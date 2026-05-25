import { useEffect, useMemo, useState } from "react";
import {
  deleteStoredLeague,
  getImportHistory,
  getMainLeaguesCatalog,
  getStoredCompetitions,
  importLeagueToDatabase,
} from "../services/api";

type LeagueItem = {
  id: number;
  key: string;
  name: string;
  country: string;
  sourceUrl: string;
};

export function DataHubPage(): JSX.Element {
  const [leagues, setLeagues] = useState<LeagueItem[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number>(87);
  const [imports, setImports] = useState<Array<Record<string, unknown>>>([]);
  const [storedCompetitions, setStoredCompetitions] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    getMainLeaguesCatalog()
      .then((data) => {
        setLeagues(data.leagues || []);
      })
      .catch(() => setLeagues([]));

    getImportHistory()
      .then(setImports)
      .catch(() => setImports([]));
    getStoredCompetitions()
      .then(setStoredCompetitions)
      .catch(() => setStoredCompetitions([]));
  }, []);

  const leagueOptions = useMemo(
    () => leagues.map((l) => ({ label: `${l.name} (${l.id})`, value: l.id })),
    [leagues],
  );

  const selectedLeagueName = useMemo(() => {
    const found = leagues.find((l) => l.id === selectedLeague);
    return found ? found.name : String(selectedLeague);
  }, [leagues, selectedLeague]);

  const handleDelete = async (
    leagueId: number,
    leagueName: string,
  ): Promise<void> => {
    const ok = window.confirm(
      `¿Eliminar la liga "${leagueName}" y todos sus equipos, partidos y jugadores? Esta accion no se puede deshacer.`,
    );
    if (!ok) return;
    setLoading(true);
    setStatusMessage(`Eliminando "${leagueName}"...`);
    try {
      await deleteStoredLeague(leagueId);
      const [importsResult, competitionsResult] = await Promise.all([
        getImportHistory(),
        getStoredCompetitions(),
      ]);
      setImports(importsResult);
      setStoredCompetitions(competitionsResult);
      setStatusMessage(`Liga "${leagueName}" eliminada de la base de datos.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error desconocido";
      setStatusMessage(`Error al eliminar la liga: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (): Promise<void> => {
    setLoading(true);
    setStatusMessage("Importando liga, esto puede tardar unos segundos...");
    try {
      await importLeagueToDatabase(selectedLeague);
      const [importsResult, competitionsResult] = await Promise.all([
        getImportHistory(),
        getStoredCompetitions(),
      ]);
      setImports(importsResult);
      setStoredCompetitions(competitionsResult);
      setStatusMessage(`Liga "${selectedLeagueName}" importada correctamente.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error desconocido";
      setStatusMessage(`Error al importar la liga: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eventing-layout">
      <section className="glass-panel panel">
        <div className="panel-head">
          <h3>FOTMOB DATA HUB</h3>
        </div>

        <p className="subtle">
          Importa una liga de FotMob a la base de datos local. Esto descarga
          la competicion, sus equipos y sus partidos, y los deja disponibles
          para el resto de la aplicacion.
        </p>

        <div className="event-form">
          <label className="field">
            Liga a importar
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(Number(e.target.value))}
            >
              {leagueOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="cta"
            type="button"
            onClick={handleImport}
            disabled={loading}
          >
            {loading ? "Importando..." : "Importar liga a la base de datos"}
          </button>
        </div>

        {statusMessage && (
          <p className="subtle" style={{ marginTop: "0.8rem" }}>
            {statusMessage}
          </p>
        )}
      </section>

      <section className="glass-panel panel">
        <div className="panel-head">
          <h3>COMPETICIONES EN BD</h3>
        </div>
        <div className="event-list">
          {storedCompetitions.length === 0 && (
            <p className="subtle">No hay competiciones guardadas todavia.</p>
          )}
          {storedCompetitions.map((item, idx) => {
            const extId = Number(item.externalId);
            const name = String(item.name);
            return (
              <div
                key={idx}
                className="event-item glass-soft"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.6rem",
                }}
              >
                <div>
                  <strong>{name}</strong>
                  <p>ID: {String(item.externalId)}</p>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  title="Eliminar liga de la base de datos"
                  aria-label={`Eliminar ${name}`}
                  disabled={loading || !Number.isFinite(extId)}
                  onClick={() => handleDelete(extId, name)}
                >
                  ✖
                </button>
              </div>
            );
          })}
        </div>

        <div className="panel-head" style={{ marginTop: "0.8rem" }}>
          <h3>IMPORTACIONES RECIENTES</h3>
        </div>
        <div className="event-list">
          {imports.length === 0 && (
            <p className="subtle">Aun no se han realizado importaciones.</p>
          )}
          {imports.map((item, idx) => (
            <div key={idx} className="event-item glass-soft">
              <strong>
                Liga {String(item.leagueExternalId)} ·{" "}
                {String(item.status)}
              </strong>
              <p>
                partidos: {String(item.importedMatches || 0)} · equipos:{" "}
                {String(item.importedTeams || 0)} · jugadores:{" "}
                {String(item.importedPlayers || 0)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
