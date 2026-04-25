import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, Search, Grid3X3, List, Crosshair, Upload, X, ImageIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal } from "@/components/ui-custom/Modal";
import { ConfirmDialog } from "@/components/ui-custom/ConfirmDialog";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

type WForm = {
  name: string;
  imageUrl: string;
  type: "pistola" | "rifle" | "escopeta" | "subfusil" | "francotirador" | "explosivo" | "otro";
  price: string;
  caliber: string;
};

const initial: WForm = { name: "", imageUrl: "", type: "pistola", price: "", caliber: "" };
const typeLabels: Record<string, string> = { pistola: "PISTOLA", rifle: "RIFLE", escopeta: "ESCOPETA", subfusil: "SUBFUSIL", francotirador: "FRANCOTIRADOR", explosivo: "EXPLOSIVO", otro: "OTRO" };

function ImageUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const handleFile = (file: File) => { if (!file.type.startsWith("image/")) return; const r = new FileReader(); r.onloadend = () => onChange(r.result as string); r.readAsDataURL(file); };
  return (
    <div>
      <label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Imagen</label>
      {value ? (
        <div className="relative" style={{ border: "1px solid rgba(255, 215, 0, 0.2)", borderRadius: 2 }}>
          <img src={value} alt="Preview" className="w-full" style={{ maxHeight: 180, objectFit: "contain", background: "var(--color-bg-tertiary)" }} />
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 p-1 cursor-pointer" style={{ background: "rgba(255, 51, 51, 0.8)", borderRadius: 2, color: "#fff" }}><X size={14} /></button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer" style={{ border: dragOver ? "2px dashed var(--color-gold-primary)" : "2px dashed rgba(255, 215, 0, 0.2)", borderRadius: 2, background: dragOver ? "rgba(255, 215, 0, 0.05)" : "transparent" }}>
          <Upload size={20} style={{ color: "var(--color-gold-dim)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Arrastra PNG o haz click</span>
          <input ref={ref} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
        </div>
      )}
    </div>
  );
}

export default function WeaponsPage() {
  const { canEdit, canDelete } = useAuth();
  const utils = trpc.useUtils();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<WForm>(initial);
  const [error, setError] = useState("");
  const [delId, setDelId] = useState<number | null>(null);

  const { data: wList, isLoading } = trpc.weapon.list.useQuery({ search: search || undefined, type: typeFilter || undefined });
  const createM = trpc.weapon.create.useMutation({ onSuccess: () => { utils.weapon.list.invalidate(); setIsOpen(false); setForm(initial); }, onError: (e) => setError(e.message) });
  const updateM = trpc.weapon.update.useMutation({ onSuccess: () => { utils.weapon.list.invalidate(); setIsOpen(false); setEditing(null); setForm(initial); }, onError: (e) => setError(e.message) });
  const deleteM = trpc.weapon.delete.useMutation({ onSuccess: () => { utils.weapon.list.invalidate(); setDelId(null); } });

  const openCreate = () => { setEditing(null); setForm(initial); setError(""); setIsOpen(true); };
  const openEdit = (w: { id: number; name: string; imageUrl: string | null; type: string; price: string; caliber: string | null }) => {
    setEditing(w.id); setForm({ name: w.name, imageUrl: w.imageUrl || "", type: w.type as WForm["type"], price: w.price, caliber: w.caliber || "" }); setError(""); setIsOpen(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.name.trim()) { setError("El nombre es requerido"); return; }
    const data = { name: form.name.trim(), imageUrl: form.imageUrl || undefined, type: form.type, price: form.price || "0", caliber: form.caliber || undefined };
    if (editing) updateM.mutate({ id: editing, ...data }); else createM.mutate(data);
  };

  return (
    <AppLayout title="Arsenal">
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Inventario de armamento</p>
        <div className="flex items-center gap-3">
          <div className="flex" style={{ border: "1px solid rgba(255, 215, 0, 0.15)", borderRadius: 2 }}>
            <button onClick={() => setViewMode("grid")} className="p-2 cursor-pointer" style={{ color: viewMode === "grid" ? "var(--color-gold-primary)" : "var(--color-text-muted)", background: viewMode === "grid" ? "rgba(255, 215, 0, 0.08)" : "transparent" }}><Grid3X3 size={16} /></button>
            <button onClick={() => setViewMode("list")} className="p-2 cursor-pointer" style={{ color: viewMode === "list" ? "var(--color-gold-primary)" : "var(--color-text-muted)", background: viewMode === "list" ? "rgba(255, 215, 0, 0.08)" : "transparent" }}><List size={16} /></button>
          </div>
          <button onClick={openCreate} className="glow-btn flex items-center gap-2 cursor-pointer"><Plus size={16} /> NUEVA ARMA</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input type="text" placeholder="BUSCAR ARMA..." value={search} onChange={(e) => setSearch(e.target.value)} className="terminal-input w-full" style={{ paddingLeft: 36 }} />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="terminal-input cursor-pointer" style={{ width: 160 }}>
          <option value="">Todos</option>{Object.keys(typeLabels).map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
        </select>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? <div className="col-span-full text-center py-12 loading-pulse" style={{ color: "var(--color-text-muted)" }}>CARGANDO...</div> :
           wList && wList.length > 0 ? wList.map(w => (
            <div key={w.id} className="glow-card flex flex-col overflow-hidden">
              <div className="relative flex items-center justify-center" style={{ height: 160, background: "var(--color-bg-tertiary)" }}>
                {w.imageUrl ? <img src={w.imageUrl} alt={w.name} className="w-full h-full" style={{ objectFit: "contain" }} /> : <Crosshair size={40} style={{ color: "var(--color-gold-dim)", opacity: 0.3 }} />}
              </div>
              <div className="p-4 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--color-gold-primary)" }}>{w.name}</h3>
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{typeLabels[w.type]}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs"><span style={{ color: "var(--color-text-muted)" }}>PRECIO</span><span className="font-semibold" style={{ color: "var(--color-gold-primary)" }}>${parseFloat(w.price).toLocaleString("es-ES")}</span></div>
                  <div className="flex justify-between text-xs"><span style={{ color: "var(--color-text-muted)" }}>CALIBRE</span><span style={{ color: "var(--color-text-secondary)" }}>{w.caliber || "-"}</span></div>
                </div>
                {(canEdit || canDelete) && (
                  <div className="flex items-center justify-end gap-2 mt-3 pt-2" style={{ borderTop: "1px solid rgba(255, 215, 0, 0.1)" }}>
                    {canEdit && <button onClick={() => openEdit(w)} className="p-1 cursor-pointer" style={{ color: "var(--color-gold-dim)" }}><Pencil size={14} /></button>}
                    {canDelete && <button onClick={() => setDelId(w.id)} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}><Trash2 size={14} /></button>}
                  </div>
                )}
              </div>
            </div>
          )) : <div className="col-span-full text-center py-12" style={{ color: "var(--color-text-muted)" }}>Inventario vacio</div>}
        </div>
      ) : (
        <div className="glow-card overflow-x-auto">
          <table className="terminal-table">
            <thead><tr><th style={{ width: 60 }}>IMG</th><th>Nombre</th><th>Tipo</th><th>Precio</th><th>Calibre</th>{(canEdit || canDelete) && <th>Acciones</th>}</tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={canEdit || canDelete ? 6 : 5} className="text-center py-8 loading-pulse" style={{ color: "var(--color-text-muted)" }}>CARGANDO...</td></tr> :
               wList && wList.length > 0 ? wList.map(w => (
                <tr key={w.id}>
                  <td>{w.imageUrl ? <img src={w.imageUrl} alt={w.name} style={{ width: 40, height: 40, objectFit: "contain" }} /> : <div className="flex items-center justify-center" style={{ width: 40, height: 40, background: "rgba(255, 215, 0, 0.05)" }}><ImageIcon size={16} style={{ color: "var(--color-gold-dim)" }} /></div>}</td>
                  <td style={{ color: "var(--color-gold-primary)", fontWeight: 500 }}>{w.name}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{typeLabels[w.type]}</td>
                  <td className="font-semibold" style={{ color: "var(--color-gold-primary)" }}>${parseFloat(w.price).toLocaleString("es-ES")}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{w.caliber || "-"}</td>
                  {(canEdit || canDelete) && <td><div className="flex gap-2">{canEdit && <button onClick={() => openEdit(w)} className="p-1 cursor-pointer" style={{ color: "var(--color-gold-dim)" }}><Pencil size={14} /></button>}{canDelete && <button onClick={() => setDelId(w.id)} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}><Trash2 size={14} /></button>}</div></td>}
                </tr>
              )) : <tr><td colSpan={canEdit || canDelete ? 6 : 5} className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>Inventario vacio</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setError(""); }} title={editing ? "Editar Arma" : "Nueva Arma"}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error && <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(255, 51, 51, 0.08)", border: "1px solid rgba(255, 51, 51, 0.2)", borderRadius: 2 }}><span className="text-xs" style={{ color: "#ff6666" }}>{error}</span></div>}
          <ImageUpload value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} />
          <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Nombre</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="terminal-input" placeholder="Nombre del arma" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Tipo</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as WForm["type"] })} className="terminal-input cursor-pointer">{Object.keys(typeLabels).map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}</select></div>
            <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Precio ($)</label><input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="terminal-input" placeholder="0.00" /></div>
            <div><label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Calibre</label><input type="text" value={form.caliber} onChange={(e) => setForm({ ...form, caliber: e.target.value })} className="terminal-input" placeholder="Ej: 9mm" /></div>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => { setIsOpen(false); setError(""); }} className="flex-1 glow-btn-secondary py-2.5 cursor-pointer">Cancelar</button>
            <button type="submit" disabled={createM.isPending || updateM.isPending} className="flex-1 glow-btn py-2.5 cursor-pointer">{createM.isPending || updateM.isPending ? "Guardando..." : editing ? "Actualizar" : "Registrar"}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={delId !== null} onClose={() => setDelId(null)} onConfirm={() => { if (delId !== null) deleteM.mutate({ id: delId }); }} title="Confirmar" message="El arma sera eliminada." confirmText="Eliminar" isLoading={deleteM.isPending} />
    </AppLayout>
  );
}
