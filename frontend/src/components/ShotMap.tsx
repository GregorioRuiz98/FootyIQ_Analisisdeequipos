import type { MatchEvent } from "../types";

type ShotMapProps = {
  events: MatchEvent[];
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  height?: number;
  filterTeamId?: string;
  filterPlayer?: string;
  onlyGoals?: boolean;
};

const SHOT_TYPES = new Set(["TIRO", "GOL"]);

export function ShotMap({
  events,
  homeTeamId,
  awayTeamId,
  homeTeamName = "Local",
  awayTeamName = "Visitante",
  height = 320,
  filterTeamId,
  filterPlayer,
  onlyGoals = false,
}: ShotMapProps): JSX.Element {
  const shots = events.filter((e) => {
    if (!SHOT_TYPES.has(e.eventType)) return false;
    if (onlyGoals && e.eventType !== "GOL") return false;
    if (filterTeamId && e.teamId !== filterTeamId) return false;
    if (
      filterPlayer &&
      !(e.playerName || "").toLowerCase().includes(filterPlayer.toLowerCase())
    )
      return false;
    return true;
  });
  const totalShots = shots.length;
  const goals = shots.filter((e) => e.eventType === "GOL").length;
  const homeShots = shots.filter((e) => e.teamId && e.teamId === homeTeamId);
  const awayShots = shots.filter((e) => e.teamId && e.teamId === awayTeamId);

  return (
    <div className="shotmap-wrapper">
      <div className="shotmap-stats">
        <span>
          <strong>{totalShots}</strong> tiros
        </span>
        <span>
          <strong>{goals}</strong> goles
        </span>
        <span className="dot home" /> {homeTeamName} ({homeShots.length})
        <span className="dot away" /> {awayTeamName} ({awayShots.length})
      </div>
      <svg
        viewBox="0 0 100 62"
        preserveAspectRatio="none"
        style={{ width: "100%", height }}
        className="shotmap-svg"
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
        <rect
          x="0"
          y="20"
          width="14"
          height="22"
          fill="none"
          stroke="rgba(221,249,168,0.35)"
          strokeWidth="0.3"
        />
        <rect
          x="86"
          y="20"
          width="14"
          height="22"
          fill="none"
          stroke="rgba(221,249,168,0.35)"
          strokeWidth="0.3"
        />
        {shots.map((shot, idx) => {
          const isGoal = shot.eventType === "GOL";
          const isHome = shot.teamId === homeTeamId;
          const fill = isGoal ? "#f9ff7a" : isHome ? "#7ec8ff" : "#ff8a8a";
          const stroke = isGoal ? "#3f6112" : "#0b172a";
          const r = isGoal ? 1.8 : 1.3;
          const cx = (shot.x / 100) * 100;
          const cy = (shot.y / 100) * 62;
          return (
            <g key={shot.id || `${shot.minute}-${shot.second}-${idx}`}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={fill}
                stroke={stroke}
                strokeWidth="0.3"
              />
              {isGoal ? (
                <text
                  x={cx}
                  y={cy + 0.6}
                  fontSize="1.6"
                  textAnchor="middle"
                  fill="#0b172a"
                  fontWeight="bold"
                >
                  G
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {totalShots === 0 ? (
        <p className="subtle">Sin tiros registrados todavia.</p>
      ) : null}
    </div>
  );
}
