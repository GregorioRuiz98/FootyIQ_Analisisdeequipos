import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  createManualMatch,
  getManualMatch,
  getTeams,
  updateManualMatch,
  type ManualMatch,
  type ManualMatchPayload,
} from "../../services/api";
import type { CustomTeam } from "../../types";

function findTeamByName(teams: CustomTeam[], query: string): CustomTeam | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const exact = teams.find((t) => t.name?.toLowerCase() === q);
  if (exact) return exact;
  return (
    teams.find(
      (t) =>
        t.name?.toLowerCase().includes(q) || q.includes(t.name?.toLowerCase()),
    ) || null
  );
}

export function EventingSetupPage(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const [teams, setTeams] = useState<CustomTeam[]>([]);
  const [name, setName] = useState("");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [existing, setExisting] = useState<ManualMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const promises: [Promise<CustomTeam[]>, Promise<ManualMatch | null>] = [
      getTeams(),
      id ? getManualMatch(id) : Promise.resolve(null),
    ];
    Promise.all(promises)
      .then(([ts, m]) => {
        setTeams(ts);
        if (m) {
          setExisting(m);
          setName(m.name || "");
          setHomeTeamId(m.homeTeamId || "");
          setAwayTeamId(m.awayTeamId || "");
          return;
        }
        // Modo creacion: aplicar preload desde query
        const qName = searchParams.get("name");
        const qHome = searchParams.get("home");
        const qAway = searchParams.get("away");
        if (qName) setName(qName);
        const missing: string[] = [];
        if (qHome) {
          const match = findTeamByName(ts, qHome);
          if (match) setHomeTeamId(match.id);
          else missing.push(qHome);
        }
        if (qAway) {
          const match = findTeamByName(ts, qAway);
          if (match) setAwayTeamId(match.id);
          else missing.push(qAway);
        }
        if (missing.length > 0) {
          setHint(
            `No se encontro equipo propio para: ${missing.join(", ")}. Creales en la seccion Equipo o elige uno equivalente.`,
          );
        }
      })
      .finally(() => setLoading(false));
  }, [id, searchParams]);

  const homeTeam = teams.find((t) => t.id === homeTeamId) || null;
  const awayTeam = teams.find((t) => t.id === awayTeamId) || null;

  const submit = async (evt: FormEvent): Promise<void> => {
    evt.preventDefault();
    if (!homeTeamId || !awayTeamId) {
      setError("Selecciona ambos equipos.");
      return;
    }
    if (homeTeamId === awayTeamId) {
      setError("El equipo local y visitante no pueden ser el mismo.");
      return;
    }
    setError(null);
    setLoading(true);

    const payload: ManualMatchPayload = {
      name: name.trim(),
      homeTeamId,
      homeTeamName: homeTeam?.name,
      awayTeamId,
      awayTeamName: awayTeam?.name,
      homeStartingXI: existing?.homeStartingXI || [],
      homeBench: existing?.homeBench || [],
      awayStartingXI: existing?.awayStartingXI || [],
      awayBench: existing?.awayBench || [],
    };

    try {
      const saved = existing
        ? await updateManualMatch(existing.id, payload)
        : await createManualMatch(payload);
      navigate(`/eventing/${saved.id}/alineaciones`);
    } catch {
      setError("No se pudo guardar la configuracion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eventing-shell">
      <section className="glass-panel panel">
        <div className="panel-head">
          <div>
            <h3 style={{ margin: 0 }}>
              {isEditing ? "Editar configuracion" : "Nuevo partido manual"}
            </h3>
            <span className="subtle">
              Define los equipos para continuar con alineaciones
            </span>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => navigate("/eventing")}
          >
            ← Lista
          </button>
        </div>

        <form className="event-form" onSubmit={submit}>
          <label className="field">
            Nombre del partido (opcional)
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Local vs Visitante"
            />
          </label>

          <label className="field">
            Equipo local
            <select
              value={homeTeamId}
              onChange={(e) => setHomeTeamId(e.target.value)}
              required
            >
              <option value="">Selecciona equipo local</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Equipo visitante
            <select
              value={awayTeamId}
              onChange={(e) => setAwayTeamId(e.target.value)}
              required
            >
              <option value="">Selecciona equipo visitante</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <div className="two-inputs">
            <button
              type="button"
              className="icon-btn big"
              onClick={() => navigate("/team")}
            >
              Crear equipo nuevo
            </button>
            <button
              type="submit"
              className="cta"
              disabled={loading || !homeTeamId || !awayTeamId}
            >
              {loading ? "Guardando..." : "Guardar y continuar"}
            </button>
          </div>

          {error ? <p className="subtle error">{error}</p> : null}
          {hint ? <p className="subtle">{hint}</p> : null}
        </form>
      </section>
    </div>
  );
}
