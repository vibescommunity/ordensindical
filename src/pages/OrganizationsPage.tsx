import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, Search, Upload, X, ImageIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal } from "@/components/ui-custom/Modal";
import { ConfirmDialog } from "@/components/ui-custom/ConfirmDialog";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

type OrgForm = {
  name: string;
  type: "organizacion_avanzada" | "organizacion_oficial" | "proyecto_organizacion";
  logo: string;
  location: string;
  leader: string;
  status: "active" | "inactive";
};

const initial: OrgForm = { name: "", type: "organizacion_avanzada", logo: "", location: "", leader: "", status: "active" };

const typeColors: Record<string, string> = { organizacion_avanzada: "#ff6666", organizacion_oficial: "#FFD700", proyecto_organizacion: "#00ccff" };
const typeLabels: Record<string, string> = { organizacion_avanzada: "Organizacion Avanzada", organizacion_oficial: "Organizacion Oficial", proyecto_organizacion: "Proyecto de Organizacion" };

function LogoUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onloadend = () => onChange(r.result as string);
    r.readAsDataURL(file);
  };
  return (
    <div>
      <label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Logo</label>
      {value ? (
        <div className="relative" style={{ border: "1px solid rgba(255, 215, 0, 0.2)", borderRadius: 2 }}>
          <img src={value} alt="Logo" className="w-full" style={{ maxHeight: 120, objectFit: "contain", background: "var(--color-bg-tertiary)" }} />
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 p-1 cursor-pointer" style={{ background: "rgba(255, 51, 51, 0.8)", borderRadius: 2, color: "#fff" }}><X size={14} /></button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer transition-all" style={{ border: dragOver ? "2px dashed var(--color-gold-primary)" : "2px dashed rgba(255, 215, 0, 0.2)", borderRadius: 2, background: dragOver ? "rgba(255, 215, 0, 0.05)" : "transparent" }}>
          <Upload size={20} style={{ color: "var(--color-gold-dim)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Arrastra un logo o haz click</span>
          <input ref={ref} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
        </div>
      )}
    </div>
  );
}

export default function OrganizationsPage() {
  const { canEdit, canDelete } = useAuth();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<OrgForm>(initial);
  const [error, setError] = useState("");
  const [delId, setDelId] = useState<number | null>(null);

  const { data: orgs, isLoading } = trpc.organization.list.useQuery({ search: search || undefined, type: typeFilter || undefined });
  const createM = trpc.organization.create.useMutation({ onSuccess: () => { utils.organization.list.invalidate(); setIsOpen(false); setForm(initial); }, onError: (e) => setError(e.message) });
  const updateM = trpc.organization.update.useMutation({ onSuccess: () => { utils.organization.list.invalidate(); setIsOpen(false); setEditing(null); setForm(initial); }, onError: (e) => setError(e.message) });
  const deleteM = trpc.organization.delete.useMutation({ onSuccess: () => { utils.organization.list.invalidate(); setDelId(null); } });

  const openCreate = () => { setEditing(null); setForm(initial); setError(""); setIsOpen(true); };
  const openEdit = (o: { id: number; name: string; type: string; logo: string | null; location: string | null; leader: string | null; status: string }) => {
    setEditing(o.id); setForm({ name: o.name, type: o.type as OrgForm["type"], logo: o.logo || "", location: o.location || "", leader: o.leader || "", status: o.status as "active" | "inactive" }); setError(""); setIsOpen(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.name.trim()) { setError("El nombre es requerido"); return; }
    const data = { name: form.name.trim(), type: form.type, logo: form.logo || undefined, location: form.location || undefined, leader: form.leader || undefined, status: form.status };
    if (editing) updateM.mutate({ id: editing, ...data }); else createM.mutate(data);
  };

  return (
    <AppLayout title="Organizaciones">
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Registro de organizaciones</p>
        <button onClick={openCreate} className="glow-btn flex items-center gap-2 cursor-pointer"><Plus size={16} /> NUEVA</button>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input type="text" placeholder="BUSCAR..." value={search} onChange={(e) => setSearch(e.target.value)} className="terminal-input w-full" style={{ paddingLeft: 36 }} />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="terminal-input cursor-pointer" style={{ width: 160 }}>
          <option value="">Todos los Tipos</option>
          <option value="organizacion_avanzada">Organizacion Avanzada</option>
          <option value="organizacion_oficial">Organizacion Oficial</option>
          <option value="proyecto_organizacion">Proyecto de Organizacion</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 loading-pulse" style={{ color: "var(--color-text-muted)" }}>CARGANDO...</div>
        ) : orgs && orgs.length > 0 ? orgs.map((o) => (
          <div key={o.id} className="glow-card flex flex-col overflow-hidden">
            <div className="relative flex items-center justify-center" style={{ height: 120, background: "var(--color-bg-tertiary)" }}>
              {o.logo ? <img src={o.logo} alt={o.name} className="w-full h-full" style={{ objectFit: "contain" }} /> : <ImageIcon size={40} style={{ color: "var(--color-gold-dim)", opacity: 0.3 }} />}
              <div className="absolute top-2 right-2"><span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: typeColors[o.type], background: `${typeColors[o.type]}20` }}>{typeLabels[o.type]}</span></div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--color-gold-primary)" }}>{o.name}</h3>
              <div className="space-y-1.5 mb-3 flex-1">
                {o.location && <div className="flex justify-between text-xs"><span style={{ color: "var(--color-text-muted)" }}>UBICACION</span><span style={{ color: "var(--color-text-secondary)" }}>{o.location}</span></div>}
                {o.leader && <div className="flex justify-between text-xs"><span style={{ color: "var(--color-text-muted)" }}>JEFE</span><span style={{ color: "var(--color-text-secondary)" }}>{o.leader}</span></div>}
                <div className="flex justify-between text-xs"><span style={{ color: "var(--color-text-muted)" }}>ESTADO</span><span style={{ color: o.status === "active" ? "var(--color-success)" : "#888" }}>{o.status === "active" ? "ACTIVO" : "INACTIVO"}</span></div>
              </div>
              {(canEdit || canDelete) && (
                <div className="flex items-center justify-end gap-2 pt-2" style={{ borderTop: "1px solid rgba(255, 215, 0, 0.1)" }}>
                  {canEdit && <button onClick={() => openEdit(o)} className="p-1 cursor-pointer" style={{ color: "var(--color-gold-dim)" }}><Pencil size={14} /></button>}
                  {canDelete && <button onClick={() => setDelId(o.id)} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}><Trash2 size={14} /></button>}
                </div>
              )}
            </div>
          </div>
        )) : <div className="col-span-full text-center py-12" style={{ color: "var(--color-text-muted)" }}>No hay organizaciones</div>}
      </div>

      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setError(""); }} title={editing ? "Editar Organizacion" : "Nueva Organizacion"}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error && <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(255, 51, 51, 0.08)", border: "1px solid rgba(255, 51, 51, 0.2)", borderRadius: 2 }}><span className="text-xs" style={{ color: "#ff6666" }}>{error}</span></div>}
          <LogoUpload value={form.logo} onChange={(v) => setForm({ ...form, logo: v })} />
          <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Nombre</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="terminal-input" placeholder="Nombre de la organizacion" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Tipo</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as OrgForm["type"] })} className="terminal-input cursor-pointer">{Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Estado</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })} className="terminal-input cursor-pointer"><option value="active">Activo</option><option value="inactive">Inactivo</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Ubicacion</label><input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="terminal-input" placeholder="Ciudad, Pais" /></div>
            <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Jefe</label><input type="text" value={form.leader} onChange={(e) => setForm({ ...form, leader: e.target.value })} className="terminal-input" placeholder="Nombre del lider" /></div>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => { setIsOpen(false); setError(""); }} className="flex-1 glow-btn-secondary py-2.5 cursor-pointer">Cancelar</button>
            <button type="submit" disabled={createM.isPending || updateM.isPending} className="flex-1 glow-btn py-2.5 cursor-pointer">{createM.isPending || updateM.isPending ? "Guardando..." : editing ? "Actualizar" : "Crear"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={delId !== null} onClose={() => setDelId(null)} onConfirm={() => { if (delId !== null) deleteM.mutate({ id: delId }); }} title="Confirmar Eliminacion" message="La organizacion sera eliminada." confirmText="Eliminar" isLoading={deleteM.isPending} />
    </AppLayout>
  );
}
