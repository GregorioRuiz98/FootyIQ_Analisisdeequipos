import { generateManualMatchPdf } from "../../services/matchReportPdf";
import { useEventingMatch } from "./eventingContext";

export function EventingReportPage(): JSX.Element {
  const { match, events } = useEventingMatch();

  const download = (): void => {
    generateManualMatchPdf(match, events);
  };

  const total = events.length;
  const goals = events.filter((e) => e.eventType === "GOL").length;
  const shots = events.filter(
    (e) => e.eventType === "TIRO" || e.eventType === "GOL",
  ).length;
  const fouls = events.filter((e) => e.eventType === "FALTA").length;
  const cards = events.filter((e) => e.eventType === "TARJETA").length;

  return (
    <section className="glass-panel panel">
      <div className="panel-head">
        <h3>Informe PDF</h3>
        <span className="subtle">
          Descarga un informe del partido con alineaciones, mapa de tiros y
          cronologia
        </span>
      </div>

      <div className="stat-grid">
        <div className="stat-card glass-soft">
          <span className="subtle">Eventos</span>
          <strong>{total}</strong>
        </div>
        <div className="stat-card glass-soft">
          <span className="subtle">Tiros</span>
          <strong>{shots}</strong>
        </div>
        <div className="stat-card glass-soft">
          <span className="subtle">Goles</span>
          <strong>{goals}</strong>
        </div>
        <div className="stat-card glass-soft">
          <span className="subtle">Faltas</span>
          <strong>{fouls}</strong>
        </div>
        <div className="stat-card glass-soft">
          <span className="subtle">Tarjetas</span>
          <strong>{cards}</strong>
        </div>
      </div>

      <p className="subtle" style={{ marginTop: "0.8rem" }}>
        Se generara un PDF con las alineaciones guardadas, mapa de tiros y la
        cronologia completa de eventos.
      </p>

      <button
        type="button"
        className="cta"
        onClick={download}
        style={{ marginTop: "0.8rem" }}
      >
        Descargar informe PDF
      </button>
    </section>
  );
}
