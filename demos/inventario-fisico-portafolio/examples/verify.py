from collections import Counter
from decimal import Decimal
import json
from pathlib import Path


data = json.loads(Path(__file__).with_name('scenario.json').read_text(encoding='utf-8'))
assert data['synthetic'] is True
assert data['count_id'].startswith('DEMO-')

state_counts = Counter()
counted_lines = []
pending_lines = []

for row in data['lines']:
    counted = row['counted']
    if counted is None:
        difference = None
        state = 'Sin contar'
        pending_lines.append(row)
    else:
        difference = Decimal(counted) - Decimal(row['expected'])
        state = 'Coincide' if difference == 0 else 'Faltante' if difference < 0 else 'Sobrante'
        counted_lines.append(row)

    assert state == row['state'], row['article']
    expected_difference = None if row['difference'] is None else Decimal(row['difference'])
    assert difference == expected_difference, row['article']
    state_counts[state] += 1

net_difference = sum(
    (Decimal(row['difference']) for row in counted_lines),
    Decimal('0')
)

assert len(counted_lines) == data['expected_counted_lines']
assert len(pending_lines) == data['expected_pending_lines']
assert net_difference == Decimal(data['expected_net_difference'])
assert any(row['counted'] == '0' and row['state'] == 'Faltante' for row in data['lines'])

print(f"Conteo sintético {data['count_id']} | almacén: {data['warehouse']}")
print(f"{'Artículo':<10} {'Esperado':>10} {'Físico':>10} {'Diferencia':>12} {'Estado':<14}")
for row in data['lines']:
    counted = '-' if row['counted'] is None else row['counted']
    difference = '-' if row['difference'] is None else row['difference']
    print(f"{row['article']:<10} {row['expected']:>10} {counted:>10} {difference:>12} {row['state']:<14}")

print(f"Líneas contadas: {len(counted_lines)} | pendientes excluidas: {len(pending_lines)}")
print(f"Estados: {dict(sorted(state_counts.items()))}")
print(f"Diferencia neta de líneas contadas: {net_difference}")
print('El ejemplo no genera ajustes ERP; muestra solo una conciliación didáctica con decimales exactos.')
