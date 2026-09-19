import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { AlertTriangle, CheckCircle, Cpu } from "lucide-react";
import { useAppStore } from "../../store/appStore";

const C = {
  bg: "#F8FAFC", surface: "#FFFFFF", border: "#E2E8F0",
  text: "#1E293B", muted: "#64748B", primary: "#3B82F6",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  cardShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
};

function Card({ children, style, onClick, onMouseEnter, onMouseLeave }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.cardShadow, ...style }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

const RISK_DATA = [
  { day: "Sep 10", Normal: 45, Warning: 22, Critical: 8 },
  { day: "Sep 11", Normal: 50, Warning: 25, Critical: 10 },
  { day: "Sep 12", Normal: 42, Warning: 28, Critical: 12 },
  { day: "Sep 13", Normal: 55, Warning: 20, Critical: 9 },
  { day: "Sep 14", Normal: 60, Warning: 18, Critical: 7 },
  { day: "Sep 15", Normal: 48, Warning: 30, Critical: 14 },
  { day: "Sep 16", Normal: 52, Warning: 27, Critical: 11 },
];

const RECENT_ALERTS = [
  { id: 1, severity: "Critical", equipment: "Transformer T-104", location: "Substation A", desc: "Temperature exceeds threshold (97°C)", time: "2 min ago" },
  { id: 2, severity: "Warning", equipment: "Circuit Breaker CB-23", location: "North Grid", desc: "Vibration anomaly detected", time: "18 min ago" },
  { id: 3, severity: "Warning", equipment: "Transformer T-87", location: "East Zone", desc: "Oil quality degradation warning", time: "1 hr ago" },
];

function CustomDot(props: { cx?: number; cy?: number; fill?: string }) {
  return <circle cx={props.cx} cy={props.cy} r={3} fill={props.fill} stroke="#fff" strokeWidth={1.5} />;
}


export default function Dashboard() {
  const navigate = useNavigate();
  const { equipment } = useAppStore();
  const [now, setNow] = useState(new Date());

  const totalEq = equipment.length;
  const atRisk = equipment.filter(e => e.status === "Critical" || e.status === "Warning").length;
  const critical = equipment.filter(e => e.status === "Critical").length;
  const healthy = equipment.filter(e => e.status === "Healthy").length;
  const uptime = totalEq > 0 ? (((totalEq - critical) / totalEq) * 100).toFixed(1) : "99.6";

  const PIE_DATA_LIVE = [
    { name: "Healthy", value: healthy, color: C.success },
    { name: "Warning", value: equipment.filter(e => e.status === "Warning").length, color: C.warning },
    { name: "Critical", value: critical, color: C.danger },
  ];

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: C.muted, margin: "4px 0 0" }}>Real-time overview of your power grid health</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{timeStr}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{dateStr}</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20, marginBottom: 24 }}>
        {[
          { label: "Total Equipment", value: totalEq.toLocaleString(), trend: "+2.5%", trendUp: true, bgColor: "rgba(59,130,246,0.08)", iconColor: "#3B82F6", icon: <Cpu size={20} color="#3B82F6" />, link: "/equipment" },
          { label: "At Risk", value: String(atRisk), trend: critical > 0 ? `${critical} critical` : "All stable", trendUp: false, bgColor: "rgba(245,158,11,0.08)", iconColor: "#F59E0B", icon: <AlertTriangle size={20} color="#F59E0B" />, link: "/equipment" },
          { label: "Predicted Outages", value: "5", sub: "Next 7 days", trend: "Next 7 days", trendUp: false, bgColor: "rgba(239,68,68,0.08)", iconColor: "#EF4444", icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>, link: "/predictions" },
          { label: "Uptime", value: `${uptime}%`, trend: "+0.2%", trendUp: true, bgColor: "rgba(34,197,94,0.08)", iconColor: "#22C55E", icon: <CheckCircle size={20} color="#22C55E" />, link: "/dashboard" },
        ].map(k => (
          <Card key={k.label} style={{ padding: 20, cursor: "pointer", transition: "box-shadow 0.15s" }}
            onClick={() => navigate(k.link)}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)")}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.boxShadow = C.cardShadow)}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.text, lineHeight: 1 }}>{k.value}</div>
                {k.sub ? (
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{k.sub}</div>
                ) : (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    marginTop: 8, padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                    background: k.trendUp ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    color: k.trendUp ? C.success : C.danger,
                  }}>
                    {k.trendUp ? "↑" : "↓"} {k.trend}
                  </div>
                )}
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: k.bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {k.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Row 2: Risk Chart + Donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Risk Overview */}
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Risk Overview</h2>
              <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>Equipment risk distribution over time</p>
            </div>
            <span style={{
              background: "rgba(34,197,94,0.1)", color: C.success,
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
            }}>Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={RISK_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.muted }} />
              <YAxis domain={[0, 80]} tick={{ fontSize: 11, fill: C.muted }} />
              <Tooltip
                contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: C.text, fontWeight: 600 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Line type="monotone" dataKey="Normal" stroke={C.primary} strokeWidth={2} dot={<CustomDot fill={C.primary} />} />
              <Line type="monotone" dataKey="Warning" stroke={C.warning} strokeWidth={2} dot={<CustomDot fill={C.warning} />} />
              <Line type="monotone" dataKey="Critical" stroke={C.danger} strokeWidth={2} dot={<CustomDot fill={C.danger} />} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Equipment Status donut */}
        <Card style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Equipment Status</h2>
            <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>Current health breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={PIE_DATA_LIVE} cx="50%" cy="50%"
                innerRadius={55} outerRadius={80}
                paddingAngle={3} dataKey="value"
                label={false}
              >
                {PIE_DATA_LIVE.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 20, fontWeight: 800, fill: C.text }}>{totalEq}</text>
              <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 12, fill: C.muted }}>Total</text>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {PIE_DATA_LIVE.map(p => (
              <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                  <span style={{ fontSize: 13, color: C.text }}>{p.name}</span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.value.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>{totalEq > 0 ? ((p.value / totalEq) * 100).toFixed(1) : "0"}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 3: Recent Alerts + Live Map */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        {/* Recent Alerts */}
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Recent Alerts</h2>
            <button
              onClick={() => navigate("/alerts")}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: C.primary, fontSize: 13, fontWeight: 600,
                padding: 0,
              }}
            >
              View All →
            </button>
          </div>
          <div>
            {RECENT_ALERTS.map((a, i) => (
              <div key={a.id} style={{
                display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 14,
                borderBottom: i < RECENT_ALERTS.length - 1 ? `1px solid ${C.border}` : "none",
                marginBottom: i < RECENT_ALERTS.length - 1 ? 14 : 0,
              }}>
                <span style={{
                  padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: a.severity === "Critical" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                  color: a.severity === "Critical" ? C.danger : C.warning,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {a.severity}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.equipment}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{a.location} — {a.desc}</div>
                </div>
                <span style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>{a.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Map */}
        <Card style={{ padding: 24, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Live Map</h2>
            <span style={{
              display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.success,
            }}>
              <span style={{ width: 6, height: 6, background: C.success, borderRadius: "50%", display: "inline-block" }} />
              Live
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <svg viewBox="0 0 300 200" style={{ width: "100%", borderRadius: 8, background: "#EEF5FF" }}>
              {/* India outline (miniature) */}
              <path d="M 120,18 L 148,19 L 158,26 L 172,24 L 180,32 L 192,34 L 200,40 L 204,52 L 208,62 L 212,72 L 204,84 L 200,92 L 208,100 L 206,112 L 196,118 L 192,128 L 188,138 L 180,146 L 172,154 L 160,162 L 150,164 L 140,162 L 132,160 L 124,156 L 116,150 L 108,142 L 100,132 L 96,120 L 92,108 L 88,96 L 86,84 L 90,72 L 94,60 L 98,48 L 104,38 L 112,28 Z"
                fill="#dbeafe" stroke="#93c5fd" strokeWidth="1" fillOpacity="0.8" />
              {/* Connections */}
              <line x1="125" y1="60" x2="150" y2="72" stroke="#93c5fd" strokeWidth="0.8" strokeDasharray="3 2" />
              <line x1="150" y1="72" x2="190" y2="70" stroke="#93c5fd" strokeWidth="0.8" strokeDasharray="3 2" />
              <line x1="150" y1="72" x2="135" y2="110" stroke="#93c5fd" strokeWidth="0.8" strokeDasharray="3 2" />
              <line x1="135" y1="110" x2="115" y2="130" stroke="#93c5fd" strokeWidth="0.8" strokeDasharray="3 2" />
              <line x1="135" y1="110" x2="155" y2="135" stroke="#93c5fd" strokeWidth="0.8" strokeDasharray="3 2" />
              {/* Equipment markers — India locations */}
              <circle cx="110" cy="68" r="7" fill="#EF4444" stroke="#fff" strokeWidth="1.5" />
              <circle cx="150" cy="72" r="7" fill="#F59E0B" stroke="#fff" strokeWidth="1.5" />
              <circle cx="185" cy="68" r="7" fill="#22C55E" stroke="#fff" strokeWidth="1.5" />
              <circle cx="135" cy="110" r="7" fill="#22C55E" stroke="#fff" strokeWidth="1.5" />
              <circle cx="115" cy="130" r="7" fill="#22C55E" stroke="#fff" strokeWidth="1.5" />
              <circle cx="155" cy="135" r="7" fill="#F59E0B" stroke="#fff" strokeWidth="1.5" />
              {/* Labels */}
              <text x="110" y="64" textAnchor="middle" fontSize="5" fontWeight="700" fill="#fff">T</text>
              <text x="150" y="68" textAnchor="middle" fontSize="5" fontWeight="700" fill="#fff">CB</text>
              <text x="185" y="64" textAnchor="middle" fontSize="5" fontWeight="700" fill="#fff">G</text>
              <text x="135" y="106" textAnchor="middle" fontSize="5" fontWeight="700" fill="#fff">S</text>
              <text x="115" y="126" textAnchor="middle" fontSize="5" fontWeight="700" fill="#fff">T</text>
              <text x="155" y="131" textAnchor="middle" fontSize="5" fontWeight="700" fill="#fff">CB</text>
              {/* Region labels */}
              <text x="95" y="55" fontSize="5" fill="#94a3b8" fontStyle="italic">Gujarat</text>
              <text x="148" y="58" fontSize="5" fill="#94a3b8" fontStyle="italic">Delhi</text>
              <text x="175" y="55" fontSize="5" fill="#94a3b8" fontStyle="italic">W.Bengal</text>
              <text x="118" y="98" fontSize="5" fill="#94a3b8" fontStyle="italic">Maharashtra</text>
              <text x="96" y="118" fontSize="5" fill="#94a3b8" fontStyle="italic">Karnataka</text>
            </svg>
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
            {[{ color: C.success, label: "Healthy" }, { color: C.warning, label: "Warning" }, { color: C.danger, label: "Critical" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.muted }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, display: "inline-block" }} />
                {l.label}
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/maps")}
            style={{
              marginTop: 14, width: "100%", height: 36,
              background: C.primary, color: "#fff", border: "none",
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#1d4ed8")}
            onMouseLeave={e => (e.currentTarget.style.background = C.primary)}
          >
            View Full Map
          </button>
        </Card>
      </div>
    </div>
  );
}
