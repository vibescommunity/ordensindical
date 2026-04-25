import { useState } from "react";
import { Users, Building2, Crosshair, Activity, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal } from "@/components/ui-custom/Modal";
import { ConfirmDialog } from "@/components/ui-custom/ConfirmDialog";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const typeColors: Record<string, string> = {
  login: "#00ff88", create: "#00ccff", update: "#FFD700", delete: "#ff3333", auth: "#00ccff", system: "#888",
};

export default function DashboardPage() {
  const { canEdit, canDelete } = useAuth();
  const utils = trpc.useUtils();

  const [editLogId, setEditLogId] = useState<number | null>(null);
  const [editAction, setEditAction] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [delLogId, setDelLogId] = useState<number | null>(null);

  const { data: userList } = trpc.user.list.useQuery(undefined);
  const { data: orgList } = trpc.organization.list.useQuery(undefined);
  const { data: weaponList } = trpc.weapon.list.useQuery(undefined);
  const { data: saleStats } = trpc.sale.stats.useQuery(undefined, { refetchInterval: 5000 });
  const { data: recentLogs } = trpc.log.recent.useQuery({ limit: 15 }, { refetchInterval: 5000 });

  const updateLogM = trpc.log.update.useMutation({
    onSuccess: () => { utils.log.recent.invalidate(); setEditLogId(null); },
  });
  const deleteLogM = trpc.log.delete.useMutation({
    onSuccess: () => { utils.log.recent.invalidate(); setDelLogId(null); },
  });

  const openEditLog = (log: { id: number; action: string; details: string | null }) => {
    setEditLogId(log.id);
    setEditAction(log.action);
    setEditDetails(log.details || "");
  };

  const metrics = [
    { title: "USUARIOS REGISTRADOS", value: userList?.length ?? 0, icon: Users },
    { title: "ORGANIZACIONES", value: orgList?.length ?? 0, icon: Building2 },
    { title: "VENTAS ESTE MES", value: saleStats ? `$${parseFloat(saleStats.thisMonth).toLocaleString("es-ES")}` : "$0", icon: Activity },
    { title: "ARMAS REGISTRADAS", value: weaponList?.length ?? 0, icon: Crosshair },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <div key={m.title} className="glow-card p-5 flex items-start gap-4">
            <div className="flex items-center justify-center rounded-full" style={{ width: 48, height: 48, background: "rgba(255, 215, 0, 0.08)", minWidth: 48 }}>
              <m.icon size={24} style={{ color: "var(--color-gold-primary)" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--color-gold-primary)" }}>{m.value}</p>
              <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--color-text-muted)" }}>{m.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glow-card">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255, 215, 0, 0.1)" }}>
          <div className="flex items-center gap-3">
            <Activity size={18} style={{ color: "var(--color-gold-primary)" }} />
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--color-gold-primary)" }}>Registro de Actividad</h2>
          </div>
          <button onClick={() => { utils.log.recent.invalidate(); utils.sale.stats.invalidate(); }}
            className="p-2 cursor-pointer" style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}><RefreshCw size={14} /></button>
        </div>

        <div className="overflow-x-auto">
          <table className="terminal-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Usuario</th>
                <th>Accion</th>
                <th>Detalle</th>
                {(canEdit || canDelete) && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {recentLogs && recentLogs.length > 0 ? recentLogs.map((log) => (
                <tr key={log.id}>
                  <td className="tabular-nums" style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{format(new Date(log.createdAt), "HH:mm:ss")}</td>
                  <td><span className="text-xs font-semibold px-2 py-1 rounded" style={{ color: typeColors[log.type], background: `${typeColors[log.type]}15` }}>{log.type.toUpperCase()}</span></td>
                  <td style={{ color: log.username ? "var(--color-gold-primary)" : "var(--color-text-muted)" }}>{log.username || "SISTEMA"}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{log.action}</td>
                  <td style={{ color: "var(--color-text-muted)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.details || "-"}</td>
                  {(canEdit || canDelete) && (
                    <td>
                      <div className="flex items-center gap-2">
                        {canEdit && <button onClick={() => openEditLog(log)} className="p-1 cursor-pointer" style={{ color: "var(--color-gold-dim)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold-primary)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-gold-dim)")}><Pencil size={13} /></button>}
                        {canDelete && <button onClick={() => setDelLogId(log.id)} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6666")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}><Trash2 size={13} /></button>}
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan={canEdit || canDelete ? 6 : 5} className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>No hay registros de actividad</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-6 px-4 py-3" style={{ borderTop: "1px solid rgba(255, 215, 0, 0.05)" }}>
        <div className="flex items-center gap-2">
          <div className="rounded-full" style={{ width: 8, height: 8, background: "var(--color-success)", boxShadow: "0 0 6px rgba(0, 255, 136, 0.4)" }} />
          <span className="text-xs uppercase tracking-wider" style={{ color: "var(--color-success)" }}>Conectado</span>
        </div>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>| Servidor: Activo | DB: Sincronizada | Version: 2.1</span>
      </div>

      {/* Edit Log Modal */}
      <Modal isOpen={editLogId !== null} onClose={() => setEditLogId(null)} title="Editar Registro">
        <div className="flex flex-col gap-4">
          <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Accion</label><input type="text" value={editAction} onChange={(e) => setEditAction(e.target.value)} className="terminal-input" /></div>
          <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Detalle</label><textarea value={editDetails} onChange={(e) => setEditDetails(e.target.value)} className="terminal-input" rows={3} /></div>
          <div className="flex gap-3">
            <button onClick={() => setEditLogId(null)} className="flex-1 glow-btn-secondary py-2.5 cursor-pointer">Cancelar</button>
            <button onClick={() => { if (editLogId !== null) updateLogM.mutate({ id: editLogId, action: editAction, details: editDetails }); }} disabled={updateLogM.isPending} className="flex-1 glow-btn py-2.5 cursor-pointer">{updateLogM.isPending ? "Guardando..." : "Guardar"}</button>
          </div>
        </div>
      </Modal>

      {/* Delete Log Confirm */}
      <ConfirmDialog isOpen={delLogId !== null} onClose={() => setDelLogId(null)} onConfirm={() => { if (delLogId !== null) deleteLogM.mutate({ id: delLogId }); }} title="Eliminar Registro" message="El registro de actividad sera eliminado permanentemente." confirmText="Eliminar" isLoading={deleteLogM.isPending} />
    </AppLayout>
  );
}
