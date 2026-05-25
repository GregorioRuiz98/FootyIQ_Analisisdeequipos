import jsPDF from "jspdf";
import type { ManualMatch } from "../services/api";
import type { MatchEvent } from "../types";
import type { MatchStats } from "./eventStats";

type ExportArgs = {
  match: ManualMatch;
  events: MatchEvent[];
  stats: MatchStats;
};

const PITCH_X = 15;
const PITCH_Y = 60;
const PITCH_W = 180;
const PITCH_H = 110;

function drawPitch(doc: jsPDF): void {
  doc.setDrawColor(80, 120, 80);
  doc.setFillColor(35, 95, 55);
  doc.rect(PITCH_X, PITCH_Y, PITCH_W, PITCH_H, "FD");
  doc.line(
    PITCH_X + PITCH_W / 2,
    PITCH_Y,
    PITCH_X + PITCH_W / 2,
    PITCH_Y + PITCH_H,
  );
  doc.circle(PITCH_X + PITCH_W / 2, PITCH_Y + PITCH_H / 2, 12);
  doc.rect(PITCH_X, PITCH_Y + PITCH_H * 0.3, 18, PITCH_H * 0.4);
  doc.rect(PITCH_X + PITCH_W - 18, PITCH_Y + PITCH_H * 0.3, 18, PITCH_H * 0.4);
}

function plotShots(
  doc: jsPDF,
  events: MatchEvent[],
  homeTeamId?: string,
): void {
  for (const ev of events) {
    if (ev.eventType !== "TIRO" && ev.eventType !== "GOL") continue;
    if (typeof ev.x !== "number" || typeof ev.y !== "number") continue;
    const cx = PITCH_X + (ev.x / 100) * PITCH_W;
    const cy = PITCH_Y + (ev.y / 100) * PITCH_H;
    const isGoal = ev.eventType === "GOL";
    const isHome = ev.teamId && ev.teamId === homeTeamId;
    if (isGoal) {
      doc.setFillColor(249, 255, 122);
    } else if (isHome) {
      doc.setFillColor(126, 200, 255);
    } else {
      doc.setFillColor(255, 138, 138);
    }
    doc.setDrawColor(11, 23, 42);
    doc.circle(cx, cy, isGoal ? 2.2 : 1.6, "FD");
  }
}

export function exportMatchPdf({ match, events, stats }: ExportArgs): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Cabecera
  doc.setFontSize(18);
  const title =
    match.name ||
    `${match.homeTeamName || "Local"} vs ${match.awayTeamName || "Visitante"}`;
  doc.text(title, pageW / 2, 18, { align: "center" });

  doc.setFontSize(12);
  doc.text(
    `${match.homeTeamName || "Local"} ${stats.home.goals} - ${stats.away.goals} ${
      match.awayTeamName || "Visitante"
    }`,
    pageW / 2,
    27,
    { align: "center" },
  );

  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`Generado: ${new Date().toLocaleString()}`, pageW / 2, 33, {
    align: "center",
  });
  doc.setTextColor(0);

  // Stats resumen
  doc.setFontSize(11);
  doc.text("Estadisticas", 15, 44);
  doc.setFontSize(9);
  const left = 15;
  const right = 110;
  let row = 50;
  const lineH = 4.5;
  const headers: Array<[string, number, number]> = [
    ["Posesion", stats.possessionHome, stats.possessionAway],
    ["Tiros", stats.home.shots, stats.away.shots],
    ["Goles", stats.home.goals, stats.away.goals],
    ["Pases", stats.home.passes, stats.away.passes],
    ["Regates", stats.home.dribbles, stats.away.dribbles],
    ["Recuperaciones", stats.home.recoveries, stats.away.recoveries],
    ["Perdidas", stats.home.losses, stats.away.losses],
    ["Faltas", stats.home.fouls, stats.away.fouls],
    ["Tarjetas", stats.home.cards, stats.away.cards],
    ["Paradas", stats.home.saves, stats.away.saves],
  ];
  for (const [label, h, a] of headers) {
    doc.text(label, left, row);
    const isPct = label === "Posesion";
    doc.text(isPct ? `${h.toFixed(0)}%` : String(h), left + 60, row, {
      align: "right",
    });
    doc.text(isPct ? `${a.toFixed(0)}%` : String(a), right, row, {
      align: "right",
    });
    row += lineH;
  }

  // Campograma + tiros
  drawPitch(doc);
  plotShots(doc, events, match.homeTeamId);

  doc.setFontSize(9);
  doc.text(
    `Mapa de tiros - ${stats.home.shots + stats.away.shots} tiros, ${
      stats.home.goals + stats.away.goals
    } goles`,
    15,
    PITCH_Y + PITCH_H + 6,
  );

  // Lista de eventos (nueva pagina si hace falta)
  let y = PITCH_Y + PITCH_H + 14;
  doc.setFontSize(11);
  doc.text(`Eventos (${events.length})`, 15, y);
  y += 6;
  doc.setFontSize(9);

  const sorted = [...events].sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute;
    return (a.second || 0) - (b.second || 0);
  });
  for (const ev of sorted) {
    if (y > 285) {
      doc.addPage();
      y = 20;
    }
    const team =
      ev.teamId === match.homeTeamId
        ? match.homeTeamName || "Local"
        : ev.teamId === match.awayTeamId
          ? match.awayTeamName || "Visitante"
          : "-";
    const min = `${ev.minute}:${String(ev.second || 0).padStart(2, "0")}`;
    const line = `${min}  ${ev.eventType.padEnd(13, " ")} ${ev.playerName || ""}  [${team}]`;
    doc.text(line, 15, y);
    y += 4.5;
  }

  doc.save(`${title.replace(/[^a-zA-Z0-9-_]+/g, "_")}.pdf`);
}
