import { useState } from "react";
import { Plus, Download, FileText, X } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import type { Report } from "../../store/appStore";

const C = {
  bg: "#F8FAFC", surface: "#FFFFFF", border: "#E2E8F0",
  text: "#1E293B", muted: "#64748B", primary: "#3B82F6",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  cardShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
};

const REPORT_TYPES = ["Equipment Health", "Prediction Summary", "Maintenance Schedule", "Outage Analysis"];

// ─── Generate Report Modal ────────────────────────────────────────────────────
function GenerateReportModal({ onClose, onGenerate }: {
  onClose: () => void;
  onGenerate: (type: string, startDate: string, endDate: string, format: "PDF" | "CSV") => void;
}) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [startDate, setStartDate] = useState("2025-09-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [format, setFormat] = useState<"PDF" | "CSV">("PDF");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!startDate) e.startDate = "Start date required";
    if (!endDate) e.endDate = "End date required";
    if (startDate && endDate && startDate > endDate) e.endDate = "End date must be after start date";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      onGenerate(reportType, startDate, endDate, format);
      setLoading(false);
    }, 1200);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 40, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "0 12px", fontSize: 14, color: C.text, background: C.surface,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: C.surface, borderRadius: 16, width: "100%", maxWidth: 500,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{
          padding: "20px 24px", borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Generate Report</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex", color: C.muted }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Report Type</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={reportType} onChange={e => setReportType(e.target.value)}>
              {REPORT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Start Date</label>
              <input type="date" style={{ ...inputStyle, borderColor: errors.startDate ? C.danger : C.border }}
                value={startDate} onChange={e => setStartDate(e.target.value)}
                onFocus={e => (e.target.style.borderColor = C.primary)}
                onBlur={e => (e.target.style.borderColor = errors.startDate ? C.danger : C.border)}
              />
              {errors.startDate && <div style={{ fontSize: 12, color: C.danger, marginTop: 4 }}>{errors.startDate}</div>}
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>End Date</label>
              <input type="date" style={{ ...inputStyle, borderColor: errors.endDate ? C.danger : C.border }}
                value={endDate} onChange={e => setEndDate(e.target.value)}
                onFocus={e => (e.target.style.borderColor = C.primary)}
                onBlur={e => (e.target.style.borderColor = errors.endDate ? C.danger : C.border)}
              />
              {errors.endDate && <div style={{ fontSize: 12, color: C.danger, marginTop: 4 }}>{errors.endDate}</div>}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 8 }}>Format</label>
            <div style={{ display: "flex", gap: 10 }}>
              {(["PDF", "CSV"] as const).map(f => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setFormat(f)}
                  style={{
                    flex: 1, height: 40, borderRadius: 8, fontSize: 14, fontWeight: 600,
                    background: format === f ? C.primary : C.surface,
                    color: format === f ? "#fff" : C.text,
                    border: `1px solid ${format === f ? C.primary : C.border}`,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{
              padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: C.surface, color: C.text, border: `1px solid ${C.border}`, cursor: "pointer",
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: loading ? "#93c5fd" : C.primary, color: "#fff", border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Generating...
                </>
              ) : "Generate Report"}
            </button>
          </div>
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </form>
      </div>
    </div>
  );
}

// ─── Download helpers ─────────────────────────────────────────────────────────
function downloadCSV(report: Report, equipment: { id: string; name: string; type: string; location: string; status: string; risk: number }[]) {
  const rows = [
    ["NEXORA Report", report.title],
    ["Generated", report.generatedAt],
    [""],
    ["Equipment ID", "Name", "Type", "Location", "Status", "Risk Score"],
    ...equipment.map(e => [e.id, e.name, e.type, e.location, e.status, `${e.risk}%`]),
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nexora-${report.type.toLowerCase().replace(/\s+/g, "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadPDF(report: Report, equipment: { id: string; name: string; type: string; location: string; status: string; risk: number }[]) {
  // Build a printable HTML document and trigger print/save as PDF
  const rows = equipment.map(e =>
    `<tr>
      <td>${e.id}</td><td>${e.name}</td><td>${e.type}</td>
      <td>${e.location}</td>
      <td style="color:${e.status === "Critical" ? "#EF4444" : e.status === "Warning" ? "#F59E0B" : "#22C55E"}">${e.status}</td>
      <td>${e.risk}%</td>
    </tr>`
  ).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>NEXORA — ${report.title}</title>
  <style>
    body{font-family:system-ui,sans-serif;padding:40px;color:#1E293B}
    h1{font-size:24px;color:#0F2645;margin-bottom:4px}
    .meta{font-size:13px;color:#64748B;margin-bottom:32px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{background:#F8FAFC;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#64748B;border-bottom:1px solid #E2E8F0}
    td{padding:10px 12px;border-bottom:1px solid #E2E8F0}
    .header{display:flex;align-items:center;gap:12px;margin-bottom:8px}
    .logo{background:linear-gradient(135deg,#3B82F6,#38bdf8);width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;flex-shrink:0}
    @media print{body{padding:20px}}
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">N</div>
    <h1>NEXORA — ${report.title}</h1>
  </div>
  <div class="meta">Generated: ${report.generatedAt} · Period: ${report.title} · Format: PDF</div>
  <table>
    <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Location</th><th>Status</th><th>Risk</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="font-size:11px;color:#94A3B8;margin-top:32px;text-align:center">© 2025 NEXORA AI Grid Intelligence · Confidential</p>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      win.print();
      URL.revokeObjectURL(url);
    };
  }
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { reports, addReport, equipment, showToast } = useAppStore();
  const [showGenModal, setShowGenModal] = useState(false);

  const ICON_MAP: Record<string, { icon: React.ReactNode; iconBg: string }> = {
    "Equipment Health": {
      icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#F59E0B" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" /></svg>,
      iconBg: "rgba(245,158,11,0.1)",
    },
    "Prediction Summary": {
      icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>,
      iconBg: "rgba(239,68,68,0.1)",
    },
    "Maintenance Schedule": {
      icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#3B82F6" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
      iconBg: "rgba(59,130,246,0.1)",
    },
    "Outage Analysis": {
      icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#22C55E" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
      iconBg: "rgba(34,197,94,0.1)",
    },
  };

  function handleGenerate(type: string, startDate: string, endDate: string, format: "PDF" | "CSV") {
    const now = new Date();
    const newReport: Report = {
      id: `r-${Date.now()}`,
      title: type,
      type,
      generatedAt: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      format,
      size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
    };
    addReport(newReport);
    setShowGenModal(false);
    showToast(`${type} report generated successfully.`);
  }

  function handleDownload(report: Report, fmt: "PDF" | "CSV") {
    if (fmt === "CSV") {
      downloadCSV(report, equipment);
    } else {
      downloadPDF(report, equipment);
    }
    showToast(`${report.title} download started.`, "info");
  }

  return (
    <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>Reports</h1>
          <p style={{ fontSize: 14, color: C.muted, margin: "4px 0 0" }}>Generate and download detailed grid reports</p>
        </div>
        <button
          onClick={() => setShowGenModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: C.primary, color: "#fff", border: "none",
            borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#2563EB")}
          onMouseLeave={e => (e.currentTarget.style.background = C.primary)}
        >
          <Plus size={16} /> Generate Report
        </button>
      </div>

      {/* Report cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 20, marginBottom: 32 }}>
        {reports.map(r => {
          const iconData = ICON_MAP[r.type] ?? ICON_MAP["Equipment Health"];
          return (
            <div key={r.id} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: 24,
              boxShadow: C.cardShadow, display: "flex", flexDirection: "column", gap: 16,
              transition: "box-shadow 0.2s, transform 0.2s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.cardShadow; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: iconData.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {iconData.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                    {r.type === "Equipment Health" && "Complete health status with risk scores and recommendations."}
                    {r.type === "Prediction Summary" && "AI prediction results and trend analysis for monitored assets."}
                    {r.type === "Maintenance Schedule" && "Recommended maintenance actions for the next 90 days."}
                    {r.type === "Outage Analysis" && "Historical and predicted outage data with prevention strategies."}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted }}>
                <span>Generated: {r.generatedAt}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{
                    background: r.format === "PDF" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                    color: r.format === "PDF" ? C.danger : C.success,
                    borderRadius: 6, padding: "1px 8px", fontSize: 11, fontWeight: 600,
                  }}>{r.format}</span>
                  {r.size}
                </span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => handleDownload(r, "PDF")}
                  style={{
                    flex: 1, height: 36, background: C.primary, color: "#fff",
                    border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#2563EB")}
                  onMouseLeave={e => (e.currentTarget.style.background = C.primary)}
                >
                  <Download size={13} /> PDF
                </button>
                <button
                  onClick={() => handleDownload(r, "CSV")}
                  style={{
                    flex: 1, height: 36, background: C.surface, color: C.text,
                    border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.bg; (e.currentTarget as HTMLButtonElement).style.borderColor = C.primary; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.surface; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
                >
                  <FileText size={13} /> CSV
                </button>
              </div>
            </div>
          );
        })}
        {reports.length === 0 && (
          <div style={{
            gridColumn: "1/-1", background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 48, textAlign: "center", color: C.muted, fontSize: 14,
            boxShadow: C.cardShadow,
          }}>
            No reports yet. Click "Generate Report" to create your first report.
          </div>
        )}
      </div>

      {showGenModal && (
        <GenerateReportModal onClose={() => setShowGenModal(false)} onGenerate={handleGenerate} />
      )}
    </div>
  );
}
