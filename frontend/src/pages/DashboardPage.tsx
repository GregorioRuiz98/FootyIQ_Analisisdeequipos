import { useEffect, useState } from "react";
import { AnalysisContinuity } from "../components/AnalysisContinuity";
import { MatchPanels } from "../components/MatchPanels";
import { QuickAccess } from "../components/QuickAccess";
import { StatCards } from "../components/StatCards";
import { getDashboard, refreshDashboard } from "../services/api";
import type { DashboardSnapshot } from "../types";

const fallback: DashboardSnapshot = {
  matchesToday: 24,
  activeAlerts: 8,
  analysisInProgress: 5,
  opportunities: 12,
  modelPrecision: 76,
  recentMatches: [],
  upcomingMatches: [],
};

export function DashboardPage(): JSX.Element {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(fallback);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDashboard()
      .then(setSnapshot)
      .catch(() => setSnapshot(fallback));
  }, []);

  const handleRefresh = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await refreshDashboard();
      setSnapshot(data);
    } catch {
      // Keep existing data if scraper is unavailable.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="actions-row">
        <button type="button" className="icon-btn big" onClick={handleRefresh}>
          {loading ? "Actualizando..." : "Refrescar datos FotMob"}
        </button>
      </div>
      <StatCards snapshot={snapshot} />
      <MatchPanels snapshot={snapshot} />
      <QuickAccess />
      <AnalysisContinuity />
    </div>
  );
}
