import { useMemo } from "react";
import type { MatchEvent } from "../types";

type HeatmapProps = {
  events: MatchEvent[];
  height?: number;
  cellsX?: number;
  cellsY?: number;
};

export function Heatmap({
  events,
  height = 220,
  cellsX = 12,
  cellsY = 8,
}: HeatmapProps): JSX.Element {
  const { grid, max } = useMemo(() => {
    const g: number[][] = Array.from({ length: cellsY }, () =>
      Array.from({ length: cellsX }, () => 0),
    );
    let maxVal = 0;
    for (const ev of events) {
      if (typeof ev.x !== "number" || typeof ev.y !== "number") continue;
      const cx = Math.max(
        0,
        Math.min(cellsX - 1, Math.floor((ev.x / 100) * cellsX)),
      );
      const cy = Math.max(
        0,
        Math.min(cellsY - 1, Math.floor((ev.y / 100) * cellsY)),
      );
      g[cy][cx] += 1;
      if (g[cy][cx] > maxVal) maxVal = g[cy][cx];
    }
    return { grid: g, max: maxVal };
  }, [events, cellsX, cellsY]);

  const cellW = 100 / cellsX;
  const cellH = 62 / cellsY;

  return (
    <div className="heatmap-wrapper">
      <svg
        viewBox="0 0 100 62"
        preserveAspectRatio="none"
        style={{ width: "100%", height }}
        className="heatmap-svg"
      >
        <rect
          x="0"
          y="0"
          width="100"
          height="62"
          fill="#1d5630"
          stroke="rgba(221,249,168,0.45)"
          strokeWidth="0.4"
        />
        {grid.flatMap((row, y) =>
          row.map((value, x) => {
            if (value === 0) return null;
            const intensity = max > 0 ? value / max : 0;
            const alpha = 0.15 + intensity * 0.65;
            return (
              <rect
                key={`${x}-${y}`}
                x={x * cellW}
                y={y * cellH}
                width={cellW}
                height={cellH}
                fill={`rgba(249, 255, 122, ${alpha})`}
              />
            );
          }),
        )}
        <line
          x1="50"
          y1="0"
          x2="50"
          y2="62"
          stroke="rgba(221,249,168,0.45)"
          strokeWidth="0.3"
        />
        <circle
          cx="50"
          cy="31"
          r="7"
          fill="none"
          stroke="rgba(221,249,168,0.45)"
          strokeWidth="0.3"
        />
      </svg>
      {events.length === 0 ? (
        <p className="subtle">Sin eventos para generar mapa de calor.</p>
      ) : (
        <p className="subtle">
          {events.length} eventos · pico {max} en una zona
        </p>
      )}
    </div>
  );
}
