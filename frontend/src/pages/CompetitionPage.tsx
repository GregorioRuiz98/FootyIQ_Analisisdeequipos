import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getStoredCompetitionMatches,
  getStoredCompetitionTeams,
  getStoredCompetitionsTyped,
  type StoredCompetition,
  type StoredMatch,
  type StoredTeam,
} from "../services/api";
import { fallbackImageToInitials } from "../utils/imageFallback";

const TEAM_LOGO = (id: number | string) =>
  `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png`;

type Row = {
  teamId: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  form: ("W" | "D" | "L")[];
};

function parseScore(s: string | null | undefined): [number, number] | null {
  if (!s) return null;
  const m = s.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2])];
}

function isFinished(m: StoredMatch): boolean {
  const st = (m.status || "").toLowerCase();
  return st === "ft" || st === "aet" || st === "pen" || st.includes("finished");
}

function buildStandings(matches: StoredMatch[], teams: StoredTeam[]): Row[] {
  const byId = new Map<number, Row>();
  // Inicializar con todos los equipos conocidos para que aparezcan aunque
  // todavia no hayan jugado.
  teams.forEach((t) => {
    byId.set(t.externalId, {
      teamId: t.externalId,
      name: t.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
      form: [],
    });
  });

  // Ordenar partidos por fecha para construir la "forma" cronologicamente.
  const finished = matches
    .filter(isFinished)
    .slice()
    .sort((a, b) => {
      const ta = a.utcTime ? Date.parse(a.utcTime) : 0;
      const tb = b.utcTime ? Date.parse(b.utcTime) : 0;
      return ta - tb;
    });

  for (const m of finished) {
    let hs = m.homeScore;
    let as_ = m.awayScore;
    if (hs == null || as_ == null) {
      const parsed = parseScore(m.scoreStr);
      if (parsed) {
        hs = parsed[0];
        as_ = parsed[1];
      }
    }
    if (hs == null || as_ == null) continue;
    if (m.homeTeamExternalId == null || m.awayTeamExternalId == null) continue;

    const ensure = (id: number, name?: string): Row => {
      let r = byId.get(id);
      if (!r) {
        r = {
          teamId: id,
          name: name || `#${id}`,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          gd: 0,
          pts: 0,
          form: [],
        };
        byId.set(id, r);
      }
      return r;
    };

    const home = ensure(m.homeTeamExternalId, m.homeTeamName);
    const away = ensure(m.awayTeamExternalId, m.awayTeamName);

    home.played += 1;
    away.played += 1;
    home.gf += hs;
    home.ga += as_;
    away.gf += as_;
    away.ga += hs;

    if (hs > as_) {
      home.won += 1;
      home.pts += 3;
      away.lost += 1;
      home.form.push("W");
      away.form.push("L");
    } else if (hs < as_) {
      away.won += 1;
      away.pts += 3;
      home.lost += 1;
      home.form.push("L");
      away.form.push("W");
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.pts += 1;
      away.pts += 1;
      home.form.push("D");
      away.form.push("D");
    }
  }

  const rows = Array.from(byId.values());
  rows.forEach((r) => {
    r.gd = r.gf - r.ga;
  });
  rows.sort(
    (a, b) =>
      b.pts - a.pts ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.name.localeCompare(b.name),
  );
  return rows;
}

export function CompetitionPage(): JSX.Element {
  const [competitions, setCompetitions] = useState<StoredCompetition[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [matches, setMatches] = useState<StoredMatch[]>([]);
  const [teams, setTeams] = useState<StoredTeam[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStoredCompetitionsTyped()
      .then((data) => {
        setCompetitions(data);
        if (data.length > 0) setSelectedLeague(data[0].externalId);
      })
      .catch(() => setCompetitions([]));
  }, []);

  useEffect(() => {
    if (!selectedLeague) return;
    setLoading(true);
    Promise.all([
      getStoredCompetitionMatches(selectedLeague),
      getStoredCompetitionTeams(selectedLeague),
    ])
      .then(([m, t]) => {
        setMatches(m);
        setTeams(t);
      })
      .finally(() => setLoading(false));
  }, [selectedLeague]);

  const selectedCompetitionName = useMemo(() => {
    const found = competitions.find((c) => c.externalId === selectedLeague);
    return found?.name || "Competition";
  }, [competitions, selectedLeague]);

  const standings = useMemo(
    () => buildStandings(matches, teams),
    [matches, teams],
  );
  const finishedCount = useMemo(
    () => matches.filter(isFinished).length,
    [matches],
  );

  const teamHref = (teamId: number) =>
    `/equipos?team=${teamId}${selectedLeague ? `&league=${selectedLeague}` : ""}`;

  return (
    <div className="competition-layout">
      <section className="glass-panel panel">
        <div className="panel-head">
          <h3>CLASIFICACIÓN</h3>
          <span className="subtle">
            {loading
              ? "Cargando..."
              : `${selectedCompetitionName} · ${finishedCount} partidos jugados`}
          </span>
        </div>

        <label className="field">
          Competición
          <select
            value={selectedLeague ?? ""}
            onChange={(e) => setSelectedLeague(Number(e.target.value))}
          >
            {competitions.map((c) => (
              <option key={c.id} value={c.externalId}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {standings.length === 0 ? (
          <p className="subtle" style={{ marginTop: "0.8rem" }}>
            Sin datos de clasificación todavía.
          </p>
        ) : (
          <div className="standings-wrap">
            <table className="standings">
              <thead>
                <tr>
                  <th className="pos">#</th>
                  <th className="team">Equipo</th>
                  <th>PJ</th>
                  <th>G</th>
                  <th>E</th>
                  <th>P</th>
                  <th>GF</th>
                  <th>GC</th>
                  <th>DG</th>
                  <th className="pts">Pts</th>
                  <th className="form">Últimos 5</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => {
                  const pos = i + 1;
                  const zone =
                    pos <= 4
                      ? "ucl"
                      : pos === 5
                        ? "uel"
                        : pos === 6
                          ? "uecl"
                          : pos >= standings.length - 2
                            ? "rel"
                            : "";
                  const last5 = row.form.slice(-5);
                  return (
                    <tr key={row.teamId} className={zone}>
                      <td className="pos">
                        <span className={`pos-badge ${zone}`}>{pos}</span>
                      </td>
                      <td className="team">
                        <img
                          src={TEAM_LOGO(row.teamId)}
                          alt=""
                          className="team-logo"
                          onError={(e) => fallbackImageToInitials(e, row.name)}
                        />
                        <Link to={teamHref(row.teamId)} className="player-link">
                          {row.name}
                        </Link>
                      </td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.drawn}</td>
                      <td>{row.lost}</td>
                      <td>{row.gf}</td>
                      <td>{row.ga}</td>
                      <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                      <td className="pts">
                        <strong>{row.pts}</strong>
                      </td>
                      <td className="form">
                        {last5.length === 0
                          ? "-"
                          : last5.map((f, idx) => (
                              <span
                                key={idx}
                                className={`form-pill form-${f.toLowerCase()}`}
                                title={
                                  f === "W"
                                    ? "Victoria"
                                    : f === "D"
                                      ? "Empate"
                                      : "Derrota"
                                }
                              >
                                {f}
                              </span>
                            ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
