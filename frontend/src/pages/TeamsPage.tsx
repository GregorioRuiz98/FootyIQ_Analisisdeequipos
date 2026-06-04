import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addPlayer,
  createTeam,
  getTeams,
  resolveBackendAssetUrl,
} from "../services/api";
import type { CustomTeam } from "../types";
import axios from "axios";

export function TeamsPage(): JSX.Element {
  const [teams, setTeams] = useState<CustomTeam[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [shared, setShared] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [savingPlayer, setSavingPlayer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState("");

  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState(1);
  const [playerPosition, setPlayerPosition] = useState("MED");

  const visibleTeams = useMemo(() => {
    const q = teamFilter.trim().toLowerCase();
    const list = q
      ? teams.filter((team) => team.name?.toLowerCase().includes(q))
      : teams;

    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [teams, teamFilter]);

  useEffect(() => {
    getTeams()
      .then((res) => {
        setTeams(res);
        if (res.length > 0) setSelectedTeam(res[0].id);
      })
      .catch((err: unknown) => {
        setTeams([]);
        setError(readApiError(err, "No se pudieron cargar tus equipos."));
      });
  }, []);

  const onCreateTeam = async (evt: FormEvent): Promise<void> => {
    evt.preventDefault();
    const name = newTeamName.trim();
    if (!name) {
      setError("Indica un nombre de equipo valido.");
      setSuccess(null);
      return;
    }
    setSavingTeam(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createTeam({
        name,
        shared,
        logo: logoFile,
      });
      setTeams((prev) => [...prev, created]);
      setSelectedTeam(created.id);
      setNewTeamName("");
      setLogoFile(null);
      setShared(false);
      setSuccess(`Equipo "${created.name}" creado correctamente.`);
    } catch (err: unknown) {
      setError(readApiError(err, "No se pudo crear el equipo."));
      setSuccess(null);
    } finally {
      setSavingTeam(false);
    }
  };

  const onAddPlayer = async (evt: FormEvent): Promise<void> => {
    evt.preventDefault();
    if (!selectedTeam) return;

    setSavingPlayer(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await addPlayer(selectedTeam, {
        name: playerName,
        number: playerNumber,
        position: playerPosition,
        preferredFoot: "Right",
      });

      setTeams((prev) =>
        prev.map((team) => (team.id === updated.id ? updated : team)),
      );
      setPlayerName("");
      setPlayerNumber(1);
    } catch (err: unknown) {
      setError(readApiError(err, "No se pudo anadir el jugador."));
    } finally {
      setSavingPlayer(false);
    }
  };

  return (
    <div className="eventing-layout">
      <section className="glass-panel panel">
        <div className="panel-head">
          <h3>EQUIPOS PERSONALIZADOS</h3>
        </div>
        <form className="event-form" onSubmit={onCreateTeam}>
          <label className="field">
            Nombre del equipo
            <input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              required
            />
          </label>
          <label className="field">
            Escudo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={shared}
              onChange={(e) => setShared(e.target.checked)}
            />{" "}
            Compartido
          </label>
          <button className="cta" type="submit">
            {savingTeam ? "Creando..." : "Crear equipo"}
          </button>
        </form>

        {error ? <p className="subtle error">{error}</p> : null}
        {success ? <p className="subtle">{success}</p> : null}

        <div className="league-teams-head" style={{ marginTop: "0.8rem" }}>
          <h4 style={{ margin: 0 }}>Mis equipos</h4>
          <input
            type="search"
            placeholder="Filtrar equipo..."
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="league-teams-search"
          />
        </div>

        {visibleTeams.length === 0 ? (
          <p className="subtle">
            {teams.length === 0
              ? "Aun no has creado equipos."
              : "Sin resultados para ese filtro."}
          </p>
        ) : (
          <ul className="team-grid" aria-label="Mis equipos">
            {visibleTeams.map((team) => (
              <li key={team.id}>
                <button
                  type="button"
                  className={`team-card ${team.id === selectedTeam ? "active" : ""}`}
                  onClick={() => setSelectedTeam(team.id)}
                >
                  <TeamAvatar
                    logoPath={team.logoPath}
                    name={team.name}
                    size={56}
                  />
                  <span className="team-card-name">{team.name}</span>
                  <span className="subtle team-card-country">
                    {team.players?.length ?? 0} jugadores
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass-panel panel">
        <div className="panel-head">
          <h3>ALTA DE JUGADOR</h3>
        </div>
        <form className="event-form" onSubmit={onAddPlayer}>
          <label className="field">
            Equipo destino
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Nombre jugador
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
          </label>
          <div className="two-inputs">
            <label className="field">
              Dorsal
              <input
                type="number"
                value={playerNumber}
                onChange={(e) => setPlayerNumber(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Posicion
              <select
                value={playerPosition}
                onChange={(e) => setPlayerPosition(e.target.value)}
              >
                <option value="POR">POR</option>
                <option value="DEF">DEF</option>
                <option value="MED">MED</option>
                <option value="DEL">DEL</option>
              </select>
            </label>
          </div>
          <button
            className="cta"
            type="submit"
            disabled={!selectedTeam || savingPlayer}
          >
            {savingPlayer ? "Guardando..." : "Anadir jugador"}
          </button>
        </form>
      </section>
    </div>
  );
}

function TeamAvatar({
  logoPath,
  name,
  size,
}: {
  logoPath?: string;
  name: string;
  size?: number;
}): JSX.Element {
  const [errored, setErrored] = useState(false);
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const logoUrl = resolveBackendAssetUrl(logoPath);

  return (
    <span
      className="team-logo"
      style={{ width: size, height: size }}
      title={name}
    >
      {logoUrl && !errored ? (
        <img
          src={logoUrl}
          alt={name}
          loading="lazy"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="team-logo-fallback">{initial}</span>
      )}
    </span>
  );
}

function readApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message =
      typeof error.response?.data === "string"
        ? error.response.data
        : (error.response?.data as { message?: string } | undefined)?.message;
    if (message) {
      return message;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Sesion expirada o no autorizada. Vuelve a iniciar sesion.";
    }
  }
  return fallback;
}
