import { FormEvent, useEffect, useState } from "react";
import { addPlayer, createTeam, getTeams } from "../services/api";
import type { CustomTeam } from "../types";

export function TeamsPage(): JSX.Element {
  const [teams, setTeams] = useState<CustomTeam[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [shared, setShared] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState(1);
  const [playerPosition, setPlayerPosition] = useState("MED");

  useEffect(() => {
    getTeams()
      .then((res) => {
        setTeams(res);
        if (res.length > 0) setSelectedTeam(res[0].id);
      })
      .catch(() => setTeams([]));
  }, []);

  const onCreateTeam = async (evt: FormEvent): Promise<void> => {
    evt.preventDefault();
    const created = await createTeam({
      name: newTeamName,
      shared,
      logo: logoFile,
    });
    const next = [...teams, created];
    setTeams(next);
    setSelectedTeam(created.id);
    setNewTeamName("");
    setLogoFile(null);
    setShared(false);
  };

  const onAddPlayer = async (evt: FormEvent): Promise<void> => {
    evt.preventDefault();
    if (!selectedTeam) return;

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
            Crear equipo
          </button>
        </form>

        <div className="team-list">
          {teams.map((team) => (
            <button
              key={team.id}
              className={`team-item ${team.id === selectedTeam ? "active" : ""}`}
              onClick={() => setSelectedTeam(team.id)}
            >
              <span>{team.name}</span>
              <small>{team.players.length} jugadores</small>
            </button>
          ))}
        </div>
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
          <button className="cta" type="submit" disabled={!selectedTeam}>
            Anadir jugador
          </button>
        </form>
      </section>
    </div>
  );
}
