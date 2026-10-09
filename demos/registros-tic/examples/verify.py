from collections import Counter
from datetime import datetime
import json
from pathlib import Path


data = json.loads(Path(__file__).with_name('scenario.json').read_text(encoding='utf-8'))
assert data['synthetic'] is True
assert data['scope'].startswith('Didactic')

allowed_statuses = {'Pendiente', 'En Proceso', 'Atendido', 'Cerrado'}
ticket_ids = set()
latest_states = Counter()
categories = Counter()
open_tickets = 0
in_period = []

for ticket in data['tickets']:
    ticket_id = ticket['id']
    assert ticket_id.startswith('DEMO-TIC-')
    assert ticket_id not in ticket_ids
    ticket_ids.add(ticket_id)
    assert ticket['asset_code'].startswith('DEMO-')

    created_at = datetime.fromisoformat(ticket['created_at'])
    history = ticket['status_history']
    assert history
    events = [(datetime.fromisoformat(event['at']), event['status']) for event in history]
    assert all(status in allowed_statuses for _, status in events)
    assert events[0][0] == created_at
    assert events[0][1] == 'Pendiente'
    assert all(current[0] >= previous[0] for previous, current in zip(events, events[1:]))

    if created_at.strftime('%Y-%m') != data['report_period']:
        continue
    in_period.append((ticket, events))
    state = events[-1][1]
    latest_states[state] += 1
    categories[ticket['category']] += 1
    if state in {'Pendiente', 'En Proceso'}:
        open_tickets += 1

expected = data['expected_report']
assert len(in_period) == expected['total_tickets']
assert open_tickets == expected['open_tickets']
assert dict(sorted(latest_states.items())) == dict(sorted(expected['by_latest_state'].items()))
assert dict(sorted(categories.items())) == dict(sorted(expected['by_category'].items()))

print(f"Escenario sintético de tickets | periodo {data['report_period']}")
print('CREAR')
for ticket, _ in in_period:
    print(f"{ticket['id']} | {ticket['requester']} | {ticket['asset_code']} | {ticket['category']}")
print('SEGUIMIENTO')
for ticket, events in in_period:
    history = ' > '.join(status for _, status in events)
    print(f"{ticket['id']}: {history}")
print('INFORME')
print(f"Tickets: {len(in_period)} | abiertos (Pendiente + En Proceso): {open_tickets}")
print(f"Por estado final: {dict(sorted(latest_states.items()))}")
print(f"Por categoría: {dict(sorted(categories.items()))}")
print('Alcance: informe calculado desde JSON ficticio; no es una salida de la aplicación ni de Looker Studio.')
