import { useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { TopBar } from "./components/TopBar";
import { StatusBar } from "./components/StatusBar";
import { DashboardPage } from "./pages/DashboardPage";
import { DataHubPage } from "./pages/DataHubPage";
import { LoginPage } from "./pages/LoginPage";
import { CompetitionPage } from "./pages/CompetitionPage";
import { MatchPage } from "./pages/MatchPage";
import { PlayerPage } from "./pages/PlayerPage";
import { TeamsPage } from "./pages/TeamsPage";
import { TeamsHubPage } from "./pages/TeamsHubPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { FavoritesProvider } from "./context/FavoritesContext";
import { launchScraperBrowser } from "./services/api";

export default function App(): JSX.Element {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("footyiq_token"),
  );
  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  if (!isAuthenticated) {
    return (
      <LoginPage
        onAuthenticated={() => {
          const newToken = localStorage.getItem("footyiq_token");
          setToken(newToken);
          // Lanza Chrome con CDP para que el scraper pueda saltar Turnstile.
          // No bloqueante: si falla, la UI sigue funcionando.
          launchScraperBrowser().catch(() => undefined);
        }}
      />
    );
  }

  return (
    <FavoritesProvider>
      <div className="app-shell">
        <main className="main-area">
          <TopBar />
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/data-hub" element={<DataHubPage />} />
            <Route path="/team" element={<Navigate to="/equipos" replace />} />
            <Route path="/equipos" element={<TeamsHubPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/match" element={<MatchPage />} />
            <Route path="/player" element={<PlayerPage />} />
            <Route path="/competition" element={<CompetitionPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <StatusBar />
      </div>
    </FavoritesProvider>
  );
}
