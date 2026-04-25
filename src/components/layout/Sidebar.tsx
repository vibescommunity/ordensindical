import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  Crosshair,
  LogOut,
  Terminal,
  Shield,
  UserCog,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/users", label: "Usuarios", icon: Users },
  { path: "/roles", label: "Roles", icon: UserCog },
  { path: "/organizations", label: "Organizaciones", icon: Building2 },
  { path: "/sales", label: "Ventas", icon: DollarSign },
  { path: "/weapons", label: "Armas", icon: Crosshair },
];

export function Sidebar({ onToggleTerminal }: { onToggleTerminal: () => void }) {
  const location = useLocation();
  const { user, logout, canCreateUsers } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col" style={{ width: 260, background: "var(--color-bg-sidebar)", borderRight: "1px solid rgba(255, 215, 0, 0.1)", zIndex: 50 }}>
      <div className="flex items-center gap-3 px-5" style={{ paddingTop: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255, 215, 0, 0.1)" }}>
        <Shield size={24} style={{ color: "var(--color-gold-primary)" }} />
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-wider" style={{ color: "var(--color-gold-primary)" }}>SHADOW</span>
          <span className="text-sm font-bold tracking-wider" style={{ color: "var(--color-gold-dim)" }}>COMMAND</span>
        </div>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          if ((item.path === "/users" || item.path === "/roles") && !canCreateUsers) return null;
          const active = isActive(item.path);
          return (
            <Link key={item.path} to={item.path}
              className="flex items-center gap-3 px-5 py-3 text-sm transition-all duration-200"
              style={{ color: active ? "var(--color-gold-primary)" : "var(--color-text-secondary)", background: active ? "rgba(255, 215, 0, 0.08)" : "transparent", borderLeft: active ? "2px solid var(--color-gold-primary)" : "2px solid transparent", textShadow: active ? "0 0 10px rgba(255, 215, 0, 0.3)" : "none" }}>
              <item.icon size={18} />
              <span className="uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(255, 215, 0, 0.1)" }}>
        {user && (
          <div className="flex justify-center">
            <span className="text-center" style={{ padding: "6px 12px", borderRadius: 2, fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", background: user.roleName === "admin" ? "rgba(255, 51, 51, 0.15)" : user.roleName === "hacker" ? "rgba(255, 215, 0, 0.12)" : "rgba(128, 128, 128, 0.12)", color: user.roleName === "admin" ? "#ff6666" : user.roleName === "hacker" ? "var(--color-gold-primary)" : "#888" }}>
              {user.roleName.toUpperCase()}
            </span>
          </div>
        )}
        <button onClick={onToggleTerminal} className="flex items-center justify-center gap-2 py-2 text-xs uppercase tracking-wider cursor-pointer transition-all" style={{ color: "var(--color-text-secondary)", border: "1px solid rgba(255, 215, 0, 0.15)", borderRadius: 2, background: "transparent" }}><Terminal size={14} /> Consola</button>
        <button onClick={logout} className="flex items-center justify-center gap-2 py-2 text-xs uppercase tracking-wider cursor-pointer transition-all" style={{ color: "var(--color-text-secondary)", border: "1px solid rgba(255, 215, 0, 0.15)", borderRadius: 2, background: "transparent" }}><LogOut size={14} /> Cerrar Sesion</button>
      </div>
    </aside>
  );
}
