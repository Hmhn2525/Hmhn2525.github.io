"use strict";

const fs = require("node:fs");
const path = require("node:path");
const fixture = require("./scenario.json");

const outputPath = path.join(__dirname, "..", "docs", "images", "mockup-synthetic.svg");
const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const colors = {
  ink: "#17233b",
  muted: "#586681",
  line: "#dce3ee",
  blue: "#23489f",
  bluePale: "#eef3ff",
  teal: "#08766e",
  tealPale: "#e5f5f1",
  amber: "#80510b",
  amberPale: "#fff4dc",
  canvas: "#f3f6fb",
  paper: "#ffffff",
  header: "#14284d"
};

function xml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
}

function toCents(value) {
  if (value === null) return null;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2));
}

function formatCents(cents) {
  const whole = (cents / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fraction = (cents % 100n).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

function summarize(values) {
  let cents = 0n;
  let captured = 0;
  let pending = 0;
  let zeros = 0;
  for (const value of values) {
    if (value === null) {
      pending += 1;
    } else {
      const amount = toCents(value);
      cents += amount;
      captured += 1;
      if (amount === 0n) zeros += 1;
    }
  }
  return { cents, captured, pending, zeros };
}

function text(x, y, value, size = 14, fill = colors.ink, weight = 400, extra = "") {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" ${extra}>${xml(value)}</text>`;
}

function cell(x, y, width, height, label, kind = "normal", align = "middle", size = 12, weight = 500) {
  const fill = kind === "zero" ? colors.tealPale : kind === "pending" ? colors.amberPale : kind === "header" ? "#eef2f8" : kind === "total" ? "#f5f7fb" : colors.paper;
  const ink = kind === "zero" ? colors.teal : kind === "pending" ? colors.amber : kind === "header" ? "#35415a" : colors.ink;
  const xText = align === "start" ? x + 10 : x + width / 2;
  return `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${colors.line}"/><text x="${xText}" y="${y + height / 2 + 4}" fill="${ink}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${align === "start" ? "start" : "middle"}">${xml(label)}</text></g>`;
}

function rowValues(centerId, item) {
  return item.months.map((value) => value === null ? "PENDIENTE" : value).join("|");
}

function centerBlock(center, top) {
  const stats = summarize(center.items.flatMap((item) => item.months));
  const centerTotal = formatCents(stats.cents);
  const centerTotalText = `$${centerTotal} MXN · ${stats.pending} pendiente`;
  const cardX = 40;
  const cardW = 1440;
  const tableX = 62;
  const tableY = top + 91;
  const labelW = 164;
  const monthW = 82;
  const annualW = 248;
  const headerH = 34;
  const rowH = 39;
  const footerH = 44;
  const tableW = labelW + monthW * 12 + annualW;
  let out = `<g class="budget-center" data-center-id="${xml(center.id)}" data-total-cents="${stats.cents}" data-captured="${stats.captured}" data-pending="${stats.pending}" data-zeros="${stats.zeros}">`;
  out += `<rect x="${cardX}" y="${top}" width="${cardW}" height="405" rx="18" fill="${colors.paper}" stroke="${colors.line}"/>`;
  out += text(64, top + 36, center.name, 23, colors.ink, 700);
  out += text(64, top + 59, `${center.id} · Ejercicio demo`, 13, colors.muted, 500);
  out += `<rect x="470" y="${top + 17}" width="188" height="31" rx="15" fill="${colors.bluePale}"/>`;
  out += text(564, top + 37, "BORRADOR · VERSIÓN 1", 11, colors.blue, 700, 'text-anchor="middle" letter-spacing="0.4"');
  out += text(1072, top + 25, "TOTAL CAPTURADO · MXN", 11, colors.muted, 700, 'letter-spacing="0.6"');
  out += text(1072, top + 51, centerTotalText, 16, colors.ink, 700);
  out += text(tableX, top + 80, "Importes por mes · 0.00 = cero capturado · PEND. = celda vacía", 12, colors.muted, 500);

  let x = tableX;
  out += cell(x, tableY, labelW, headerH, "PARTIDA", "header", "start", 11, 700);
  x += labelW;
  for (const month of monthLabels) {
    out += cell(x, tableY, monthW, headerH, month.toUpperCase(), "header", "middle", 11, 700);
    x += monthW;
  }
  out += cell(x, tableY, annualW, headerH, "TOTAL ANUAL", "header", "middle", 11, 700);

  for (let rowIndex = 0; rowIndex < center.items.length; rowIndex += 1) {
    const item = center.items[rowIndex];
    const y = tableY + headerH + rowIndex * rowH;
    const itemStats = summarize(item.months);
    const annualText = itemStats.pending ? `$${formatCents(itemStats.cents)} · ${itemStats.pending} pend.` : `$${formatCents(itemStats.cents)}`;
    out += `<g class="budget-row" data-center-id="${xml(center.id)}" data-item-id="${xml(item.id)}" data-month-values="${xml(rowValues(center.id, item))}" data-total-cents="${itemStats.cents}" data-captured="${itemStats.captured}" data-pending="${itemStats.pending}" data-zeros="${itemStats.zeros}">`;
    out += cell(tableX, y, labelW, rowH, item.name, "normal", "start", 12, 650);
    x = tableX + labelW;
    for (const value of item.months) {
      const label = value === null ? "PEND." : value;
      const kind = value === null ? "pending" : toCents(value) === 0n ? "zero" : "normal";
      out += cell(x, y, monthW, rowH, label, kind, "middle", 12, value === null || kind === "zero" ? 700 : 500);
      x += monthW;
    }
    out += cell(x, y, annualW, rowH, annualText, itemStats.pending ? "pending" : "total", "middle", 12, 700);
    out += "</g>";
  }

  const totalsY = tableY + headerH + center.items.length * rowH;
  out += cell(tableX, totalsY, labelW, footerH, "SUBTOTAL POR MES", "total", "start", 11, 700);
  x = tableX + labelW;
  for (let monthIndex = 0; monthIndex < monthLabels.length; monthIndex += 1) {
    const values = center.items.map((item) => item.months[monthIndex]);
    const monthly = summarize(values);
    const label = monthly.pending ? `${formatCents(monthly.cents)} + ${monthly.pending} pend.` : formatCents(monthly.cents);
    out += cell(x, totalsY, monthW, footerH, label, monthly.pending ? "pending" : "total", "middle", 10, 650);
    x += monthW;
  }
  const annualFooter = `$${centerTotal} · ${stats.pending} pend.`;
  out += cell(x, totalsY, annualW, footerH, annualFooter, "total", "middle", 12, 750);

  out += text(tableX, top + 365, `${stats.captured}/36 importes capturados  ·  ${stats.pending} pendiente  ·  ${stats.zeros} ceros explícitos`, 13, colors.muted, 650);
  out += "</g>";
  return out;
}

function render() {
  const width = 1520;
  const height = 1180;
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`;
  svg += `<title id="title">Mockup sintético del presupuesto anual de dos centros</title>`;
  svg += `<desc id="desc">Matriz estática con tres partidas y doce meses por centro. Muestra totales parciales, once ceros capturados y una celda pendiente por centro. Fixture pública, sin backend y sin relación con la interfaz del piloto.</desc>`;
  svg += `<rect width="${width}" height="${height}" fill="${colors.canvas}"/>`;
  svg += `<rect x="40" y="30" width="1440" height="145" rx="20" fill="${colors.header}"/>`;
  svg += text(68, 62, "GESTIÓN PRESUPUESTARIA · ESTADO INICIAL", 12, "#b7c9ed", 700, 'letter-spacing="1"');
  svg += text(68, 101, "Presupuesto anual por centro", 31, "#ffffff", 700);
  svg += text(68, 132, "mockup sintético; demo independiente, sin backend", 16, "#8fe0cc", 700);
  svg += text(68, 158, "Origen: fixture pública examples/scenario.json · ejercicio demo · MXN", 12, "#e1e8f5", 500);
  svg += `<rect x="1260" y="50" width="188" height="39" rx="19" fill="#28416c" stroke="#6f88b3"/>`;
  svg += text(1354, 75, "2026-10-09", 14, "#ffffff", 700, 'text-anchor="middle"');
  svg += centerBlock(fixture.centers[0], 195);
  svg += centerBlock(fixture.centers[1], 615);
  svg += `<rect x="40" y="1035" width="1440" height="112" rx="17" fill="${colors.paper}" stroke="${colors.line}"/>`;
  svg += `<rect x="66" y="1058" width="18" height="18" rx="4" fill="${colors.bluePale}" stroke="#aac0ee"/>`;
  svg += text(92, 1072, "Importe capturado", 13, colors.ink, 600);
  svg += `<rect x="278" y="1058" width="18" height="18" rx="4" fill="${colors.tealPale}" stroke="#7bc4b5"/>`;
  svg += text(304, 1072, "Cero capturado", 13, colors.ink, 600);
  svg += `<rect x="468" y="1058" width="18" height="18" rx="4" fill="${colors.amberPale}" stroke="#d5ae60"/>`;
  svg += text(494, 1072, "Pendiente", 13, colors.ink, 600);
  svg += text(66, 1101, "Alcance: estado inicial ficticio; no es captura del piloto ni evidencia de backend, permisos o aceptación.", 13, colors.muted, 500);
  svg += text(66, 1127, "Las asignaciones de la demo solo simulan permisos en navegador. Datos públicos, sintéticos y de sesión.", 12, colors.muted, 500);
  svg += "</svg>\n";
  return svg;
}

const rendered = render();
if (process.argv.includes("--check")) {
  const current = fs.readFileSync(outputPath, "utf8");
  if (current !== rendered) {
    console.error("El mockup SVG no coincide con examples/scenario.json; ejecuta node examples/render_mockup.js para regenerarlo.");
    process.exitCode = 1;
  } else {
    console.log("Mockup SVG coincide con la fixture pública scenario.json.");
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, rendered, "utf8");
  console.log(`Mockup sintético escrito en ${path.relative(process.cwd(), outputPath)}.`);
}
