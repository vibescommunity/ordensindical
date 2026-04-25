import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import SalesPage from "./pages/SalesPage";
import WeaponsPage from "./pages/WeaponsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg-primary)" }}>
        <div className="text-center">
          <div className="text-lg font-bold uppercase tracking-widest loading-pulse mb-2" style={{ color: "var(--color-gold-primary)" }}>ACCEDIENDO...</div>
          <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Verificando credenciales</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { canCreateUsers, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg-primary)" }}><div className="text-lg font-bold uppercase tracking-widest loading-pulse" style={{ color: "var(--color-gold-primary)" }}>VERIFICANDO...</div></div>;
  if (!canCreateUsers) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><AdminRoute><UsersPage /></AdminRoute></ProtectedRoute>} />
      <Route path="/roles" element={<ProtectedRoute><AdminRoute><RolesPage /></AdminRoute></ProtectedRoute>} />
      <Route path="/organizations" element={<ProtectedRoute><OrganizationsPage /></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
      <Route path="/weapons" element={<ProtectedRoute><WeaponsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
