import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateManualMatch } from "../../services/api";
import type { CustomTeam } from "../../types";
import { useEventingMatch } from "./eventingContext";

type SideKey = "home" | "away";

export function EventingLineupsPage(): JSX.Element {
  const navigate = useNavigate();
  const { match, homeTeam, awayTeam, refreshMatch } = useEventingMatch();

  const [homeStarterIds, setHomeStarterIds] = useState<string[]>([]);
  const [homeBenchIds, setHomeBenchIds] = useState<string[]>([]);
  const [awayStarterIds, setAwayStarterIds] = useState<string[]>([]);
  const [awayBenchIds, setAwayBenchIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setHomeStarterIds(
      (match.homeStartingXI || []).map((p) => p.playerId || "").filter(Boolean),
    );
    setHomeBenchIds(
      (match.homeBench || []).map((p) => p.playerId || "").filter(Boolean),
    );
    setAwayStarterIds(
      (match.awayStartingXI || []).map((p) => p.playerId || "").filter(Boolean),
    );
    setAwayBenchIds(
      (match.awayBench || []).map((p) => p.playerId || "").filter(Boolean),
    );
  }, [match]);

  const toggle = (
    playerId: string,
    selected: string[],
    setSelected: (v: string[]) => void,
    opposite: string[],
    setOpposite: (v: string[]) => void,
  ): void => {
    if (selected.includes(playerId)) {
      setSelected(selected.filter((p) => p !== playerId));
      return;
    }
    setSelected([...selected, playerId]);
    if (opposite.includes(playerId)) {
      setOpposite(opposite.filter((p) => p !== playerId));
    }
  };

  const buildSelections = (
    team: CustomTeam | null,
    ids: string[],
  ): { playerId: string; name: string; number: number; position: string }[] => {
    if (!team) return [];
    return ids
      .map((id) => team.players.find((p) => p.id === id))
      .filter((p): p is CustomTeam["players"][number] => Boolean(p))
      .map((p) => ({
        playerId: p.id,
        name: p.name,
        number: p.number,
        position: p.position,
      }));
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    setFeedback(null);
    try {
      await updateManualMatch(match.id, {
        name: match.name,
        homeTeamId: match.homeTeamId,
        homeTeamName: match.homeTeamName,
        awayTeamId: match.awayTeamId,
        awayTeamName: match.awayTeamName,
        homeStartingXI: buildSelections(homeTeam, homeStarterIds),
        homeBench: buildSelections(homeTeam, homeBenchIds),
        awayStartingXI: buildSelections(awayTeam, awayStarterIds),
        awayBench: buildSelections(awayTeam, awayBenchIds),
      });
      await refreshMatch();
      setFeedback("Alineaciones guardadas.");
    } catch {
      setFeedback("Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const renderSide = (
    side: SideKey,
    team: CustomTeam | null,
    starters: string[],
    setStarters: (v: string[]) => void,
    bench: string[],
    setBench: (v: string[]) => void,
  ): JSX.Element => {
    const title =
      side === "home"
        ? `Local · ${team?.name || match.homeTeamName || "-"}`
        : `Visitante · ${team?.name || match.awayTeamName || "-"}`;
    return (
      <section className="glass-soft panel">
        <div className="panel-head">
          <h3>{title}</h3>
          <span className="subtle">
            XI: {starters.length}/11 · Suplentes: {bench.length}
          </span>
        </div>
        <div className="two-inputs" style={{ marginBottom: "0.5rem" }}>
          <button
            type="button"
            className="icon-btn"
            disabled={!team || team.players.length === 0}
            onClick={() => {
              if (!team) return;
              const ids = team.players.slice(0, 11).map((p) => p.id);
              setStarters(ids);
              setBench(bench.filter((b) => !ids.includes(b)));
            }}
          >
            Auto-rellenar XI (primeros 11)
          </button>
          <button
            type="button"
            className="icon-btn"
            disabled={!team || team.players.length <= 11}
            onClick={() => {
              if (!team) return;
              const rest = team.players.slice(11, 18).map((p) => p.id);
              setBench(rest);
              setStarters(starters.filter((s) => !rest.includes(s)));
            }}
          >
            Auto-rellenar banquillo (12-18)
          </button>
          <button
            type="button"
            className="icon-btn danger"
            onClick={() => {
              setStarters([]);
              setBench([]);
            }}
          >
            Limpiar
          </button>
        </div>
        <div className="event-list">
          {(team?.players || []).map((player) => (
            <div key={player.id} className="event-item">
              <strong>
                #{player.number} {player.name}
              </strong>
              <p className="subtle">{player.position}</p>
              <div className="two-inputs">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={starters.includes(player.id)}
                    onChange={() =>
                      toggle(player.id, starters, setStarters, bench, setBench)
                    }
                  />
                  XI
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={bench.includes(player.id)}
                    onChange={() =>
                      toggle(player.id, bench, setBench, starters, setStarters)
                    }
                  />
                  Suplente
                </label>
              </div>
            </div>
          ))}
          {(!team || team.players.length === 0) && (
            <p className="subtle">
              Este equipo no tiene jugadores cargados todavia.
            </p>
          )}
        </div>
      </section>
    );
  };

  return (
    <section className="glass-panel panel">
      <div className="panel-head">
        <h3>Alineaciones</h3>
        <span className="subtle">
          Marca XI titular y suplentes para cada equipo
        </span>
      </div>

      <div className="two-cols">
        {renderSide(
          "home",
          homeTeam,
          homeStarterIds,
          setHomeStarterIds,
          homeBenchIds,
          setHomeBenchIds,
        )}
        {renderSide(
          "away",
          awayTeam,
          awayStarterIds,
          setAwayStarterIds,
          awayBenchIds,
          setAwayBenchIds,
        )}
      </div>

      <div className="two-inputs" style={{ marginTop: "0.8rem" }}>
        <button type="button" className="cta" onClick={save} disabled={saving}>
          {saving ? "Guardando..." : "Guardar alineaciones"}
        </button>
        <button
          type="button"
          className="icon-btn big"
          onClick={() => navigate(`/eventing/${match.id}/registrar`)}
        >
          Continuar a registrar evento →
        </button>
      </div>
      {feedback ? <p className="subtle">{feedback}</p> : null}
    </section>
  );
}
