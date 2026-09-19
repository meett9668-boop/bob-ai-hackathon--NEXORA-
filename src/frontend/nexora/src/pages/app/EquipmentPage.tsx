import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronLeft, ChevronRight, Eye, Edit2, Trash2, X } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import type { Equipment } from "../../store/appStore";

const C = {
  bg: "#F8FAFC", surface: "#FFFFFF", border: "#E2E8F0",
  text: "#1E293B", muted: "#64748B", primary: "#3B82F6",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  cardShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
};

const TYPES = ["All Types", "Power Transformer", "Circuit Breaker", "Generator", "Feeder", "Substation", "Other"];
const STATUSES = ["All Status", "Healthy", "Warning", "Critical"];
const PAGE_SIZE = 8;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Critical: { bg: "rgba(239,68,68,0.1)", color: C.danger },
    Warning: { bg: "rgba(245,158,11,0.1)", color: C.warning },
    Healthy: { bg: "rgba(34,197,94,0.1)", color: C.success },
  };
  const s = map[status] ?? { bg: "rgba(100,116,139,0.1)", color: C.muted };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {status}
    </span>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
interface EquipmentFormData {
  id: string; name: string; type: string; location: string;
  status: "Healthy" | "Warning" | "Critical";
  manufacturer: string; model: string; installDate: string; capacity: string; region: string;
}

const EMPTY_FORM: EquipmentFormData = {
  id: "", name: "", type: "Power Transformer", location: "",
  status: "Healthy", manufacturer: "", model: "", installDate: "", capacity: "", region: "",
};

function EquipmentModal({
  mode, initial, existingIds, onClose, onSubmit,
}: {
  mode: "add" | "edit";
  initial: EquipmentFormData;
  existingIds: string[];
  onClose: () => void;
  onSubmit: (data: EquipmentFormData) => void;
}) {
  const [form, setForm] = useState<EquipmentFormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof EquipmentFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function set(k: keyof EquipmentFormData, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof EquipmentFormData, string>> = {};
    if (!form.id.trim()) e.id = "Equipment ID is required";
    else if (mode === "add" && existingIds.includes(form.id.trim())) e.id = "Equipment ID already exists";
    if (!form.name.trim()) e.name = "Equipment name is required";
    if (!form.location.trim()) e.location = "Location is required";
    if (!form.type) e.type = "Type is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      onSubmit(form);
      setSubmitting(false);
    }, 600);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 40, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "0 12px", fontSize: 14, color: C.text, background: C.surface,
    outline: "none", boxSizing: "border-box",
  };

  const Field = ({ label, name, children }: { label: string; name: keyof EquipmentFormData; children: React.ReactNode }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>{label}</label>
      {children}
      {errors[name] && <div style={{ fontSize: 12, color: C.danger, marginTop: 4 }}>{errors[name]}</div>}
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: C.surface, borderRadius: 16, width: "100%", maxWidth: 580,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: C.surface, zIndex: 1,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
            {mode === "add" ? "Add Equipment" : "Edit Equipment"}
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6, color: C.muted }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Equipment ID *" name="id">
              <input
                style={{ ...inputStyle, borderColor: errors.id ? C.danger : C.border, background: mode === "edit" ? C.bg : C.surface }}
                value={form.id} onChange={e => set("id", e.target.value)}
                placeholder="e.g. T-201" readOnly={mode === "edit"}
                onFocus={e => { if (mode !== "edit") e.target.style.borderColor = C.primary; }}
                onBlur={e => { e.target.style.borderColor = errors.id ? C.danger : C.border; }}
              />
            </Field>
            <Field label="Equipment Name *" name="name">
              <input style={{ ...inputStyle, borderColor: errors.name ? C.danger : C.border }}
                value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="e.g. Transformer T-201"
                onFocus={e => (e.target.style.borderColor = C.primary)}
                onBlur={e => (e.target.style.borderColor = errors.name ? C.danger : C.border)}
              />
            </Field>
            <Field label="Equipment Type *" name="type">
              <select style={{ ...inputStyle, cursor: "pointer" }}
                value={form.type} onChange={e => set("type", e.target.value)}
              >
                {["Power Transformer", "Circuit Breaker", "Generator", "Feeder", "Substation", "Other"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Status *" name="status">
              <select style={{ ...inputStyle, cursor: "pointer" }}
                value={form.status} onChange={e => set("status", e.target.value as EquipmentFormData["status"])}
              >
                <option value="Healthy">Healthy</option>
                <option value="Warning">Warning</option>
                <option value="Critical">Critical</option>
              </select>
            </Field>
            <Field label="Location *" name="location">
              <input style={{ ...inputStyle, borderColor: errors.location ? C.danger : C.border }}
                value={form.location} onChange={e => set("location", e.target.value)}
                placeholder="e.g. Substation B, Mumbai"
                onFocus={e => (e.target.style.borderColor = C.primary)}
                onBlur={e => (e.target.style.borderColor = errors.location ? C.danger : C.border)}
              />
            </Field>
            <Field label="Region" name="region">
              <input style={inputStyle} value={form.region} onChange={e => set("region", e.target.value)}
                placeholder="e.g. Maharashtra"
                onFocus={e => (e.target.style.borderColor = C.primary)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </Field>
            <Field label="Manufacturer" name="manufacturer">
              <input style={inputStyle} value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)}
                placeholder="e.g. BHEL, Siemens"
                onFocus={e => (e.target.style.borderColor = C.primary)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </Field>
            <Field label="Model" name="model">
              <input style={inputStyle} value={form.model} onChange={e => set("model", e.target.value)}
                placeholder="e.g. TX-220"
                onFocus={e => (e.target.style.borderColor = C.primary)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </Field>
            <Field label="Installation Date" name="installDate">
              <input type="date" style={inputStyle} value={form.installDate} onChange={e => set("installDate", e.target.value)}
                onFocus={e => (e.target.style.borderColor = C.primary)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </Field>
            <Field label="Capacity" name="capacity">
              <input style={inputStyle} value={form.capacity} onChange={e => set("capacity", e.target.value)}
                placeholder="e.g. 220/66 kV"
                onFocus={e => (e.target.style.borderColor = C.primary)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </Field>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <button type="button" onClick={onClose} style={{
              padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: C.surface, color: C.text, border: `1px solid ${C.border}`,
              cursor: "pointer",
            }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{
              padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: submitting ? "#93c5fd" : C.primary, color: "#fff", border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
              transition: "background 0.15s",
            }}>
              {submitting ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  {mode === "add" ? "Adding..." : "Saving..."}
                </>
              ) : (mode === "add" ? "Add Equipment" : "Save Changes")}
            </button>
          </div>
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ eq, onClose, onConfirm }: { eq: Equipment; onClose: () => void; onConfirm: () => void }) {
  const [deleting, setDeleting] = useState(false);
  function handleDelete() {
    setDeleting(true);
    setTimeout(() => { onConfirm(); setDeleting(false); }, 500);
  }
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: C.surface, borderRadius: 16, width: "100%", maxWidth: 420,
        padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trash2 size={22} color={C.danger} />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Delete Equipment</h3>
            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>This action cannot be undone.</p>
          </div>
        </div>
        <p style={{ fontSize: 14, color: C.text, marginBottom: 24, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{eq.name}</strong>? All associated data will be removed.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: C.surface, color: C.text, border: `1px solid ${C.border}`, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} style={{
            padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: deleting ? "#fca5a5" : C.danger, color: "#fff", border: "none",
            cursor: deleting ? "not-allowed" : "pointer", transition: "background 0.15s",
          }}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Equipment Page ───────────────────────────────────────────────────────────
export default function EquipmentPage() {
  const navigate = useNavigate();
  const { equipment, addEquipment, updateEquipment, deleteEquipment, showToast } = useAppStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Equipment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);

  const filtered = equipment.filter(eq => {
    const q = search.toLowerCase();
    const matchQ = !q || eq.id.toLowerCase().includes(q) || eq.name.toLowerCase().includes(q) || eq.location.toLowerCase().includes(q) || eq.type.toLowerCase().includes(q);
    const matchT = typeFilter === "All Types" || eq.type === typeFilter;
    const matchS = statusFilter === "All Status" || eq.status === statusFilter;
    return matchQ && matchT && matchS;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleType(v: string) { setTypeFilter(v); setPage(1); }
  function handleStatus(v: string) { setStatusFilter(v); setPage(1); }

  function handleAdd(data: EquipmentFormData) {
    addEquipment({
      id: data.id.trim(),
      name: data.name.trim(),
      type: data.type,
      location: data.location.trim(),
      status: data.status,
      manufacturer: data.manufacturer,
      model: data.model,
      installDate: data.installDate,
      capacity: data.capacity,
      region: data.region,
    });
    setShowAddModal(false);
    showToast("Equipment added successfully.");
    setPage(1);
  }

  function handleEdit(data: EquipmentFormData) {
    if (!editTarget) return;
    updateEquipment(editTarget.id, {
      name: data.name.trim(),
      type: data.type,
      location: data.location.trim(),
      status: data.status,
      manufacturer: data.manufacturer,
      model: data.model,
      installDate: data.installDate,
      capacity: data.capacity,
      region: data.region,
    });
    setEditTarget(null);
    showToast("Equipment updated successfully.");
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteEquipment(deleteTarget.id);
    setDeleteTarget(null);
    showToast("Equipment deleted.");
    if (paged.length === 1 && page > 1) setPage(p => p - 1);
  }

  return (
    <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>Equipment</h1>
          <p style={{ fontSize: 14, color: C.muted, margin: "4px 0 0" }}>
            {equipment.length} equipment items · {equipment.filter(e => e.status === "Critical").length} critical
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: C.primary, color: "#fff", border: "none",
            borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#2563EB")}
          onMouseLeave={e => (e.currentTarget.style.background = C.primary)}
        >
          <Plus size={16} /> Add Equipment
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: "16px 20px",
        display: "flex", gap: 12, flexWrap: "wrap",
        marginBottom: 20, boxShadow: C.cardShadow,
      }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={14} color={C.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search by ID, name or location..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{
              width: "100%", height: 38, border: `1px solid ${C.border}`,
              borderRadius: 8, paddingLeft: 36, paddingRight: 12, fontSize: 13,
              color: C.text, background: C.bg, outline: "none", boxSizing: "border-box",
            }}
            onFocus={e => (e.target.style.borderColor = C.primary)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
        </div>
        <select value={typeFilter} onChange={e => handleType(e.target.value)}
          style={{ height: 38, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 12px", fontSize: 13, color: C.text, background: C.surface, outline: "none", cursor: "pointer", minWidth: 150 }}>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => handleStatus(e.target.value)}
          style={{ height: 38, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 12px", fontSize: 13, color: C.text, background: C.surface, outline: "none", cursor: "pointer", minWidth: 140 }}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", fontSize: 13, color: C.muted }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.cardShadow, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["ID", "Name", "Type", "Location", "Status", "Risk Score", "Last Check", "Actions"].map(col => (
                <th key={col} style={{
                  padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: C.muted,
                  letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`,
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((eq, i) => (
              <tr key={eq.id} style={{ borderBottom: i < paged.length - 1 ? `1px solid ${C.border}` : "none", transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{eq.id}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{eq.name}</div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ background: "rgba(59,130,246,0.07)", color: C.primary, fontSize: 12, borderRadius: 6, padding: "2px 8px", fontWeight: 500 }}>
                    {eq.type}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: C.muted }}>{eq.location}</td>
                <td style={{ padding: "14px 16px" }}><StatusBadge status={eq.status} /></td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 3, maxWidth: 80 }}>
                      <div style={{ height: 6, borderRadius: 3, width: `${eq.risk}%`, background: eq.risk >= 70 ? C.danger : eq.risk >= 40 ? C.warning : C.success }} />
                    </div>
                    <span style={{ fontSize: 12, color: C.muted, minWidth: 28 }}>{eq.risk}%</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: C.muted }}>{eq.lastCheck}</td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/equipment/${eq.id}`)}
                      title="View details"
                      style={{
                        background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6,
                        padding: "5px 10px", fontSize: 12, color: C.text, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 3, transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.primary; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = C.primary; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = C.text; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
                    >
                      <Eye size={12} /> View
                    </button>
                    <button
                      onClick={() => setEditTarget(eq)}
                      title="Edit"
                      style={{
                        background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6,
                        padding: "5px 10px", fontSize: 12, color: C.text, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 3, transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F59E0B"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#F59E0B"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = C.text; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(eq)}
                      title="Delete"
                      style={{
                        background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6,
                        padding: "5px 8px", fontSize: 12, color: C.muted, cursor: "pointer",
                        display: "flex", alignItems: "center", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = C.danger; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.3)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = C.muted; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 14 }}>
                  {search || typeFilter !== "All Types" || statusFilter !== "All Status"
                    ? "No equipment found matching the current filters."
                    : "No equipment added yet. Click \"Add Equipment\" to get started."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderTop: `1px solid ${C.border}`, background: C.bg,
          }}>
            <span style={{ fontSize: 13, color: C.muted }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, cursor: page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === 1 ? 0.5 : 1 }}>
                <ChevronLeft size={14} color={C.muted} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 32, height: 32, borderRadius: 6, fontSize: 13, fontWeight: page === p ? 700 : 400,
                    background: page === p ? C.primary : C.surface, color: page === p ? "#fff" : C.text,
                    border: `1px solid ${page === p ? C.primary : C.border}`, cursor: "pointer",
                  }}>{p}</button>
                );
              })}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, cursor: page === totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === totalPages ? 0.5 : 1 }}>
                <ChevronRight size={14} color={C.muted} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <EquipmentModal
          mode="add"
          initial={EMPTY_FORM}
          existingIds={equipment.map(e => e.id)}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}
      {editTarget && (
        <EquipmentModal
          mode="edit"
          initial={{
            id: editTarget.id, name: editTarget.name, type: editTarget.type,
            location: editTarget.location, status: editTarget.status,
            manufacturer: editTarget.manufacturer ?? "", model: editTarget.model ?? "",
            installDate: editTarget.installDate ?? "", capacity: editTarget.capacity ?? "",
            region: editTarget.region ?? "",
          }}
          existingIds={equipment.map(e => e.id)}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
        />
      )}
      {deleteTarget && (
        <DeleteModal eq={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
}

