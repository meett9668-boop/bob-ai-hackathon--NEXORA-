import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line, ResponsiveContainer,
} from "recharts";
import { fetchAnalytics } from "../../api/client";
import { TrendingUp, Activity, Cpu, AlertTriangle } from "lucide-react";

const C = {
  bg: "#F8FAFC", surface: "#FFFFFF", border: "#E2E8F0",
  text: "#1E293B", muted: "#64748B", primary: "#3B82F6",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  cardShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
};

const COLORS = [C.danger, C.warning, "#a78bfa", C.success, C.primary];

function KPICard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: C.cardShadow, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: C.muted }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, badge }: { title: string; children: React.ReactNode; badge?: string }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.cardShadow, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
        {badge && (
          <span style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 10, color: C.muted }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// Static demo data for charts — clearly labelled as NEXORA DEMO DATASET
const HEALTH_TREND = [
  { month: "Apr", healthy: 62, warning: 25, critical: 8 },
  { month: "May", healthy: 58, warning: 28, critical: 9 },
  { month: "Jun", healthy: 64, warning: 24, critical: 7 },
  { month: "Jul", healthy: 60, warning: 27, critical: 8 },
  { month: "Aug", healthy: 55, warning: 30, critical: 10 },
  { month: "Sep", healthy: 60, warning: 27, critical: 11 },
];

const RISK_BY_TYPE = [
  { type: "Transformer", avgRisk: 52, count: 3 },
  { type: "Circuit Breaker", avgRisk: 44, count: 3 },
  { type: "Generator", avgRisk: 11, count: 2 },
  { type: "Feeder", avgRisk: 42, count: 1 },
  { type: "Substation", avgRisk: 9, count: 1 },
];

const FAILURE_TYPES = [
  { type: "Thermal", count: 12 },
  { type: "Insulation", count: 8 },
  { type: "Mechanical", count: 6 },
  { type: "Electrical", count: 9 },
  { type: "Environmental", count: 4 },
];

const REGION_RISK = [
  { region: "Gujarat", risk: 80 },
  { region: "Delhi", risk: 45 },
  { region: "W. Bengal", risk: 38 },
  { region: "Maharashtra", risk: 42 },
  { region: "Tamil Nadu", risk: 8 },
  { region: "Karnataka", risk: 9 },
  { region: "Rajasthan", risk: 12 },
  { region: "Uttar Pradesh", risk: 11 },
];

export default function AnalyticsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apiData, setApiData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then(d => { setApiData(d); setLoading(false); })
      .catch(() => { setApiData(null); setLoading(false); });
  }, []);

  // Use API data if available, otherwise fall back to static demo data
  const totalAssets = apiData?.total_assets ?? 10;
  const totalIncidents = apiData?.total_incidents ?? 39;
  const customersAtRisk = apiData?.customers_at_risk ?? 247500;
  const avgRisk = apiData?.avg_risk_score ? Math.round(apiData.avg_risk_score * 100) : 36;

  const riskDist: { name: string; value: number }[] = apiData?.risk_distribution ?? [
    { name: "Critical (>65%)", value: 2 },
    { name: "Warning (45-65%)", value: 3 },
    { name: "Moderate (25-45%)", value: 2 },
    { name: "Low (<25%)", value: 3 },
  ];

  const healthDist: { name: string; value: number }[] = apiData?.health_distribution ?? [
    { name: "Healthy", value: 5 },
    { name: "Warning", value: 3 },
    { name: "Critical", value: 2 },
  ];

  if (loading) {
    return (
      <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <div style={{ fontSize: 14, color: C.muted }}>Loading analytics…</div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: 14, color: C.muted, margin: "4px 0 0" }}>Grid intelligence trends and asset performance</p>
        </div>
        <span style={{ background: "rgba(245,158,11,0.1)", color: C.warning, border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600 }}>
          NEXORA DEMO DATASET
        </span>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        <KPICard icon={<Cpu size={22} color={C.primary} />} label="Total Assets" value={totalAssets} color={C.primary} />
        <KPICard icon={<AlertTriangle size={22} color={C.danger} />} label="Incidents" value={totalIncidents} sub="Last 90 days" color={C.danger} />
        <KPICard icon={<Activity size={22} color={C.warning} />} label="Avg Risk Score" value={`${avgRisk}%`} color={C.warning} />
        <KPICard icon={<TrendingUp size={22} color={C.success} />} label="Customers at Risk" value={customersAtRisk.toLocaleString()} color={C.success} />
      </div>

      {/* Row 1: Health Trend + Risk Distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 20 }}>
        <ChartCard title="Equipment Health Trend (6 months)" badge="DEMO">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={HEALTH_TREND} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} />
              <YAxis tick={{ fontSize: 11, fill: C.muted }} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="healthy" stroke={C.success} strokeWidth={2} dot={false} name="Healthy" />
              <Line type="monotone" dataKey="warning" stroke={C.warning} strokeWidth={2} dot={false} name="Warning" />
              <Line type="monotone" dataKey="critical" stroke={C.danger} strokeWidth={2} dot={false} name="Critical" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risk Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={riskDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" label={false}>
                {riskDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {riskDist.map((d, i) => (
              <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "inline-block" }} />
                  <span style={{ color: C.text }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: 600, color: C.text }}>{d.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Risk by Type + Region */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <ChartCard title="Average Risk by Equipment Type" badge="DEMO">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={RISK_BY_TYPE} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: C.muted }} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 11, fill: C.muted }} width={100} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${Number(v)}%`, "Avg Risk"]} />
              <Bar dataKey="avgRisk" name="Avg Risk %" radius={[0, 4, 4, 0]}>
                {RISK_BY_TYPE.map((entry, i) => (
                  <Cell key={i} fill={entry.avgRisk >= 50 ? C.danger : entry.avgRisk >= 35 ? C.warning : C.success} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risk by Region" badge="DEMO">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={REGION_RISK} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="region" tick={{ fontSize: 9, fill: C.muted }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: C.muted }} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${Number(v)}%`, "Risk"]} />
              <Bar dataKey="risk" name="Risk %" radius={[4, 4, 0, 0]}>
                {REGION_RISK.map((entry, i) => (
                  <Cell key={i} fill={entry.risk >= 65 ? C.danger : entry.risk >= 35 ? C.warning : C.success} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Failure types + Health distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <ChartCard title="Incidents by Failure Type" badge="DEMO">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={FAILURE_TYPES} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: C.muted }} />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 11, fill: C.muted }} width={90} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" name="Incidents" fill={C.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Asset Health Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={healthDist} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={{ stroke: C.muted, strokeWidth: 1 }}
              >
                {healthDist.map((entry, i) => (
                  <Cell key={i} fill={entry.name === "Healthy" ? C.success : entry.name === "Warning" ? C.warning : C.danger} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
