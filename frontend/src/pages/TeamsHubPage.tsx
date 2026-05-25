import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getStoredCompetitionTeams,
  getStoredCompetitionsTyped,
  getTeamData,
  type StoredCompetition,
  type StoredTeam,
} from "../services/api";
import { TeamsPage as MyTeamsPage } from "./TeamsPage";
import { FavoriteButton } from "../components/FavoriteButton";

type Tab = string; // "myteams" o el leagueId como string
const MY_TEAMS: Tab = "myteams";

const TEAM_LOGO = (id: number | string) =>
  `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png`;
const PLAYER_PHOTO = (id: number | string) =>
  `https://images.fotmob.com/image_resources/playerimages/${id}.png`;

function teamHref(id: number | string, leagueId?: number | string) {
  return leagueId
    ? `/equipos?team=${id}&league=${leagueId}`
    : `/equipos?team=${id}`;
}
function playerHref(id: number | string) {
  return `/player?id=${id}`;
}

function TeamNameLink({
  id,
  name,
  leagueId,
  className,
}: {
  id?: number | string;
  name: string;
  leagueId?: number | string;
  className?: string;
}) {
  if (id == null) return <span className={className}>{name}</span>;
  return (
    <Link
      to={teamHref(id, leagueId)}
      className={`name-link ${className || ""}`}
    >
      {name}
    </Link>
  );
}
function PlayerNameLink({
  id,
  name,
  className,
}: {
  id?: number | string;
  name: string;
  className?: string;
}) {
  if (id == null) return <span className={className}>{name}</span>;
  return (
    <Link to={playerHref(id)} className={`name-link ${className || ""}`}>
      {name}
    </Link>
  );
}

export function TeamsHubPage(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const teamParam = params.get("team");
  const leagueParam = params.get("league");

  const [competitions, setCompetitions] = useState<StoredCompetition[]>([]);
  const [tab, setTab] = useState<Tab>(leagueParam || MY_TEAMS);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(
    teamParam ? Number(teamParam) : null,
  );

  // Carga el catalogo de competiciones almacenadas para generar las pestanas.
  useEffect(() => {
    getStoredCompetitionsTyped()
      .then((data) => {
        setCompetitions(data);
        // Si la pestana actual no existe en el catalogo (y no es "myteams"),
        // ajusta a la primera competicion disponible.
        if (tab !== MY_TEAMS && !data.some((c) => String(c.externalId) === tab)) {
          if (data.length > 0) setTab(String(data[0].externalId));
          else setTab(MY_TEAMS);
        }
      })
      .catch(() => setCompetitions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza estado <- URL cuando cambian los query params.
  useEffect(() => {
    if (teamParam) {
      setSelectedTeamId(Number(teamParam));
      if (leagueParam) setTab(leagueParam);
    } else {
      setSelectedTeamId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamParam, leagueParam]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setSelectedTeamId(null);
    if (params.get("team") || params.get("league")) {
      setParams({}, { replace: true });
    }
  };

  const activeLeagueId = tab === MY_TEAMS ? null : Number(tab);
  const activeCompetition = useMemo(
    () => competitions.find((c) => c.externalId === activeLeagueId) || null,
    [competitions, activeLeagueId],
  );

  const openTeam = (id: number) => {
    setSelectedTeamId(id);
    if (activeLeagueId != null) {
      setParams(
        { team: String(id), league: String(activeLeagueId) },
        { replace: false },
      );
    }
  };

  const closeTeam = () => {
    setSelectedTeamId(null);
    if (params.get("team") || params.get("league")) {
      setParams({}, { replace: true });
    }
  };

  return (
    <section className="teams-hub glass-panel panel">
      <div className="teams-hub-tabs">
        {competitions.map((comp) => {
          const key = String(comp.externalId);
          return (
            <button
              key={key}
              type="button"
              className={`hub-tab ${tab === key ? "active" : ""}`}
              onClick={() => switchTab(key)}
            >
              {comp.name}
            </button>
          );
        })}
        <button
          type="button"
          className={`hub-tab ${tab === MY_TEAMS ? "active" : ""}`}
          onClick={() => switchTab(MY_TEAMS)}
        >
          Mis equipos
        </button>
      </div>

      {tab === MY_TEAMS ? (
        <MyTeamsPage />
      ) : activeLeagueId == null ? (
        <p className="subtle" style={{ padding: "1rem" }}>
          No hay competiciones importadas. Ve a Data Hub para importar una liga.
        </p>
      ) : selectedTeamId != null ? (
        <TeamOverviewPanel
          teamId={selectedTeamId}
          leagueId={activeLeagueId}
          onBack={closeTeam}
        />
      ) : (
        <LeagueTeamsGrid
          leagueId={activeLeagueId}
          leagueLabel={activeCompetition?.name || String(activeLeagueId)}
          onSelect={openTeam}
        />
      )}
    </section>
  );
}

// ---------- Grid de equipos por liga ----------
function LeagueTeamsGrid({
  leagueId,
  leagueLabel,
  onSelect,
}: {
  leagueId: number;
  leagueLabel: string;
  onSelect: (externalId: number) => void;
}) {
  const [teams, setTeams] = useState<StoredTeam[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setTeams(null);
    setError(null);
    getStoredCompetitionTeams(leagueId)
      .then((data) => setTeams(data))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setTeams([]);
      });
  }, [leagueId]);

  const visible = useMemo(() => {
    if (!teams) return [];
    const q = filter.trim().toLowerCase();
    const list = q
      ? teams.filter((t) => (t.name || "").toLowerCase().includes(q))
      : teams;
    return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [teams, filter]);

  return (
    <div className="league-teams">
      <div className="league-teams-head">
        <h3>{leagueLabel}</h3>
        <input
          type="search"
          placeholder="Filtrar equipo..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="league-teams-search"
        />
      </div>
      {teams === null ? (
        <p className="subtle">Cargando equipos...</p>
      ) : visible.length === 0 ? (
        <div className="empty">
          <p className="subtle">
            {error
              ? `Error: ${error}`
              : teams.length === 0
                ? "No hay equipos importados. Ejecuta scripts/seed_la_liga_teams.py."
                : "Sin resultados para ese filtro."}
          </p>
        </div>
      ) : (
        <ul className="team-grid">
          {visible.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="team-card"
                onClick={() => onSelect(t.externalId)}
              >
                <TeamLogo id={t.externalId} name={t.name} />
                <span className="team-card-name">{t.name}</span>
                {t.country ? (
                  <span className="subtle team-card-country">{t.country}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TeamLogo({
  id,
  name,
  size = 56,
}: {
  id: number | string;
  name?: string;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  return (
    <span
      className="team-logo"
      style={{ width: size, height: size }}
      title={name}
    >
      {!errored ? (
        <img
          src={TEAM_LOGO(id)}
          alt={name || ""}
          loading="lazy"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="team-logo-fallback">{(name || "?")[0]}</span>
      )}
    </span>
  );
}

// ---------- Overview de un equipo ----------
type AnyDict = Record<string, unknown>;

function isObj(v: unknown): v is AnyDict {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function str(v: unknown, fb = ""): string {
  return v == null ? fb : typeof v === "string" ? v : String(v);
}
function num(v: unknown): number | null {
  if (typeof v === "number" && !isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  return null;
}
function get(obj: unknown, path: (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (!isObj(cur) && !Array.isArray(cur)) return undefined;
    cur = (cur as AnyDict)[k as string];
  }
  return cur;
}

type OverviewSection = "info" | "squad" | "fixtures" | "stats";

function TeamOverviewPanel({
  teamId,
  leagueId,
  onBack,
}: {
  teamId: number;
  leagueId?: number;
  onBack: () => void;
}) {
  const [raw, setRaw] = useState<AnyDict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<OverviewSection>("info");

  useEffect(() => {
    setRaw(null);
    setError(null);
    getTeamData(teamId)
      .then((d) => setRaw(d as AnyDict))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      );
  }, [teamId]);

  if (error) {
    return (
      <div className="team-overview">
        <BackBar onBack={onBack} />
        <p className="subtle">Error: {error}</p>
      </div>
    );
  }
  if (!raw) {
    return (
      <div className="team-overview">
        <BackBar onBack={onBack} />
        <p className="subtle">Cargando datos del equipo...</p>
      </div>
    );
  }

  const data = isObj(raw.data) ? (raw.data as AnyDict) : raw;
  const details = isObj(data.details) ? (data.details as AnyDict) : {};
  const overview = isObj(data.overview) ? (data.overview as AnyDict) : {};
  const fixtures = isObj(data.fixtures) ? (data.fixtures as AnyDict) : {};
  const stats = isObj(data.stats) ? (data.stats as AnyDict) : {};

  return (
    <div className="team-overview">
      <BackBar onBack={onBack} />
      <TeamHeader teamId={teamId} details={details} overview={overview} leagueId={leagueId} />

      <div className="team-overview-tabs">
        {(
          [
            ["info", "Resumen"],
            ["squad", "Plantilla"],
            ["fixtures", "Calendario"],
            ["stats", "Estadisticas"],
          ] as [OverviewSection, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`hub-tab ${section === k ? "active" : ""}`}
            onClick={() => setSection(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "info" ? (
        <OverviewInfo
          overview={overview}
          details={details}
          leagueId={leagueId}
        />
      ) : null}
      {section === "squad" ? <SquadView overview={overview} /> : null}
      {section === "fixtures" ? (
        <FixturesView
          overview={overview}
          fixtures={fixtures}
          leagueId={leagueId}
        />
      ) : null}
      {section === "stats" ? (
        <StatsView stats={stats} overview={overview} />
      ) : null}
    </div>
  );
}

function BackBar({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" className="back-bar" onClick={onBack}>
      ← Volver al listado
    </button>
  );
}

function extractVenue(overview: AnyDict) {
  const v = isObj(overview.venue) ? (overview.venue as AnyDict) : {};
  const widget = isObj(v.widget) ? (v.widget as AnyDict) : v;
  const pairs = asArr(v.statPairs);
  const pairMap: Record<string, string> = {};
  for (const p of pairs) {
    if (Array.isArray(p) && p.length >= 2) {
      pairMap[str(p[0])] = str(p[1]);
    }
  }
  return {
    name: str(widget.name, ""),
    city: str(widget.city, ""),
    capacity: pairMap["Capacity"] || "",
    surface: pairMap["Surface"] || "",
    opened: pairMap["Opened"] || "",
  };
}

function extractCoach(overview: AnyDict): AnyDict | null {
  const squad = asArr(overview.squad);
  for (const section of squad) {
    if (
      isObj(section) &&
      str((section as AnyDict).title).toLowerCase() === "coach"
    ) {
      const members = asArr((section as AnyDict).members);
      if (members.length > 0 && isObj(members[0])) return members[0] as AnyDict;
    }
  }
  const ch = asArr(overview.coachHistory);
  return isObj(ch[0]) ? (ch[0] as AnyDict) : null;
}

function TeamHeader({
  teamId,
  details,
  overview,
  leagueId,
}: {
  teamId: number;
  details: AnyDict;
  overview: AnyDict;
  leagueId?: number;
}) {
  const venue = extractVenue(overview);
  const currentCoach = extractCoach(overview);
  const country = str(details.country, "");
  const league = str(details.primaryLeagueName, "");
  const name = str(details.name, "Equipo");

  return (
    <header className="team-overview-header">
      <TeamLogo id={teamId} name={name} size={84} />
      <div className="team-overview-headinfo">
        <div className="team-overview-title">
          <h2>{name}</h2>
          <FavoriteButton
            type="TEAM"
            externalId={teamId}
            name={name}
            metadata={{
              leagueName: league || "",
              leagueId: leagueId ? String(leagueId) : "",
              country: country || "",
              subtitle: league || country || "",
            }}
          />
        </div>
        <div className="subtle team-overview-meta">
          {country ? <span>{country}</span> : null}
          {league ? <span>· {league}</span> : null}
          {venue.name ? <span>· Estadio: {venue.name}</span> : null}
          {venue.city ? <span>({venue.city})</span> : null}
          {currentCoach ? (
            <span>· Entrenador: {str(currentCoach.name)}</span>
          ) : null}
        </div>
      </div>
    </header>
  );
}

// --- Info (resumen) ---
function OverviewInfo({
  overview,
  details,
  leagueId,
}: {
  overview: AnyDict;
  details: AnyDict;
  leagueId?: number;
}) {
  const form = asArr(overview.teamForm);
  const table = pickTableRow(overview, num(details.id));
  const nextMatch = isObj(overview.nextMatch)
    ? (overview.nextMatch as AnyDict)
    : null;
  const lastMatch = isObj(overview.lastMatch)
    ? (overview.lastMatch as AnyDict)
    : null;
  const topPlayers = extractTopPlayers(overview);
  const venue = extractVenue(overview);

  return (
    <div className="tab-grid two-cols">
      <section className="glass-soft pad">
        <h4>Forma reciente</h4>
        {form.length === 0 ? (
          <p className="subtle">Sin datos.</p>
        ) : (
          <div className="form-row">
            {form.slice(-10).map((m, i) => {
              if (!isObj(m)) return null;
              const r = str(m.resultString, "");
              const cls =
                r === "W"
                  ? "win"
                  : r === "L"
                    ? "loss"
                    : r === "D"
                      ? "draw"
                      : "";
              const tip = isObj(m.tooltipText)
                ? (m.tooltipText as AnyDict)
                : null;
              const title = tip
                ? `${str(tip.homeTeam)} ${str(tip.homeScore)} - ${str(tip.awayScore)} ${str(tip.awayTeam)}`
                : str(m.score, "");
              return (
                <span key={i} className={`form-chip ${cls}`} title={title}>
                  {r || "?"}
                </span>
              );
            })}
          </div>
        )}
        {table ? (
          <p className="subtle">
            Posicion en liga: <strong>{str(table.idx, "-")}</strong> ·{" "}
            <strong>{str(table.pts, "-")}</strong> pts ·{" "}
            {str(table.played, "-")} PJ ·{" "}
            <span style={{ color: "#22c55e" }}>{str(table.wins, "-")}V</span>{" "}
            <span style={{ color: "#9ca3af" }}>{str(table.draws, "-")}E</span>{" "}
            <span style={{ color: "#ef4444" }}>{str(table.losses, "-")}D</span>
            {table.scoresStr ? ` · Goles ${str(table.scoresStr)}` : ""}
          </p>
        ) : null}
      </section>

      <section className="glass-soft pad">
        <h4>Estadio e info</h4>
        <ul className="kv-list">
          <li>
            <span className="subtle">Estadio</span>
            <strong>{venue.name || "-"}</strong>
          </li>
          <li>
            <span className="subtle">Ciudad</span>
            <strong>{venue.city || "-"}</strong>
          </li>
          <li>
            <span className="subtle">Capacidad</span>
            <strong>{venue.capacity || "-"}</strong>
          </li>
          {venue.opened ? (
            <li>
              <span className="subtle">Inaugurado</span>
              <strong>{venue.opened}</strong>
            </li>
          ) : null}
          <li>
            <span className="subtle">Pais</span>
            <strong>{str(details.country, "-")}</strong>
          </li>
        </ul>
      </section>

      <section className="glass-soft pad">
        <h4>Proximo partido</h4>
        {nextMatch ? (
          <MatchRow m={nextMatch} leagueId={leagueId} />
        ) : (
          <p className="subtle">Sin datos.</p>
        )}
        <h4 style={{ marginTop: "0.8rem" }}>Ultimo partido</h4>
        {lastMatch ? (
          <MatchRow m={lastMatch} leagueId={leagueId} />
        ) : (
          <p className="subtle">Sin datos.</p>
        )}
      </section>

      <section className="glass-soft pad">
        <h4>Jugadores destacados</h4>
        {topPlayers.length === 0 ? (
          <p className="subtle">Sin datos.</p>
        ) : (
          <div className="top-players-groups">
            {topPlayers.map((group) => (
              <div key={group.key} className="top-players-group">
                <div className="subtle top-players-title">{group.label}</div>
                <ul className="top-players-list">
                  {group.players.slice(0, 3).map((p, i) => (
                    <li key={i}>
                      <PlayerAvatar id={p.id} name={p.name} size={32} />
                      <PlayerNameLink
                        id={p.id}
                        name={p.name}
                        className="tp-name"
                      />
                      <span className="tp-stat">{p.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type TopPlayerEntry = { id?: string | number; name: string; value: string };
type TopPlayerGroup = { key: string; label: string; players: TopPlayerEntry[] };

function extractTopPlayers(overview: AnyDict): TopPlayerGroup[] {
  const top = isObj(overview.topPlayers)
    ? (overview.topPlayers as AnyDict)
    : null;
  if (!top) return [];
  const groups: [string, string][] = [
    ["byRating", "Por rating"],
    ["byGoals", "Goles"],
    ["byAssists", "Asistencias"],
  ];
  const result: TopPlayerGroup[] = [];
  for (const [k, label] of groups) {
    const block = isObj(top[k]) ? (top[k] as AnyDict) : null;
    if (!block) continue;
    const players = asArr(block.players);
    if (players.length === 0) continue;
    result.push({
      key: k,
      label,
      players: players.map((p) => {
        const o = isObj(p) ? (p as AnyDict) : {};
        return {
          id: o.id as string | number | undefined,
          name: str(o.name, "-"),
          value: str(o.value ?? get(o, ["stat", "value"]), ""),
        };
      }),
    });
  }
  return result;
}

function pickTableRow(overview: AnyDict, teamId: number | null) {
  const tables = asArr(overview.table);
  // overview.table puede ser [{ data: { table | tables } }] o variantes.
  for (const block of tables) {
    if (!isObj(block)) continue;
    const dataBlock = isObj(block.data) ? (block.data as AnyDict) : block;
    const rows = collectRows(dataBlock);
    if (!rows.length) continue;
    if (teamId == null) {
      const row = rows[0];
      return rowSummary(row);
    }
    const found = rows.find(
      (r) =>
        num((r as AnyDict).id) === teamId ||
        num((r as AnyDict).teamId) === teamId,
    );
    if (found) return rowSummary(found as AnyDict);
  }
  return null;
}

function collectRows(block: AnyDict): AnyDict[] {
  const out: AnyDict[] = [];
  const direct = block.table;
  if (Array.isArray(direct)) {
    direct.forEach((r) => isObj(r) && out.push(r));
    return out;
  }
  // estructura {all: [...], home: [...], away: [...]}
  const tableObj = isObj(direct) ? (direct as AnyDict) : null;
  if (tableObj) {
    const all = tableObj.all;
    if (Array.isArray(all)) {
      all.forEach((r) => isObj(r) && out.push(r));
      return out;
    }
  }
  // estructura {tables: [{table: {...}}]}
  const tables = block.tables;
  if (Array.isArray(tables)) {
    for (const t of tables) {
      if (isObj(t)) out.push(...collectRows(t as AnyDict));
    }
  }
  return out;
}

function rowSummary(row: AnyDict) {
  return {
    idx: row.idx ?? row.rank ?? row.position ?? "-",
    pts: row.pts ?? row.points ?? "-",
    played: row.played ?? row.matchesPlayed ?? "-",
    wins: row.wins ?? "-",
    draws: row.draws ?? "-",
    losses: row.losses ?? "-",
    scoresStr: row.scoresStr ?? "",
  };
}

// --- Squad ---
function SquadView({ overview }: { overview: AnyDict }) {
  const squad = asArr(overview.squad);
  if (squad.length === 0) {
    return <p className="subtle">Sin plantilla.</p>;
  }
  return (
    <div className="squad-grid">
      {squad.map((section, i) => {
        if (!isObj(section)) return null;
        // FotMob: section es [title, members[]] o {title, members}
        let title = "";
        let members: unknown[] = [];
        if (Array.isArray(section)) {
          title = str((section as unknown[])[0], "");
          members = Array.isArray((section as unknown[])[1])
            ? ((section as unknown[])[1] as unknown[])
            : [];
        } else {
          title = str(section.title, "");
          members = asArr(section.members);
        }
        // Si miembros vienen como [id, name, rating,...] o como objetos
        return (
          <section key={i} className="glass-soft pad squad-section">
            <h4>{translateSquadSection(title)}</h4>
            <ul className="squad-list">
              {members.map((m, j) => {
                const p = isObj(m) ? (m as AnyDict) : null;
                if (!p) return null;
                const pid = p.id as number | string | undefined;
                const name = str(p.name, "-");
                const roleRaw = isObj(p.role)
                  ? str(
                      (p.role as AnyDict).fallback ?? (p.role as AnyDict).key,
                      "",
                    )
                  : str(p.role, "");
                const role = translateRole(roleRaw);
                const shirt = str(p.shirtNumber ?? p.shirt, "");
                const rating = str(p.rating, "");
                const goals = num(p.goals);
                const assists = num(p.assists);
                return (
                  <li key={j} className="squad-row">
                    <PlayerAvatar id={pid} name={name} size={36} />
                    <div className="squad-info">
                      <PlayerNameLink
                        id={pid}
                        name={name}
                        className="squad-name"
                      />
                      <span className="subtle squad-meta">
                        {shirt ? `#${shirt}` : ""}
                        {role ? ` · ${role}` : ""}
                        {goals ? ` · ${goals}G` : ""}
                        {assists ? ` · ${assists}A` : ""}
                      </span>
                    </div>
                    {rating ? (
                      <span className="squad-rating">{rating}</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function translateSquadSection(t: string): string {
  const map: Record<string, string> = {
    coach: "Entrenador",
    keepers: "Porteros",
    goalkeepers: "Porteros",
    defenders: "Defensas",
    midfielders: "Centrocampistas",
    attackers: "Delanteros",
    forwards: "Delanteros",
  };
  return map[(t || "").toLowerCase()] || t || "Plantilla";
}

function translateRole(r: string): string {
  const map: Record<string, string> = {
    Keeper: "Portero",
    keeper_long: "Portero",
    Defender: "Defensa",
    defender_long: "Defensa",
    Midfielder: "Centrocampista",
    midfielder_long: "Centrocampista",
    Attacker: "Delantero",
    attacker_long: "Delantero",
    Coach: "Entrenador",
    coach: "Entrenador",
  };
  return map[r] || r;
}

// --- Fixtures ---
function FixturesView({
  overview,
  fixtures,
  leagueId,
}: {
  overview: AnyDict;
  fixtures: AnyDict;
  leagueId?: number;
}) {
  const all =
    asArr(fixtures.allFixtures).length > 0
      ? asArr(fixtures.allFixtures)
      : asArr(overview.overviewFixtures);

  // Algunas variantes envuelven en {fixtures: [...]}
  const flat: AnyDict[] = [];
  all.forEach((it) => {
    if (isObj(it)) {
      const inner = (it as AnyDict).fixtures;
      if (Array.isArray(inner)) {
        inner.forEach((m) => isObj(m) && flat.push(m as AnyDict));
      } else {
        flat.push(it as AnyDict);
      }
    }
  });

  const now = Date.now();
  const past: AnyDict[] = [];
  const upcoming: AnyDict[] = [];
  flat.forEach((m) => {
    const ts = parseMatchTs(m);
    const isFinished =
      !!get(m, ["status", "finished"]) || (ts != null && ts < now);
    if (isFinished) past.push(m);
    else upcoming.push(m);
  });
  past.sort((a, b) => (parseMatchTs(b) ?? 0) - (parseMatchTs(a) ?? 0));
  upcoming.sort((a, b) => (parseMatchTs(a) ?? 0) - (parseMatchTs(b) ?? 0));

  return (
    <div className="tab-grid two-cols">
      <section className="glass-soft pad">
        <h4>Proximos partidos</h4>
        {upcoming.length === 0 ? (
          <p className="subtle">Sin programados.</p>
        ) : (
          <ul className="fixtures-list">
            {upcoming.slice(0, 8).map((m, i) => (
              <li key={i}>
                <MatchRow m={m} leagueId={leagueId} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="glass-soft pad">
        <h4>Ultimos resultados</h4>
        {past.length === 0 ? (
          <p className="subtle">Sin partidos disputados.</p>
        ) : (
          <ul className="fixtures-list">
            {past.slice(0, 8).map((m, i) => (
              <li key={i}>
                <MatchRow m={m} leagueId={leagueId} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function parseMatchTs(m: AnyDict): number | null {
  const utc = get(m, ["status", "utcTime"]);
  if (typeof utc === "string") {
    const t = Date.parse(utc);
    if (!isNaN(t)) return t;
  }
  const s = m.utcTime || m.timeTS;
  if (typeof s === "string") {
    const t = Date.parse(s);
    if (!isNaN(t)) return t;
  }
  const n = num(s);
  if (n != null) return n > 1e12 ? n : n * 1000;
  return null;
}

function MatchRow({ m, leagueId }: { m: AnyDict; leagueId?: number }) {
  const home = isObj(m.home) ? (m.home as AnyDict) : {};
  const away = isObj(m.away) ? (m.away as AnyDict) : {};
  const homeName = str(home.name || home.shortName, "-");
  const awayName = str(away.name || away.shortName, "-");
  const homeId = home.id as number | string | undefined;
  const awayId = away.id as number | string | undefined;
  const score =
    str(get(m, ["status", "scoreStr"]), "") ||
    (typeof home.score !== "undefined" && typeof away.score !== "undefined"
      ? `${home.score} - ${away.score}`
      : "");
  const ts = parseMatchTs(m);
  const when = ts
    ? new Date(ts).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : str(get(m, ["status", "startDateStr"]), "");
  const tournament = str(get(m, ["tournament", "name"]), "");

  return (
    <div className="match-row">
      <div className="match-row-teams">
        <span className="mt-side">
          {homeId ? <TeamLogo id={homeId} name={homeName} size={20} /> : null}
          <TeamNameLink id={homeId} name={homeName} leagueId={leagueId} />
        </span>
        <span className="mt-score">{score || "vs"}</span>
        <span className="mt-side away">
          <TeamNameLink id={awayId} name={awayName} leagueId={leagueId} />
          {awayId ? <TeamLogo id={awayId} name={awayName} size={20} /> : null}
        </span>
      </div>
      <div className="subtle match-row-meta">
        {when}
        {tournament ? ` · ${tournament}` : ""}
      </div>
    </div>
  );
}

// --- Stats ---
function StatsView({ stats, overview }: { stats: AnyDict; overview: AnyDict }) {
  const teamStats = asArr(stats.teams);
  const season = isObj(overview.season) ? (overview.season as AnyDict) : null;

  // Agrupa por categoria
  const byCategory = new Map<string, AnyDict[]>();
  for (const block of teamStats) {
    if (!isObj(block)) continue;
    const cat = str(block.category, "Otros");
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(block as AnyDict);
  }

  return (
    <div className="team-stats">
      {season ? (
        <p className="subtle">
          Temporada: <strong>{str(season.name, "-")}</strong>
        </p>
      ) : null}
      {teamStats.length === 0 ? (
        <p className="subtle">Sin estadisticas disponibles.</p>
      ) : (
        [...byCategory.entries()].map(([cat, blocks]) => (
          <section key={cat} className="team-stats-section">
            <h4>{translateCategory(cat)}</h4>
            <div className="team-stats-grid">
              {blocks.map((block, i) => {
                const participant = isObj(block.participant)
                  ? (block.participant as AnyDict)
                  : {};
                const title = str(block.header || block.localizedTitleId, "");
                const value = str(
                  participant.value ?? get(participant, ["stat", "value"]),
                  "-",
                );
                const rank = str(participant.rank, "");
                return (
                  <div key={i} className="team-stat-card">
                    <span className="subtle">{title}</span>
                    <strong>{value}</strong>
                    {rank ? (
                      <span className="team-stat-rank">#{rank}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function translateCategory(c: string): string {
  const map: Record<string, string> = {
    "Top Stat": "Principales",
    Attack: "Ataque",
    Defence: "Defensa",
    Defense: "Defensa",
    Discipline: "Disciplina",
    Passing: "Pases",
    Goalkeeping: "Porteria",
  };
  return map[c] || c;
}

// ---------- helpers ----------
function PlayerAvatar({
  id,
  name,
  size = 32,
}: {
  id?: string | number;
  name?: string;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  const initials = (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
  return (
    <span
      className="player-photo"
      style={{ width: size, height: size }}
      title={name}
    >
      {id && !errored ? (
        <img
          src={PLAYER_PHOTO(id)}
          alt={name || ""}
          loading="lazy"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="player-photo-fallback">{initials || "?"}</span>
      )}
    </span>
  );
}
