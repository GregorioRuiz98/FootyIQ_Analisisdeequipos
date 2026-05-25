import { ShotMap } from "../../components/ShotMap";
import { useEventingMatch } from "./eventingContext";

export function EventingShotMapPage(): JSX.Element {
  const { match, events } = useEventingMatch();
  return (
    <section className="glass-panel panel">
      <div className="panel-head">
        <h3>Mapa de tiros</h3>
        <span className="subtle">
          Generado a partir de los eventos TIRO y GOL
        </span>
      </div>
      <ShotMap
        events={events}
        homeTeamId={match.homeTeamId}
        awayTeamId={match.awayTeamId}
        homeTeamName={match.homeTeamName}
        awayTeamName={match.awayTeamName}
        height={420}
      />
    </section>
  );
}
