import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getMatchData,
  getStoredCompetitionMatches,
  getStoredCompetitionsTyped,
  getStoredMatch,
  type StoredCompetition,
  type StoredMatch,
} from "../services/api";
import { FavoriteButton } from "../components/FavoriteButton";
import { fallbackImageToInitials } from "../utils/imageFallback";

type Json = unknown;
type Dict = Record<string, unknown>;

// ---------- helpers ----------
function isObj(v: unknown): v is Dict {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function get(obj: unknown, path: (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur == null) return undefined;
    if (Array.isArray(cur) && typeof k === "number") cur = cur[k];
    else if (isObj(cur)) cur = cur[String(k)];
    else return undefined;
  }
  return cur;
}
function str(v: unknown, fallback = "-"): string {
  if (v == null) return fallback;
  if (typeof v === "string") return v || fallback;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
}
function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isRichMatchPayload(v: Dict | null): boolean {
  if (!isObj(v)) return false;
  if (v.error) return false;
  return (
    isObj(v.header) ||
    isObj(v.general) ||
    isObj(get(v, ["content", "matchFacts"]))
  );
}

// ---------- Round / matchweek helpers ----------
function roundNumber(round?: string | null): number {
  if (!round) return Number.MAX_SAFE_INTEGER;
  const m = String(round).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

function roundLabel(round?: string | null): string {
  if (!round) return "Otras jornadas";
  const n = roundNumber(round);
  if (n === Number.MAX_SAFE_INTEGER) return String(round);
  return `Jornada ${n}`;
}

function groupByRound(
  items: StoredMatch[],
): { label: string; round: number; matches: StoredMatch[] }[] {
  const buckets = new Map<
    number,
    { label: string; round: number; matches: StoredMatch[] }
  >();
  for (const m of items) {
    const n = roundNumber(m.round);
    if (!buckets.has(n)) {
      buckets.set(n, { label: roundLabel(m.round), round: n, matches: [] });
    }
    buckets.get(n)!.matches.push(m);
  }
  return [...buckets.values()].sort((a, b) => a.round - b.round);
}

// ---------- Date / event translation helpers ----------
function formatMatchDate(raw?: string | null): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  try {
    return d.toLocaleString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d.toISOString();
  }
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  Goal: "Gol",
  AddedTime: "Tiempo añadido",
  Half: "Final de tiempo",
  Substitution: "Cambio",
  Card: "Tarjeta",
  RedCard: "Tarjeta roja",
  YellowCard: "Tarjeta amarilla",
  Penalty: "Penalti",
  PenaltyMissed: "Penalti fallado",
  OwnGoal: "Gol en propia",
  VAR: "VAR",
  Whistle: "Silbato",
};

function translateEventType(type: string): string {
  return EVENT_TYPE_LABELS[type] || type || "-";
}

// ---------- Player photo (FotMob) ----------
const FOTMOB_PLAYER_IMG =
  "https://images.fotmob.com/image_resources/playerimages";

function PlayerPhoto({
  playerId,
  name,
  size = 32,
  className = "",
}: {
  playerId?: string | number | null;
  name?: string;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const id = playerId != null ? String(playerId) : "";
  const initials = (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
  const showImg = id && !errored;
  return (
    <span
      className={`player-photo ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden={!name ? true : undefined}
      title={name || undefined}
    >
      {showImg ? (
        <img
          src={`${FOTMOB_PLAYER_IMG}/${id}.png`}
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

// Renderiza el nombre del jugador como <Link> a /player?id=ID cuando hay id;
// si no, devuelve un span plano. Pensado para timeline, lineups, top players...
function PlayerLink({
  playerId,
  name,
  className,
  fallback,
}: {
  playerId?: string | number | null;
  name?: string;
  className?: string;
  fallback?: string;
}) {
  const label = name && name !== "-" ? name : (fallback ?? "-");
  const id = playerId != null && playerId !== "" ? String(playerId) : "";
  if (!id) return <span className={className}>{label}</span>;
  return (
    <Link
      to={`/player?id=${id}`}
      className={`player-link ${className || ""}`.trim()}
    >
      {label}
    </Link>
  );
}

// ---------- Event icon ----------
function EventIcon({ type, card }: { type: string; card?: string }) {
  if (type === "Goal" || type === "OwnGoal") {
    // Soccer ball
    return (
      <svg
        className="ev-icon ev-icon-goal"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.4"
        />
        <polygon
          points="12,7 15.5,9.6 14.2,13.8 9.8,13.8 8.5,9.6"
          fill="#111"
        />
        <line x1="12" y1="2" x2="12" y2="7" stroke="#111" strokeWidth="1.2" />
        <line
          x1="22"
          y1="12"
          x2="15.5"
          y2="9.6"
          stroke="#111"
          strokeWidth="1.2"
        />
        <line
          x1="18"
          y1="20"
          x2="14.2"
          y2="13.8"
          stroke="#111"
          strokeWidth="1.2"
        />
        <line
          x1="6"
          y1="20"
          x2="9.8"
          y2="13.8"
          stroke="#111"
          strokeWidth="1.2"
        />
        <line
          x1="2"
          y1="12"
          x2="8.5"
          y2="9.6"
          stroke="#111"
          strokeWidth="1.2"
        />
      </svg>
    );
  }
  if (type === "Card") {
    const isRed = (card || "").toLowerCase() === "red";
    return (
      <svg className="ev-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="7"
          y="3"
          width="10"
          height="16"
          rx="1.5"
          fill={isRed ? "#e23b3b" : "#f5c518"}
          stroke="#0008"
          strokeWidth="0.6"
        />
      </svg>
    );
  }
  if (type === "RedCard") {
    return (
      <svg className="ev-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="7"
          y="3"
          width="10"
          height="16"
          rx="1.5"
          fill="#e23b3b"
          stroke="#0008"
          strokeWidth="0.6"
        />
      </svg>
    );
  }
  if (type === "YellowCard") {
    return (
      <svg className="ev-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="7"
          y="3"
          width="10"
          height="16"
          rx="1.5"
          fill="#f5c518"
          stroke="#0008"
          strokeWidth="0.6"
        />
      </svg>
    );
  }
  if (type === "Substitution") {
    return (
      <svg className="ev-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 8 H13 L11 6 M13 8 L11 10"
          fill="none"
          stroke="#2bb673"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 16 H11 L13 14 M11 16 L13 18"
          fill="none"
          stroke="#e23b3b"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "Penalty" || type === "PenaltyMissed") {
    return (
      <svg className="ev-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="6"
          width="18"
          height="12"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      </svg>
    );
  }
  if (type === "VAR") {
    return (
      <svg className="ev-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="6"
          width="18"
          height="12"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <text
          x="12"
          y="15"
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill="currentColor"
        >
          VAR
        </text>
      </svg>
    );
  }
  // default
  return (
    <svg className="ev-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

// ---------- JSON viewer (raw tab) ----------
function describe(value: Json): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array (${value.length})`;
  const t = typeof value;
  if (t === "object") {
    const keys = Object.keys(value as Dict);
    return `object (${keys.length} claves)`;
  }
  if (t === "string") {
    const s = value as string;
    return s.length > 60 ? `string (${s.length} chars)` : `"${s}"`;
  }
  return String(value);
}
function JsonBlock({ value }: { value: Json }): JSX.Element {
  const text = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);
  return <pre className="json-block">{text}</pre>;
}
function JsonSection({
  name,
  value,
}: {
  name: string;
  value: Json;
}): JSX.Element {
  return (
    <details className="json-section glass-soft">
      <summary>
        <strong>{name}</strong>{" "}
        <span className="subtle">{describe(value)}</span>
      </summary>
      <JsonBlock value={value} />
    </details>
  );
}

// ---------- header card ----------
function MatchHeader({
  json,
  detail,
}: {
  json: Dict | null;
  detail: StoredMatch | null;
}) {
  const teams = asArr(get(json, ["header", "teams"]));
  const home = isObj(teams[0]) ? teams[0] : {};
  const away = isObj(teams[1]) ? teams[1] : {};
  const status = isObj(get(json, ["header", "status"]))
    ? (get(json, ["header", "status"]) as Dict)
    : {};
  const homeName = str(home.name, detail?.homeTeamName || "Local");
  const awayName = str(away.name, detail?.awayTeamName || "Visitante");
  const homeScore = home.score ?? null;
  const awayScore = away.score ?? null;
  const scoreStr =
    homeScore != null && awayScore != null
      ? `${homeScore} - ${awayScore}`
      : str(status.scoreStr, detail?.scoreStr || "vs");
  const homeLogo = str(home.imageUrl, "");
  const awayLogo = str(away.imageUrl, "");
  const statusLabel = status.finished
    ? "Finalizado"
    : status.started
      ? "En juego"
      : status.cancelled
        ? "Cancelado"
        : "Programado";
  const league = str(get(json, ["general", "leagueName"]), detail?.leagueName);
  const rawRound = str(
    get(json, ["general", "leagueRoundName"]),
    detail?.round,
  );
  const round = rawRound && rawRound !== "-" ? roundLabel(rawRound) : "";
  const utc = str(get(json, ["general", "matchTimeUTC"]), detail?.utcTime);
  const utcLabel = utc && utc !== "-" ? formatMatchDate(utc) : "";

  return (
    <div className="match-hero glass-panel">
      <div className="mh-meta subtle">
        <span>{league}</span>
        {round ? <span>· {round}</span> : null}
        {utcLabel ? <span>· {utcLabel}</span> : null}
        <span className="mh-fav-slot">
          <FavoriteButton
            type="MATCH"
            externalId={detail?.externalId}
            name={`${homeName} vs ${awayName}`}
            metadata={{
              leagueName: league || "",
              leagueId: detail?.leagueExternalId
                ? String(detail.leagueExternalId)
                : "",
              date: utcLabel || "",
              scoreStr: typeof scoreStr === "string" ? scoreStr : "",
              subtitle: `${league || ""}${utcLabel ? ` · ${utcLabel}` : ""}`,
            }}
          />
        </span>
      </div>
      <div className="mh-row">
        <div className="mh-team">
          {homeLogo ? (
            <img
              src={homeLogo}
              alt={homeName}
              onError={(e) => fallbackImageToInitials(e, homeName)}
            />
          ) : (
            <div className="mh-logo-ph" />
          )}
          <strong>{homeName}</strong>
        </div>
        <div className="mh-score">
          <span className="mh-score-val">{scoreStr}</span>
          <span className="mh-status subtle">{statusLabel}</span>
        </div>
        <div className="mh-team mh-team-away">
          {awayLogo ? (
            <img
              src={awayLogo}
              alt={awayName}
              onError={(e) => fallbackImageToInitials(e, awayName)}
            />
          ) : (
            <div className="mh-logo-ph" />
          )}
          <strong>{awayName}</strong>
        </div>
      </div>
    </div>
  );
}

// ---------- Overview ----------
function OverviewTab({ json }: { json: Dict }) {
  const infoBox = isObj(get(json, ["content", "matchFacts", "infoBox"]))
    ? (get(json, ["content", "matchFacts", "infoBox"]) as Dict)
    : {};
  const highlights = asArr(get(json, ["content", "matchFacts", "highlights"]));
  const events = asArr(
    get(json, ["content", "matchFacts", "events", "events"]),
  );
  const mvp = get(json, ["content", "matchFacts", "playerOfTheMatch"]);

  const stadium = get(infoBox, ["Stadium"]);
  const referee = get(infoBox, ["Referee"]);
  const attendance = get(infoBox, ["Attendance"]);
  const infoEntries = Object.entries(infoBox).filter(
    ([k, v]) =>
      v != null &&
      typeof v !== "object" &&
      !["Stadium", "Referee", "Attendance"].includes(k),
  );

  return (
    <div className="tab-grid">
      <section className="glass-soft pad">
        <h4>Info del partido</h4>
        <ul className="kv-list">
          {isObj(stadium) ? (
            <li>
              <span>Estadio</span>
              <strong>
                {str(stadium.name)}
                {stadium.city ? ` (${str(stadium.city)})` : ""}
              </strong>
            </li>
          ) : stadium != null ? (
            <li>
              <span>Estadio</span>
              <strong>{str(stadium)}</strong>
            </li>
          ) : null}
          {isObj(referee) ? (
            <li>
              <span>Árbitro</span>
              <strong>{str(referee.text || referee.name)}</strong>
            </li>
          ) : referee != null ? (
            <li>
              <span>Árbitro</span>
              <strong>{str(referee)}</strong>
            </li>
          ) : null}
          {attendance != null ? (
            <li>
              <span>Asistencia</span>
              <strong>{str(attendance)}</strong>
            </li>
          ) : null}
          {infoEntries.map(([k, v]) => (
            <li key={k}>
              <span>{k}</span>
              <strong>{str(v)}</strong>
            </li>
          ))}
          {infoEntries.length === 0 && !stadium && !referee && !attendance ? (
            <li className="subtle">Sin información adicional.</li>
          ) : null}
        </ul>
      </section>

      <section className="glass-soft pad">
        <h4>Eventos clave</h4>
        {events.length === 0 ? (
          <p className="subtle">Sin eventos.</p>
        ) : (
          <ul className="event-list">
            {events
              .filter((e) => {
                if (!isObj(e)) return false;
                const t = str(e.type, "");
                return !["Half", "AddedTime", "Whistle"].includes(t);
              })
              .slice(0, 60)
              .map((e, i) => {
                if (!isObj(e)) return null;
                const min = str(e.timeStr || e.time, "");
                const overload = str(e.overloadTime, "");
                const rawType = str(e.type, "");
                const type = translateEventType(rawType);
                const isHome = !!e.isHome;
                const card = str(e.card, "");
                const effectiveType =
                  rawType === "Card" && card.toLowerCase() === "red"
                    ? "RedCard"
                    : rawType === "Card" && card.toLowerCase() === "yellow"
                      ? "YellowCard"
                      : rawType;

                // Texto principal por tipo
                let mainName = "";
                let mainPlayerId: string | number | null = null;
                let detail: React.ReactNode = null;

                if (rawType === "Substitution") {
                  // FotMob: swap = [IN, OUT]
                  const swapArr = Array.isArray(e.swap)
                    ? (e.swap as unknown[])
                    : [];
                  const inP = isObj(swapArr[0]) ? (swapArr[0] as Dict) : null;
                  const outP = isObj(swapArr[1]) ? (swapArr[1] as Dict) : null;
                  const inPlayer = inP ? str(inP.name) : "";
                  const outPlayer = outP ? str(outP.name) : "";
                  mainName = inPlayer || str(e.nameStr);
                  mainPlayerId = (inP && (inP.id as string | number)) || null;
                  detail = (
                    <span className="ev-detail">
                      <span className="ev-in">
                        <PlayerPhoto
                          playerId={inP?.id as string | number | undefined}
                          name={inPlayer}
                          size={20}
                        />
                        ↑{" "}
                        <PlayerLink
                          playerId={inP?.id as string | number | undefined}
                          name={inPlayer}
                        />
                      </span>
                      <span className="ev-out">
                        <PlayerPhoto
                          playerId={outP?.id as string | number | undefined}
                          name={outPlayer}
                          size={20}
                        />
                        ↓{" "}
                        <PlayerLink
                          playerId={outP?.id as string | number | undefined}
                          name={outPlayer}
                        />
                      </span>
                    </span>
                  );
                } else if (rawType === "Goal") {
                  const pl = isObj(e.player) ? (e.player as Dict) : null;
                  mainName = pl ? str(pl.name) : str(e.nameStr || e.fullName);
                  mainPlayerId =
                    (pl && (pl.id as string | number)) ||
                    (e.playerId as string | number) ||
                    null;
                  const isOwn = !!e.ownGoal;
                  const goalDesc = str(e.goalDescription || e.suffix, "");
                  const assist = str(e.assistStr, "").replace(
                    /^assist by /i,
                    "",
                  );
                  const score = Array.isArray(e.newScore)
                    ? (e.newScore as unknown[]).join(" - ")
                    : "";
                  detail = (
                    <span className="ev-detail">
                      {score ? (
                        <strong className="ev-score">{score}</strong>
                      ) : null}
                      {isOwn ? (
                        <span className="ev-tag tag-own">Gol en propia</span>
                      ) : null}
                      {goalDesc ? (
                        <span className="ev-tag">
                          {goalDesc.toLowerCase() === "penalty"
                            ? "Penalti"
                            : goalDesc}
                        </span>
                      ) : null}
                      {assist ? (
                        <span className="subtle">Asistencia: {assist}</span>
                      ) : null}
                    </span>
                  );
                } else if (rawType === "Card") {
                  const pl = isObj(e.player) ? (e.player as Dict) : null;
                  mainName = pl ? str(pl.name) : str(e.nameStr);
                  mainPlayerId =
                    (pl && (pl.id as string | number)) ||
                    (e.playerId as string | number) ||
                    null;
                  const desc = str(e.cardDescription, "");
                  detail = desc ? <span className="subtle">{desc}</span> : null;
                } else {
                  const pl = isObj(e.player) ? (e.player as Dict) : null;
                  mainName = pl ? str(pl.name) : str(e.nameStr || e.playerName);
                  mainPlayerId =
                    (pl && (pl.id as string | number)) ||
                    (e.playerId as string | number) ||
                    null;
                }

                return (
                  <li key={i} className={isHome ? "ev home" : "ev away"}>
                    <span className="ev-min">
                      {min}
                      {min ? "'" : ""}
                      {overload && overload !== "0" ? `+${overload}` : ""}
                    </span>
                    <span className="ev-icon-wrap" title={type}>
                      <EventIcon type={effectiveType} card={card} />
                    </span>
                    <span className="ev-body">
                      <span className="ev-name">
                        {rawType !== "Substitution" ? (
                          <PlayerPhoto
                            playerId={mainPlayerId}
                            name={mainName}
                            size={22}
                          />
                        ) : null}
                        {mainName && mainName !== "-" ? (
                          <PlayerLink playerId={mainPlayerId} name={mainName} />
                        ) : (
                          <span>{type}</span>
                        )}
                      </span>
                      {detail}
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {isObj(mvp) ? (
        <section className="glass-soft pad">
          <h4>Jugador del partido</h4>
          <div className="mvp-row">
            {(mvp as Dict).imageUrl ? (
              <img
                src={str((mvp as Dict).imageUrl)}
                alt="MVP"
                className="mvp-img"
                onError={(e) =>
                  fallbackImageToInitials(
                    e,
                    str(
                      get(mvp, ["name", "fullName"]),
                      str(get(mvp, ["name"]), "MVP"),
                    ),
                  )
                }
              />
            ) : null}
            <div>
              <strong>
                <PlayerLink
                  playerId={
                    ((mvp as Dict).id as string | number | undefined) ??
                    ((mvp as Dict).playerId as string | number | undefined)
                  }
                  name={str(
                    get(mvp, ["name", "fullName"]),
                    str(get(mvp, ["name"]), "-"),
                  )}
                />
              </strong>
              <div className="subtle">
                Equipo: <strong>{str((mvp as Dict).teamName)}</strong>
              </div>
              <div className="subtle">
                Rating:{" "}
                <strong>
                  {str(
                    get(mvp, ["rating", "num"]),
                    str((mvp as Dict).rating, "-"),
                  )}
                </strong>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {highlights.length > 0 ? (
        <section className="glass-soft pad">
          <h4>Highlights</h4>
          <ul className="kv-list">
            {highlights.slice(0, 10).map((h, i) => {
              if (!isObj(h)) return null;
              const title = str(h.title || h.description, "Highlight");
              const url = str(h.url || h.videoUrl, "");
              return (
                <li key={i}>
                  <span>{title}</span>
                  {url ? (
                    <a href={url} target="_blank" rel="noreferrer">
                      Ver
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

// ---------- Stats ----------
const PERIOD_LABELS: Record<string, string> = {
  All: "Partido completo",
  FirstHalf: "1ª parte",
  SecondHalf: "2ª parte",
  ExtraFirstHalf: "Prórroga 1",
  ExtraSecondHalf: "Prórroga 2",
  Penalties: "Penaltis",
};

function StatsTab({ json }: { json: Dict }) {
  const root = get(json, ["content", "stats"]);
  // Estructura real (FotMob):
  //   content.stats.Periods.{All|FirstHalf|SecondHalf}.stats[].stats[]
  // Estructura legacy:
  //   content.stats[] o content.stats.stats[]
  const periods: { key: string; title: string; data: Dict }[] = [];

  if (isObj(root)) {
    const periodsRoot = (root as Dict).Periods;
    if (isObj(periodsRoot)) {
      // Orden preferido (All primero)
      const orderedKeys = [
        "All",
        "FirstHalf",
        "SecondHalf",
        "ExtraFirstHalf",
        "ExtraSecondHalf",
        "Penalties",
      ];
      const seen = new Set<string>();
      for (const k of orderedKeys) {
        const v = (periodsRoot as Dict)[k];
        if (isObj(v)) {
          periods.push({ key: k, title: PERIOD_LABELS[k] || k, data: v });
          seen.add(k);
        }
      }
      // Cualquier otro periodo no contemplado.
      Object.entries(periodsRoot as Dict).forEach(([k, v]) => {
        if (!seen.has(k) && isObj(v)) {
          periods.push({ key: k, title: PERIOD_LABELS[k] || k, data: v });
        }
      });
    } else if (Array.isArray(periodsRoot)) {
      (periodsRoot as unknown[]).forEach((p, i) => {
        if (isObj(p)) {
          periods.push({
            key: String(i),
            title: str((p as Dict).title, `Periodo ${i + 1}`),
            data: p as Dict,
          });
        }
      });
    } else if (Array.isArray((root as Dict).stats)) {
      periods.push({
        key: "All",
        title: "Partido completo",
        data: root as Dict,
      });
    }
  } else if (Array.isArray(root)) {
    (root as unknown[]).forEach((p, i) => {
      if (isObj(p)) {
        periods.push({
          key: String(i),
          title: str((p as Dict).title, `Periodo ${i + 1}`),
          data: p as Dict,
        });
      }
    });
  }

  const [periodIdx, setPeriodIdx] = useState(0);
  const current = periods[periodIdx] || periods[0];

  if (!current) return <p className="subtle">No hay estadísticas.</p>;
  const groups = asArr(current.data.stats);

  return (
    <div className="stats-tab">
      {periods.length > 1 ? (
        <div className="period-tabs">
          {periods.map((p, i) => (
            <button
              key={p.key}
              type="button"
              className={i === periodIdx ? "chip chip-on" : "chip"}
              onClick={() => setPeriodIdx(i)}
            >
              {p.title}
            </button>
          ))}
        </div>
      ) : null}

      <div className="stats-list">
        {groups.map((g, gi) => {
          if (!isObj(g)) return null;
          const rows = asArr(g.stats);
          return (
            <div key={gi} className="stats-group">
              {g.title ? <h5 className="subtle">{str(g.title)}</h5> : null}
              {rows.map((r, ri) => {
                if (!isObj(r)) return null;
                const vals = asArr(r.stats);
                const h = vals[0];
                const a = vals[1];
                const hn = num(h);
                const an = num(a);
                let hPct = 50;
                let aPct = 50;
                if (hn != null && an != null && hn + an > 0) {
                  hPct = Math.round((hn / (hn + an)) * 100);
                  aPct = 100 - hPct;
                }
                return (
                  <div key={ri} className="stat-row">
                    <span className="stat-h">{str(h)}</span>
                    <div className="stat-bars">
                      <div className="stat-name">{str(r.title)}</div>
                      <div className="bars">
                        <div
                          className="bar bar-h"
                          style={{ width: `${hPct}%` }}
                        />
                        <div
                          className="bar bar-a"
                          style={{ width: `${aPct}%` }}
                        />
                      </div>
                    </div>
                    <span className="stat-a">{str(a)}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Lineups ----------
function LineupsTab({ json }: { json: Dict }) {
  // Estructura real: content.lineup.{homeTeam, awayTeam}, con starters/subs/coach/formation.
  const lineupRoot = get(json, ["content", "lineup"]);
  const homeTeam = isObj(get(lineupRoot, ["homeTeam"]))
    ? (get(lineupRoot, ["homeTeam"]) as Dict)
    : null;
  const awayTeam = isObj(get(lineupRoot, ["awayTeam"]))
    ? (get(lineupRoot, ["awayTeam"]) as Dict)
    : null;

  // Fallback al formato antiguo (content.lineup.lineup [home, away]) si existiera.
  const legacy = get(json, ["content", "lineup", "lineup"]);
  const legacyHome =
    Array.isArray(legacy) && isObj(legacy[0]) ? (legacy[0] as Dict) : null;
  const legacyAway =
    Array.isArray(legacy) && isObj(legacy[1]) ? (legacy[1] as Dict) : null;

  const home = homeTeam || legacyHome;
  const away = awayTeam || legacyAway;

  if (!home && !away) return <p className="subtle">Sin alineaciones.</p>;

  const extractStarters = (side: Dict | null): Dict[] => {
    if (!side) return [];
    const arr: Dict[] = [];
    if (Array.isArray(side.starters)) {
      (side.starters as unknown[]).forEach((p) => {
        if (isObj(p)) arr.push(p);
      });
    } else {
      asArr(side.players).forEach((row) => {
        asArr(row).forEach((p) => {
          if (isObj(p)) arr.push(p);
        });
      });
    }
    return arr;
  };

  const extractSubs = (side: Dict | null): Dict[] => {
    if (!side) return [];
    const arr: Dict[] = [];
    if (Array.isArray(side.subs)) {
      (side.subs as unknown[]).forEach((p) => {
        if (isObj(p)) arr.push(p);
      });
    } else {
      asArr(side.bench).forEach((p) => {
        if (isObj(p)) arr.push(p);
      });
    }
    return arr;
  };

  const getCoach = (side: Dict | null): Dict | null => {
    if (!side) return null;
    const c = side.coach;
    if (isObj(c)) return c;
    if (Array.isArray(c) && isObj(c[0])) return c[0] as Dict;
    return null;
  };

  const homeStarters = extractStarters(home);
  const awayStarters = extractStarters(away);
  const homeSubs = extractSubs(home);
  const awaySubs = extractSubs(away);
  const homeCoach = getCoach(home);
  const awayCoach = getCoach(away);

  const homeName = str(home?.name, "Local");
  const awayName = str(away?.name, "Visitante");
  const homeFormation = str(home?.formation, "");
  const awayFormation = str(away?.formation, "");
  const homeRating = str(home?.rating, "");
  const awayRating = str(away?.rating, "");

  return (
    <div className="lineups-tab">
      <div className="lineup-header">
        <div className="lineup-team-head home">
          <strong>{homeName}</strong>
          <span className="subtle">{homeFormation}</span>
          {homeRating ? (
            <span className="lineup-team-rating">{homeRating}</span>
          ) : null}
        </div>
        <div className="lineup-team-head away">
          {awayRating ? (
            <span className="lineup-team-rating">{awayRating}</span>
          ) : null}
          <span className="subtle">{awayFormation}</span>
          <strong>{awayName}</strong>
        </div>
      </div>

      <FormationPitch homeStarters={homeStarters} awayStarters={awayStarters} />

      <div className="tab-grid two-cols lineup-extra">
        <LineupBench
          title={`${homeName} · Banquillo`}
          subs={homeSubs}
          coach={homeCoach}
          side="home"
        />
        <LineupBench
          title={`${awayName} · Banquillo`}
          subs={awaySubs}
          coach={awayCoach}
          side="away"
        />
      </div>
    </div>
  );
}

// Convierte horizontalLayout (que puede llegar como objeto {x,y} o como string
// '@{x=0.1; y=0.5; ...}' tras serialización defectuosa) en {x,y} numéricos.
function parseLayout(layout: unknown): { x: number; y: number } | null {
  if (isObj(layout)) {
    const x = num((layout as Dict).x);
    const y = num((layout as Dict).y);
    if (x != null && y != null) return { x, y };
  }
  if (typeof layout === "string") {
    const mx = layout.match(/x\s*=\s*([0-9.]+)/);
    const my = layout.match(/y\s*=\s*([0-9.]+)/);
    if (mx && my) return { x: parseFloat(mx[1]!), y: parseFloat(my[1]!) };
  }
  return null;
}

function FormationPitch({
  homeStarters,
  awayStarters,
}: {
  homeStarters: Dict[];
  awayStarters: Dict[];
}) {
  // Pintamos los dos equipos en un único campo. Home a la izquierda (x directo),
  // away a la derecha (x espejado).
  // Coordenadas FotMob horizontalLayout: x en [0..1] desde el portero local
  // (0=banda local) hasta área rival (1). y en [0..1] lateral.
  // Sin embargo, las coords vienen relativas al "lado" del equipo, así que
  // para colocar a ambos en el mismo campo:
  //   home_x = x * 0.5      (0..0.5)
  //   away_x = 1 - x * 0.5  (1..0.5)
  // De esta forma cada equipo ocupa su mitad y ambos GKs quedan en bandas.
  const W = 1000;
  const H = 580;

  const place = (p: Dict, isHome: boolean) => {
    const layout = parseLayout(p.horizontalLayout);
    if (!layout) return null;
    // FotMob entrega coords desde la perspectiva del propio equipo (GK en x=0.1,
    // atacando hacia x=1). Para pintar a ambos en el mismo campo y que el
    // lateral derecho de un equipo quede frente al lateral izquierdo del otro,
    // hay que espejar tanto X como Y para el visitante.
    const x = isHome ? layout.x * 0.5 : 1 - layout.x * 0.5;
    const y = isHome ? layout.y : 1 - layout.y;
    return { x: x * W, y: y * H };
  };

  type Pos = { x: number; y: number; p: Dict; isHome: boolean };
  const positions: Pos[] = [];
  homeStarters.forEach((p) => {
    const pos = place(p, true);
    if (pos) positions.push({ ...pos, p, isHome: true });
  });
  awayStarters.forEach((p) => {
    const pos = place(p, false);
    if (pos) positions.push({ ...pos, p, isHome: false });
  });

  return (
    <div className="formation-pitch">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="formation-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Césped */}
        <defs>
          <linearGradient id="gpitch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f6b34" />
            <stop offset="1" stopColor="#164a25" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="url(#gpitch)" />
        {/* Líneas */}
        <g stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none">
          <rect x="20" y="20" width={W - 40} height={H - 40} />
          <line x1={W / 2} y1="20" x2={W / 2} y2={H - 20} />
          <circle cx={W / 2} cy={H / 2} r="60" />
          {/* Áreas */}
          <rect x="20" y={H / 2 - 110} width="140" height="220" />
          <rect x={W - 160} y={H / 2 - 110} width="140" height="220" />
          <rect x="20" y={H / 2 - 50} width="55" height="100" />
          <rect x={W - 75} y={H / 2 - 50} width="55" height="100" />
        </g>

        {positions.map((pos, i) => (
          <PitchPlayer key={i} {...pos} />
        ))}
      </svg>
    </div>
  );
}

function PitchPlayer({
  x,
  y,
  p,
  isHome,
}: {
  x: number;
  y: number;
  p: Dict;
  isHome: boolean;
}) {
  const navigate = useNavigate();
  const id = (p.id as string | number | undefined) ?? "";
  const name = str(p.name, "");
  const lastName =
    str(p.lastName, "") || (name.split(" ").slice(-1)[0] ?? name);
  const shirt = str(p.shirtNumber ?? p.shirt, "");
  const rating = str(get(p, ["performance", "rating"]) ?? p.rating, "");
  const isCaptain = !!p.isCaptain;
  const ratingNum = parseFloat(rating);
  const ratingClass =
    !isNaN(ratingNum) && ratingNum >= 7.5
      ? "rating-high"
      : !isNaN(ratingNum) && ratingNum >= 6.5
        ? "rating-mid"
        : !isNaN(ratingNum) && ratingNum > 0
          ? "rating-low"
          : "";

  // Centro del badge en (x, y). Tamaño nominal:
  const r = 26;
  const labelY = y + r + 22;

  const clickable = id !== "";
  const onClick = clickable
    ? (ev: React.MouseEvent) => {
        ev.preventDefault();
        navigate(`/player?id=${id}`);
      }
    : undefined;

  return (
    <g
      className={`pp ${isHome ? "is-home" : "is-away"} ${clickable ? "is-clickable" : ""}`.trim()}
      onClick={onClick}
      style={clickable ? { cursor: "pointer" } : undefined}
    >
      <title>{name || lastName}</title>{" "}
      {/* Foto envuelta en clipPath circular */}
      <defs>
        <clipPath id={`clip-${id}`}>
          <circle cx={x} cy={y} r={r} />
        </clipPath>
      </defs>
      <circle
        cx={x}
        cy={y}
        r={r + 2}
        fill={isHome ? "#5aa8ff" : "#ff7a7a"}
        opacity="0.95"
      />
      {id ? (
        <image
          href={`${FOTMOB_PLAYER_IMG}/${id}.png`}
          x={x - r}
          y={y - r}
          width={r * 2}
          height={r * 2}
          clipPath={`url(#clip-${id})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <text
          x={x}
          y={y + 5}
          textAnchor="middle"
          fontSize="14"
          fill="#fff"
          fontWeight="700"
        >
          {shirt || "?"}
        </text>
      )}
      {/* Badge dorsal pequeño */}
      {shirt ? (
        <g>
          <circle
            cx={x - r + 6}
            cy={y - r + 6}
            r={9}
            fill="#0a0f1a"
            stroke="#fff"
            strokeWidth="1"
          />
          <text
            x={x - r + 6}
            y={y - r + 9}
            textAnchor="middle"
            fontSize="10"
            fill="#fff"
            fontWeight="700"
          >
            {shirt}
          </text>
        </g>
      ) : null}
      {/* Capitán */}
      {isCaptain ? (
        <g>
          <circle
            cx={x + r - 4}
            cy={y - r + 4}
            r={8}
            fill="#ffce4d"
            stroke="#0a0f1a"
            strokeWidth="1"
          />
          <text
            x={x + r - 4}
            y={y - r + 7}
            textAnchor="middle"
            fontSize="9"
            fill="#0a0f1a"
            fontWeight="700"
          >
            C
          </text>
        </g>
      ) : null}
      {/* Rating badge */}
      {rating ? (
        <g className={`rating ${ratingClass}`}>
          <rect
            x={x + r - 14}
            y={y + r - 12}
            width="28"
            height="14"
            rx="3"
            fill={
              ratingClass === "rating-high"
                ? "#22c55e"
                : ratingClass === "rating-mid"
                  ? "#facc15"
                  : ratingClass === "rating-low"
                    ? "#ef4444"
                    : "#475569"
            }
            stroke="#0a0f1a"
            strokeWidth="1"
          />
          <text
            x={x + r}
            y={y + r - 1}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill={ratingClass === "rating-mid" ? "#0a0f1a" : "#fff"}
          >
            {rating}
          </text>
        </g>
      ) : null}
      {/* Nombre */}
      <text
        x={x}
        y={labelY}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill="#fff"
        stroke="#000"
        strokeWidth="3"
        paintOrder="stroke"
      >
        {lastName}
      </text>
    </g>
  );
}

function LineupBench({
  title,
  subs,
  coach,
  side,
}: {
  title: string;
  subs: Dict[];
  coach: Dict | null;
  side: "home" | "away";
}) {
  return (
    <section className={`glass-soft pad bench bench-${side}`}>
      <h4>{title}</h4>
      {subs.length === 0 ? (
        <p className="subtle">Sin suplentes.</p>
      ) : (
        <ul className="bench-list">
          {subs.map((p, i) => {
            const id = (p.id as string | number | undefined) ?? "";
            const name = str(p.name, "-");
            const shirt = str(p.shirtNumber ?? p.shirt, "");
            const rating = str(
              get(p, ["performance", "rating"]) ?? p.rating,
              "",
            );
            return (
              <li key={i} className="bench-row">
                <PlayerPhoto playerId={id} name={name} size={28} />
                <span className="bench-num">{shirt}</span>
                <PlayerLink playerId={id} name={name} className="bench-name" />
                {rating ? <span className="bench-rating">{rating}</span> : null}
              </li>
            );
          })}
        </ul>
      )}
      {coach ? (
        <p className="subtle bench-coach">
          Entrenador: <strong>{str(coach.name)}</strong>
        </p>
      ) : null}
    </section>
  );
}

// ---------- Shotmap ----------
const SHOT_EVENT_LABELS: Record<string, string> = {
  Goal: "Gol",
  Miss: "Fallo",
  AttemptSaved: "Parada",
  SavedShot: "Parada",
  Post: "Al palo",
  Blocked: "Bloqueado",
  BlockedShot: "Bloqueado",
  OwnGoal: "Gol en propia",
};
const SHOT_TYPE_LABELS: Record<string, string> = {
  RightFoot: "Pie derecho",
  LeftFoot: "Pie izquierdo",
  Header: "Remate de cabeza",
  Other: "Otro",
};
const SHOT_SITUATION_LABELS: Record<string, string> = {
  RegularPlay: "Juego abierto",
  FromCorner: "Tras córner",
  SetPiece: "Jugada a balón parado",
  FreeKick: "Falta directa",
  Penalty: "Penalti",
  FastBreak: "Contraataque",
  ThrowInSetPiece: "Saque de banda",
};
const SHOT_PERIOD_LABELS: Record<string, string> = {
  FirstHalf: "1ª parte",
  SecondHalf: "2ª parte",
  ExtraFirstHalf: "Prórroga 1",
  ExtraSecondHalf: "Prórroga 2",
  PenaltyShootout: "Tanda de penaltis",
};

function ShotmapTab({ json }: { json: Dict }) {
  const shots = asArr(get(json, ["content", "shotmap", "shots"])).filter(
    isObj,
  ) as Dict[];
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  if (shots.length === 0) return <p className="subtle">Sin shotmap.</p>;
  const W = 700;
  const H = 460;
  const teams = asArr(get(json, ["header", "teams"]));
  const homeId = isObj(teams[0]) ? num((teams[0] as Dict).id) : null;
  const homeName = isObj(teams[0]) ? str((teams[0] as Dict).name) : "Local";
  const awayName = isObj(teams[1]) ? str((teams[1] as Dict).name) : "Visitante";

  const selected = selectedIdx != null ? shots[selectedIdx] : null;

  return (
    <div className="glass-soft pad shotmap-tab">
      <h4>
        Shotmap <span className="subtle">{shots.length} tiros</span>
      </h4>
      <svg viewBox={`0 0 ${W} ${H}`} className="pitch-svg">
        <rect x={0} y={0} width={W} height={H} fill="#0f3b1f" />
        <rect
          x={5}
          y={5}
          width={W - 10}
          height={H - 10}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
        />
        <line
          x1={W / 2}
          y1={5}
          x2={W / 2}
          y2={H - 5}
          stroke="rgba(255,255,255,0.4)"
        />
        <circle
          cx={W / 2}
          cy={H / 2}
          r={50}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
        />
        <rect
          x={5}
          y={H * 0.2}
          width={W * 0.16}
          height={H * 0.6}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
        />
        <rect
          x={W - 5 - W * 0.16}
          y={H * 0.2}
          width={W * 0.16}
          height={H * 0.6}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
        />
        {shots.map((s, i) => {
          const x = num(s.x);
          const y = num(s.y);
          if (x == null || y == null) return null;
          const isHome = homeId != null ? num(s.teamId) === homeId : !!s.isHome;
          const px = isHome ? (x / 100) * W : W - (x / 100) * W;
          const py = (y / 100) * H;
          const goal = String(s.eventType || "").toLowerCase() === "goal";
          const xg = num(s.expectedGoals) ?? 0;
          const r = 4 + Math.sqrt(xg) * 14;
          const fill = goal ? "#ffce4d" : isHome ? "#5aa8ff" : "#ff7a7a";
          const isSel = selectedIdx === i;
          return (
            <g
              key={i}
              className="shot-dot"
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedIdx(isSel ? null : i)}
            >
              <circle
                cx={px}
                cy={py}
                r={r}
                fill={fill}
                opacity={isSel ? 1 : goal ? 0.95 : 0.55}
                stroke={isSel ? "#fff" : "rgba(0,0,0,0.4)"}
                strokeWidth={isSel ? 2 : 1}
              />
              {goal ? (
                <text
                  x={px}
                  y={py + 3}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#000"
                  pointerEvents="none"
                >
                  ⚽
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="shot-legend subtle">
        <span>
          <i className="dot dot-h" /> Local
        </span>
        <span>
          <i className="dot dot-a" /> Visitante
        </span>
        <span>
          <i className="dot dot-g" /> Gol
        </span>
        <span>Tamaño = xG</span>
        <span className="subtle">Pulsa un tiro para ver detalles</span>
      </div>

      {selected ? (
        <ShotDetailCard
          shot={selected}
          isHome={
            homeId != null ? num(selected.teamId) === homeId : !!selected.isHome
          }
          homeName={homeName}
          awayName={awayName}
          onClose={() => setSelectedIdx(null)}
        />
      ) : null}
    </div>
  );
}

function ShotDetailCard({
  shot,
  isHome,
  homeName,
  awayName,
  onClose,
}: {
  shot: Dict;
  isHome: boolean;
  homeName: string;
  awayName: string;
  onClose: () => void;
}) {
  const player = str(shot.playerName || shot.fullName, "-");
  const teamName = isHome ? homeName : awayName;
  const min = str(shot.min, "");
  const added = num(shot.minAdded);
  const minStr = min ? `${min}${added && added > 0 ? `+${added}` : ""}'` : "";
  const evt = str(shot.eventType, "");
  const evtLabel = SHOT_EVENT_LABELS[evt] || evt || "-";
  const shotType = str(shot.shotType, "");
  const shotTypeLabel = SHOT_TYPE_LABELS[shotType] || shotType || "-";
  const situation = str(shot.situation, "");
  const situationLabel = SHOT_SITUATION_LABELS[situation] || situation || "-";
  const period = str(shot.period, "");
  const periodLabel = SHOT_PERIOD_LABELS[period] || period || "";
  const xg = num(shot.expectedGoals);
  const xgot = num(shot.expectedGoalsOnTarget);
  const insideBox = shot.isFromInsideBox === true;
  const onTarget = shot.isOnTarget === true;
  const blocked = shot.isBlocked === true;
  const ownGoal = shot.isOwnGoal === true;
  const isGoal = evt.toLowerCase() === "goal";

  const fmt = (v: number | null, dig = 2): string =>
    v == null ? "-" : v.toFixed(dig);

  return (
    <div className={`shot-detail ${isHome ? "is-home" : "is-away"}`}>
      <button
        type="button"
        className="shot-detail-close"
        aria-label="Cerrar"
        onClick={onClose}
      >
        ✕
      </button>
      <div className="shot-detail-head">
        <span className={`shot-pill ${isGoal ? "is-goal" : ""}`}>
          {isGoal ? "⚽" : "●"} {evtLabel}
        </span>
        {minStr ? <span className="shot-min">{minStr}</span> : null}
        {periodLabel ? <span className="subtle">· {periodLabel}</span> : null}
      </div>
      <div className="shot-detail-player">
        <PlayerPhoto
          playerId={shot.playerId as number | undefined}
          name={player}
          size={32}
        />
        <strong>
          <PlayerLink
            playerId={shot.playerId as number | undefined}
            name={player}
          />
        </strong>
        <span className="subtle">{teamName}</span>
      </div>
      <div className="shot-detail-body">
        <div className="shot-detail-grid">
          <div>
            <span className="subtle">xG</span>
            <strong>{fmt(xg)}</strong>
          </div>
          <div>
            <span className="subtle">xGOT</span>
            <strong>{fmt(xgot)}</strong>
          </div>
          <div>
            <span className="subtle">Tipo de tiro</span>
            <strong>{shotTypeLabel}</strong>
          </div>
          <div>
            <span className="subtle">Situación</span>
            <strong>{situationLabel}</strong>
          </div>
          <div>
            <span className="subtle">Zona</span>
            <strong>{insideBox ? "Dentro del área" : "Fuera del área"}</strong>
          </div>
          <div>
            <span className="subtle">A puerta</span>
            <strong>{blocked ? "Bloqueado" : onTarget ? "Sí" : "No"}</strong>
          </div>
        </div>
        <GoalFrame shot={shot} isGoal={isGoal} />
      </div>
      {ownGoal ? <p className="ev-tag tag-own">Gol en propia puerta</p> : null}
    </div>
  );
}

// Diagrama de la portería con el punto donde cruza el balón.
// FotMob aporta dos coordenadas útiles:
//  - goalCrossedY (m, eje Y del campo: postes en ~30.34 y ~37.66)
//  - goalCrossedZ (m, altura: travesaño en 2.44)
//  - isSavedOffLine, isBlocked, isOnTarget para decidir si dibujar fuera.
function GoalFrame({ shot, isGoal }: { shot: Dict; isGoal: boolean }) {
  // Dimensiones SVG.
  const W = 260;
  const H = 130;
  // Margen lateral y superior dentro del SVG para que el marco quede centrado
  // y haya espacio para tiros desviados.
  const mx = 28;
  const my = 14;
  const frameW = W - mx * 2;
  const frameH = 78;
  const frameX = mx;
  const frameY = my;

  // Postes (en metros) del campo FotMob.
  const POST_L = 30.34;
  const POST_R = 37.66;
  const GOAL_W = POST_R - POST_L;
  const GOAL_H = 2.44;

  const gy = num(shot.goalCrossedY);
  const gz = num(shot.goalCrossedZ);
  const onTarget = shot.isOnTarget === true;
  const blocked = shot.isBlocked === true;

  // Si no tenemos las coords reales o el tiro fue bloqueado pronto, sólo
  // pintamos el marco como indicador.
  const hasCoords = gy != null && gz != null && !blocked;

  let dotX: number | null = null;
  let dotY: number | null = null;
  let isInside = false;
  if (hasCoords) {
    // 0 = poste izquierdo, 1 = poste derecho.
    const nx = (gy! - POST_L) / GOAL_W;
    // 0 = suelo, 1 = travesaño.
    const nz = gz! / GOAL_H;
    isInside = nx >= 0 && nx <= 1 && nz >= 0 && nz <= 1;
    // Permitimos cierto rango fuera del marco (-0.4 a 1.4) para tiros desviados.
    const clampedX = Math.max(-0.4, Math.min(1.4, nx));
    const clampedZ = Math.max(-0.2, Math.min(1.4, nz));
    dotX = frameX + clampedX * frameW;
    dotY = frameY + (1 - clampedZ) * frameH;
  }

  const dotColor = isGoal
    ? "#ffce4d"
    : isInside && onTarget
      ? "#5aa8ff"
      : "#ff7a7a";

  return (
    <div className="goal-frame-wrap">
      <span className="goal-frame-label subtle">Trayectoria a portería</span>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="goal-frame-svg"
        aria-hidden="true"
      >
        {/* Suelo */}
        <line
          x1={4}
          y1={frameY + frameH}
          x2={W - 4}
          y2={frameY + frameH}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1"
        />
        {/* Red */}
        <defs>
          <pattern
            id="goalnet"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 0 L8 8 M8 0 L0 8"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.6"
            />
          </pattern>
        </defs>
        <rect
          x={frameX}
          y={frameY}
          width={frameW}
          height={frameH}
          fill="url(#goalnet)"
        />
        {/* Marco (postes + travesaño) */}
        <line
          x1={frameX}
          y1={frameY}
          x2={frameX + frameW}
          y2={frameY}
          stroke="#fff"
          strokeWidth="3"
        />
        <line
          x1={frameX}
          y1={frameY}
          x2={frameX}
          y2={frameY + frameH}
          stroke="#fff"
          strokeWidth="3"
        />
        <line
          x1={frameX + frameW}
          y1={frameY}
          x2={frameX + frameW}
          y2={frameY + frameH}
          stroke="#fff"
          strokeWidth="3"
        />
        {/* Punto del tiro */}
        {dotX != null && dotY != null ? (
          <g>
            <circle
              cx={dotX}
              cy={dotY}
              r={8}
              fill={dotColor}
              stroke="#000"
              strokeWidth="0.8"
              opacity="0.95"
            />
            {isGoal ? (
              <text
                x={dotX}
                y={dotY + 3}
                fontSize="9"
                textAnchor="middle"
                fill="#000"
                pointerEvents="none"
              >
                ⚽
              </text>
            ) : null}
          </g>
        ) : (
          <text
            x={W / 2}
            y={H / 2 + 4}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(255,255,255,0.6)"
          >
            {blocked ? "Tiro bloqueado" : "Sin datos de trayectoria"}
          </text>
        )}
      </svg>
    </div>
  );
}

// ---------- Momentum ----------
function MomentumTab({ json }: { json: Dict }) {
  const data = asArr(get(json, ["content", "momentum", "main", "data"])).filter(
    isObj,
  ) as Dict[];
  if (data.length === 0) return <p className="subtle">Sin momentum.</p>;
  const W = 800;
  const H = 200;
  const mid = H / 2;
  const max = data.reduce(
    (m, d) => Math.max(m, Math.abs(num(d.value) ?? 0)),
    1,
  );
  const step = W / data.length;
  return (
    <div className="glass-soft pad">
      <h4>Momentum</h4>
      <svg viewBox={`0 0 ${W} ${H}`} className="momentum-svg">
        <line x1={0} y1={mid} x2={W} y2={mid} stroke="rgba(255,255,255,0.3)" />
        {data.map((d, i) => {
          const v = num(d.value) ?? 0;
          const h = (Math.abs(v) / max) * (mid - 4);
          const y = v >= 0 ? mid - h : mid;
          return (
            <rect
              key={i}
              x={i * step + 1}
              y={y}
              width={Math.max(1, step - 2)}
              height={h}
              fill={v >= 0 ? "#5aa8ff" : "#ff7a7a"}
              opacity={0.8}
            />
          );
        })}
      </svg>
      <p className="subtle">
        Azul = local · Rojo = visitante (presión por minuto)
      </p>
    </div>
  );
}

// ---------- Top Players ----------
function TopPlayersTab({ json }: { json: Dict }) {
  // FotMob expone los Top Players bajo content.matchFacts.topPlayers,
  // con dos listas (homeTopPlayers / awayTopPlayers).
  const tp = get(json, ["content", "matchFacts", "topPlayers"]);
  if (!isObj(tp)) return <p className="subtle">Sin top players.</p>;

  const teams = asArr(get(json, ["header", "teams"]));
  const homeName = isObj(teams[0])
    ? str((teams[0] as Dict).name, "Local")
    : "Local";
  const awayName = isObj(teams[1])
    ? str((teams[1] as Dict).name, "Visitante")
    : "Visitante";

  const sections: { label: string; players: Dict[] }[] = [];
  const home = asArr((tp as Dict).homeTopPlayers).filter(isObj) as Dict[];
  const away = asArr((tp as Dict).awayTopPlayers).filter(isObj) as Dict[];
  if (home.length) sections.push({ label: homeName, players: home });
  if (away.length) sections.push({ label: awayName, players: away });

  // Fallback: si la API devuelve un objeto plano con arrays (formato antiguo).
  if (sections.length === 0) {
    Object.entries(tp).forEach(([k, v]) => {
      if (Array.isArray(v) && v.length > 0) {
        sections.push({
          label: k,
          players: (v as unknown[]).filter(isObj) as Dict[],
        });
      }
    });
  }

  if (sections.length === 0) return <p className="subtle">Sin top players.</p>;

  return (
    <div className="tab-grid two-cols">
      {sections.map((sec) => (
        <section key={sec.label} className="glass-soft pad">
          <h4>{sec.label}</h4>
          <ul className="player-list">
            {sec.players.slice(0, 8).map((p, i) => {
              const name = str(
                get(p, ["name", "fullName"]),
                str(p.name, str(p.shortName, "-")),
              );
              const pid =
                (p.id as string | number | undefined) ??
                (p.participantId as string | number | undefined) ??
                (p.playerId as string | number | undefined);
              const rating = str(
                p.playerRatingRounded ??
                  get(p, ["rating", "num"]) ??
                  p.playerRating ??
                  p.value ??
                  p.rating,
                "-",
              );
              const pos = str(get(p, ["positionLabel", "label"]), "");
              const mom = p.manOfTheMatch ? " ★" : "";
              return (
                <li key={i}>
                  <span className="pl-num">{pos}</span>
                  <span className="pl-name">
                    <PlayerLink playerId={pid} name={name} />
                    {mom}
                  </span>
                  <span className="pl-rating">{rating}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ---------- H2H ----------
function H2HTab({ json }: { json: Dict }) {
  const h2h = get(json, ["content", "h2h"]);
  if (!isObj(h2h)) return <p className="subtle">Sin H2H.</p>;
  const summary = asArr(h2h.summary);
  const matches = asArr(h2h.matches).filter(isObj) as Dict[];
  const finished = matches.filter(
    (m) => Boolean(get(m, ["status", "finished"])) || Boolean(m.finished),
  );

  const formatDate = (raw: unknown): string => {
    const s = typeof raw === "string" ? raw : "";
    if (!s) return "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    try {
      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d.toISOString().slice(0, 10);
    }
  };

  return (
    <div className="tab-grid">
      {summary.length === 3 ? (
        <section className="glass-soft pad">
          <h4>Histórico</h4>
          <div className="h2h-summary">
            <div>
              <strong>{str(summary[0])}</strong>
              <span className="subtle">Local</span>
            </div>
            <div>
              <strong>{str(summary[1])}</strong>
              <span className="subtle">Empates</span>
            </div>
            <div>
              <strong>{str(summary[2])}</strong>
              <span className="subtle">Visitante</span>
            </div>
          </div>
        </section>
      ) : null}
      {finished.length > 0 ? (
        <section className="glass-soft pad">
          <h4>Últimos enfrentamientos</h4>
          <ul className="h2h-list">
            {finished.slice(0, 10).map((m, i) => {
              const date = formatDate(
                get(m, ["time", "utcTime"]) ?? m.date ?? m.matchDate,
              );
              const homeName = str(
                get(m, ["home", "name"]),
                str(m.homeName, "-"),
              );
              const awayName = str(
                get(m, ["away", "name"]),
                str(m.awayName, "-"),
              );
              const score = str(
                get(m, ["status", "scoreStr"]),
                str(m.score ?? m.scoreStr, "-"),
              );
              return (
                <li key={i}>
                  <span>{date}</span>
                  <span>{homeName}</span>
                  <strong>{score}</strong>
                  <span>{awayName}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="glass-soft pad">
          <p className="subtle">Sin enfrentamientos previos registrados.</p>
        </section>
      )}
    </div>
  );
}

// ---------- Raw JSON ----------
function RawJsonTab({ json, matchId }: { json: Dict; matchId: number | null }) {
  const [search, setSearch] = useState("");
  const topKeys = useMemo(
    () =>
      Object.entries(json).filter(([k]) =>
        search ? k.toLowerCase().includes(search.toLowerCase()) : true,
      ),
    [json, search],
  );
  return (
    <div>
      <div className="filters-row">
        <label className="field inline">
          Buscar clave
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ej. content, header, lineup..."
          />
        </label>
        <button
          type="button"
          className="icon-btn"
          onClick={() => {
            const blob = new Blob([JSON.stringify(json, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `match-${matchId ?? "data"}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
        >
          Descargar JSON
        </button>
      </div>
      <div className="json-tree">
        {topKeys.map(([k, v]) => (
          <JsonSection key={k} name={k} value={v} />
        ))}
      </div>
    </div>
  );
}

// ---------- Page ----------
const TABS = [
  "Resumen",
  "Estadísticas",
  "Alineaciones",
  "Shotmap",
  "Momentum",
  "Top Players",
  "H2H",
  "JSON",
] as const;
type Tab = (typeof TABS)[number];

export function MatchPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const initialIdRaw = searchParams.get("id");
  const initialMatchId = initialIdRaw ? Number(initialIdRaw) : null;
  const pendingInitialRef = useRef<number | null>(initialMatchId);

  const [competitions, setCompetitions] = useState<StoredCompetition[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [matches, setMatches] = useState<StoredMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [matchDetail, setMatchDetail] = useState<StoredMatch | null>(null);
  const [matchJson, setMatchJson] = useState<Dict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRichMatchJson = isRichMatchPayload(matchJson);
  const richMatchJson = hasRichMatchJson ? (matchJson as Dict) : null;
  const [tab, setTab] = useState<Tab>("Resumen");

  useEffect(() => {
    getStoredCompetitionsTyped()
      .then((data) => {
        setCompetitions(data);
        if (data.length === 0) return;
        // Si llega ?id=, resolvemos su liga antes de seleccionar una por defecto.
        if (pendingInitialRef.current) {
          getStoredMatch(pendingInitialRef.current)
            .then((m) => {
              if (m && data.some((c) => c.externalId === m.leagueExternalId)) {
                setSelectedLeague(m.leagueExternalId);
              } else {
                setSelectedLeague(data[0].externalId);
              }
            })
            .catch(() => setSelectedLeague(data[0].externalId));
        } else {
          setSelectedLeague(data[0].externalId);
        }
      })
      .catch(() => setCompetitions([]));
  }, []);

  useEffect(() => {
    if (!selectedLeague) return;
    setLoading(true);
    getStoredCompetitionMatches(selectedLeague)
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          const ra = roundNumber(a.round);
          const rb = roundNumber(b.round);
          if (ra !== rb) return ra - rb;
          const ta = a.utcTime ? Date.parse(a.utcTime) : 0;
          const tb = b.utcTime ? Date.parse(b.utcTime) : 0;
          return ta - tb;
        });
        setMatches(sorted);
        const pending = pendingInitialRef.current;
        if (pending && sorted.some((m) => m.externalId === pending)) {
          setSelectedMatch(pending);
          pendingInitialRef.current = null;
        } else {
          setSelectedMatch(sorted[0]?.externalId ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedLeague]);

  useEffect(() => {
    if (!selectedMatch) {
      setMatchDetail(null);
      setMatchJson(null);
      return;
    }
    // Limpia los datos del partido anterior inmediatamente para evitar
    // mostrar tabs con info residual mientras se carga el nuevo JSON.
    setMatchDetail(null);
    setMatchJson(null);
    setLoading(true);
    setError(null);
    let cancelled = false;
    Promise.all([
      getStoredMatch(selectedMatch).catch(() => null),
      getMatchData(selectedMatch, selectedLeague || undefined).catch(() => {
        if (!cancelled) setError("No se pudo cargar el JSON del partido.");
        return null;
      }),
    ])
      .then(([detail, json]) => {
        if (cancelled) return;
        setMatchDetail(detail);
        const raw = json as Dict | null;
        const unwrapped =
          raw && typeof raw.data === "object" && raw.data !== null
            ? (raw.data as Dict)
            : raw;
        setMatchJson(unwrapped || null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMatch, selectedLeague]);

  return (
    <div className="match-layout">
      <section className="glass-panel panel">
        <div className="panel-head">
          <h3>Partido</h3>
          <span className="subtle">
            {loading
              ? "Cargando..."
              : matchJson
                ? "Datos cargados"
                : "Selecciona partido"}
          </span>
        </div>

        <div className="two-inputs">
          <label className="field">
            Competición
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
            Partido
            <select
              value={selectedMatch ?? ""}
              onChange={(e) => setSelectedMatch(Number(e.target.value))}
            >
              {groupByRound(matches).map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.matches.map((m) => (
                    <option key={m.id} value={m.externalId}>
                      {(m.homeTeamName || "Home") +
                        " " +
                        (typeof m.homeScore === "number" &&
                        typeof m.awayScore === "number"
                          ? `${m.homeScore}-${m.awayScore}`
                          : "vs") +
                        " " +
                        (m.awayTeamName || "Away")}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="subtle error">{error}</p> : null}
      </section>

      {hasRichMatchJson ? (
        <>
          <MatchHeader json={richMatchJson} detail={matchDetail} />

          <div className="match-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={t === tab ? "tab tab-on" : "tab"}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <section className="glass-panel panel">
            {tab === "Resumen" ? <OverviewTab json={richMatchJson!} /> : null}
            {tab === "Estadísticas" ? <StatsTab json={richMatchJson!} /> : null}
            {tab === "Alineaciones" ? (
              <LineupsTab json={richMatchJson!} />
            ) : null}
            {tab === "Shotmap" ? <ShotmapTab json={richMatchJson!} /> : null}
            {tab === "Momentum" ? <MomentumTab json={richMatchJson!} /> : null}
            {tab === "Top Players" ? (
              <TopPlayersTab json={richMatchJson!} />
            ) : null}
            {tab === "H2H" ? <H2HTab json={richMatchJson!} /> : null}
            {tab === "JSON" ? (
              <RawJsonTab json={richMatchJson!} matchId={selectedMatch} />
            ) : null}
          </section>
        </>
      ) : matchDetail ? (
        <>
          <MatchHeader json={null} detail={matchDetail} />
          <section className="glass-panel panel">
            <p className="subtle">
              No hay perfil avanzado disponible para este partido en este
              momento.
            </p>
            <p className="subtle">
              Se muestra la informacion basica almacenada. Intenta de nuevo tras
              refrescar datos de la liga.
            </p>
          </section>
        </>
      ) : !loading ? (
        <section className="glass-panel panel">
          <p className="subtle">
            Selecciona un partido o introduce un matchId.
          </p>
        </section>
      ) : null}
    </div>
  );
}
