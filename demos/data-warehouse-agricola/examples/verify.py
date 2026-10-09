"""Load fictional CSV facts, validate them, query SQLite, and export dashboard data."""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
import hashlib
import json
import sqlite3
import sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any


EXAMPLES = Path(__file__).resolve().parent
DEFAULT_OUTPUT = EXAMPLES / "outputs"
SCHEMA = EXAMPLES / "model.sql"
CENTERS_FILE = EXAMPLES / "centers.csv"
PERIODS_FILE = EXAMPLES / "periods.csv"
PRODUCTION_FILE = EXAMPLES / "production.csv"
COSTS_FILE = EXAMPLES / "costs.csv"
CURRENCY_QUANTUM = Decimal("0.01")
ANOMALY_MULTIPLIER = Decimal("2")


class DataError(ValueError):
    """Input data failed a documented validation rule."""


def read_csv(path: Path, expected_columns: tuple[str, ...]) -> tuple[bytes, list[dict[str, str]]]:
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise DataError(f"{path.name}: archivo debe usar UTF-8") from exc
    reader = csv.DictReader(text.splitlines())
    if tuple(reader.fieldnames or ()) != expected_columns:
        raise DataError(f"{path.name}: encabezados esperados: {', '.join(expected_columns)}")
    rows: list[dict[str, str]] = []
    for line_number, row in enumerate(reader, start=2):
        if None in row or any(value is None for value in row.values()):
            raise DataError(f"{path.name}:{line_number}: número de columnas incorrecto")
        if any(not value.strip() for value in row.values()):
            raise DataError(f"{path.name}:{line_number}: campo vacío")
        rows.append({key: value.strip() for key, value in row.items()})
    if not rows:
        raise DataError(f"{path.name}: archivo sin registros")
    return raw, rows


def load_dimensions(db: sqlite3.Connection) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    _centers_raw, centers = read_csv(CENTERS_FILE, ("center_id", "center_name"))
    _periods_raw, periods = read_csv(PERIODS_FILE, ("period_id", "period_label"))
    if len(centers) != 4 or len(periods) != 6:
        raise DataError("El escenario debe contener cuatro centros y seis periodos")
    if len({row["center_id"] for row in centers}) != len(centers):
        raise DataError("centers.csv: identificador de centro repetido")
    if len({row["period_id"] for row in periods}) != len(periods):
        raise DataError("periods.csv: identificador de periodo repetido")
    for center in centers:
        if not center["center_id"].startswith("DEMO-"):
            raise DataError("Todos los centros deben identificarse como ficticios DEMO-")
    for period in periods:
        if len(period["period_id"]) != 7 or period["period_id"][4] != "-":
            raise DataError(f"Periodo inválido: {period['period_id']}")
        try:
            datetime.strptime(period["period_id"] + "-01", "%Y-%m-%d")
        except ValueError as exc:
            raise DataError(f"Periodo inválido: {period['period_id']}") from exc
    for center in centers:
        existing = db.execute(
            "SELECT center_name FROM centers WHERE center_id = ?", (center["center_id"],)
        ).fetchone()
        if existing and existing[0] != center["center_name"]:
            raise DataError(f"Nombre de centro cambió en la base: {center['center_id']}")
        db.execute(
            "INSERT OR IGNORE INTO centers(center_id, center_name) VALUES (?, ?)",
            (center["center_id"], center["center_name"]),
        )
    for period in periods:
        existing = db.execute(
            "SELECT period_label FROM periods WHERE period_id = ?", (period["period_id"],)
        ).fetchone()
        if existing and existing[0] != period["period_label"]:
            raise DataError(f"Etiqueta de periodo cambió en la base: {period['period_id']}")
        db.execute(
            "INSERT OR IGNORE INTO periods(period_id, period_label) VALUES (?, ?)",
            (period["period_id"], period["period_label"]),
        )
    db.commit()
    return centers, periods


def parse_nonnegative_int(value: str, path: Path, line_number: int, column: str) -> int:
    if not value.isascii() or not value.isdecimal():
        raise DataError(f"{path.name}:{line_number}: {column} debe ser entero no negativo")
    return int(value)


def import_facts(
    db: sqlite3.Connection,
    path: Path,
    dataset: str,
    expected_columns: tuple[str, ...],
    amount_column: str,
) -> str:
    raw, rows = read_csv(path, expected_columns)
    return import_rows(db, path.name, raw, rows, dataset, amount_column)


def import_rows(
    db: sqlite3.Connection,
    source_name: str,
    raw: bytes,
    rows: list[dict[str, str]],
    dataset: str,
    amount_column: str,
) -> str:
    digest = hashlib.sha256(raw).hexdigest()
    previous = db.execute(
        "SELECT row_count FROM source_imports WHERE dataset = ? AND sha256 = ?",
        (dataset, digest),
    ).fetchone()
    if previous:
        if previous[0] != len(rows):
            raise DataError(f"{source_name}: manifiesto de importación no coincide")
        return "reutilizada"

    record_ids: set[str] = set()
    known_centers = {row[0] for row in db.execute("SELECT center_id FROM centers")}
    known_periods = {row[0] for row in db.execute("SELECT period_id FROM periods")}
    prepared: list[tuple[str, str, str, int]] = []
    for line_number, row in enumerate(rows, start=2):
        record_id = row["record_id"]
        if record_id in record_ids:
            raise DataError(f"{source_name}:{line_number}: record_id repetido dentro del archivo: {record_id}")
        record_ids.add(record_id)
        if not record_id.startswith("DEMO-"):
            raise DataError(f"{source_name}:{line_number}: record_id debe ser ficticio DEMO-")
        if row["center_id"] not in known_centers:
            raise DataError(f"{source_name}:{line_number}: centro desconocido: {row['center_id']}")
        if row["period_id"] not in known_periods:
            raise DataError(f"{source_name}:{line_number}: periodo desconocido: {row['period_id']}")
        amount = parse_nonnegative_int(row[amount_column], Path(source_name), line_number, amount_column)
        prepared.append((record_id, row["center_id"], row["period_id"], amount))

    target = "production" if dataset == "production" else "costs"
    try:
        with db:
            db.executemany(
                f"INSERT INTO {target}(record_id, center_id, period_id, {amount_column}) VALUES (?, ?, ?, ?)",
                prepared,
            )
            db.execute(
                "INSERT INTO source_imports(dataset, sha256, row_count) VALUES (?, ?, ?)",
                (dataset, digest, len(rows)),
            )
    except sqlite3.IntegrityError as exc:
        raise DataError(f"{source_name}: conflicto de clave o referencia; importación cancelada") from exc
    return f"{len(rows)} filas nuevas"


def money(cents: int | None) -> str | None:
    if cents is None:
        return None
    return f"{Decimal(cents) / Decimal(100):.2f}"


def unit_cost(cost_cents: int | None, units: int | None) -> str | None:
    if cost_cents is None or units is None or units <= 0:
        return None
    amount = Decimal(cost_cents) / Decimal(100) / Decimal(units)
    return str(amount.quantize(CURRENCY_QUANTUM, rounding=ROUND_HALF_UP))


def query_aggregates(db: sqlite3.Connection) -> list[dict[str, Any]]:
    cursor = db.execute(
        """SELECT center_id, center_name, period_id, period_label,
                  production_units, cost_cents, unit_cost_mxn
           FROM analytics_by_center_period
           ORDER BY center_id, period_id"""
    )
    names = [column[0] for column in cursor.description]
    output: list[dict[str, Any]] = []
    for values in cursor.fetchall():
        row = dict(zip(names, values))
        row["production_units"] = int(row["production_units"]) if row["production_units"] is not None else None
        row["cost_cents"] = int(row["cost_cents"]) if row["cost_cents"] is not None else None
        # Format from integer aggregates, not SQLite binary floats.
        row["cost_mxn"] = money(row["cost_cents"])
        exact_cost = unit_cost(row["cost_cents"], row["production_units"])
        sql_cost = row["unit_cost_mxn"]
        if exact_cost is None:
            if sql_cost is not None:
                raise AssertionError("SQL debe dejar nulo el costo unitario de datos incompletos o cero")
        elif sql_cost is None or Decimal(str(sql_cost)).quantize(CURRENCY_QUANTUM, rounding=ROUND_HALF_UP) != Decimal(exact_cost):
            raise AssertionError("Costo unitario SQL no coincide con el cálculo exacto en centavos")
        row["unit_cost_mxn"] = exact_cost
        output.append(row)
    return output


def enrich_anomalies(rows: list[dict[str, Any]]) -> dict[str, Any]:
    matched = [
        row for row in rows
        if row["production_units"] is not None
        and row["production_units"] > 0
        and row["cost_cents"] is not None
    ]
    benchmark_units = sum(row["production_units"] for row in matched)
    benchmark_cents = sum(row["cost_cents"] for row in matched)
    benchmark = Decimal(benchmark_cents) / Decimal(100) / Decimal(benchmark_units)
    threshold = (benchmark * ANOMALY_MULTIPLIER).quantize(CURRENCY_QUANTUM, rounding=ROUND_HALF_UP)

    for row in rows:
        flags: list[str] = []
        if row["production_units"] is None:
            flags.append("missing_production")
        if row["cost_cents"] is None:
            flags.append("missing_cost")
        if row["production_units"] == 0:
            flags.append("zero_production")
        exact_unit_cost = (
            Decimal(row["cost_cents"]) / Decimal(100) / Decimal(row["production_units"])
            if row["cost_cents"] is not None and row["production_units"] is not None and row["production_units"] > 0
            else None
        )
        if exact_unit_cost is not None and exact_unit_cost >= benchmark * ANOMALY_MULTIPLIER:
            flags.append("high_unit_cost")
        row["anomalies"] = flags

    return {
        "matched_units": benchmark_units,
        "matched_cost_mxn": money(benchmark_cents),
        "weighted_unit_cost_mxn": str(benchmark.quantize(CURRENCY_QUANTUM, rounding=ROUND_HALF_UP)),
        "multiplier": int(ANOMALY_MULTIPLIER),
        "threshold_mxn_per_unit": str(threshold),
    }


def write_exports(
    output_dir: Path,
    rows: list[dict[str, Any]],
    centers: list[dict[str, str]],
    periods: list[dict[str, str]],
    benchmark: dict[str, Any],
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    fields = (
        "center_id", "center_name", "period_id", "period_label",
        "production_units", "cost_mxn", "unit_cost_mxn", "anomalies",
    )
    csv_path = output_dir / "aggregated-results.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "center_id": row["center_id"],
                "center_name": row["center_name"],
                "period_id": row["period_id"],
                "period_label": row["period_label"],
                "production_units": "" if row["production_units"] is None else row["production_units"],
                "cost_mxn": row["cost_mxn"] or "",
                "unit_cost_mxn": row["unit_cost_mxn"] or "",
                "anomalies": ";".join(row["anomalies"]),
            })

    payload = {
        "synthetic": True,
        "scope": "Ejemplo público independiente; no es evidencia de BigQuery ni de la interfaz operativa.",
        "currency": "MXN",
        "benchmark": benchmark,
        "centers": centers,
        "periods": periods,
        "rows": rows,
    }
    json_text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    dashboard_path = output_dir / "dashboard-data.js"
    assignment = "window.AGRICOLA_DEMO_DATA = " + json_text + ";\n"
    dashboard_path.write_text(assignment, encoding="utf-8")
    dashboard_source = dashboard_path.read_text(encoding="utf-8")
    prefix = "window.AGRICOLA_DEMO_DATA = "
    if not dashboard_source.startswith(prefix) or not dashboard_source.endswith(";\n"):
        raise AssertionError("La salida JavaScript no tiene el formato esperado")
    dashboard_payload = json.loads(dashboard_source[len(prefix):-2])
    if dashboard_payload["rows"] != rows or dashboard_payload["centers"] != centers or dashboard_payload["periods"] != periods:
        raise AssertionError("Los datos del dashboard no coinciden con la consulta SQL")

    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        exported = list(csv.DictReader(handle))
    if len(exported) != len(rows):
        raise AssertionError("La exportación CSV no contiene las 24 combinaciones consultadas")
    for source, result in zip(rows, exported):
        if any(result[field] != source[field] for field in ("center_id", "center_name", "period_id", "period_label")):
            raise AssertionError("La exportación CSV cambió el orden o clave del resultado")
        expected_units = "" if source["production_units"] is None else str(source["production_units"])
        if result["production_units"] != expected_units:
            raise AssertionError("Producción exportada no coincide con la consulta")
        if result["cost_mxn"] != (source["cost_mxn"] or "") or result["unit_cost_mxn"] != (source["unit_cost_mxn"] or ""):
            raise AssertionError("Costos exportados no coinciden con la consulta")
        if result["anomalies"] != ";".join(source["anomalies"]):
            raise AssertionError("Señales exportadas no coinciden con la consulta")


def assert_scenario(db: sqlite3.Connection, rows: list[dict[str, Any]], benchmark: dict[str, Any]) -> None:
    assert len(rows) == 24
    assert db.execute("SELECT COUNT(*) FROM production").fetchone()[0] == 24
    assert db.execute("SELECT COUNT(*) FROM costs").fetchone()[0] == 24
    assert sum(row["production_units"] or 0 for row in rows) == 1768
    assert sum(row["cost_cents"] or 0 for row in rows) == 1_202_500
    by_key = {(row["center_id"], row["period_id"]): row for row in rows}
    assert by_key[("DEMO-CC-001", "2026-01")]["production_units"] == 100
    assert by_key[("DEMO-CC-001", "2026-01")]["cost_cents"] == 50_000
    assert by_key[("DEMO-CC-001", "2026-01")]["unit_cost_mxn"] == "5.00"
    assert by_key[("DEMO-CC-002", "2026-03")]["production_units"] == 0
    assert by_key[("DEMO-CC-002", "2026-03")]["cost_cents"] == 10_000
    assert by_key[("DEMO-CC-002", "2026-03")]["unit_cost_mxn"] is None
    assert by_key[("DEMO-CC-003", "2026-02")]["production_units"] == 55
    assert by_key[("DEMO-CC-003", "2026-02")]["cost_cents"] is None
    assert by_key[("DEMO-CC-003", "2026-04")]["production_units"] is None
    assert by_key[("DEMO-CC-003", "2026-04")]["cost_cents"] == 30_000
    assert by_key[("DEMO-CC-004", "2026-06")]["unit_cost_mxn"] == "30.00"
    assert benchmark["matched_units"] == 1713
    assert benchmark["matched_cost_mxn"] == "11625.00"
    assert sum("missing_production" in row["anomalies"] for row in rows) == 1
    assert sum("missing_cost" in row["anomalies"] for row in rows) == 1
    assert sum("zero_production" in row["anomalies"] for row in rows) == 1
    assert sum("high_unit_cost" in row["anomalies"] for row in rows) == 1

    # Prove exact-file re-import is idempotent and a reused primary key is rejected.
    for path, dataset, columns, amount_column in (
        (PRODUCTION_FILE, "production", ("record_id", "center_id", "period_id", "units"), "units"),
        (COSTS_FILE, "costs", ("record_id", "center_id", "period_id", "cost_cents"), "cost_cents"),
    ):
        before = db.execute(f"SELECT COUNT(*) FROM {dataset}").fetchone()[0]
        assert import_facts(db, path, dataset, columns, amount_column) == "reutilizada"
        assert db.execute(f"SELECT COUNT(*) FROM {dataset}").fetchone()[0] == before

    before = db.execute("SELECT COUNT(*) FROM production").fetchone()[0]
    imports_before = db.execute("SELECT COUNT(*) FROM source_imports").fetchone()[0]
    try:
        import_rows(
            db,
            "changed-production.csv",
            b"changed file hash",
            [{"record_id": "DEMO-P-001", "center_id": "DEMO-CC-001", "period_id": "2026-01", "units": "999"}],
            "production",
            "units",
        )
    except DataError:
        pass
    else:
        raise AssertionError("El ejemplo debe rechazar una clave ya importada")
    assert db.execute("SELECT COUNT(*) FROM production").fetchone()[0] == before
    assert db.execute("SELECT COUNT(*) FROM source_imports").fetchone()[0] == imports_before
    assert db.execute("PRAGMA foreign_key_check").fetchall() == []
    assert db.execute("PRAGMA quick_check").fetchone()[0] == "ok"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, help="SQLite opcional; si se omite, usa memoria nueva")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT, help="Carpeta de exports verificados")
    args = parser.parse_args()
    if args.db:
        args.db.parent.mkdir(parents=True, exist_ok=True)
    database = str(args.db) if args.db else ":memory:"
    db = sqlite3.connect(database)
    db.execute("PRAGMA foreign_keys = ON")
    try:
        db.executescript(SCHEMA.read_text(encoding="utf-8"))
        centers, periods = load_dimensions(db)
        production_status = import_facts(
            db, PRODUCTION_FILE, "production", ("record_id", "center_id", "period_id", "units"), "units"
        )
        costs_status = import_facts(
            db, COSTS_FILE, "costs", ("record_id", "center_id", "period_id", "cost_cents"), "cost_cents"
        )
        rows = query_aggregates(db)
        benchmark = enrich_anomalies(rows)
        assert_scenario(db, rows, benchmark)
        write_exports(args.output_dir, rows, centers, periods, benchmark)
        print("Escenario ficticio: 4 centros × 6 periodos = 24 combinaciones.")
        print(f"Importación: producción {production_status}; costos {costs_status}.")
        print("Validación: claves, referencias, importación idempotente, duplicado rechazado, cero y faltantes: OK.")
        print(f"Consulta SQL: 24 filas; referencia ponderada {benchmark['weighted_unit_cost_mxn']} MXN/unidad.")
        print(f"Exportación: {args.output_dir / 'aggregated-results.csv'} y dashboard-data.js.")
        print("Alcance: datos ficticios; sin ejecución de BigQuery ni de la interfaz operativa.")
        return 0
    except (DataError, sqlite3.Error, AssertionError) as exc:
        print(f"Error de validación: {exc}", file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
