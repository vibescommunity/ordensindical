import { useState } from "react";
import { UserPlus, Pencil, Trash2, Search, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal } from "@/components/ui-custom/Modal";
import { ConfirmDialog } from "@/components/ui-custom/ConfirmDialog";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

type UForm = { username: string; password: string; roleId: number; roleName: string; status: "active" | "inactive" };
const initial: UForm = { username: "", password: "", roleId: 0, roleName: "", status: "active" };

export default function UsersPage() {
  const { user: me } = useAuth();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<UForm>(initial);
  const [error, setError] = useState("");
  const [delId, setDelId] = useState<number | null>(null);

  const { data: userList, isLoading } = trpc.user.list.useQuery({ search: search || undefined });
  const { data: roleList } = trpc.role.list.useQuery(undefined);

  const createM = trpc.user.create.useMutation({ onSuccess: () => { utils.user.list.invalidate(); setIsOpen(false); setForm(initial); }, onError: (e) => setError(e.message) });
  const updateM = trpc.user.update.useMutation({ onSuccess: () => { utils.user.list.invalidate(); setIsOpen(false); setEditing(null); setForm(initial); }, onError: (e) => setError(e.message) });
  const deleteM = trpc.user.delete.useMutation({ onSuccess: () => { utils.user.list.invalidate(); setDelId(null); } });

  const openCreate = () => { setEditing(null); setForm(initial); setError(""); setIsOpen(true); };
  const openEdit = (u: { id: number; username: string; roleId: number | null; roleName: string; status: string }) => {
    setEditing(u.id); setForm({ username: u.username, password: "", roleId: u.roleId ?? 0, roleName: u.roleName, status: u.status as "active" | "inactive" }); setError(""); setIsOpen(true);
  };

  const handleRoleChange = (roleId: number) => {
    const r = roleList?.find(r => r.id === roleId);
    setForm({ ...form, roleId, roleName: r?.name || "" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.username.trim()) { setError("El usuario es requerido"); return; }
    if (!editing && !form.password) { setError("La contrasena es requerida"); return; }
    if (!editing && form.password.length < 6) { setError("Minimo 6 caracteres"); return; }
    if (!form.roleId) { setError("Selecciona un rol"); return; }

    if (editing) {
      updateM.mutate({ id: editing, username: form.username, roleId: form.roleId, roleName: form.roleName, status: form.status, ...(form.password ? { password: form.password } : {}) });
    } else {
      createM.mutate({ username: form.username.trim(), password: form.password, roleId: form.roleId, roleName: form.roleName, status: form.status });
    }
  };

  const getRoleBadge = (roleName: string) => {
    if (roleName === "admin") return <span className="badge-admin">ADMIN</span>;
    if (roleName === "hacker") return <span className="badge-hacker">HACKER</span>;
    return <span className="badge-user">{roleName.toUpperCase()}</span>;
  };

  return (
    <AppLayout title="Usuarios">
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Gestion de usuarios</p>
        <button onClick={openCreate} className="glow-btn flex items-center gap-2 cursor-pointer"><UserPlus size={16} /> NUEVO USUARIO</button>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input type="text" placeholder="BUSCAR..." value={search} onChange={(e) => setSearch(e.target.value)} className="terminal-input w-full" style={{ paddingLeft: 36 }} />
        </div>
      </div>

      <div className="glow-card overflow-x-auto">
        <table className="terminal-table">
          <thead><tr><th>ID</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={5} className="text-center py-8 loading-pulse" style={{ color: "var(--color-text-muted)" }}>CARGANDO...</td></tr> :
             userList && userList.length > 0 ? userList.map(u => (
              <tr key={u.id}>
                <td style={{ color: "var(--color-text-muted)" }} className="tabular-nums">{u.id}</td>
                <td style={{ color: "var(--color-gold-primary)", fontWeight: 500 }}>{u.username}</td>
                <td>{getRoleBadge(u.roleName)}</td>
                <td>{u.status === "active" ? <span className="badge-active">ACTIVO</span> : <span className="badge-inactive">INACTIVO</span>}</td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)} className="p-1.5 cursor-pointer" style={{ color: "var(--color-gold-dim)" }}><Pencil size={14} /></button>
                    {me?.id !== u.id && <button onClick={() => setDelId(u.id)} className="p-1.5 cursor-pointer" style={{ color: "var(--color-text-muted)" }}><Trash2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan={5} className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>No hay usuarios</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setError(""); }} title={editing ? "Editar Usuario" : "Nuevo Usuario"}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error && <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(255, 51, 51, 0.08)", border: "1px solid rgba(255, 51, 51, 0.2)", borderRadius: 2 }}><AlertCircle size={14} style={{ color: "#ff6666" }} /><span className="text-xs" style={{ color: "#ff6666" }}>{error}</span></div>}
          <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Usuario</label><input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="terminal-input" placeholder="Nombre de usuario" /></div>
          <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>{editing ? "Contrasena (opcional)" : "Contrasena"}</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="terminal-input" placeholder={editing ? "Sin cambios" : "Minimo 6 caracteres"} /></div>
          <div>
            <label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Rol</label>
            <select value={form.roleId} onChange={(e) => handleRoleChange(Number(e.target.value))} className="terminal-input cursor-pointer">
              <option value={0}>-- Seleccionar rol --</option>
              {roleList?.map(r => <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Estado</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })} className="terminal-input cursor-pointer">
              <option value="active">Activo</option><option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => { setIsOpen(false); setError(""); }} className="flex-1 glow-btn-secondary py-2.5 cursor-pointer">Cancelar</button>
            <button type="submit" disabled={createM.isPending || updateM.isPending} className="flex-1 glow-btn py-2.5 cursor-pointer">{createM.isPending || updateM.isPending ? "Guardando..." : editing ? "Actualizar" : "Crear"}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={delId !== null} onClose={() => setDelId(null)} onConfirm={() => { if (delId !== null) deleteM.mutate({ id: delId }); }} title="Confirmar" message="El usuario sera eliminado." confirmText="Eliminar" isLoading={deleteM.isPending} />
    </AppLayout>
  );
}
