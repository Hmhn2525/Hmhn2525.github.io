-- Modelo pedagógico SQLite. Datos, nombres y claves son ficticios.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS centers (
    center_id TEXT PRIMARY KEY,
    center_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS periods (
    period_id TEXT PRIMARY KEY,
    period_label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS production (
    record_id TEXT PRIMARY KEY,
    center_id TEXT NOT NULL REFERENCES centers(center_id),
    period_id TEXT NOT NULL REFERENCES periods(period_id),
    units INTEGER NOT NULL CHECK (units >= 0)
);

CREATE TABLE IF NOT EXISTS costs (
    record_id TEXT PRIMARY KEY,
    center_id TEXT NOT NULL REFERENCES centers(center_id),
    period_id TEXT NOT NULL REFERENCES periods(period_id),
    cost_cents INTEGER NOT NULL CHECK (cost_cents >= 0)
);

CREATE TABLE IF NOT EXISTS source_imports (
    dataset TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    row_count INTEGER NOT NULL CHECK (row_count >= 0),
    PRIMARY KEY (dataset, sha256)
);

-- El scaffold muestra combinaciones sin registros.
-- Agregar cada fuente antes del join evita multiplicar importes.
CREATE VIEW IF NOT EXISTS analytics_by_center_period AS
WITH production_by_key AS (
    SELECT center_id, period_id, SUM(units) AS production_units
    FROM production
    GROUP BY center_id, period_id
), costs_by_key AS (
    SELECT center_id, period_id, SUM(cost_cents) AS cost_cents
    FROM costs
    GROUP BY center_id, period_id
)
SELECT center.center_id,
       center.center_name,
       period.period_id,
       period.period_label,
       production_by_key.production_units,
       costs_by_key.cost_cents,
       CASE
           WHEN production_by_key.production_units > 0 AND costs_by_key.cost_cents IS NOT NULL
           THEN CAST(costs_by_key.cost_cents AS REAL) / 100 / production_by_key.production_units
           ELSE NULL
       END AS unit_cost_mxn
FROM centers AS center
CROSS JOIN periods AS period
LEFT JOIN production_by_key
    ON production_by_key.center_id = center.center_id
   AND production_by_key.period_id = period.period_id
LEFT JOIN costs_by_key
    ON costs_by_key.center_id = center.center_id
   AND costs_by_key.period_id = period.period_id;
