"use strict";

const assert = require("node:assert/strict");
const fixture = require("./scenario.json");
const BudgetState = require("../demo/budget-state.js");

const north = BudgetState.createCenter(fixture.centers[0]);
const south = BudgetState.createCenter(fixture.centers[1]);
const zeroCount = (center) => center.items.flatMap((item) => item.months).filter((value) => value === "0.00").length;
assert.deepEqual(BudgetState.centerStats(north), { cents: 360000, pending: 1, invalid: 0, captured: 35, count: 36 });
assert.deepEqual(BudgetState.centerStats(south), { cents: 240000, pending: 1, invalid: 0, captured: 35, count: 36 });
assert.equal(zeroCount(north), 11);
assert.equal(zeroCount(south), 11);
assert.deepEqual(BudgetState.parseCents("0.00"), { kind: "captured", cents: 0 });
assert.deepEqual(BudgetState.parseCents(".50"), { kind: "captured", cents: 50 });
assert.deepEqual(BudgetState.parseCents(null), { kind: "pending", cents: 0 });
assert.deepEqual(BudgetState.parseCents("12.345"), { kind: "invalid", cents: 0 });

const incomplete = BudgetState.submit(north, 1, 1);
assert.equal(incomplete.reason, "incomplete");
assert.equal(north.version, 1);
assert.equal(north.submissions.length, 0);
assert.equal(BudgetState.completePending(north), 1);

const beforeStaleAttempt = JSON.stringify({ version: north.version, items: north.items, submissions: north.submissions });
const stale = BudgetState.submit(north, 0, 1);
assert.equal(stale.reason, "stale");
assert.equal(JSON.stringify({ version: north.version, items: north.items, submissions: north.submissions }), beforeStaleAttempt);

const first = BudgetState.submit(north, 1, 1);
assert.equal(first.ok, true);
assert.equal(north.status, "submitted");
assert.equal(north.version, 2);
assert.equal(first.snapshot.cents, 360000);
assert.equal(first.snapshot.items[2].months[11], "0.00");

const missingObservation = BudgetState.review(north, "return", "   ");
assert.equal(missingObservation.reason, "observation-required");
assert.equal(north.status, "submitted");
assert.equal(north.version, 2);

const returned = BudgetState.review(north, "return", "Revisar importe de abril.");
assert.equal(returned.status, "returned");
assert.equal(north.version, 3);
assert.equal(north.submissions.length, 1);
north.items[0].months[0] = "125.00";

const second = BudgetState.submit(north, 3, 2);
assert.equal(second.ok, true);
assert.equal(north.status, "submitted");
assert.equal(north.version, 4);
assert.equal(north.submissions.length, 2);
assert.equal(north.submissions[0].items[0].months[0], "100.00");
assert.equal(north.submissions[1].items[0].months[0], "125.00");
assert.equal(BudgetState.submit(north, 4, 3).reason, "not-editable");

const validated = BudgetState.review(north, "approve", "Cifras revisadas.");
assert.equal(validated.status, "validated");
assert.equal(north.version, 5);
assert.equal(north.submissions.length, 2);

console.log("Cálculos y flujo verificados: pendiente bloquea entrega; cero queda capturado.");
console.log("Transiciones verificadas: entrega, devolución con observación, nueva entrega y validación.");
console.log("Versión obsoleta rechazada sin cambios; snapshot anterior preservado tras corrección.");
