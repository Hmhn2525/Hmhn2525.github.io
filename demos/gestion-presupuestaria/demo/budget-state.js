(function exposeBudgetState(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BudgetState = api;
})(globalThis, function createBudgetState() {
  "use strict";

  function parseCents(value) {
    if (value === null || value === "") return { kind: "pending", cents: 0 };
    const text = String(value).trim();
    if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(text)) return { kind: "invalid", cents: 0 };
    const [whole, fraction = ""] = text.split(".");
    const cents = Number(whole || "0") * 100 + Number((fraction + "00").slice(0, 2));
    if (!Number.isSafeInteger(cents)) return { kind: "invalid", cents: 0 };
    return { kind: "captured", cents };
  }

  function aggregate(values) {
    let cents = 0;
    let pending = 0;
    let invalid = 0;
    for (const value of values) {
      const result = parseCents(value);
      if (result.kind === "captured") cents += result.cents;
      else if (result.kind === "pending") pending += 1;
      else invalid += 1;
    }
    return { cents, pending, invalid };
  }

  function centerStats(center) {
    const total = aggregate(center.items.flatMap((item) => item.months));
    return { ...total, captured: center.items.flatMap((item) => item.months).filter((value) => parseCents(value).kind === "captured").length, count: center.items.reduce((count, item) => count + item.months.length, 0) };
  }

  function createCenter(source) {
    return {
      id: source.id,
      name: source.name,
      version: source.initialVersion,
      status: "draft",
      items: JSON.parse(JSON.stringify(source.items)),
      submissions: [],
      events: [{ type: "state", message: "Borrador sintético preparado." }],
      observations: []
    };
  }

  function completePending(center) {
    let filled = 0;
    for (const item of center.items) {
      item.months = item.months.map((value) => {
        if (value !== null && value !== "") return value;
        filled += 1;
        return "0.00";
      });
    }
    return filled;
  }

  function submit(center, expectedVersion, submissionId) {
    if (!["draft", "returned"].includes(center.status)) return { ok: false, reason: "not-editable" };
    if (expectedVersion !== center.version) {
      return { ok: false, reason: "stale", expectedVersion, currentVersion: center.version };
    }
    const stats = centerStats(center);
    if (stats.pending || stats.invalid) return { ok: false, reason: "incomplete", stats };

    const snapshot = {
      id: submissionId,
      version: center.version + 1,
      cents: stats.cents,
      capturedCount: stats.captured,
      itemCount: center.items.length,
      items: JSON.parse(JSON.stringify(center.items))
    };
    center.version = snapshot.version;
    center.submissions.push(snapshot);
    center.observations = [];
    center.status = "submitted";
    return { ok: true, snapshot };
  }

  function review(center, decision, note = "") {
    if (center.status !== "submitted") return { ok: false, reason: "not-submitted" };
    const observation = note.trim();
    if (decision === "return" && !observation) return { ok: false, reason: "observation-required" };
    if (decision !== "return" && decision !== "approve") return { ok: false, reason: "unknown-decision" };

    center.version += 1;
    center.status = decision === "return" ? "returned" : "validated";
    if (observation) center.observations.push(observation);
    return { ok: true, status: center.status, version: center.version };
  }

  return { aggregate, centerStats, completePending, createCenter, parseCents, review, submit };
});
