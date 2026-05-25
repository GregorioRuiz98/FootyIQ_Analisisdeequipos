import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Database,
  Gauge,
  LayoutDashboard,
  LogOut,
  Shield,
  SlidersHorizontal,
  Star,
  UserCircle2,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/match", label: "Match", icon: Gauge },
  { to: "/equipos", label: "Equipos", icon: Users },
  { to: "/player", label: "Player", icon: UserCircle2 },
  { to: "/competition", label: "Competition", icon: Shield },
  { to: "/data-hub", label: "Data Hub", icon: Database },
  { to: "/favorites", label: "Favoritos", icon: Star },
];

type Density = "normal" | "compacta";

const PREF_AUTO_REFRESH = "footyiq_pref_autorefresh";
const PREF_DENSITY = "footyiq_pref_density";

function readDensity(): Density {
  const value = localStorage.getItem(PREF_DENSITY);
  return value === "compacta" ? "compacta" : "normal";
}

function readBool(key: string, fallback: boolean): boolean {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  return value === "on";
}

export function TopBar(): JSX.Element {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const [autoRefresh, setAutoRefresh] = useState(() =>
    readBool(PREF_AUTO_REFRESH, true),
  );
  const [density, setDensity] = useState<Density>(() => readDensity());

  useEffect(() => {
    localStorage.setItem(PREF_AUTO_REFRESH, autoRefresh ? "on" : "off");
    window.dispatchEvent(new CustomEvent("footyiq:prefs"));
  }, [autoRefresh]);

  useEffect(() => {
    localStorage.setItem(PREF_DENSITY, density);
    document.body.classList.toggle("density-compact", density === "compacta");
    window.dispatchEvent(new CustomEvent("footyiq:prefs"));
  }, [density]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Node;
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setSettingsOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("footyiq_token");
    window.location.reload();
  }

  return (
    <header className="topbar glass-panel">
      <div className="topbar-row">
        <div className="topbar-brand">FOOTY IQ</div>
        <p className="topbar-tagline">
          Inteligencia táctica para entender el fútbol
        </p>
        <div className="topbar-right">
          <div className="popover-anchor" ref={settingsRef}>
            <button
              type="button"
              className={`icon-btn ${settingsOpen ? "active" : ""}`}
              title="Ajustes"
              aria-label="Ajustes"
              aria-expanded={settingsOpen}
              onClick={() => {
                setSettingsOpen((v) => !v);
                setAccountOpen(false);
              }}
            >
              <SlidersHorizontal size={18} />
            </button>
            {settingsOpen ? (
              <div className="popover glass-panel" role="menu">
                <p className="popover-title">Ajustes</p>

                <label className="popover-row">
                  <span>Auto-actualizar estado</span>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                </label>

                <div className="popover-row popover-row-stack">
                  <span>Densidad</span>
                  <div className="popover-segmented">
                    <button
                      type="button"
                      className={density === "normal" ? "active" : ""}
                      onClick={() => setDensity("normal")}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      className={density === "compacta" ? "active" : ""}
                      onClick={() => setDensity("compacta")}
                    >
                      Compacta
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="popover-anchor" ref={accountRef}>
            <button
              type="button"
              className={`account-chip ${accountOpen ? "active" : ""}`}
              title="Cuenta"
              aria-label="Cuenta"
              aria-expanded={accountOpen}
              onClick={() => {
                setAccountOpen((v) => !v);
                setSettingsOpen(false);
              }}
            >
              <span className="avatar avatar-sm">AT</span>
              <span className="account-chip-label">Analista TFG</span>
            </button>
            {accountOpen ? (
              <div className="popover glass-panel" role="menu">
                <div className="popover-account">
                  <span className="avatar">AT</span>
                  <div>
                    <p className="user-name">Analista TFG</p>
                    <p className="user-role">Sesión activa</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="popover-action danger"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <nav className="topbar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `topbar-nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}
