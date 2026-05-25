import type { MatchEvent } from "../types";

export type TeamStats = {
  total: number;
  shots: number;
  goals: number;
  passes: number;
  dribbles: number;
  duels: number;
  recoveries: number;
  losses: number;
  fouls: number;
  cards: number;
  saves: number;
  shotAccuracy: number;
};

export type MatchStats = {
  total: number;
  home: TeamStats;
  away: TeamStats;
  unassigned: TeamStats;
  possessionHome: number;
  possessionAway: number;
};

function emptyTeam(): TeamStats {
  return {
    total: 0,
    shots: 0,
    goals: 0,
    passes: 0,
    dribbles: 0,
    duels: 0,
    recoveries: 0,
    losses: 0,
    fouls: 0,
    cards: 0,
    saves: 0,
    shotAccuracy: 0,
  };
}

function acc(stats: TeamStats, ev: MatchEvent): void {
  stats.total += 1;
  switch (ev.eventType) {
    case "GOL":
      stats.goals += 1;
      stats.shots += 1;
      break;
    case "TIRO":
      stats.shots += 1;
      break;
    case "PASE":
      stats.passes += 1;
      break;
    case "REGATE":
      stats.dribbles += 1;
      break;
    case "DUELO":
      stats.duels += 1;
      break;
    case "RECUPERACION":
      stats.recoveries += 1;
      break;
    case "PERDIDA":
      stats.losses += 1;
      break;
    case "FALTA":
      stats.fouls += 1;
      break;
    case "TARJETA":
      stats.cards += 1;
      break;
    case "PARADA":
      stats.saves += 1;
      break;
    default:
      break;
  }
}

// Eventos que indican "tener el balon"
const POSSESSION_TYPES = new Set([
  "PASE",
  "TIRO",
  "GOL",
  "REGATE",
  "RECUPERACION",
]);

export function computeMatchStats(
  events: MatchEvent[],
  homeTeamId?: string,
  awayTeamId?: string,
): MatchStats {
  const home = emptyTeam();
  const away = emptyTeam();
  const unassigned = emptyTeam();

  let possHome = 0;
  let possAway = 0;

  for (const ev of events) {
    if (ev.teamId && ev.teamId === homeTeamId) acc(home, ev);
    else if (ev.teamId && ev.teamId === awayTeamId) acc(away, ev);
    else acc(unassigned, ev);

    if (POSSESSION_TYPES.has(ev.eventType)) {
      if (ev.teamId && ev.teamId === homeTeamId) possHome += 1;
      else if (ev.teamId && ev.teamId === awayTeamId) possAway += 1;
    }
  }

  home.shotAccuracy = home.shots > 0 ? (home.goals / home.shots) * 100 : 0;
  away.shotAccuracy = away.shots > 0 ? (away.goals / away.shots) * 100 : 0;
  unassigned.shotAccuracy =
    unassigned.shots > 0 ? (unassigned.goals / unassigned.shots) * 100 : 0;

  const totalPoss = possHome + possAway;
  return {
    total: events.length,
    home,
    away,
    unassigned,
    possessionHome: totalPoss > 0 ? (possHome / totalPoss) * 100 : 50,
    possessionAway: totalPoss > 0 ? (possAway / totalPoss) * 100 : 50,
  };
}
