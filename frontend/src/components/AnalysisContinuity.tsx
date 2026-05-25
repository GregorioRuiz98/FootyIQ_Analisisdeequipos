const cards = [
  {
    status: "EN CURSO",
    title: "Barcelona vs Villarreal",
    subtitle: "LaLiga - Jornada 37",
    cta: "Continuar analisis",
  },
  {
    status: "EN PAUSA",
    title: "Arsenal - Modelo Ofensivo",
    subtitle: "Premier League 24/25",
    cta: "Reanudar analisis",
  },
  {
    status: "COMPLETADO",
    title: "Real Madrid - Scouting",
    subtitle: "LaLiga 24/25",
    cta: "Ver informe",
  },
  {
    status: "PROGRAMADO",
    title: "Manchester City - Informe",
    subtitle: "Premier League 24/25",
    cta: "Ver planificacion",
  },
];

export function AnalysisContinuity(): JSX.Element {
  return (
    <section className="glass-panel panel">
      <div className="panel-head">
        <h3>CONTINUIDAD DE ANALISIS</h3>
      </div>
      <div className="analysis-grid">
        {cards.map((card) => (
          <article key={card.title} className="analysis-card glass-soft">
            <span
              className={`status ${card.status.toLowerCase().replace(" ", "-")}`}
            >
              {card.status}
            </span>
            <h4>{card.title}</h4>
            <p>{card.subtitle}</p>
            <button type="button" className="cta">
              {card.cta}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
