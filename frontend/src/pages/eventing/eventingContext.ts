import { createContext, useContext } from "react";
import type { CustomTeam, MatchEvent } from "../../types";
import type { ManualMatch } from "../../services/api";

export type EventingMatchContextValue = {
  match: ManualMatch;
  events: MatchEvent[];
  teams: CustomTeam[];
  homeTeam: CustomTeam | null;
  awayTeam: CustomTeam | null;
  refreshMatch: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  appendEvent: (event: MatchEvent) => void;
  updateEventInState: (event: MatchEvent) => void;
  removeEvent: (eventId: string) => void;
};

export const EventingMatchContext =
  createContext<EventingMatchContextValue | null>(null);

export function useEventingMatch(): EventingMatchContextValue {
  const ctx = useContext(EventingMatchContext);
  if (!ctx) {
    throw new Error(
      "useEventingMatch debe usarse dentro de EventingMatchLayout",
    );
  }
  return ctx;
}

export const EVENT_TYPES = [
  "PASE",
  "TIRO",
  "REGATE",
  "DUELO",
  "RECUPERACION",
  "PERDIDA",
  "FALTA",
  "TARJETA",
  "GOL",
  "PARADA",
];
