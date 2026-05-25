import type { DashboardSnapshot } from "../types";

type Props = {
  snapshot: DashboardSnapshot;
};

function PriorityPill({ value }: { value?: string }): JSX.Element {
  const normalized = (value || "BAJO").toUpperCase();
  return <span className={`pill ${normalized.toLowerCase()}`}>{normalized}</span>;
}

export function MatchPanels({ snapshot }: Props): JSX.Element {
  return (
    <section className="two-cols">
      <article className="glass-panel panel">
        <div className="panel-head">
          <h3>PARTIDOS RECIENTES</h3>
        </div>
        <div className="list-rows">
          {snapshot.recentMatches.map((match, index) => (
            <div key={`${match.home}-${match.away}-${index}`} className="match-row">
              <div>
                <p className="subtle">{match.status || "Finalizado"}</p>
                <p className="league">{match.league || "Liga"}</p>
              </div>
              <div className="match-center">
                <p>{match.home}</p>
                <strong>{match.score || "-"}</strong>
                <p>{match.away}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="glass-panel panel">
        <div className="panel-head">
          <h3>PROXIMOS PARTIDOS</h3>
        </div>
        <div className="list-rows">
          {snapshot.upcomingMatches.map((match, index) => (
            <div key={`${match.home}-${match.away}-${index}`} className="match-row upcoming">
              <div>
                <p className="subtle">{match.time || "--:--"}</p>
                <p className="league">Hoy</p>
              </div>
              <div className="match-center">
                <p>{match.home}</p>
                <strong>vs</strong>
                <p>{match.away}</p>
              </div>
              <PriorityPill value={match.priority} />
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
