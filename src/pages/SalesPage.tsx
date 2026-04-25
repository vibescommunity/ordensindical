import { useState } from "react";
import { Plus, Pencil, Trash2, TrendingUp, Calendar, Package, Crosshair, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal } from "@/components/ui-custom/Modal";
import { ConfirmDialog } from "@/components/ui-custom/ConfirmDialog";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface SaleItemInput {
  weaponId: number;
  weaponName: string;
  quantity: number;
  unitPrice: string;
}

export default function SalesPage() {
  const { canEdit, canDelete } = useAuth();
  const utils = trpc.useUtils();

  const [isOpen, setIsOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<number | null>(null);
  const [orgId, setOrgId] = useState<number>(0);
  const [items, setItems] = useState<SaleItemInput[]>([]);
  const [error, setError] = useState("");
  const [delId, setDelId] = useState<number | null>(null);
  const [showWeaponPicker, setShowWeaponPicker] = useState(false);

  const { data: saleList, isLoading } = trpc.sale.list.useQuery(undefined);
  const { data: stats } = trpc.sale.stats.useQuery(undefined, { refetchInterval: 5000 });
  const { data: orgs } = trpc.organization.list.useQuery(undefined);
  const { data: weapons } = trpc.weapon.list.useQuery(undefined);

  const createM = trpc.sale.create.useMutation({
    onSuccess: () => { utils.sale.list.invalidate(); utils.sale.stats.invalidate(); setIsOpen(false); resetForm(); },
    onError: (e) => setError(e.message),
  });
  const updateM = trpc.sale.update.useMutation({
    onSuccess: () => { utils.sale.list.invalidate(); utils.sale.stats.invalidate(); setIsOpen(false); resetForm(); },
    onError: (e) => setError(e.message),
  });
  const deleteM = trpc.sale.delete.useMutation({
    onSuccess: () => { utils.sale.list.invalidate(); utils.sale.stats.invalidate(); setDelId(null); },
  });

  const resetForm = () => { setOrgId(0); setItems([]); setError(""); setEditingSale(null); setShowWeaponPicker(false); };

  const openCreate = () => { resetForm(); setIsOpen(true); };

  const openEdit = (sale: { id: number; organizationId: number | null; organizationName: string | null; totalAmount: string; items?: Array<{ weaponId: number; weaponName: string | null; quantity: number; unitPrice: string }> }) => {
    setEditingSale(sale.id);
    setOrgId(sale.organizationId || 0);
    setItems((sale.items || []).map(i => ({ weaponId: i.weaponId, weaponName: i.weaponName || "", quantity: i.quantity, unitPrice: i.unitPrice })));
    setError("");
    setShowWeaponPicker(false);
    setIsOpen(true);
  };

  const addWeapon = (w: { id: number; name: string; price: string }) => {
    if (items.find(i => i.weaponId === w.id)) return;
    setItems([...items, { weaponId: w.id, weaponName: w.name, quantity: 1, unitPrice: w.price }]);
    setShowWeaponPicker(false);
  };

  const updateItemQty = (idx: number, qty: number) => {
    const next = [...items]; next[idx].quantity = Math.max(1, qty); setItems(next);
  };

  const updateItemPrice = (idx: number, price: string) => {
    const next = [...items]; next[idx].unitPrice = price; setItems(next);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const selectedOrg = orgs?.find(o => o.id === orgId);
  const totalAmount = items.reduce((sum, i) => sum + (parseFloat(i.unitPrice || "0") * i.quantity), 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!orgId) { setError("Selecciona una organizacion"); return; }
    if (items.length === 0) { setError("Agrega al menos un arma"); return; }

    const payload = {
      organizationId: orgId,
      organizationName: selectedOrg?.name || "",
      items: items.map(i => ({ weaponId: i.weaponId, weaponName: i.weaponName, quantity: i.quantity, unitPrice: i.unitPrice })),
    };

    if (editingSale) {
      updateM.mutate({ id: editingSale, ...payload });
    } else {
      createM.mutate(payload);
    }
  };

  return (
    <AppLayout title="Ventas">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Ventas", value: `$${stats ? parseFloat(stats.totalAmount).toLocaleString("es-ES") : "0"}`, icon: TrendingUp },
          { label: "Este Mes", value: `$${stats ? parseFloat(stats.thisMonth).toLocaleString("es-ES") : "0"}`, icon: Calendar },
          { label: "Promedio", value: `$${stats ? parseFloat(stats.averageAmount).toLocaleString("es-ES") : "0"}`, icon: Package },
        ].map(s => (
          <div key={s.label} className="glow-card p-4 flex items-center gap-4">
            <div className="flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: "rgba(255, 215, 0, 0.08)" }}>
              <s.icon size={20} style={{ color: "var(--color-gold-primary)" }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "var(--color-gold-primary)" }}>{s.value}</p>
              <p className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="glow-btn flex items-center gap-2 cursor-pointer"><Plus size={16} /> NUEVA VENTA</button>
      </div>

      {/* Sales Table */}
      <div className="glow-card overflow-x-auto">
        <table className="terminal-table">
          <thead>
            <tr><th>ID</th><th>Fecha</th><th>Organizacion</th><th>Items</th><th>Total</th><th>Vendedor</th>{(canEdit || canDelete) && <th>Acciones</th>}</tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={canEdit || canDelete ? 7 : 6} className="text-center py-8 loading-pulse" style={{ color: "var(--color-text-muted)" }}>CARGANDO...</td></tr> :
             saleList && saleList.length > 0 ? saleList.map(s => (
              <tr key={s.id}>
                <td style={{ color: "var(--color-text-muted)" }} className="tabular-nums">{s.id}</td>
                <td style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>{format(new Date(s.saleDate), "dd/MM/yyyy HH:mm")}</td>
                <td style={{ color: "var(--color-gold-primary)", fontWeight: 500 }}>{s.organizationName || "-"}</td>
                <td>
                  <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {Array.isArray(s.items) && s.items.length > 0 ? s.items.map((it) => `${it.quantity}x ${it.weaponName || "?"}`).join(", ") : "-"}
                  </div>
                </td>
                <td className="font-semibold tabular-nums" style={{ color: "var(--color-gold-primary)" }}>${parseFloat(s.totalAmount).toLocaleString("es-ES")}</td>
                <td style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>{s.createdByName || "-"}</td>
                {(canEdit || canDelete) && (
                  <td><div className="flex gap-2">
                    {canEdit && <button onClick={() => openEdit(s)} className="p-1 cursor-pointer" style={{ color: "var(--color-gold-dim)" }}><Pencil size={14} /></button>}
                    {canDelete && <button onClick={() => setDelId(s.id)} className="p-1 cursor-pointer" style={{ color: "var(--color-text-muted)" }}><Trash2 size={14} /></button>}
                  </div></td>
                )}
              </tr>
            )) : <tr><td colSpan={canEdit || canDelete ? 7 : 6} className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>No hay ventas registradas</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); resetForm(); }} title={editingSale ? "Editar Venta" : "Nueva Venta"} width={560}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error && <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(255, 51, 51, 0.08)", border: "1px solid rgba(255, 51, 51, 0.2)", borderRadius: 2 }}><span className="text-xs" style={{ color: "#ff6666" }}>{error}</span></div>}

          <div>
            <label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Organizacion</label>
            <select value={orgId} onChange={(e) => setOrgId(Number(e.target.value))} className="terminal-input cursor-pointer w-full">
              <option value={0}>-- Seleccionar organizacion --</option>
              {orgs?.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Fecha y Hora</label>
            <div className="terminal-input flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
              <Calendar size={14} /> {format(new Date(), "dd/MM/yyyy HH:mm:ss")} <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>(auto)</span>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-gold-dark)" }}>Armas</label>
            {items.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {items.map((item, idx) => (
                  <div key={item.weaponId} className="flex items-center gap-2 px-3 py-2" style={{ background: "var(--color-bg-tertiary)", border: "1px solid rgba(255, 215, 0, 0.1)", borderRadius: 2 }}>
                    <span className="flex-1 text-xs" style={{ color: "var(--color-gold-primary)" }}>{item.weaponName}</span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>Cant:</label>
                      <input type="number" min={1} value={item.quantity} onChange={(e) => updateItemQty(idx, parseInt(e.target.value) || 1)}
                        className="terminal-input text-center" style={{ width: 50, height: 28, padding: "2px 4px" }} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>$</span>
                      <input type="number" step="0.01" min="0" value={item.unitPrice} onChange={(e) => updateItemPrice(idx, e.target.value)}
                        className="terminal-input text-right" style={{ width: 80, height: 28, padding: "2px 4px" }} />
                    </div>
                    <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--color-gold-primary)", width: 60, textAlign: "right" }}>
                      ${(parseFloat(item.unitPrice || "0") * item.quantity).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </span>
                    <button type="button" onClick={() => removeItem(idx)} className="p-1 cursor-pointer" style={{ color: "#ff6666" }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <button type="button" onClick={() => setShowWeaponPicker(!showWeaponPicker)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs uppercase tracking-wider cursor-pointer"
                style={{ border: "1px dashed rgba(255, 215, 0, 0.25)", borderRadius: 2, color: "var(--color-gold-dim)", background: "transparent" }}>
                <Plus size={14} /> Agregar Arma
              </button>
              {showWeaponPicker && weapons && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20" style={{ maxHeight: 200, overflow: "auto", background: "var(--color-bg-secondary)", border: "1px solid rgba(255, 215, 0, 0.2)", borderRadius: 2 }}>
                  {weapons.filter(w => !items.find(i => i.weaponId === w.id)).map(w => (
                    <button key={w.id} type="button" onClick={() => addWeapon(w)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left cursor-pointer transition-colors"
                      style={{ color: "var(--color-text-secondary)", borderBottom: "1px solid rgba(255, 215, 0, 0.05)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 215, 0, 0.08)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                      {w.imageUrl ? <img src={w.imageUrl} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} /> : <Crosshair size={14} style={{ color: "var(--color-gold-dim)" }} />}
                      <span className="text-xs flex-1">{w.name}</span>
                      <span className="text-xs tabular-nums" style={{ color: "var(--color-gold-primary)" }}>${parseFloat(w.price).toLocaleString("es-ES")}</span>
                    </button>
                  ))}
                  {weapons.filter(w => !items.find(i => i.weaponId === w.id)).length === 0 && (
                    <div className="px-3 py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>Todas las armas agregadas</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center px-4 py-3" style={{ background: "rgba(255, 215, 0, 0.05)", border: "1px solid rgba(255, 215, 0, 0.1)", borderRadius: 2 }}>
            <span className="text-xs uppercase tracking-wider" style={{ color: "var(--color-gold-dark)" }}>Total</span>
            <span className="text-lg font-bold" style={{ color: "var(--color-gold-primary)" }}>${totalAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => { setIsOpen(false); resetForm(); }} className="flex-1 glow-btn-secondary py-2.5 cursor-pointer">Cancelar</button>
            <button type="submit" disabled={createM.isPending || updateM.isPending} className="flex-1 glow-btn py-2.5 cursor-pointer">{createM.isPending || updateM.isPending ? "Guardando..." : editingSale ? "Actualizar Venta" : "Registrar Venta"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={delId !== null} onClose={() => setDelId(null)} onConfirm={() => { if (delId !== null) deleteM.mutate({ id: delId }); }} title="Confirmar" message="La venta sera eliminada." confirmText="Eliminar" isLoading={deleteM.isPending} />
    </AppLayout>
  );
}
