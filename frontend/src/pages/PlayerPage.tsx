import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getPlayerData,
  getStoredCompetitionTeams,
  getStoredCompetitionsTyped,
  getStoredPlayer,
  getStoredTeamPlayers,
  type StoredCompetition,
  type StoredPlayer,
  type StoredTeam,
} from "../services/api";
import { exportPlayerReportPdf } from "../utils/playerPdf";
import { FavoriteButton } from "../components/FavoriteButton";

type AnyDict = Record<string, any>;

const PLAYER_PHOTO = (id: number | string) =>
  `https://images.fotmob.com/image_resources/playerimages/${id}.png`;
const TEAM_LOGO = (id: number | string) =>
  `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png`;

export function PlayerPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const initialIdRaw = searchParams.get("id");
  const initialId = initialIdRaw ? Number(initialIdRaw) : null;
  const initialResolvedRef = useRef<number | null>(null);

  const [competitions, setCompetitions] = useState<StoredCompetition[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [teams, setTeams] = useState<StoredTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [players, setPlayers] = useState<StoredPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [playerDetail, setPlayerDetail] = useState<StoredPlayer | null>(null);
  const [playerRich, setPlayerRich] = useState<AnyDict | null>(null);
  const [richLoading, setRichLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Resuelve la liga/equipo cuando llega ?id= en la URL.
  useEffect(() => {
    if (!initialId || initialResolvedRef.current === initialId) return;
    let cancelled = false;
    (async () => {
      try {
        const player = await getStoredPlayer(initialId);
        if (cancelled || !player) return;
        const comps = await getStoredCompetitionsTyped();
        if (cancelled) return;
        setCompetitions(comps);
        for (const c of comps) {
          const teamList = await getStoredCompetitionTeams(c.externalId);
          if (cancelled) return;
          if (teamList.some((t) => t.externalId === player.teamExternalId)) {
            setSelectedLeague(c.externalId);
            setTeams(teamList);
            setSelectedTeam(player.teamExternalId);
            const teamPlayers = await getStoredTeamPlayers(
              player.teamExternalId,
            );
            if (cancelled) return;
            setPlayers(teamPlayers);
            setSelectedPlayer(player.externalId);
            initialResolvedRef.current = initialId;
            return;
          }
        }
        // Si no se encontro en ninguna liga, deja el flujo normal.
        initialResolvedRef.current = initialId;
      } catch {
        initialResolvedRef.current = initialId;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialId]);

  useEffect(() => {
    if (initialId) return; // la rama de arriba se encarga
    getStoredCompetitionsTyped()
      .then((data) => {
        setCompetitions(data);
        if (data.length > 0) {
          setSelectedLeague(data[0].externalId);
        }
      })
      .catch(() => setCompetitions([]));
  }, [initialId]);

  useEffect(() => {
    if (!selectedLeague) return;
    setLoading(true);
    getStoredCompetitionTeams(selectedLeague)
      .then((data) => {
        setTeams(data);
        setSelectedTeam((prev) =>
          prev && data.some((t) => t.externalId === prev)
            ? prev
            : (data[0]?.externalId ?? null),
        );
      })
      .finally(() => setLoading(false));
  }, [selectedLeague]);

  useEffect(() => {
    if (!selectedTeam) return;
    setLoading(true);
    getStoredTeamPlayers(selectedTeam)
      .then((data) => {
        setPlayers(data);
        setSelectedPlayer((prev) =>
          prev && data.some((p) => p.externalId === prev)
            ? prev
            : (data[0]?.externalId ?? null),
        );
      })
      .finally(() => setLoading(false));
  }, [selectedTeam]);

  useEffect(() => {
    if (!selectedPlayer) {
      setPlayerDetail(null);
      setPlayerRich(null);
      return;
    }
    getStoredPlayer(selectedPlayer)
      .then(setPlayerDetail)
      .catch(() => setPlayerDetail(null));
    setRichLoading(true);
    setPlayerRich(null);
    getPlayerData(selectedPlayer)
      .then((raw) => {
        const data = isObj((raw as AnyDict)?.data)
          ? ((raw as AnyDict).data as AnyDict)
          : (raw as AnyDict);
        setPlayerRich(data || null);
      })
      .catch(() => setPlayerRich(null))
      .finally(() => setRichLoading(false));
  }, [selectedPlayer]);

  const currentTeamName = useMemo(() => {
    return teams.find((t) => t.externalId === selectedTeam)?.name || "Equipo";
  }, [teams, selectedTeam]);

  return (
    <div className="eventing-layout">
      <section className="glass-panel panel">
        <div className="panel-head">
          <h3>PLAYER (BD)</h3>
          <span className="subtle">Fuente: Mongo persistido</span>
        </div>

        <div className="event-form">
          <label className="field">
            Competicion
            <select
              value={selectedLeague ?? ""}
              onChange={(e) => setSelectedLeague(Number(e.target.value))}
            >
              {competitions.map((c) => (
                <option key={c.id} value={c.externalId}>
                  {c.name} ({c.externalId})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Equipo
            <select
              value={selectedTeam ?? ""}
              onChange={(e) => setSelectedTeam(Number(e.target.value))}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.externalId}>
                  {t.name} ({t.externalId})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Jugador
            <select
              value={selectedPlayer ?? ""}
              onChange={(e) => setSelectedPlayer(Number(e.target.value))}
            >
              {players.map((p) => (
                <option key={p.id} value={p.externalId}>
                  {p.name} ({p.externalId})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="panel-head" style={{ marginTop: "0.8rem" }}>
          <h3>PLANTILLA · {currentTeamName}</h3>
          <span className="subtle">
            {loading ? "Cargando..." : `${players.length} jugadores`}
          </span>
        </div>
        <div className="event-list">
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              className="team-item"
              onClick={() => setSelectedPlayer(p.externalId)}
            >
              <strong>{p.name}</strong>
              <p className="subtle">
                #{p.shirtNumber ?? "-"} · {p.role || "N/A"}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="glass-panel panel">
        <div className="panel-head">
          <h3>FICHA JUGADOR</h3>
          {richLoading ? (
            <span className="subtle">Cargando datos FotMob...</span>
          ) : null}
        </div>

        {!selectedPlayer ? (
          <p className="subtle">Selecciona un jugador para ver su ficha.</p>
        ) : playerRich && !playerRich.error ? (
          <PlayerProfileView data={playerRich} fallback={playerDetail} />
        ) : playerDetail ? (
          <PlayerFallbackCards detail={playerDetail} />
        ) : (
          <p className="subtle">Sin datos disponibles.</p>
        )}
      </section>
    </div>
  );
}

// ---------- helpers ----------
function isObj(x: unknown): x is AnyDict {
  return !!x && typeof x === "object" && !Array.isArray(x);
}
function asArr(x: unknown): any[] {
  return Array.isArray(x) ? x : [];
}
function str(x: unknown, fb = ""): string {
  if (x === null || x === undefined || x === "") return fb;
  if (typeof x === "string") return x;
  if (typeof x === "number" || typeof x === "boolean") return String(x);
  return fb;
}
function get(
  obj: AnyDict | undefined | null,
  path: (string | number)[],
  fb: any = undefined,
): any {
  let cur: any = obj;
  for (const k of path) {
    if (cur == null) return fb;
    cur = cur[k as any];
  }
  return cur === undefined ? fb : cur;
}
function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ---------- Ficha rica ----------
function PlayerProfileView({
  data,
  fallback,
}: {
  data: AnyDict;
  fallback: StoredPlayer | null;
}) {
  const name = str(data.name, fallback?.name || "-");
  const playerId = data.id ?? fallback?.externalId;
  const primaryTeam = isObj(data.primaryTeam) ? data.primaryTeam : {};
  const teamId = primaryTeam.teamId;
  const teamName = str(primaryTeam.teamName, fallback?.teamName || "");
  const position = str(
    get(data, ["positionDescription", "primaryPosition", "label"]),
    "",
  );
  const birth = str(get(data, ["birthDate", "utcTime"]), "");
  const isCaptain = !!data.isCaptain;
  const info = asArr(data.playerInformation);
  const infoMap: Record<string, AnyDict> = {};
  for (const item of info) {
    const t = str(item?.title);
    if (t) infoMap[t] = item;
  }
  const height = str(get(infoMap, ["Height", "value", "fallback"]), "");
  const shirt = str(get(infoMap, ["Shirt", "value", "fallback"]), "");
  const age = str(get(infoMap, ["Age", "value", "fallback"]), "");
  const foot = str(get(infoMap, ["Preferred foot", "value", "fallback"]), "");
  const country = str(get(infoMap, ["Country", "value", "fallback"]), "");
  const marketValue = str(
    get(infoMap, ["Market value", "value", "fallback"]),
    "",
  );
  const contractEnd = (() => {
    const raw = get(infoMap, ["Contract end", "value", "fallback"]);
    if (isObj(raw) && raw.utcTime) return formatDate(String(raw.utcTime));
    return str(raw, "");
  })();
  const traits = isObj(data.traits) ? data.traits : null;
  const traitItems = traits ? asArr(traits.items) : [];
  // recentMatches puede venir como array directo o como { matches: [] }
  const recent: AnyDict[] = Array.isArray(data.recentMatches)
    ? (data.recentMatches as AnyDict[])
    : asArr(get(data, ["recentMatches", "matches"]));
  // careerHistory puede venir como array directo o como { careerItems: { senior, youth, 'national team' } }
  const seasons: AnyDict[] = (() => {
    if (Array.isArray(data.careerHistory))
      return data.careerHistory as AnyDict[];
    const items = get(data, ["careerHistory", "careerItems"]);
    if (!isObj(items)) return [];
    const groups = ["senior", "national team", "youth"];
    const out: AnyDict[] = [];
    for (const g of groups) {
      const grp = (items as AnyDict)[g];
      const entries = asArr(grp?.seasonEntries);
      for (const e of entries) {
        out.push({ ...e, _group: g });
      }
    }
    return out;
  })();
  const trophies = asArr(get(data, ["trophies", "playerTrophies"]));
  const status = str(data.status, "");
  const positions = asArr(get(data, ["positionDescription", "positions"]));
  const otherPositions = positions
    .filter((p: AnyDict) => !p.isMainPosition)
    .map((p: AnyDict) => str(get(p, ["strPos", "label"])))
    .filter(Boolean);
  const nextMatch = isObj(data.nextMatch) ? data.nextMatch : null;
  const mainLeague = isObj(data.mainLeague) ? data.mainLeague : null;
  const mainStats = mainLeague ? asArr(mainLeague.stats) : [];
  // marketValues: { values: [{date, value}] } | { marketValue: [...] } | array directo
  const marketSeries: AnyDict[] = (() => {
    if (Array.isArray(data.marketValues)) return data.marketValues as AnyDict[];
    if (isObj(data.marketValues)) {
      const mv = data.marketValues as AnyDict;
      if (Array.isArray(mv.values)) return mv.values as AnyDict[];
      if (Array.isArray(mv.marketValue)) return mv.marketValue as AnyDict[];
    }
    return [];
  })();
  const trophiesWonCount = trophies.reduce(
    (acc: number, g: AnyDict) =>
      acc +
      asArr(g.tournaments).reduce(
        (a: number, t: AnyDict) => a + asArr(t.seasonsWon).length,
        0,
      ),
    0,
  );

  return (
    <div className="player-profile">
      <header className="pp-header">
        <img
          className="pp-photo"
          src={playerId ? PLAYER_PHOTO(playerId) : ""}
          alt={name}
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        />
        <div className="pp-meta">
          <h2 className="pp-name">
            {name}{" "}
            {isCaptain ? (
              <span className="pp-captain" title="Capit\u00e1n">
                (C)
              </span>
            ) : null}
          </h2>
          {teamId ? (
            <Link to={`/equipos?team=${teamId}`} className="pp-team-link">
              <img
                className="pp-team-logo"
                src={TEAM_LOGO(teamId)}
                alt={teamName}
                onError={(e) => (e.currentTarget.style.visibility = "hidden")}
              />
              {teamName || "Equipo"}
            </Link>
          ) : (
            <span className="subtle">{teamName}</span>
          )}
          <div className="pp-tags">
            {position ? (
              <span className="pp-tag accent">{position}</span>
            ) : null}
            {otherPositions.map((p: string, i: number) => (
              <span key={i} className="pp-tag">
                {p}
              </span>
            ))}
            {shirt ? <span className="pp-tag">#{shirt}</span> : null}
            {age ? <span className="pp-tag">{age}</span> : null}
            {country ? <span className="pp-tag">{country}</span> : null}
            {height ? <span className="pp-tag">{height}</span> : null}
            {foot ? <span className="pp-tag">{foot}</span> : null}
            {status ? (
              <span className={`pp-tag ${status === "active" ? "ok" : "warn"}`}>
                {status}
              </span>
            ) : null}
            {trophiesWonCount > 0 ? (
              <span className="pp-tag gold">🏆 {trophiesWonCount}</span>
            ) : null}
          </div>
          <div className="pp-extra subtle">
            {birth ? <span>Nac. {formatDate(birth)}</span> : null}
            {marketValue ? <span>Valor: {marketValue}</span> : null}
            {contractEnd ? <span>Contrato: {contractEnd}</span> : null}
          </div>
        </div>
        <div className="pp-actions">
          <FavoriteButton
            type="PLAYER"
            externalId={typeof playerId === "number" ? playerId : Number(playerId)}
            name={name}
            metadata={{
              teamName: teamName || "",
              teamId: teamId ? String(teamId) : "",
              position: position || "",
              subtitle: teamName || "",
            }}
          />
          <button
            type="button"
            className="pp-export-btn"
            onClick={() => {
              exportPlayerReportPdf({
                name,
                playerId,
                teamName,
                teamId,
                position,
                otherPositions,
                shirt,
                age,
                country,
                height,
                foot,
                marketValue,
                contractEnd,
                birth: birth ? formatDate(birth) : "",
                status,
                leagueName: mainLeague ? str(mainLeague.leagueName, "") : "",
                season: mainLeague ? str(mainLeague.season, "") : "",
                stats: mainStats.map((s: AnyDict) => ({
                  title: str(s.title),
                  value: str(s.value, "-"),
                })),
                career: seasons.map((s: AnyDict) => ({
                  season: str(s.seasonName),
                  team: str(s.team),
                  type: str(s._group, "-"),
                  appearances: str(s.appearances, "-"),
                  goals: str(s.goals, "-"),
                  assists: str(s.assists, "-"),
                  rating: str(get(s, ["rating", "rating"]), "-"),
                })),
              }).catch((e) => {
                console.error("Error exportando PDF", e);
                alert("No se pudo generar el PDF");
              });
            }}
          >
            Exportar PDF
          </button>
        </div>
      </header>

      {nextMatch ? (
        <section className="pp-section">
          <h4>Próximo partido</h4>
          <Link to={`/match?id=${nextMatch.matchId}`} className="pp-next">
            <span className="pp-next-side">
              {nextMatch.homeId ? (
                <img
                  src={TEAM_LOGO(nextMatch.homeId)}
                  alt={str(nextMatch.homeName)}
                  onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                />
              ) : null}
              <span>{str(nextMatch.homeName, "-")}</span>
            </span>
            <span className="pp-next-mid">
              <span className="pp-next-date">
                {formatDate(
                  str(
                    get(nextMatch, ["status", "utcTime"]),
                    str(nextMatch.matchDate),
                  ),
                )}
              </span>
              <span className="subtle">{str(nextMatch.leagueName)}</span>
            </span>
            <span className="pp-next-side right">
              <span>{str(nextMatch.awayName, "-")}</span>
              {nextMatch.awayId ? (
                <img
                  src={TEAM_LOGO(nextMatch.awayId)}
                  alt={str(nextMatch.awayName)}
                  onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                />
              ) : null}
            </span>
          </Link>
          {get(nextMatch, ["stadium", "venue"]) ? (
            <p className="subtle pp-next-stadium">
              {str(get(nextMatch, ["stadium", "venue"]))} ·{" "}
              {str(get(nextMatch, ["stadium", "city"]))}
            </p>
          ) : null}
        </section>
      ) : null}

      {mainLeague ? (
        <section className="pp-section">
          <h4>
            {str(mainLeague.leagueName, "Liga")} · {str(mainLeague.season)}
          </h4>
          <div className="pp-kpis">
            {mainStats.map((s: AnyDict, i: number) => (
              <div key={i} className="pp-kpi">
                <span className="pp-kpi-value">{str(s.value, "-")}</span>
                <span className="pp-kpi-label subtle">{str(s.title)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {traitItems.length > 0 ? (
        <section className="pp-section">
          <h4>{str(traits?.title, "Comparativa")}</h4>
          <ul className="pp-traits">
            {traitItems.map((t: AnyDict, i: number) => {
              const v =
                typeof t?.value === "number"
                  ? Math.max(0, Math.min(1, t.value))
                  : 0;
              return (
                <li key={i}>
                  <span className="pp-trait-label">
                    {str(t?.title, str(t?.key))}
                  </span>
                  <div className="pp-trait-bar">
                    <div
                      className="pp-trait-fill"
                      style={{ width: `${Math.round(v * 100)}%` }}
                    />
                  </div>
                  <span className="pp-trait-value">{Math.round(v * 100)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {recent.length > 0 ? (
        <section className="pp-section">
          <h4>Partidos ({recent.length})</h4>
          <div className="pp-matches">
            {recent.map((m: AnyDict, i: number) => {
              const opp = str(m.opponentTeamName, "-");
              const oppId = m.opponentTeamId;
              const hs = m.homeScore;
              const as = m.awayScore;
              const isHome = !!m.isHomeTeam;
              const score = `${hs} - ${as}`;
              const rating = str(get(m, ["ratingProps", "rating"]), "");
              const isTop = !!get(m, ["ratingProps", "isTopRating"]);
              const date = formatDate(str(get(m, ["matchDate", "utcTime"])));
              const league = str(m.leagueName, "");
              return (
                <Link
                  key={i}
                  to={`/match?id=${m.id}`}
                  className={`pp-match ${m.playerOfTheMatch ? "motm" : ""}`}
                >
                  <span className="pp-match-when">{date}</span>
                  <span className="pp-match-opp">
                    {isHome ? "vs" : "@"}
                    {oppId ? (
                      <img
                        src={TEAM_LOGO(oppId)}
                        alt={opp}
                        onError={(e) =>
                          (e.currentTarget.style.visibility = "hidden")
                        }
                      />
                    ) : null}
                    {opp}
                  </span>
                  <span className="pp-match-score">{score}</span>
                  <span className="pp-match-stats subtle">
                    {m.minutesPlayed}′{m.goals ? ` · ${m.goals}G` : ""}
                    {m.assists ? ` · ${m.assists}A` : ""}
                  </span>
                  {rating ? (
                    <span className={`pp-match-rating ${isTop ? "top" : ""}`}>
                      {rating}
                    </span>
                  ) : (
                    <span className="pp-match-rating subtle">-</span>
                  )}
                  <span className="pp-match-league subtle">{league}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {seasons.length > 0 ? (
        <section className="pp-section">
          <h4>Trayectoria ({seasons.length} temporadas)</h4>
          <table className="pp-career">
            <thead>
              <tr>
                <th>Temp.</th>
                <th>Equipo</th>
                <th>Tipo</th>
                <th>PJ</th>
                <th>G</th>
                <th>A</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((s: AnyDict, i: number) => (
                <tr key={i}>
                  <td>{str(s.seasonName)}</td>
                  <td>
                    {s.teamId ? (
                      <Link
                        to={`/equipos?team=${s.teamId}`}
                        className="name-link"
                      >
                        {str(s.team)}
                      </Link>
                    ) : (
                      str(s.team)
                    )}
                  </td>
                  <td className="subtle">{str(s._group, "-")}</td>
                  <td>{str(s.appearances, "-")}</td>
                  <td>{str(s.goals, "-")}</td>
                  <td>{str(s.assists, "-")}</td>
                  <td>{str(get(s, ["rating", "rating"]), "-")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {trophies.length > 0 ? (
        <section className="pp-section">
          <h4>Trofeos</h4>
          <ul className="pp-trophies">
            {trophies.map((g: AnyDict, i: number) => (
              <li key={i} className="pp-trophy-team">
                <div className="pp-trophy-team-head">
                  {g.teamId ? (
                    <Link
                      to={`/equipos?team=${g.teamId}`}
                      className="name-link"
                    >
                      <strong>{str(g.teamName)}</strong>
                    </Link>
                  ) : (
                    <strong>{str(g.teamName)}</strong>
                  )}
                </div>
                <ul className="pp-trophy-list">
                  {asArr(g.tournaments).map((t: AnyDict, j: number) => {
                    const won = asArr(t.seasonsWon);
                    const ru = asArr(t.seasonsRunnerUp);
                    return (
                      <li key={j}>
                        <span className="pp-trophy-name">
                          {str(t.leagueName)}
                        </span>
                        {won.length > 0 ? (
                          <span className="pp-trophy-won">
                            🏆 {won.length} ({won.join(", ")})
                          </span>
                        ) : null}
                        {ru.length > 0 ? (
                          <span className="pp-trophy-ru subtle">
                            🥈 {ru.length} ({ru.join(", ")})
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {marketSeries.length > 0 ? (
        <section className="pp-section">
          <h4>Valor de mercado ({marketSeries.length} registros)</h4>
          <MarketValueChart series={marketSeries} />
        </section>
      ) : null}
    </div>
  );
}

function MarketValueChart({ series }: { series: AnyDict[] }) {
  const points = series
    .filter((p) => typeof p.value === "number" && p.date)
    .map((p) => ({
      date: new Date(String(p.date)),
      value: Number(p.value),
      currency: str(p.currency, "EUR"),
      teamName: str(p.teamName, ""),
      teamId: p.teamId,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  if (points.length === 0) return null;
  const max = Math.max(...points.map((p) => p.value));
  const min = Math.min(...points.map((p) => p.value));
  const range = Math.max(1, max - min);
  const W = 600;
  const H = 140;
  const PAD = 24;
  const stepX = points.length > 1 ? (W - PAD * 2) / (points.length - 1) : 0;
  const path = points
    .map((p, i) => {
      const x = PAD + i * stepX;
      const y = H - PAD - ((p.value - min) / range) * (H - PAD * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const fmt = (v: number) =>
    v >= 1_000_000
      ? `€${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
        ? `€${(v / 1_000).toFixed(0)}K`
        : `€${v}`;
  const last = points[points.length - 1];
  const first = points[0];
  return (
    <div className="pp-market">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="pp-market-svg"
        preserveAspectRatio="none"
      >
        <path d={path} fill="none" stroke="#4cc2ff" strokeWidth={2} />
        {points.map((p, i) => {
          const x = PAD + i * stepX;
          const y = H - PAD - ((p.value - min) / range) * (H - PAD * 2);
          return <circle key={i} cx={x} cy={y} r={2.5} fill="#4cc2ff" />;
        })}
        <text x={PAD} y={14} fill="rgba(255,255,255,0.6)" fontSize="10">
          {fmt(max)}
        </text>
        <text x={PAD} y={H - 6} fill="rgba(255,255,255,0.6)" fontSize="10">
          {fmt(min)}
        </text>
      </svg>
      <div className="pp-market-meta subtle">
        <span>
          {first.date.toLocaleDateString("es-ES")} →{" "}
          {last.date.toLocaleDateString("es-ES")}
        </span>
        <span>
          Actual: <strong>{fmt(last.value)}</strong>
          {last.teamName ? ` (${last.teamName})` : ""}
        </span>
        <span>
          Máx: {fmt(max)} · Mín: {fmt(min)}
        </span>
      </div>
    </div>
  );
}

function PlayerFallbackCards({ detail }: { detail: StoredPlayer }) {
  return (
    <div className="analysis-grid">
      <article className="glass-soft analysis-card">
        <h4>{detail.name}</h4>
        <p className="subtle">ID externo: {detail.externalId}</p>
      </article>
      <article className="glass-soft analysis-card">
        <h4>Equipo</h4>
        <p className="subtle">{detail.teamName || "N/A"}</p>
      </article>
      <article className="glass-soft analysis-card">
        <h4>Dorsal</h4>
        <p className="subtle">{detail.shirtNumber ?? "N/A"}</p>
      </article>
      <article className="glass-soft analysis-card">
        <h4>Perfil</h4>
        <p className="subtle">
          {detail.role || "N/A"} · {detail.section || "N/A"}
        </p>
      </article>
      <article className="glass-soft analysis-card">
        <h4>Edad</h4>
        <p className="subtle">{detail.age ?? "N/A"}</p>
      </article>
      <article className="glass-soft analysis-card">
        <h4>Nacionalidad</h4>
        <p className="subtle">{detail.nationality || "N/A"}</p>
      </article>
    </div>
  );
}
