import { useMemo } from "react";
import type { MatchEvent } from "../types";

type TimelineProps = {
  events: MatchEvent[];
  homeTeamId?: string;
  awayTeamId?: string;
  maxMinute?: number;
};

const COLORS: Record<string, string> = {
  GOL: "#f9ff7a",
  TIRO: "#7ec8ff",
  TARJETA: "#ffcf6e",
  FALTA: "#ff8a8a",
  PARADA: "#a0e8a0",
};

function colorFor(type: string): string {
  return COLORS[type] || "#d0d0d0";
}

export function Timeline({
  events,
  homeTeamId,
  awayTeamId,
  maxMinute = 90,
}: TimelineProps): JSX.Element {
  const filtered = useMemo(
    () => events.filter((e) => COLORS[e.eventType]),
    [events],
  );
  const cap = Math.max(maxMinute, ...filtered.map((e) => e.minute || 0));

  const home = filtered.filter((e) => e.teamId && e.teamId === homeTeamId);
  const away = filtered.filter((e) => e.teamId && e.teamId === awayTeamId);

  const render = (list: MatchEvent[], side: "home" | "away"): JSX.Element[] =>
    list.map((e, idx) => {
      const left = Math.min(100, ((e.minute || 0) / cap) * 100);
      return (
        <div
          key={e.id || `${side}-${idx}`}
          className={`tl-marker tl-${side}`}
          style={{ left: `${left}%`, background: colorFor(e.eventType) }}
          title={`${e.minute}' ${e.eventType} - ${e.playerName || ""}`}
        >
          {e.eventType === "GOL" ? "G" : ""}
        </div>
      );
    });

  return (
    <div className="timeline-wrapper">
      <div className="timeline-row">
        <span className="timeline-label">Local</span>
        <div className="timeline-track">{render(home, "home")}</div>
      </div>
      <div className="timeline-axis">
        {[0, 15, 30, 45, 60, 75, 90]
          .filter((m) => m <= cap)
          .map((m) => (
            <span
              key={m}
              className="timeline-tick"
              style={{ left: `${(m / cap) * 100}%` }}
            >
              {m}'
            </span>
          ))}
      </div>
      <div className="timeline-row">
        <span className="timeline-label">Visitante</span>
        <div className="timeline-track">{render(away, "away")}</div>
      </div>
      <div className="timeline-legend subtle">
        {Object.entries(COLORS).map(([type, color]) => (
          <span key={type} className="tl-legend-item">
            <span className="tl-dot" style={{ background: color }} /> {type}
          </span>
        ))}
      </div>
    </div>
  );
}
