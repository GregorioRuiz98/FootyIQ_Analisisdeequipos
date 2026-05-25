const links = ["Match", "Team", "Player", "Competition", "Favoritos"];

export function QuickAccess(): JSX.Element {
  return (
    <section className="glass-panel panel">
      <div className="panel-head">
        <h3>ACCESOS RAPIDOS</h3>
      </div>
      <div className="quick-grid">
        {links.map((label) => (
          <button key={label} type="button" className="quick-item">
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
