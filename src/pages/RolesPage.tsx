import { useState } from "react";
import { Plus, Pencil, Trash2, Shield, Check, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal } from "@/components/ui-custom/Modal";
import { ConfirmDialog } from "@/components/ui-custom/ConfirmDialog";
import { trpc } from "@/providers/trpc";

type RForm = {
  name: string;
  canEditRecords: boolean;
  canDeleteRecords: boolean;
  canCreateUsers: boolean;
  canManageRoles: boolean;
  canManageWeapons: boolean;
  canManageSales: boolean;
  canManageOrgs: boolean;
};

const initial: RForm = {
  name: "",
  canEditRecords: false,
  canDeleteRecords: false,
  canCreateUsers: false,
  canManageRoles: false,
  canManageWeapons: true,
  canManageSales: true,
  canManageOrgs: true,
};

const permissionLabels: { key: keyof Omit<RForm, "name">; label: string; desc: string }[] = [
  { key: "canEditRecords", label: "Editar Registros", desc: "Puede editar usuarios, armas, orgs y ventas" },
  { key: "canDeleteRecords", label: "Eliminar Registros", desc: "Puede eliminar cualquier registro" },
  { key: "canCreateUsers", label: "Crear Usuarios", desc: "Puede crear y gestionar usuarios" },
  { key: "canManageRoles", label: "Gestionar Roles", desc: "Puede crear y editar roles personalizados" },
  { key: "canManageWeapons", label: "Gestionar Armas", desc: "Acceso al inventario de armas" },
  { key: "canManageSales", label: "Gestionar Ventas", desc: "Acceso al registro de ventas" },
  { key: "canManageOrgs", label: "Gestionar Organizaciones", desc: "Acceso a organizaciones" },
];

export default function RolesPage() {
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<RForm>(initial);
  const [error, setError] = useState("");
  const [delId, setDelId] = useState<number | null>(null);

  const { data: roles, isLoading } = trpc.role.list.useQuery(undefined);
  const createM = trpc.role.create.useMutation({ onSuccess: () => { utils.role.list.invalidate(); setIsOpen(false); setForm(initial); }, onError: (e) => setError(e.message) });
  const updateM = trpc.role.update.useMutation({ onSuccess: () => { utils.role.list.invalidate(); setIsOpen(false); setEditing(null); setForm(initial); }, onError: (e) => setError(e.message) });
  const deleteM = trpc.role.delete.useMutation({ onSuccess: () => { utils.role.list.invalidate(); setDelId(null); } });

  const openCreate = () => { setEditing(null); setForm(initial); setError(""); setIsOpen(true); };
  const openEdit = (r: { id: number; name: string; canEditRecords: boolean; canDeleteRecords: boolean; canCreateUsers: boolean; canManageRoles: boolean; canManageWeapons: boolean; canManageSales: boolean; canManageOrgs: boolean }) => {
    setEditing(r.id); setForm({ name: r.name, canEditRecords: r.canEditRecords, canDeleteRecords: r.canDeleteRecords, canCreateUsers: r.canCreateUsers, canManageRoles: r.canManageRoles, canManageWeapons: r.canManageWeapons, canManageSales: r.canManageSales, canManageOrgs: r.canManageOrgs }); setError(""); setIsOpen(true);
  };

  const toggle = (key: keyof Omit<RForm, "name">) => setForm({ ...form, [key]: !form[key] });

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.name.trim()) { setError("El nombre del rol es requerido"); return; }
    if (editing) updateM.mutate({ id: editing, ...form, name: form.name.trim() });
    else createM.mutate({ ...form, name: form.name.trim() });
  };

  return (
    <AppLayout title="Roles y Permisos">
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Crea roles personalizados con permisos especificos</p>
        <button onClick={openCreate} className="glow-btn flex items-center gap-2 cursor-pointer"><Plus size={16} /> NUEVO ROL</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? <div className="col-span-full text-center py-12 loading-pulse" style={{ color: "var(--color-text-muted)" }}>CARGANDO...</div> :
         roles && roles.length > 0 ? roles.map(r => (
          <div key={r.id} className="glow-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield size={20} style={{ color: r.name === "admin" ? "#ff6666" : r.name === "hacker" ? "var(--color-gold-primary)" : "var(--color-text-muted)" }} />
                <h3 className="text-sm font-semibold uppercase" style={{ color: "var(--color-gold-primary)" }}>{r.name}</h3>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(r)} className="p-1 cursor-pointer" style={{ color: "var(--color-gold-dim)" }}><Pencil size={14} /></button>
                {r.id > 3 && <button onClick={() => setDelId(r.id)} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}><Trash2 size={14} /></button>}
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {permissionLabels.map(p => {
                const enabled = r[p.key];
                return (
                  <div key={p.key} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: enabled ? "var(--color-text-secondary)" : "var(--color-text-muted)" }}>{p.label}</span>
                    {enabled ? <Check size={12} style={{ color: "var(--color-success)" }} /> : <X size={12} style={{ color: "var(--color-text-muted)" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )) : <div className="col-span-full text-center py-12" style={{ color: "var(--color-text-muted)" }}>No hay roles</div>}
      </div>

      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setError(""); }} title={editing ? "Editar Rol" : "Nuevo Rol"} width={520}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error && <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(255, 51, 51, 0.08)", border: "1px solid rgba(255, 51, 51, 0.2)", borderRadius: 2 }}><span className="text-xs" style={{ color: "#ff6666" }}>{error}</span></div>}
          <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Nombre del Rol</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="terminal-input" placeholder="Ej: Supervisor, Capitan, etc." /></div>

          <div>
            <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: "var(--color-gold-dark)" }}>Permisos</label>
            <div className="flex flex-col gap-2">
              {permissionLabels.map(p => (
                <label key={p.key} className="flex items-center gap-3 p-2 cursor-pointer transition-colors" style={{ border: `1px solid ${form[p.key] ? "rgba(255, 215, 0, 0.3)" : "rgba(255, 215, 0, 0.08)"}`, borderRadius: 2, background: form[p.key] ? "rgba(255, 215, 0, 0.04)" : "transparent" }}>
                  <div className="flex items-center justify-center" style={{ width: 18, height: 18, border: `1px solid ${form[p.key] ? "var(--color-gold-primary)" : "var(--color-text-muted)"}`, borderRadius: 2, background: form[p.key] ? "var(--color-gold-primary)" : "transparent" }}>
                    {form[p.key] && <Check size={12} style={{ color: "#0a0a0a" }} />}
                  </div>
                  <input type="checkbox" checked={form[p.key]} onChange={() => toggle(p.key)} className="hidden" />
                  <div className="flex-1">
                    <div className="text-xs font-medium" style={{ color: form[p.key] ? "var(--color-gold-primary)" : "var(--color-text-secondary)" }}>{p.label}</div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => { setIsOpen(false); setError(""); }} className="flex-1 glow-btn-secondary py-2.5 cursor-pointer">Cancelar</button>
            <button type="submit" disabled={createM.isPending || updateM.isPending} className="flex-1 glow-btn py-2.5 cursor-pointer">{createM.isPending || updateM.isPending ? "Guardando..." : editing ? "Actualizar" : "Crear Rol"}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={delId !== null} onClose={() => setDelId(null)} onConfirm={() => { if (delId !== null) deleteM.mutate({ id: delId }); }} title="Confirmar" message="El rol sera eliminado. Los usuarios con este rol perderan acceso." confirmText="Eliminar" isLoading={deleteM.isPending} />
    </AppLayout>
  );
}
