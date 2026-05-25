export type DashboardSnapshot = {
  id?: string;
  matchesToday: number;
  activeAlerts: number;
  analysisInProgress: number;
  opportunities: number;
  modelPrecision: number;
  recentMatches: Array<Record<string, string>>;
  upcomingMatches: Array<Record<string, string>>;
};

export type MatchEvent = {
  id?: string;
  matchId: string;
  teamId?: string;
  eventType: string;
  minute: number;
  second: number;
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  playerName: string;
  outcome?: string;
  notes?: string;
};

export type CustomTeam = {
  id: string;
  ownerUsername: string;
  name: string;
  logoPath?: string;
  shared: boolean;
  players: Array<{
    id: string;
    name: string;
    number: number;
    position: string;
    preferredFoot: string;
    birthDate?: string;
    photoPath?: string;
    notes?: string;
  }>;
};
