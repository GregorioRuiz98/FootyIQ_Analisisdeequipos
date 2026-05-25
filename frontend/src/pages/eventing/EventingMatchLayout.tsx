import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import {
  getEvents,
  getManualMatch,
  getTeams,
  type ManualMatch,
} from "../../services/api";
import type { CustomTeam, MatchEvent } from "../../types";
import { EventingMatchContext } from "./eventingContext";

const TABS = [
  { to: "resumen", label: "Resumen" },
  { to: "alineaciones", label: "Alineaciones" },
  { to: "registrar", label: "Registrar evento" },
  { to: "mapa-tiros", label: "Mapa de tiros" },
  { to: "informe", label: "Informe PDF" },
];

export function EventingMatchLayout(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<ManualMatch | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [teams, setTeams] = useState<CustomTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([getManualMatch(id), getEvents(id), getTeams()])
      .then(([m, evs, ts]) => {
        setMatch(m);
        setEvents(evs);
        setTeams(ts);
      })
      .catch(() => setError("No se pudo cargar el partido manual."))
      .finally(() => setLoading(false));
  }, [id]);

  const homeTeam = useMemo(
    () => teams.find((t) => t.id === match?.homeTeamId) || null,
    [teams, match],
  );
  const awayTeam = useMemo(
    () => teams.find((t) => t.id === match?.awayTeamId) || null,
    [teams, match],
  );

  const refreshMatch = async (): Promise<void> => {
    if (!id) return;
    const m = await getManualMatch(id);
    setMatch(m);
  };

  const refreshEvents = async (): Promise<void> => {
    if (!id) return;
    const evs = await getEvents(id);
    setEvents(evs);
  };

  const appendEvent = (event: MatchEvent): void => {
    setEvents((prev) => [...prev, event]);
  };

  const updateEventInState = (event: MatchEvent): void => {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
  };

  const removeEvent = (eventId: string): void => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  if (loading) {
    return (
      <section className="glass-panel panel">
        <p className="subtle">Cargando partido...</p>
      </section>
    );
  }

  if (error || !match) {
    return (
      <section className="glass-panel panel">
        <p className="subtle">{error || "Partido no encontrado."}</p>
        <button
          type="button"
          className="icon-btn big"
          onClick={() => navigate("/eventing")}
        >
          Volver a la lista
        </button>
      </section>
    );
  }

  const title =
    match.name ||
    `${match.homeTeamName || "Local"} vs ${match.awayTeamName || "Visitante"}`;

  return (
    <div className="eventing-shell">
      <section className="glass-panel panel">
        <div className="panel-head">
          <div>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <span className="subtle">Partido manual · {match.id}</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => navigate("/eventing")}
          >
            ← Lista
          </button>
        </div>
        <nav className="subnav">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `subnav-item ${isActive ? "active" : ""}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </section>

      <EventingMatchContext.Provider
        value={{
          match,
          events,
          teams,
          homeTeam,
          awayTeam,
          refreshMatch,
          refreshEvents,
          appendEvent,
          updateEventInState,
          removeEvent,
        }}
      >
        <Outlet />
      </EventingMatchContext.Provider>
    </div>
  );
}
