"""Check the public synthetic fixture and its embedded browser demo data."""

import json
import re
from decimal import Decimal
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
fixture = json.loads((ROOT / "examples" / "scenario.json").read_text(encoding="utf-8"))
demo_html = (ROOT / "demo" / "index.html").read_text(encoding="utf-8")
embedded_match = re.search(
    r'<script id="scenario-data" type="application/json">\s*(.*?)\s*</script>',
    demo_html,
    flags=re.DOTALL,
)
assert embedded_match, "The demo must embed its fixture so it opens directly from disk."
embedded_fixture = json.loads(embedded_match.group(1))
assert embedded_fixture == fixture, "The standalone demo fixture and examples/scenario.json must match."

mockup_path = ROOT / "docs" / "images" / "mockup-synthetic.svg"
mockup_root = ElementTree.parse(mockup_path).getroot()
svg_namespace = {"svg": "http://www.w3.org/2000/svg"}
mockup_text = " ".join(mockup_root.itertext())
for required_label in (
    "mockup sintético; demo independiente, sin backend",
    "2026-10-09",
    "examples/scenario.json",
):
    assert required_label in mockup_text, f"Mockup is missing required provenance: {required_label}."

assert fixture["synthetic"] is True
assert fixture["currency"] == "MXN"
assert len(fixture["centers"]) == 2
assert len(fixture["profiles"]) == 3
center_ids = [center["id"] for center in fixture["centers"]]
assert len(center_ids) == len(set(center_ids))
assert all(center_id.startswith("DEMO-") for center_id in center_ids)

capture_profiles = [profile for profile in fixture["profiles"] if profile["role"] == "capture"]
review_profiles = [profile for profile in fixture["profiles"] if profile["role"] == "reviewer"]
assert len(capture_profiles) == 2
assert len(review_profiles) == 1
assert all(set(profile["assignedCenterIds"]).issubset(center_ids) for profile in fixture["profiles"])

expected_totals = {"DEMO-CC-001": Decimal("3600.00"), "DEMO-CC-002": Decimal("2400.00")}
mockup_centers = {
    node.get("data-center-id"): node
    for node in mockup_root.findall(".//svg:g[@class='budget-center']", svg_namespace)
}
assert set(mockup_centers) == set(center_ids), "The mockup must show exactly the fixture centers."
state_source = (ROOT / "examples" / "verify_state.js").read_text(encoding="utf-8")
state_matches = re.findall(
    r"assert\.deepEqual\(BudgetState\.centerStats\((north|south)\),\s*\{\s*"
    r"cents:\s*(\d+),\s*pending:\s*(\d+),\s*invalid:\s*(\d+),\s*"
    r"captured:\s*(\d+),\s*count:\s*(\d+)\s*\}\);",
    state_source,
)
state_expectations = {name: tuple(map(int, values)) for name, *values in state_matches}
assert set(state_expectations) == {"north", "south"}, "State verifier must keep explicit center expectations."
zero_matches = re.findall(r"assert\.equal\(zeroCount\((north|south)\),\s*(\d+)\);", state_source)
zero_expectations = {name: int(count) for name, count in zero_matches}
assert zero_expectations == {"north": 11, "south": 11}, "State verifier must count explicit zero captures."
report = []
for index, center in enumerate(fixture["centers"]):
    items = center["items"]
    assert len(items) == 3, f"{center['id']} must contain three line items."
    item_ids = [item["id"] for item in items]
    assert len(item_ids) == len(set(item_ids)), f"Duplicate line item in {center['id']}."
    total = Decimal("0.00")
    captured = 0
    pending = 0
    explicit_zeros = 0
    for item in items:
        assert len(item["months"]) == 12, f"{center['id']} / {item['name']} must contain twelve months."
        for value in item["months"]:
            if value is None:
                pending += 1
                continue
            amount = Decimal(value)
            assert amount >= 0 and amount.as_tuple().exponent >= -2, "Amounts must be nonnegative with at most two decimals."
            total += amount
            captured += 1
            explicit_zeros += amount == 0
    assert total == expected_totals[center["id"]], f"Unexpected fixture total for {center['id']}: {total}."
    assert pending == 1, f"Expected one visible pending cell for {center['id']}."
    assert explicit_zeros > 0, f"Expected an explicit zero for {center['id']}."
    mockup_center = mockup_centers[center["id"]]
    mockup_rows = {
        node.get("data-item-id"): node
        for node in mockup_center.findall(".//svg:g[@class='budget-row']", svg_namespace)
    }
    assert set(mockup_rows) == set(item_ids), f"Mockup line items differ for {center['id']}."
    for item in items:
        svg_row = mockup_rows[item["id"]]
        encoded_values = ["PENDIENTE" if value is None else value for value in item["months"]]
        assert svg_row.get("data-month-values", "").split("|") == encoded_values, (
            f"Mockup month values differ for {center['id']} / {item['id']}."
        )
    svg_summary = tuple(
        int(mockup_center.get(attribute, "-1"))
        for attribute in ("data-total-cents", "data-pending", "data-captured")
    )
    fixture_summary = (int(total * 100), pending, captured)
    assert svg_summary == fixture_summary, f"Mockup total or cell counts differ for {center['id']}."
    assert int(mockup_center.get("data-zeros", "-1")) == explicit_zeros, (
        f"Mockup zero count differs for {center['id']}."
    )
    state_name = "north" if index == 0 else "south"
    expected_state = state_expectations[state_name]
    fixture_state = (int(total * 100), pending, 0, captured, len(items) * 12)
    assert expected_state == fixture_state, f"Fixture and verify_state.js expectations differ for {center['id']}."
    assert svg_summary == (expected_state[0], expected_state[1], expected_state[3]), (
        f"Mockup summary differs from verify_state.js for {center['id']}."
    )
    assert explicit_zeros == zero_expectations[state_name], (
        f"Fixture zero count differs from verify_state.js for {center['id']}."
    )
    report.append((center["name"], center["id"], total, captured, pending, explicit_zeros))

print("Fixture verificado: dos centros, tres partidas y doce meses por partida.")
print("El HTML independiente usa la misma fixture JSON; no comprueba el sistema operativo.")
print("Mockup SVG, fixture JSON y expectativas de verify_state.js coinciden.")
for name, center_id, total, captured, pending, explicit_zeros in report:
    print(f"{name} ({center_id}): {total:.2f} MXN; {captured} capturados; {pending} pendiente; {explicit_zeros} ceros registrados.")
