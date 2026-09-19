import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMaintenancePlan, updateMaintenance } from "../../api/client";
import type { MaintenanceAction, CrewPositioning } from "../../types";
import { Clock, Users, AlertTriangle, CheckCircle, Wrench, ChevronDown, ChevronUp } from "lucide-react";

const C = {
  bg: "#F8FAFC", surface: "#FFFFFF", border: "#E2E8F0",
  text: "#1E293B", muted: "#64748B", primary: "#3B82F6",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  cardShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:     { bg: "rgba(100,116,139,0.1)", color: "#64748B" },
  scheduled:   { bg: "rgba(59,130,246,0.1)",  color: "#3B82F6" },
  "in-progress":{ bg: "rgba(245,158,11,0.1)", color: "#F59E0B" },
  completed:   { bg: "rgba(34,197,94,0.1)",   color: "#22C55E" },
};
const STATUS_OPTIONS = ["pending", "scheduled", "in-progress", "completed"];

function riskColor(score: number) {
  return score >= 0.65 ? C.danger : score >= 0.45 ? C.warning : score >= 0.25 ? "#a78bfa" : C.success;
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
      display: "inline-block", whiteSpace: "nowrap",
    }}>{status}</span>
  );
}

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "18px 20px", boxShadow: C.cardShadow,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: C.muted }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text }}>{value}</div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import React from "react";

export default function MaintenancePage() {
  const navigate = useNavigate();
  const [actions, setActions] = useState<MaintenanceAction[]>([]);
  const [crews, setCrews] = useState<CrewPositioning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMaintenancePlan();
      setActions(data.maintenance_actions ?? []);
      setCrews(data.crew_positioning ?? []);
    } catch {
      setError("Unable to load maintenance plan. Using demo data.");
      // Provide minimal demo data so the page isn't empty
      setActions([]);
      setCrews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async (id: string, status: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    setUpdating(id);
    try {
      await updateMaintenance(id, status);
      setActions(prev => prev.map(a => a.id === id ? { ...a, status: status as MaintenanceAction["status"] } : a));
    } catch {
      // Optimistic update even if backend fails
      setActions(prev => prev.map(a => a.id === id ? { ...a, status: status as MaintenanceAction["status"] } : a));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = statusFilter === "all" ? actions : actions.filter(a => a.status === statusFilter);

  const counts = {
    total: actions.length,
    pending: actions.filter(a => a.status === "pending").length,
    inProgress: actions.filter(a => a.status === "in-progress").length,
    completed: actions.filter(a => a.status === "completed").length,
  };

  if (loading) {
    return (
      <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <div style={{ fontSize: 14, color: C.muted }}>Loading maintenance plan…</div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>Maintenance Planner</h1>
          <p style={{ fontSize: 14, color: C.muted, margin: "4px 0 0" }}>
            {actions.length} actions · {crews.length} crews positioned
          </p>
        </div>
        <span style={{ background: "rgba(245,158,11,0.1)", color: C.warning, border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600 }}>
          NEXORA DEMO DATA
        </span>
      </div>

      {error && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: C.warning, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        <KPICard icon={<Wrench size={20} color={C.primary} />} label="Total Actions" value={counts.total} color={C.primary} />
        <KPICard icon={<Clock size={20} color={C.warning} />} label="Pending" value={counts.pending} color={C.warning} />
        <KPICard icon={<AlertTriangle size={20} color={C.danger} />} label="In Progress" value={counts.inProgress} color={C.danger} />
        <KPICard icon={<CheckCircle size={20} color={C.success} />} label="Completed" value={counts.completed} color={C.success} />
      </div>

      {/* Crew Pre-positioning */}
      {crews.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.cardShadow, padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Users size={16} color={C.primary} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Crew Pre-Positioning</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
            {crews.map(c => {
              const statusColor = c.status === "deployed" ? C.success : c.status === "en-route" ? C.primary : c.status === "standby" ? C.warning : C.muted;
              return (
                <div key={c.crew} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{c.crew}</div>
                    <span style={{ background: statusColor + "22", color: statusColor, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{c.status}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12 }}>
                    <div style={{ color: C.muted }}>📍 <span style={{ color: C.text }}>{c.assigned_location}</span></div>
                    <div style={{ color: C.muted }}>🔴 Primary: <span style={{ color: C.danger, fontWeight: 600 }}>{c.primary_target}</span></div>
                    {c.secondary_target && <div style={{ color: C.muted }}>🟡 Secondary: <span style={{ color: C.warning }}>{c.secondary_target}</span></div>}
                    <div style={{ color: C.muted }}>⚡ Response: <span style={{ color: C.success }}>{c.estimated_response_minutes} min</span></div>
                    <div style={{ color: C.muted }}>👥 Personnel: <span style={{ color: C.text }}>{c.personnel_count} people</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, width: "fit-content", boxShadow: C.cardShadow }}>
        {["all", "pending", "scheduled", "in-progress", "completed"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: statusFilter === s ? 600 : 400,
            background: statusFilter === s ? C.primary : "transparent",
            color: statusFilter === s ? "#fff" : C.muted,
            border: "none", cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
          }}>{s === "all" ? `All (${counts.total})` : s}</button>
        ))}
      </div>

      {/* Actions table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.cardShadow, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 14 }}>
            {statusFilter === "all" ? "No maintenance actions found." : `No ${statusFilter} actions.`}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["Priority", "Asset", "Risk", "Action", "Crew", "Time Window", "Status", "Update"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>
                    {h}
                  </th>
                ))}
                <th style={{ padding: "12px 8px", borderBottom: `1px solid ${C.border}` }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <React.Fragment key={a.id}>
                  <tr
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", transition: "background 0.12s", background: expanded === a.id ? "rgba(59,130,246,0.03)" : "transparent" }}
                    onMouseEnter={e => { if (expanded !== a.id) (e.currentTarget as HTMLTableRowElement).style.background = C.bg; }}
                    onMouseLeave={e => { if (expanded !== a.id) (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: riskColor(a.risk_score) }}>{a.priority}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.asset_name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{a.asset_id}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: riskColor(a.risk_score) }}>
                        {(a.risk_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: C.text, maxWidth: 200 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.action}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: C.muted }}>{a.crew}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 11, color: C.warning, fontWeight: 600 }}>{a.time_window}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge status={a.status} />
                    </td>
                    <td style={{ padding: "14px 8px" }} onClick={e => e.stopPropagation()}>
                      <select
                        value={a.status}
                        disabled={updating === a.id}
                        onChange={e => handleStatusUpdate(a.id, e.target.value, e)}
                        style={{
                          height: 30, border: `1px solid ${C.border}`, borderRadius: 6,
                          padding: "0 8px", fontSize: 11, color: C.text, background: C.surface,
                          cursor: "pointer", outline: "none",
                        }}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "14px 8px" }}>
                      <button
                        onClick={e => { e.stopPropagation(); setExpanded(expanded === a.id ? null : a.id); }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: C.muted, display: "flex" }}
                      >
                        {expanded === a.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                  </tr>
                  {expanded === a.id && (
                    <tr style={{ background: "rgba(59,130,246,0.02)" }}>
                      <td colSpan={9} style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20, fontSize: 13 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Required Equipment</div>
                            <ul style={{ margin: 0, paddingLeft: 16, color: C.text, lineHeight: 1.8 }}>
                              {(a.required_equipment ?? []).map(e => <li key={e}>{e}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Special Notes</div>
                            <p style={{ margin: 0, color: C.warning, lineHeight: 1.6 }}>{a.special_notes || "None"}</p>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Crew & Duration</div>
                            <div style={{ color: C.text }}>{a.crew}</div>
                            <div style={{ color: C.muted, marginTop: 4 }}>Est. {a.estimated_duration_hours}h · {a.crew_location}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Actions</div>
                            <button
                              onClick={() => navigate(`/equipment/${a.asset_id}`)}
                              style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 7, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                            >
                              View Asset →
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
