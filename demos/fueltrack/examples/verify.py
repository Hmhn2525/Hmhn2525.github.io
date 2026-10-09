from decimal import Decimal
import json
from pathlib import Path


data = json.loads(Path(__file__).with_name('scenario.json').read_text(encoding='utf-8'))
assert data['synthetic'] is True
assert data['unit'].startswith('DEMO-')

approved = Decimal(data['approved_liters'])
balance = approved
operations = {}
attempt_results = []

for attempt in data['attempts']:
    key = attempt['operation_key']
    liters = Decimal(attempt['liters'])
    assert key.startswith('DEMO-')
    assert liters > 0

    if key in operations:
        previous_liters, receipt = operations[key]
        if previous_liters != liters:
            raise ValueError(f"La clave {key} se reutilizó con contenido distinto.")
        attempt_results.append((attempt['number'], 'Reintento exacto', receipt, Decimal('0')))
        continue

    if liters > balance:
        raise ValueError(f"Saldo insuficiente para {key}.")
    balance -= liters
    receipt = f"DEMO-REC-{len(operations) + 1:03d}"
    operations[key] = (liters, receipt)
    attempt_results.append((attempt['number'], 'Registrado', receipt, liters))

debited = sum((amount for amount, _ in operations.values()), Decimal('0'))
additional_on_retry = sum(
    (additional for _, status, _, additional in attempt_results if status == 'Reintento exacto'),
    Decimal('0')
)

assert len(operations) == data['expected_unique_dispatches']
assert debited == Decimal(data['expected_debited_liters'])
assert balance == Decimal(data['expected_remaining_liters'])
assert additional_on_retry == Decimal(data['expected_retry_additional_liters'])
assert approved - debited == balance

print('Escenario sintético de reintento FuelTrack')
print(f"Unidad: {data['unit']} | Aprobado: {approved} L | Saldo inicial: {approved} L")
for number, status, receipt, additional in attempt_results:
    print(f"Intento {number}: {status} | recibo {receipt} | descuento de este intento: {additional} L")
print(f"Operaciones únicas: {len(operations)} | descuento total: {debited} L | saldo final: {balance} L")
print(f"Descuento adicional en reintento exacto: {additional_on_retry} L")
print('Alcance: modelo didáctico en memoria; no llama a Apps Script ni a Google Sheets.')
