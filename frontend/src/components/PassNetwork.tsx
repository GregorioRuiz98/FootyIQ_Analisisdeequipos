import { useMemo } from "react";
import type { MatchEvent } from "../types";

type PassNetworkProps = {
  events: MatchEvent[];
  teamId?: string;
  height?: number;
};

type NodeAgg = {
  name: string;
  x: number;
  y: number;
  count: number;
};

type Edge = {
  from: string;
  to: string;
  weight: number;
};

export function PassNetwork({
  events,
  teamId,
  height = 260,
}: PassNetworkProps): JSX.Element {
  const { nodes, edges, maxEdge } = useMemo(() => {
    const passes = events
      .filter((e) => e.eventType === "PASE")
      .filter((e) => (teamId ? e.teamId === teamId : true))
      .filter(
        (e) =>
          typeof e.x === "number" &&
          typeof e.y === "number" &&
          (e.playerName || "").trim().length > 0,
      )
      .slice()
      .sort((a, b) => {
        if (a.minute !== b.minute) return a.minute - b.minute;
        return (a.second || 0) - (b.second || 0);
      });

    const agg = new Map<string, { sx: number; sy: number; n: number }>();
    for (const p of passes) {
      const k = p.playerName!;
      const a = agg.get(k) || { sx: 0, sy: 0, n: 0 };
      a.sx += p.x;
      a.sy += p.y;
      a.n += 1;
      agg.set(k, a);
    }
    const nodes: NodeAgg[] = Array.from(agg.entries()).map(([name, a]) => ({
      name,
      x: a.sx / a.n,
      y: a.sy / a.n,
      count: a.n,
    }));

    const edgeMap = new Map<string, number>();
    for (let i = 0; i < passes.length - 1; i++) {
      const a = passes[i];
      const b = passes[i + 1];
      if (a.teamId !== b.teamId) continue;
      if (!a.playerName || !b.playerName) continue;
      if (a.playerName === b.playerName) continue;
      if (Math.abs((b.minute || 0) - (a.minute || 0)) > 1) continue;
      const k = `${a.playerName}>>${b.playerName}`;
      edgeMap.set(k, (edgeMap.get(k) || 0) + 1);
    }
    const edges: Edge[] = Array.from(edgeMap.entries()).map(([k, w]) => {
      const [from, to] = k.split(">>");
      return { from, to, weight: w };
    });
    const maxEdge = edges.reduce((m, e) => Math.max(m, e.weight), 0);
    return { nodes, edges, maxEdge };
  }, [events, teamId]);

  const nodeByName = useMemo(() => {
    const m = new Map<string, NodeAgg>();
    for (const n of nodes) m.set(n.name, n);
    return m;
  }, [nodes]);

  const maxCount = nodes.reduce((m, n) => Math.max(m, n.count), 0);

  return (
    <div className="passnet-wrapper">
      <svg
        viewBox="0 0 100 62"
        preserveAspectRatio="none"
        style={{ width: "100%", height }}
        className="passnet-svg"
      >
        <rect
          x="0"
          y="0"
          width="100"
          height="62"
          fill="#143922"
          stroke="rgba(221,249,168,0.45)"
          strokeWidth="0.4"
        />
        <line
          x1="50"
          y1="0"
          x2="50"
          y2="62"
          stroke="rgba(221,249,168,0.35)"
          strokeWidth="0.3"
        />
        <circle
          cx="50"
          cy="31"
          r="7"
          fill="none"
          stroke="rgba(221,249,168,0.35)"
          strokeWidth="0.3"
        />
        {edges.map((e) => {
          const a = nodeByName.get(e.from);
          const b = nodeByName.get(e.to);
          if (!a || !b) return null;
          const intensity = maxEdge > 0 ? e.weight / maxEdge : 0;
          const sw = 0.2 + intensity * 1.6;
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={a.x}
              y1={a.y * 0.62}
              x2={b.x}
              y2={b.y * 0.62}
              stroke={`rgba(249, 255, 122, ${0.25 + intensity * 0.55})`}
              strokeWidth={sw}
            />
          );
        })}
        {nodes.map((n) => {
          const r = 1.2 + (maxCount > 0 ? (n.count / maxCount) * 2.4 : 0);
          return (
            <g key={n.name}>
              <circle
                cx={n.x}
                cy={n.y * 0.62}
                r={r}
                fill="#f9ff7a"
                stroke="#0b172a"
                strokeWidth="0.25"
              />
              <text
                x={n.x}
                y={n.y * 0.62 - r - 0.6}
                textAnchor="middle"
                fontSize="1.6"
                fill="#dfe9ff"
              >
                {n.name.length > 12 ? n.name.slice(0, 11) + "..." : n.name}
              </text>
            </g>
          );
        })}
      </svg>
      {nodes.length === 0 ? (
        <p className="subtle">Sin pases registrados para esta seleccion.</p>
      ) : (
        <p className="subtle">
          {nodes.length} jugadores - {edges.length} conexiones - pico {maxEdge}{" "}
          pases entre dos
        </p>
      )}
    </div>
  );
}
