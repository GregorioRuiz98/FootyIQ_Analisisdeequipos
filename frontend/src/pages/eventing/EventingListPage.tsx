import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteManualMatch,
  getManualMatches,
  type ManualMatch,
} from "../../services/api";

export function EventingListPage(): JSX.Element {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<ManualMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getManualMatches()
      .then(setMatches)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (
    evt: React.MouseEvent,
    id: string,
  ): Promise<void> => {
    evt.stopPropagation();
    if (!window.confirm("Eliminar este partido manual?")) return;
    setDeletingId(id);
    try {
      await deleteManualMatch(id);
      setMatches((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="eventing-shell">
      <section className="glass-panel panel">
        <div className="panel-head">
          <div>
            <h3 style={{ margin: 0 }}>EVENTING MANUAL</h3>
            <span className="subtle">
              Abre un partido guardado o crea uno nuevo
            </span>
          </div>
          <button
            type="button"
            className="icon-btn big"
            onClick={() => navigate("/eventing/new")}
          >
            + Nuevo partido
          </button>
        </div>

        {loading ? (
          <p className="subtle">Cargando...</p>
        ) : matches.length === 0 ? (
          <p className="subtle">
            Todavia no tienes partidos manuales. Pulsa "Nuevo partido" para
            empezar.
          </p>
        ) : (
          <div className="event-list">
            {matches.map((m) => {
              const title =
                m.name ||
                `${m.homeTeamName || "Local"} vs ${m.awayTeamName || "Visitante"}`;
              return (
                <div
                  key={m.id}
                  className="event-item glass-soft event-item-row"
                >
                  <button
                    type="button"
                    className="eventing-list-item"
                    onClick={() => navigate(`/eventing/${m.id}/resumen`)}
                  >
                    <strong>{title}</strong>
                    <p className="subtle">
                      XI local: {m.homeStartingXI?.length || 0} · XI visitante:{" "}
                      {m.awayStartingXI?.length || 0}
                    </p>
                    <small className="subtle">
                      Actualizado:{" "}
                      {m.updatedAt
                        ? new Date(m.updatedAt).toLocaleString()
                        : "-"}
                    </small>
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    title="Eliminar partido"
                    disabled={deletingId === m.id}
                    onClick={(e) => handleDelete(e, m.id)}
                  >
                    {deletingId === m.id ? "..." : "X"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
