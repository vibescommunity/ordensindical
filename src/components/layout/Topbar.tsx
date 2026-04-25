import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Wifi, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Topbar({ title }: { title: string }) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="flex items-center justify-between px-6"
      style={{
        height: 56,
        background: "var(--color-bg-secondary)",
        borderBottom: "1px solid rgba(255, 215, 0, 0.1)",
      }}
    >
      {/* Page Title */}
      <h1
        className="text-lg font-semibold tracking-wider uppercase flicker"
        style={{ color: "var(--color-gold-primary)" }}
      >
        {title}
      </h1>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <Wifi
            size={14}
            style={{ color: "var(--color-success)" }}
          />
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--color-success)" }}
          >
            Conectado
          </span>
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-2">
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              [
            </span>
            <span
              className="text-xs font-semibold uppercase"
              style={{ color: "var(--color-gold-primary)" }}
            >
              {user.username}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              ]
            </span>
          </div>
        )}

        {/* Clock */}
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: "var(--color-gold-dim)" }} />
          <span
            className="text-xs tabular-nums"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {format(time, "HH:mm:ss")}
          </span>
        </div>
      </div>
    </header>
  );
}
