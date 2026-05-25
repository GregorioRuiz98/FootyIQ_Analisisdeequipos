import { jsPDF } from "jspdf";
import type { MatchEvent } from "../types";
import type { ManualMatch, ManualPlayerSelection } from "./api";

type ReportInput = {
  title: string;
  homeName: string;
  awayName: string;
  homeStartingXI?: ManualPlayerSelection[];
  homeBench?: ManualPlayerSelection[];
  awayStartingXI?: ManualPlayerSelection[];
  awayBench?: ManualPlayerSelection[];
  events: MatchEvent[];
  homeTeamId?: string;
  awayTeamId?: string;
};

function formatPlayer(p: ManualPlayerSelection): string {
  const num = p.number ? `#${p.number} ` : "";
  const pos = p.position ? ` (${p.position})` : "";
  return `${num}${p.name || "-"}${pos}`;
}

function drawSection(
  doc: jsPDF,
  y: number,
  label: string,
  margin = 14,
): number {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(label, margin, y);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 1.5, 200, y + 1.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  return y + 6;
}

function drawShotMap(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  events: MatchEvent[],
  homeTeamId?: string,
  awayTeamId?: string,
): void {
  doc.setFillColor(29, 86, 48);
  doc.rect(x, y, width, height, "F");
  doc.setDrawColor(221, 249, 168);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height);
  doc.line(x + width / 2, y, x + width / 2, y + height);
  doc.circle(x + width / 2, y + height / 2, Math.min(width, height) * 0.12);

  const shots = events.filter(
    (e) => e.eventType === "TIRO" || e.eventType === "GOL",
  );
  shots.forEach((s) => {
    const cx = x + (s.x / 100) * width;
    const cy = y + (s.y / 100) * height;
    const isGoal = s.eventType === "GOL";
    const isHome = s.teamId === homeTeamId;
    if (isGoal) {
      doc.setFillColor(249, 255, 122);
    } else if (isHome) {
      doc.setFillColor(126, 200, 255);
    } else if (s.teamId === awayTeamId) {
      doc.setFillColor(255, 138, 138);
    } else {
      doc.setFillColor(220, 220, 220);
    }
    doc.circle(cx, cy, isGoal ? 1.6 : 1.1, "F");
  });
}

export function generateMatchReportPdf(input: ReportInput): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("FootyIQ · Informe de partido", margin, y);
  y += 7;
  doc.setFontSize(14);
  doc.text(input.title, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString()}`, margin, y);
  y += 8;

  const total = input.events.length;
  const shots = input.events.filter(
    (e) => e.eventType === "TIRO" || e.eventType === "GOL",
  );
  const goals = input.events.filter((e) => e.eventType === "GOL");
  const fouls = input.events.filter((e) => e.eventType === "FALTA");
  const cards = input.events.filter((e) => e.eventType === "TARJETA");

  y = drawSection(doc, y, "Resumen");
  doc.text(
    `Eventos: ${total} | Tiros: ${shots.length} | Goles: ${goals.length} | Faltas: ${fouls.length} | Tarjetas: ${cards.length}`,
    margin,
    y,
  );
  y += 8;

  y = drawSection(doc, y, `Alineacion local · ${input.homeName}`);
  const homeXI = (input.homeStartingXI || []).map(formatPlayer).join(", ");
  const homeBench = (input.homeBench || []).map(formatPlayer).join(", ");
  doc.text(doc.splitTextToSize(`XI: ${homeXI || "-"}`, 180), margin, y);
  y += Math.max(5, doc.splitTextToSize(`XI: ${homeXI || "-"}`, 180).length * 4);
  doc.text(
    doc.splitTextToSize(`Banquillo: ${homeBench || "-"}`, 180),
    margin,
    y,
  );
  y +=
    Math.max(
      5,
      doc.splitTextToSize(`Banquillo: ${homeBench || "-"}`, 180).length * 4,
    ) + 3;

  y = drawSection(doc, y, `Alineacion visitante · ${input.awayName}`);
  const awayXI = (input.awayStartingXI || []).map(formatPlayer).join(", ");
  const awayBench = (input.awayBench || []).map(formatPlayer).join(", ");
  doc.text(doc.splitTextToSize(`XI: ${awayXI || "-"}`, 180), margin, y);
  y += Math.max(5, doc.splitTextToSize(`XI: ${awayXI || "-"}`, 180).length * 4);
  doc.text(
    doc.splitTextToSize(`Banquillo: ${awayBench || "-"}`, 180),
    margin,
    y,
  );
  y +=
    Math.max(
      5,
      doc.splitTextToSize(`Banquillo: ${awayBench || "-"}`, 180).length * 4,
    ) + 3;

  y = drawSection(doc, y, "Mapa de tiros");
  drawShotMap(
    doc,
    margin,
    y,
    180,
    70,
    input.events,
    input.homeTeamId,
    input.awayTeamId,
  );
  y += 76;
  doc.setFontSize(8);
  doc.text("Azul = Local · Rojo = Visitante · Amarillo = Gol", margin, y);
  y += 6;
  doc.setFontSize(10);

  if (y > 240) {
    doc.addPage();
    y = 18;
  }

  y = drawSection(doc, y, "Cronologia de eventos");
  const sorted = [...input.events].sort(
    (a, b) => a.minute * 60 + a.second - (b.minute * 60 + b.second),
  );
  sorted.forEach((e) => {
    if (y > 285) {
      doc.addPage();
      y = 18;
    }
    const time = `${String(e.minute).padStart(2, "0")}:${String(e.second).padStart(2, "0")}`;
    const teamLabel =
      e.teamId === input.homeTeamId
        ? "L"
        : e.teamId === input.awayTeamId
          ? "V"
          : "-";
    const line = `${time} · [${teamLabel}] ${e.eventType} · ${e.playerName || "-"}${e.notes ? ` (${e.notes})` : ""}`;
    doc.text(doc.splitTextToSize(line, 180), margin, y);
    y += 5;
  });

  if (sorted.length === 0) {
    doc.text("Sin eventos registrados.", margin, y);
  }

  const safeTitle = input.title
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "_");
  doc.save(`informe-${safeTitle || "partido"}.pdf`);
}

export function generateManualMatchPdf(
  match: ManualMatch,
  events: MatchEvent[],
): void {
  const title =
    match.name ||
    `${match.homeTeamName || "Local"} vs ${match.awayTeamName || "Visitante"}`;
  generateMatchReportPdf({
    title,
    homeName: match.homeTeamName || "Local",
    awayName: match.awayTeamName || "Visitante",
    homeStartingXI: match.homeStartingXI,
    homeBench: match.homeBench,
    awayStartingXI: match.awayStartingXI,
    awayBench: match.awayBench,
    events,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
  });
}
