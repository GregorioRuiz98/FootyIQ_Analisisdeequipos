import {
  Gauge,
  Database,
  LayoutDashboard,
  Shield,
  Star,
  UserCircle2,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/match", label: "Match", icon: Gauge },
  { to: "/equipos", label: "Equipos", icon: Users },
  { to: "/player", label: "Player", icon: UserCircle2 },
  { to: "/competition", label: "Competition", icon: Shield },
  { to: "/data-hub", label: "Data Hub", icon: Database },
  { to: "/favorites", label: "Favoritos", icon: Star },
];

export function Sidebar(): JSX.Element {
  return (
    <aside className="sidebar glass-panel">
      <div className="brand">FOOTY IQ</div>
      <nav className="menu">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-user glass-soft">
        <div className="avatar">AT</div>
        <div>
          <p className="user-name">Analista TFG</p>
          <p className="user-role">Session activa</p>
        </div>
      </div>
    </aside>
  );
}
