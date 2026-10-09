(() => {
  "use strict";

  const fixture = JSON.parse(document.getElementById("scenario-data").textContent);
  const BudgetState = window.BudgetState;
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const statusNames = { draft: "Borrador", submitted: "En revisión", returned: "Devuelto", validated: "Validado" };
  const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: fixture.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function createInitialState() {
    return {
      centers: fixture.centers.map(BudgetState.createCenter),
      selectedCenterId: fixture.centers[0].id,
      profileId: fixture.profiles[0].id,
      nextSubmissionId: 1,
      notice: ""
    };
  }

  let state = createInitialState();
  const elements = {
    centerPicker: document.getElementById("center-picker"),
    profileSelect: document.getElementById("profile-select"),
    profileAssignment: document.getElementById("profile-assignment"),
    statusMessage: document.getElementById("status-message"),
    budgetTitle: document.getElementById("budget-title"),
    budgetMeta: document.getElementById("budget-meta"),
    statusBadge: document.getElementById("status-badge"),
    captureActions: document.getElementById("capture-actions"),
    readonlyNote: document.getElementById("readonly-note"),
    readonlyTitle: document.getElementById("readonly-title"),
    readonlyDescription: document.getElementById("readonly-description"),
    staleSubmit: document.getElementById("stale-submit"),
    fillBlanks: document.getElementById("fill-blanks"),
    submitBudget: document.getElementById("submit-budget"),
    completionSummary: document.getElementById("completion-summary"),
    budgetTable: document.getElementById("budget-table"),
    reviewStatus: document.getElementById("review-status"),
    reviewActions: document.getElementById("review-actions"),
    reviewNote: document.getElementById("review-note"),
    submissionHistory: document.getElementById("submission-history"),
    eventLog: document.getElementById("event-log")
  };

  const selectedCenter = () => state.centers.find((center) => center.id === state.selectedCenterId);
  const selectedProfile = () => fixture.profiles.find((profile) => profile.id === state.profileId);
  const canCapture = (center, profile = selectedProfile()) => profile.role === "capture"
    && profile.assignedCenterIds.includes(center.id)
    && ["draft", "returned"].includes(center.status);

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function formatMoney(cents) {
    return currency.format(cents / 100);
  }

  function summarizeAmount(cents, pending = 0, invalid = 0) {
    const parts = [formatMoney(cents)];
    if (pending) parts.push(`${pending} pendiente${pending === 1 ? "" : "s"}`);
    if (invalid) parts.push(`${invalid} inválido${invalid === 1 ? "" : "s"}`);
    if (!pending && !invalid) parts.push("completo");
    return parts.join(" · ");
  }

  function renderCenterPicker() {
    elements.centerPicker.innerHTML = state.centers.map((center) => `
      <button class="center-choice" type="button" data-center-id="${escapeHTML(center.id)}" aria-pressed="${center.id === state.selectedCenterId}">
        <span class="center-choice-name"><strong>${escapeHTML(center.name)}</strong><small>${escapeHTML(center.id)} · ${center.items.length} partidas · 12 meses</small></span>
        <span class="center-choice-status">${escapeHTML(statusNames[center.status])}</span>
      </button>
    `).join("");
  }

  function renderProfile(center) {
    const profile = selectedProfile();
    const assignments = profile.assignedCenterIds.join(", ");
    if (profile.role === "reviewer") {
      elements.profileAssignment.textContent = `${profile.name} puede revisar entregas ficticias de ${assignments}. Esta selección solo simula permisos en JavaScript del navegador.`;
    } else {
      elements.profileAssignment.textContent = `${profile.name} puede capturar ${assignments}. Los demás centros quedan en modo de solo lectura. Asignaciones ficticias; no son un control de seguridad.`;
    }
  }

  function renderTable(center, editable) {
    const monthAggregates = monthNames.map((_, monthIndex) => BudgetState.aggregate(center.items.map((item) => item.months[monthIndex])));
    const annual = BudgetState.centerStats(center);
    const headerCells = monthNames.map((month) => `<th scope="col">${month}</th>`).join("");
    const itemRows = center.items.map((item) => {
      const rowTotal = BudgetState.aggregate(item.months);
      const cells = item.months.map((value, monthIndex) => {
        const result = BudgetState.parseCents(value);
        const amountClass = result.kind === "pending" ? "is-pending" : result.kind === "captured" && result.cents === 0 ? "is-zero" : "";
        const shownValue = value === null ? "" : escapeHTML(value);
        const accessibleValue = result.kind === "pending" ? "pendiente" : result.kind === "captured" && result.cents === 0 ? "cero capturado" : `${escapeHTML(value)} capturado`;
        return `<td><input class="amount ${amountClass}" type="number" inputmode="decimal" min="0" step="0.01" value="${shownValue}" data-amount data-center-id="${escapeHTML(center.id)}" data-item-id="${escapeHTML(item.id)}" data-month-index="${monthIndex}" aria-label="${escapeHTML(item.name)}, ${monthNames[monthIndex]}: ${accessibleValue}" ${editable ? "" : "disabled"}></td>`;
      }).join("");
      return `<tr><th scope="row">${escapeHTML(item.name)}</th>${cells}<td class="annual-column" data-row-total="${escapeHTML(item.id)}">${summarizeAmount(rowTotal.cents, rowTotal.pending, rowTotal.invalid)}</td></tr>`;
    }).join("");
    const monthFooters = monthAggregates.map((total, index) => `<td data-month-total="${index}">${summarizeAmount(total.cents, total.pending, total.invalid)}</td>`).join("");

    elements.budgetTable.innerHTML = `
      <caption>${escapeHTML(center.name)} · importes mensuales por partida. Las celdas vacías quedan pendientes; 0.00 es un importe capturado.</caption>
      <thead><tr><th scope="col">Partida</th>${headerCells}<th scope="col" class="annual-column">Total anual</th></tr></thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr><th scope="row">Subtotal por mes</th>${monthFooters}<td class="annual-column" data-month-total="annual">${summarizeAmount(annual.cents, annual.pending, annual.invalid)}</td></tr>
      </tfoot>
    `;
  }

  function renderTotals(center) {
    for (const item of center.items) {
      const total = BudgetState.aggregate(item.months);
      const cell = elements.budgetTable.querySelector(`[data-row-total="${CSS.escape(item.id)}"]`);
      if (cell) cell.textContent = summarizeAmount(total.cents, total.pending, total.invalid);
    }
    for (let monthIndex = 0; monthIndex < monthNames.length; monthIndex += 1) {
      const total = BudgetState.aggregate(center.items.map((item) => item.months[monthIndex]));
      const cell = elements.budgetTable.querySelector(`[data-month-total="${monthIndex}"]`);
      if (cell) cell.textContent = summarizeAmount(total.cents, total.pending, total.invalid);
    }
    const stats = BudgetState.centerStats(center);
    const annual = elements.budgetTable.querySelector('[data-month-total="annual"]');
    if (annual) annual.textContent = summarizeAmount(stats.cents, stats.pending, stats.invalid);
    elements.completionSummary.textContent = `${stats.captured} de ${stats.count} importes capturados · ${stats.pending} pendientes · ${stats.invalid} inválidos. Los ceros explícitos cuentan como capturados.`;
    elements.budgetMeta.textContent = `${fixture.period} · ${center.id} · Versión vigente v${center.version} · Total ${summarizeAmount(stats.cents, stats.pending, stats.invalid)}`;
    elements.submitBudget.disabled = stats.pending > 0 || stats.invalid > 0;
    elements.fillBlanks.disabled = stats.pending === 0;
    elements.budgetTable.querySelectorAll("[data-amount]").forEach((input) => {
      const value = input.value;
      const result = BudgetState.parseCents(value === "" ? null : value);
      input.classList.toggle("is-pending", result.kind === "pending");
      input.classList.toggle("is-zero", result.kind === "captured" && result.cents === 0);
      input.classList.toggle("is-invalid", result.kind === "invalid");
      const item = center.items.find((row) => row.id === input.dataset.itemId);
      const monthName = monthNames[Number(input.dataset.monthIndex)];
      const accessibleValue = result.kind === "pending" ? "pendiente" : result.kind === "invalid" ? "importe inválido" : result.cents === 0 ? "cero capturado" : `${value} capturado`;
      input.setAttribute("aria-label", `${item.name}, ${monthName}: ${accessibleValue}`);
    });
  }

  function renderHistory(center) {
    if (!center.submissions.length) {
      elements.submissionHistory.innerHTML = '<li class="history-empty">Aún no hay entregas. La primera aparecerá aquí como snapshot.</li>';
      return;
    }
    elements.submissionHistory.innerHTML = center.submissions.slice().reverse().map((submission) => `
      <li>
        <details class="history-card">
          <summary>Entrega ${submission.id} · versión v${submission.version} · ${formatMoney(submission.cents)}</summary>
          <p>Snapshot de ${submission.capturedCount} importes capturados en ${submission.itemCount} partidas y ${monthNames.length} meses. Se conserva en memoria tras una devolución.</p>
          <ul>${submission.items.map((item) => {
            const total = BudgetState.aggregate(item.months);
            return `<li>${escapeHTML(item.name)}: ${escapeHTML(summarizeAmount(total.cents, total.pending, total.invalid))}</li>`;
          }).join("")}</ul>
        </details>
      </li>
    `).join("");
  }

  function renderEvents(center) {
    if (!center.events.length) {
      elements.eventLog.innerHTML = '<li class="event-empty">Sin eventos.</li>';
      return;
    }
    elements.eventLog.innerHTML = center.events.slice().reverse().map((event) => `
      <li class="event ${event.type === "rejected" ? "is-rejected" : ""}">
        <time>${escapeHTML(event.time || "Escenario")}</time>
        <span>${escapeHTML(event.message)}</span>
        ${event.note ? `<span class="event-note">${escapeHTML(event.note)}</span>` : ""}
      </li>
    `).join("");
  }

  function render() {
    const center = selectedCenter();
    const profile = selectedProfile();
    const editable = canCapture(center, profile);
    renderCenterPicker();
    renderProfile(center);
    elements.statusMessage.textContent = state.notice;
    elements.statusMessage.className = `notice${state.noticeType ? ` is-${state.noticeType}` : ""}`;
    elements.budgetTitle.textContent = center.name;
    elements.statusBadge.textContent = statusNames[center.status];
    elements.statusBadge.dataset.status = center.status;
    elements.captureActions.hidden = !editable;
    elements.readonlyNote.hidden = editable;
    elements.staleSubmit.hidden = !editable;
    if (!editable) {
      elements.readonlyTitle.textContent = profile.role === "reviewer" ? "Perfil de revisión: solo lectura de importes." : "Este perfil no tiene asignación de captura para este centro.";
      elements.readonlyDescription.textContent = "La asignación visible es ficticia y solo se evalúa en el navegador.";
    }
    renderTable(center, editable);
    renderTotals(center);
    elements.reviewStatus.textContent = center.status === "submitted"
      ? `Entrega pendiente de revisión. Snapshot más reciente: entrega ${center.submissions.at(-1).id}, versión v${center.submissions.at(-1).version}.`
      : center.status === "returned"
        ? `Devuelto con observaciones. ${center.observations.at(-1) || ""} Puedes editar y crear una nueva entrega; la anterior sigue en el historial.`
        : center.status === "validated"
          ? "Entrega validada en este escenario sintético. El historial conserva sus snapshots anteriores."
          : "Borrador local. Completa importes, envía a revisión y observa el historial de snapshots.";
    elements.reviewActions.hidden = !(profile.role === "reviewer" && center.status === "submitted");
    elements.reviewNote.value = "";
    renderHistory(center);
    renderEvents(center);
  }

  function addEvent(center, type, message, note = "") {
    center.events.push({ type, message, note, time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) });
  }

  function setNotice(message, type = "") {
    state.notice = message;
    state.noticeType = type;
  }

  function submitWithExpectedVersion(center, expectedVersion) {
    if (!canCapture(center)) {
      setNotice("Entrega no disponible para este perfil o estado.", "error");
      render();
      return;
    }
    const result = BudgetState.submit(center, expectedVersion, state.nextSubmissionId);
    if (!result.ok && result.reason === "stale") {
      const message = `Entrega rechazada: versión esperada v${result.expectedVersion}; versión vigente v${result.currentVersion}. No cambió el presupuesto ni el historial de entregas.`;
      addEvent(center, "rejected", message);
      setNotice(message, "error");
      render();
      return;
    }
    if (!result.ok && result.reason === "incomplete") {
      setNotice(`No se puede entregar: quedan ${result.stats.pending} celdas pendientes y ${result.stats.invalid} importes inválidos.`, "error");
      render();
      return;
    }
    if (!result.ok) {
      setNotice("Entrega no disponible para este estado.", "error");
      render();
      return;
    }
    const snapshot = result.snapshot;
    state.nextSubmissionId += 1;
    addEvent(center, "state", `Entrega ${snapshot.id} enviada para revisión como versión v${snapshot.version}.`);
    setNotice(`Entrega ${snapshot.id} guardada en historial. El centro quedó en revisión.`, "success");
    render();
  }

  elements.profileSelect.addEventListener("change", () => {
    state.profileId = elements.profileSelect.value;
    setNotice("");
    render();
  });

  elements.centerPicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-center-id]");
    if (!button) return;
    state.selectedCenterId = button.dataset.centerId;
    setNotice("");
    render();
  });

  elements.budgetTable.addEventListener("input", (event) => {
    const input = event.target.closest("[data-amount]");
    if (!input) return;
    const center = state.centers.find((item) => item.id === input.dataset.centerId);
    const item = center.items.find((row) => row.id === input.dataset.itemId);
    item.months[Number(input.dataset.monthIndex)] = input.value === "" ? null : input.value;
    setNotice("");
    renderTotals(center);
  });

  elements.fillBlanks.addEventListener("click", () => {
    const center = selectedCenter();
    if (!canCapture(center)) return;
    const filled = BudgetState.completePending(center);
    addEvent(center, "state", `${filled} celdas vacías registradas explícitamente como 0.00.`);
    setNotice(`${filled} celdas pendientes quedaron registradas como 0.00. Puedes corregir cada importe antes de entregar.`, "success");
    render();
  });

  elements.submitBudget.addEventListener("click", () => {
    const center = selectedCenter();
    submitWithExpectedVersion(center, center.version);
  });

  elements.staleSubmit.addEventListener("click", () => {
    const center = selectedCenter();
    submitWithExpectedVersion(center, center.version - 1);
  });

  elements.returnBudget.addEventListener("click", () => {
    const center = selectedCenter();
    const note = elements.reviewNote.value.trim();
    if (center.status !== "submitted" || selectedProfile().role !== "reviewer") return;
    if (!note) {
      setNotice("Escribe una observación para devolver la entrega.", "error");
      elements.reviewNote.focus();
      render();
      return;
    }
    const transition = BudgetState.review(center, "return", note);
    if (!transition.ok) {
      setNotice("No se pudo devolver la entrega. Revisa la observación requerida.", "error");
      render();
      return;
    }
    addEvent(center, "state", `Entrega ${center.submissions.at(-1).id} devuelta. La versión del presupuesto ahora es v${center.version}.`, note);
    setNotice(`Entrega ${center.submissions.at(-1).id} devuelta. Su snapshot anterior permanece en el historial.`, "success");
    render();
  });

  elements.approveBudget.addEventListener("click", () => {
    const center = selectedCenter();
    if (center.status !== "submitted" || selectedProfile().role !== "reviewer") return;
    const note = elements.reviewNote.value.trim();
    const transition = BudgetState.review(center, "approve", note);
    if (!transition.ok) {
      setNotice("La entrega ya no está disponible para revisión.", "error");
      render();
      return;
    }
    addEvent(center, "state", `Entrega ${center.submissions.at(-1).id} validada. La versión del presupuesto ahora es v${center.version}.`, note);
    setNotice("Entrega validada en el escenario. El snapshot entregado y el historial siguen disponibles.", "success");
    render();
  });

  document.getElementById("reset-demo").addEventListener("click", () => {
    state = createInitialState();
    elements.profileSelect.value = state.profileId;
    render();
    document.getElementById("reset-demo").focus();
  });

  render();
})();
