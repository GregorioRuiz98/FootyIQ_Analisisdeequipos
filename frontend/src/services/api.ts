import axios from "axios";
import type { CustomTeam, DashboardSnapshot, MatchEvent } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
});

export function setAuthToken(token: string | null): void {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("footyiq_token", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("footyiq_token");
  }
}

const existingToken = localStorage.getItem("footyiq_token");
if (existingToken) {
  setAuthToken(existingToken);
}

export interface SystemHealth {
  backend: "ok" | "down";
  mongo: "ok" | "down";
  scraper: "ok" | "down";
}

export async function getSystemHealth(): Promise<SystemHealth> {
  try {
    const { data } = await api.get<SystemHealth>("/public/health", {
      timeout: 4000,
    });
    return {
      backend: data.backend === "ok" ? "ok" : "down",
      mongo: data.mongo === "ok" ? "ok" : "down",
      scraper: data.scraper === "ok" ? "ok" : "down",
    };
  } catch {
    return { backend: "down", mongo: "down", scraper: "down" };
  }
}

export interface ScraperBrowserStatus {
  running: boolean;
  launched?: boolean;
  pid?: number;
  reason?: string;
  error?: string;
  script?: string;
}

export async function getScraperBrowserStatus(): Promise<ScraperBrowserStatus> {
  try {
    const { data } = await api.get<ScraperBrowserStatus>(
      "/scraper/browser/status",
      {
        timeout: 4000,
      },
    );
    return data;
  } catch {
    return { running: false, error: "request_failed" };
  }
}

export async function launchScraperBrowser(): Promise<ScraperBrowserStatus> {
  try {
    const { data } = await api.post<ScraperBrowserStatus>(
      "/scraper/browser/launch",
      {},
      { timeout: 8000 },
    );
    return data;
  } catch {
    return { running: false, launched: false, error: "request_failed" };
  }
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<string> {
  const { data } = await api.post("/auth/register", {
    username,
    email,
    password,
  });
  setAuthToken(data.token);
  return data.token;
}

export async function login(
  username: string,
  password: string,
): Promise<string> {
  const { data } = await api.post("/auth/login", { username, password });
  setAuthToken(data.token);
  return data.token;
}

export async function getDashboard(): Promise<DashboardSnapshot> {
  const { data } = await api.get("/dashboard/summary");
  return data;
}

export async function refreshDashboard(): Promise<DashboardSnapshot> {
  const { data } = await api.post("/dashboard/refresh");
  return data;
}

export async function getTeams(): Promise<CustomTeam[]> {
  const { data } = await api.get("/teams");
  return data;
}

export async function createTeam(payload: {
  name: string;
  shared: boolean;
  logo?: File | null;
}): Promise<CustomTeam> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("shared", String(payload.shared));
  if (payload.logo) {
    formData.append("logo", payload.logo);
  }
  const { data } = await api.post("/teams", formData);
  return data;
}

export async function addPlayer(
  teamId: string,
  payload: {
    name: string;
    number: number;
    position: string;
    preferredFoot: string;
    birthDate?: string;
    notes?: string;
    photo?: File | null;
  },
): Promise<CustomTeam> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("number", String(payload.number));
  formData.append("position", payload.position);
  formData.append("preferredFoot", payload.preferredFoot);
  if (payload.birthDate) formData.append("birthDate", payload.birthDate);
  if (payload.notes) formData.append("notes", payload.notes);
  if (payload.photo) formData.append("photo", payload.photo);

  const { data } = await api.post(`/teams/${teamId}/players`, formData);
  return data;
}

export async function getEvents(matchId: string): Promise<MatchEvent[]> {
  const { data } = await api.get("/events", { params: { matchId } });
  return data;
}

export async function createEvent(event: MatchEvent): Promise<MatchEvent> {
  const { data } = await api.post("/events", event);
  return data;
}

export async function updateEvent(
  eventId: string,
  event: MatchEvent,
): Promise<MatchEvent> {
  const { data } = await api.put(`/events/${eventId}`, event);
  return data;
}

export async function deleteEvent(eventId: string): Promise<void> {
  await api.delete(`/events/${eventId}`);
}

export async function getMainLeaguesCatalog(): Promise<{
  leagues: Array<{
    id: number;
    key: string;
    name: string;
    country: string;
    sourceUrl: string;
  }>;
}> {
  const { data } = await api.get("/fotmob/catalog/leagues");
  return data;
}

export async function getLeagueData(
  leagueId: number,
): Promise<Record<string, unknown>> {
  const { data } = await api.get(`/fotmob/league/${leagueId}`);
  return data;
}

export async function getTeamData(
  teamId: number,
): Promise<Record<string, unknown>> {
  const { data } = await api.get(`/fotmob/team/${teamId}`);
  return data;
}

export async function getTeamPlayersData(
  teamId: number,
): Promise<Record<string, unknown>> {
  const { data } = await api.get(`/fotmob/team/${teamId}/players`);
  return data;
}

export async function getPlayerData(
  playerId: number,
  teamId?: number,
): Promise<Record<string, unknown>> {
  const { data } = await api.get(`/fotmob/player/${playerId}`, {
    params: teamId ? { teamId } : undefined,
  });
  return data;
}

export async function getMatchData(
  matchId: number,
  leagueId?: number,
): Promise<Record<string, unknown>> {
  const { data } = await api.get(`/fotmob/match/${matchId}`, {
    params: leagueId ? { leagueId } : undefined,
  });
  return data;
}

export async function getMatchesByDate(
  dateYyyymmdd: string,
): Promise<Record<string, unknown>> {
  const { data } = await api.get("/fotmob/matches", {
    params: { date: dateYyyymmdd },
  });
  return data;
}

export async function getLeagueMatchesData(
  leagueId: number,
): Promise<Record<string, unknown>> {
  const { data } = await api.get(`/fotmob/league/${leagueId}/matches`);
  return data;
}

export async function importLeagueToDatabase(
  leagueId: number,
): Promise<Record<string, unknown>> {
  const { data } = await api.post(`/data/import/league/${leagueId}`);
  return data;
}

export async function deleteStoredLeague(
  leagueId: number,
): Promise<Record<string, unknown>> {
  const { data } = await api.delete(`/data/competition/${leagueId}`);
  return data;
}

export async function getImportHistory(): Promise<
  Array<Record<string, unknown>>
> {
  const { data } = await api.get("/data/imports");
  return data;
}

export async function getStoredCompetitions(): Promise<
  Array<Record<string, unknown>>
> {
  const { data } = await api.get("/data/competitions");
  return data;
}

export type StoredCompetition = {
  id: string;
  externalId: number;
  key?: string;
  name: string;
  country?: string;
  sourceUrl?: string;
  createdAt?: string;
  lastImportedAt?: string;
};

export type StoredTeam = {
  id: string;
  externalId: number;
  name: string;
  shortName?: string;
  country?: string;
  competitionExternalIds: number[];
};

export type StoredPlayer = {
  id: string;
  externalId: number;
  name: string;
  teamExternalId: number;
  teamName?: string;
  section?: string;
  shirtNumber?: number;
  age?: number;
  nationality?: string;
  role?: string;
  lastImportedAt?: string;
};

export type StoredMatch = {
  id: string;
  externalId: number;
  leagueExternalId: number;
  leagueName?: string;
  round?: string;
  homeTeamExternalId?: number;
  homeTeamName?: string;
  awayTeamExternalId?: number;
  awayTeamName?: string;
  homeScore?: number;
  awayScore?: number;
  scoreStr?: string;
  utcTime?: string;
  status?: string;
  pageUrl?: string;
};

export type ManualPlayerSelection = {
  playerId?: string;
  name?: string;
  number: number;
  position?: string;
};

export type ManualMatch = {
  id: string;
  ownerUsername: string;
  name?: string;
  homeTeamId?: string;
  homeTeamName?: string;
  awayTeamId?: string;
  awayTeamName?: string;
  homeStartingXI: ManualPlayerSelection[];
  homeBench: ManualPlayerSelection[];
  awayStartingXI: ManualPlayerSelection[];
  awayBench: ManualPlayerSelection[];
  createdAt?: string;
  updatedAt?: string;
};

export type ManualMatchPayload = {
  name?: string;
  homeTeamId?: string;
  homeTeamName?: string;
  awayTeamId?: string;
  awayTeamName?: string;
  homeStartingXI: ManualPlayerSelection[];
  homeBench: ManualPlayerSelection[];
  awayStartingXI: ManualPlayerSelection[];
  awayBench: ManualPlayerSelection[];
};

export async function getStoredCompetitionsTyped(): Promise<
  StoredCompetition[]
> {
  const { data } = await api.get("/data/competitions");
  return data;
}

export async function getStoredCompetitionMatches(
  leagueId: number,
): Promise<StoredMatch[]> {
  const { data } = await api.get(`/data/competition/${leagueId}/matches`);
  return data;
}

export async function getStoredCompetitionTeams(
  leagueId: number,
): Promise<StoredTeam[]> {
  const { data } = await api.get(`/data/competition/${leagueId}/teams`);
  return data;
}

// ---------- Favoritos ----------
export type FavoriteType = "PLAYER" | "TEAM" | "MATCH";

export interface Favorite {
  id?: string;
  username?: string;
  type: FavoriteType;
  externalId: number;
  name?: string;
  metadata?: Record<string, string>;
  createdAt?: string;
}

export async function getFavorites(type?: FavoriteType): Promise<Favorite[]> {
  const { data } = await api.get("/favorites", {
    params: type ? { type } : undefined,
  });
  return data;
}

export async function addFavorite(payload: {
  type: FavoriteType;
  externalId: number;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<Favorite> {
  const { data } = await api.post("/favorites", payload);
  return data;
}

export async function removeFavorite(
  type: FavoriteType,
  externalId: number,
): Promise<void> {
  await api.delete(`/favorites/${type}/${externalId}`);
}

export async function getStoredTeamPlayers(
  teamId: number,
): Promise<StoredPlayer[]> {
  const { data } = await api.get(`/data/team/${teamId}/players`);
  return data;
}

export async function getStoredMatch(
  matchId: number,
): Promise<StoredMatch | null> {
  const { data } = await api.get(`/data/match/${matchId}`);
  return data;
}

export async function getStoredPlayer(
  playerId: number,
): Promise<StoredPlayer | null> {
  const { data } = await api.get(`/data/player/${playerId}`);
  return data;
}

export async function getManualMatches(): Promise<ManualMatch[]> {
  const { data } = await api.get("/manual-matches");
  return data;
}

export async function getManualMatch(id: string): Promise<ManualMatch> {
  const { data } = await api.get(`/manual-matches/${id}`);
  return data;
}

export async function createManualMatch(
  payload: ManualMatchPayload,
): Promise<ManualMatch> {
  const { data } = await api.post("/manual-matches", payload);
  return data;
}

export async function updateManualMatch(
  id: string,
  payload: ManualMatchPayload,
): Promise<ManualMatch> {
  const { data } = await api.put(`/manual-matches/${id}`, payload);
  return data;
}

export async function deleteManualMatch(id: string): Promise<void> {
  await api.delete(`/manual-matches/${id}`);
}
