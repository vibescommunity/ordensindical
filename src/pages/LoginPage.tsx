import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Shield, User, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GridBackground } from "@/components/effects/GridBackground";
import { FloatingParticles } from "@/components/effects/FloatingParticles";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [shake, setShake] = useState(false);
  const { loginAsync, isLoggingIn, loginError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (loginError) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }, [loginError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    try {
      await loginAsync({ username: username.trim(), password });
      navigate("/");
    } catch {
      // Error handled by loginError
    }
  };

  return (
    <div
      className="scanlines min-h-screen flex items-center justify-center relative"
      style={{ background: "var(--color-bg-primary)" }}
    >
      <GridBackground />
      <FloatingParticles count={12} />

      <div
        className={`relative z-10 w-full max-w-md px-6 ${shake ? "shake" : ""}`}
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield
              size={48}
              style={{
                color: "var(--color-gold-primary)",
                filter: "drop-shadow(0 0 15px rgba(255, 215, 0, 0.4))",
              }}
            />
          </div>
          <h1
            className="text-3xl font-bold tracking-widest uppercase flicker text-glow"
            style={{ color: "var(--color-gold-primary)" }}
          >
            Shadow Command
          </h1>
          <p
            className="text-xs uppercase tracking-widest mt-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Sistema de Acceso Restringido
          </p>
        </div>

        {/* Access Denied Banner */}
        <div
          className="flex items-center gap-3 px-4 py-3 mb-6 rounded"
          style={{
            background: "rgba(255, 51, 51, 0.08)",
            border: "1px solid rgba(255, 51, 51, 0.25)",
          }}
        >
          <AlertCircle size={16} style={{ color: "#ff6666" }} />
          <span className="text-xs uppercase tracking-wider" style={{ color: "#ff6666" }}>
            Registro Publico Deshabilitado
          </span>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          style={{
            background: "var(--color-bg-secondary)",
            border: "1px solid rgba(255, 215, 0, 0.1)",
            borderRadius: 4,
            padding: "28px",
          }}
        >
          {/* Username */}
          <div className="relative">
            <User
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="USUARIO"
              className="terminal-input w-full"
              style={{ paddingLeft: 40, height: 44 }}
              autoComplete="username"
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="CONTRASENA"
              className="terminal-input w-full"
              style={{ paddingLeft: 40, height: 44 }}
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}
          {loginError && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded"
              style={{
                background: "rgba(255, 51, 51, 0.08)",
                border: "1px solid rgba(255, 51, 51, 0.2)",
                animation: "pageEnter 0.2s ease-out",
              }}
            >
              <AlertCircle size={14} style={{ color: "#ff6666" }} />
              <span className="text-xs" style={{ color: "#ff6666" }}>
                {loginError}
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoggingIn || !username.trim() || !password.trim()}
            className="glow-btn w-full flex items-center justify-center gap-2 cursor-pointer"
            style={{
              height: 48,
              opacity: isLoggingIn || !username.trim() || !password.trim() ? 0.6 : 1,
            }}
          >
            {isLoggingIn ? (
              <span className="loading-pulse">ACCEDIENDO...</span>
            ) : (
              <>
                <Lock size={16} />
                INICIAR SESION
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p
            className="text-xs tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Shadow Command v1.0.0 | Acceso Restringido
          </p>
        </div>
      </div>
    </div>
  );
}
