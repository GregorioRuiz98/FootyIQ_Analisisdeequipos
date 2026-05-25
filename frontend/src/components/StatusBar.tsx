import { useEffect, useState } from "react";
import { getSystemHealth, type SystemHealth } from "../services/api";

const POLL_MS = 15000;
const PREF_AUTO_REFRESH = "footyiq_pref_autorefresh";

function readAutoRefresh(): boolean {
  return localStorage.getItem(PREF_AUTO_REFRESH) !== "off";
}

export function StatusBar(): JSX.Element {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [checking, setChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(readAutoRefresh);

  useEffect(() => {
    function onPrefs() {
      setAutoRefresh(readAutoRefresh());
    }
    window.addEventListener("footyiq:prefs", onPrefs);
    window.addEventListener("storage", onPrefs);
    return () => {
      window.removeEventListener("footyiq:prefs", onPrefs);
      window.removeEventListener("storage", onPrefs);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    async function check() {
      setChecking(true);
      const result = await getSystemHealth();
      if (alive) {
        setHealth(result);
        setChecking(false);
      }
    }
    check();
    if (!autoRefresh) {
      return () => {
        alive = false;
      };
    }
    const id = window.setInterval(check, POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [autoRefresh]);

  const loading = checking && !health;

  return (
    <footer
      className="status-bar"
      title={
        health
          ? `Backend: ${health.backend} | Mongo: ${health.mongo} | Scraper: ${health.scraper}`
          : "Comprobando estado..."
      }
    >
      <HealthDot label="API" status={health?.backend} loading={loading} />
      <HealthDot label="BD" status={health?.mongo} loading={loading} />
      <HealthDot label="Scraper" status={health?.scraper} loading={loading} />
    </footer>
  );
}

function HealthDot({
  label,
  status,
  loading,
}: {
  label: string;
  status: "ok" | "down" | undefined;
  loading: boolean;
}): JSX.Element {
  const tone = loading || status === undefined ? "loading" : status;
  return (
    <span className={`health-pill health-${tone}`}>
      <span className="health-bullet" />
      {label}
    </span>
  );
}
