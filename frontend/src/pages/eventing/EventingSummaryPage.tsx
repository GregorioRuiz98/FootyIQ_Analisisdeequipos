import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heatmap } from "../../components/Heatmap";
import { PassNetwork } from "../../components/PassNetwork";
import { ShotMap } from "../../components/ShotMap";
import { Timeline } from "../../components/Timeline";
import { computeMatchStats } from "../../utils/eventStats";
import { exportMatchPdf } from "../../utils/matchPdf";
import { useEventingMatch } from "./eventingContext";

export function EventingSummaryPage(): JSX.Element {
  const navigate = useNavigate();
  const { match, events, homeTeam, awayTeam } = useEventingMatch();

  const stats = useMemo(
    () => computeMatchStats(events, match.homeTeamId, match.awayTeamId),
    [events, match.homeTeamId, match.awayTeamId],
  );

  const [shotTeam, setShotTeam] = useState<string>("");
  const [shotPlayer, setShotPlayer] = useState<string>("");
  const [onlyGoals, setOnlyGoals] = useState<boolean>(false);
  const [heatTeam, setHeatTeam] = useState<string>("");
  const [heatPlayer, setHeatPlayer] = useState<string>("");
  const [netTeam, setNetTeam] = useState<string>("");

  const heatEvents = useMemo(() => {
    return events.filter((e) => {
      if (heatTeam && e.teamId !== heatTeam) return false;
      if (
        heatPlayer &&
        !(e.playerName || "").toLowerCase().includes(heatPlayer.toLowerCase())
      )
        return false;
      return true;
    });
  }, [events, heatTeam, heatPlayer]);

  const playersForSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) if (e.playerName) set.add(e.playerName);
    return Array.from(set).sort();
  }, [events]);

  const handleExportPdf = (): void => {
    exportMatchPdf({ match, events, stats });
  };

  const homeName = match.homeTeamName || "Local";
  const awayName = match.awayTeamName || "Visitante";

  return (
    <section className="glass-panel panel">
      <div className="panel-head">
        <div>
          <h3 style={{ margin: 0 }}>Resumen del partido</h3>
          <span className="subtle">
            {homeName} {stats.home.goals} - {stats.away.goals} {awayName}
          </span>
        </div>
        <button
          type="button"
          className="icon-btn big"
          onClick={handleExportPdf}
        >
          Exportar PDF
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card glass-soft">
          <span className="subtle">Eventos</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card glass-soft">
          <span className="subtle">Tiros</span>
          <strong>{stats.home.shots + stats.away.shots}</strong>
        </div>
        <div className="stat-card glass-soft">
          <span className="subtle">Goles</span>
          <strong>{stats.home.goals + stats.away.goals}</strong>
        </div>
        <div className="stat-card glass-soft">
          <span className="subtle">Posesion</span>
          <strong>
            {stats.possessionHome.toFixed(0)}% -{" "}
            {stats.possessionAway.toFixed(0)}%
          </strong>
        </div>
      </div>

      <table className="stats-table">
        <thead>
          <tr>
            <th style={{ textAlign: "right" }}>{homeName}</th>
            <th>Metrica</th>
            <th style={{ textAlign: "left" }}>{awayName}</th>
          </tr>
        </thead>
        <tbody>
          <StatRow
            label="Posesion"
            h={`${stats.possessionHome.toFixed(0)}%`}
            a={`${stats.possessionAway.toFixed(0)}%`}
          />
          <StatRow label="Tiros" h={stats.home.shots} a={stats.away.shots} />
          <StatRow label="Goles" h={stats.home.goals} a={stats.away.goals} />
          <StatRow
            label="Efectividad"
            h={`${stats.home.shotAccuracy.toFixed(0)}%`}
            a={`${stats.away.shotAccuracy.toFixed(0)}%`}
          />
          <StatRow label="Pases" h={stats.home.passes} a={stats.away.passes} />
          <StatRow
            label="Regates"
            h={stats.home.dribbles}
            a={stats.away.dribbles}
          />
          <StatRow label="Duelos" h={stats.home.duels} a={stats.away.duels} />
          <StatRow
            label="Recuperaciones"
            h={stats.home.recoveries}
            a={stats.away.recoveries}
          />
          <StatRow
            label="Perdidas"
            h={stats.home.losses}
            a={stats.away.losses}
          />
          <StatRow label="Faltas" h={stats.home.fouls} a={stats.away.fouls} />
          <StatRow label="Tarjetas" h={stats.home.cards} a={stats.away.cards} />
          <StatRow label="Paradas" h={stats.home.saves} a={stats.away.saves} />
        </tbody>
      </table>

      <div className="two-cols" style={{ marginTop: "0.8rem" }}>
        <div className="glass-soft panel">
          <strong>{homeName}</strong>
          <p className="subtle">
            XI: {match.homeStartingXI?.length || 0} - Banquillo:{" "}
            {match.homeBench?.length || 0}
          </p>
          <p className="subtle">
            Plantilla cargada: {homeTeam ? homeTeam.players.length : 0}{" "}
            jugadores
          </p>
        </div>
        <div className="glass-soft panel">
          <strong>{awayName}</strong>
          <p className="subtle">
            XI: {match.awayStartingXI?.length || 0} - Banquillo:{" "}
            {match.awayBench?.length || 0}
          </p>
          <p className="subtle">
            Plantilla cargada: {awayTeam ? awayTeam.players.length : 0}{" "}
            jugadores
          </p>
        </div>
      </div>

      <div className="panel-head" style={{ marginTop: "1rem" }}>
        <h3>Linea temporal</h3>
        <span className="subtle">goles, tiros, faltas, tarjetas y paradas</span>
      </div>
      <Timeline
        events={events}
        homeTeamId={match.homeTeamId}
        awayTeamId={match.awayTeamId}
      />

      <div className="panel-head" style={{ marginTop: "1rem" }}>
        <h3>Mapa de tiros</h3>
        <span className="subtle">filtros activos</span>
      </div>
      <div className="filters-row">
        <label className="field inline">
          Equipo
          <select
            value={shotTeam}
            onChange={(e) => setShotTeam(e.target.value)}
          >
            <option value="">Ambos</option>
            {match.homeTeamId ? (
              <option value={match.homeTeamId}>{homeName}</option>
            ) : null}
            {match.awayTeamId ? (
              <option value={match.awayTeamId}>{awayName}</option>
            ) : null}
          </select>
        </label>
        <label className="field inline">
          Jugador
          <input
            list="shot-player-suggestions"
            value={shotPlayer}
            onChange={(e) => setShotPlayer(e.target.value)}
            placeholder="todos"
          />
        </label>
        <datalist id="shot-player-suggestions">
          {playersForSuggestions.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        <label className="field inline check">
          <input
            type="checkbox"
            checked={onlyGoals}
            onChange={(e) => setOnlyGoals(e.target.checked)}
          />
          Solo goles
        </label>
      </div>
      <ShotMap
        events={events}
        homeTeamId={match.homeTeamId}
        awayTeamId={match.awayTeamId}
        homeTeamName={homeName}
        awayTeamName={awayName}
        height={260}
        filterTeamId={shotTeam || undefined}
        filterPlayer={shotPlayer || undefined}
        onlyGoals={onlyGoals}
      />

      <div className="panel-head" style={{ marginTop: "1rem" }}>
        <h3>Mapa de calor</h3>
        <span className="subtle">densidad por zona</span>
      </div>
      <div className="filters-row">
        <label className="field inline">
          Equipo
          <select
            value={heatTeam}
            onChange={(e) => setHeatTeam(e.target.value)}
          >
            <option value="">Ambos</option>
            {match.homeTeamId ? (
              <option value={match.homeTeamId}>{homeName}</option>
            ) : null}
            {match.awayTeamId ? (
              <option value={match.awayTeamId}>{awayName}</option>
            ) : null}
          </select>
        </label>
        <label className="field inline">
          Jugador
          <input
            list="heat-player-suggestions"
            value={heatPlayer}
            onChange={(e) => setHeatPlayer(e.target.value)}
            placeholder="todos"
          />
        </label>
        <datalist id="heat-player-suggestions">
          {playersForSuggestions.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>
      <Heatmap events={heatEvents} height={220} />

      <div className="panel-head" style={{ marginTop: "1rem" }}>
        <h3>Red de pases</h3>
        <span className="subtle">
          conexiones entre pases consecutivos del mismo equipo
        </span>
      </div>
      <div className="filters-row">
        <label className="field inline">
          Equipo
          <select value={netTeam} onChange={(e) => setNetTeam(e.target.value)}>
            <option value="">Ambos</option>
            {match.homeTeamId ? (
              <option value={match.homeTeamId}>{homeName}</option>
            ) : null}
            {match.awayTeamId ? (
              <option value={match.awayTeamId}>{awayName}</option>
            ) : null}
          </select>
        </label>
      </div>
      <PassNetwork events={events} teamId={netTeam || undefined} height={260} />

      <div className="two-inputs" style={{ marginTop: "0.8rem" }}>
        <button
          type="button"
          className="icon-btn big"
          onClick={() => navigate(`/eventing/${match.id}/editar`)}
        >
          Editar equipos
        </button>
        <button
          type="button"
          className="cta"
          onClick={() => navigate(`/eventing/${match.id}/registrar`)}
        >
          Ir a registrar eventos
        </button>
      </div>
    </section>
  );
}

type StatRowProps = { label: string; h: number | string; a: number | string };

function StatRow({ label, h, a }: StatRowProps): JSX.Element {
  return (
    <tr>
      <td style={{ textAlign: "right" }}>{h}</td>
      <td className="subtle" style={{ textAlign: "center" }}>
        {label}
      </td>
      <td style={{ textAlign: "left" }}>{a}</td>
    </tr>
  );
}
