from datetime import date
import json
from pathlib import Path


data = json.loads(Path(__file__).with_name('scenario.json').read_text(encoding='utf-8'))
assert data['synthetic'] is True
assert data['scope'].startswith('Illustrative')

catalog = {item['reference']: item for item in data['catalog']}
maximum_days = data['deadline_rule']['maximum_calendar_days']
validated = []

for record in data['records']:
    assert record['record'].startswith('DEMO-')
    issues = []
    catalog_item = catalog.get(record['catalog_reference'])
    if catalog_item is None:
        issues.append('catalog_missing')
    elif not catalog_item['active']:
        issues.append('catalog_inactive')

    received = None
    deadline = None
    try:
        received = date.fromisoformat(record['received_date'])
    except ValueError:
        issues.append('received_invalid_date')

    try:
        deadline = date.fromisoformat(record['deadline'])
    except ValueError:
        issues.append('deadline_invalid_date')

    if received is not None and deadline is not None:
        days_to_deadline = (deadline - received).days
        if days_to_deadline < 0:
            issues.append('deadline_before_received')
        elif days_to_deadline > maximum_days:
            issues.append('deadline_exceeds_max')

    assert issues == record['expected_issues'], record['record']
    validated.append((record, received, issues))

first_record = next(item for item in data['records'] if item['record'] == 'DEMO-SST-001')
assert date.fromisoformat(first_record['received_date']).isocalendar().week == 2
assert sum(not issues for _, _, issues in validated) == 1

print('Validación sintética SST; catálogo demo y regla didáctica de plazo.')
print(f"Regla ilustrativa: fecha límite entre la recepción y {maximum_days} días naturales después.")
print(f"{'Registro':<16} {'Catálogo':<16} {'Recepción':<12} {'Límite':<12} Resultado")
for record, received, issues in validated:
    result = 'Válido' if not issues else ', '.join(issues)
    print(f"{record['record']:<16} {record['catalog_reference']:<16} {record['received_date']:<12} {record['deadline']:<12} {result}")
print(f"Semana ISO de {first_record['received_date']}: {date.fromisoformat(first_record['received_date']).isocalendar().week}")
print('El ejemplo no contiene datos clínicos ni consulta catálogos, formularios o servicios reales.')
