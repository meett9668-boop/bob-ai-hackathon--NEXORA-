import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getIncidents } from '../../store/nexoraStore';

const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  muted: '#64748B',
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
};

const card: React.CSSProperties = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
  padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

const TRANSFORMER_MAP: Record<string, {
  id: string; name: string; location: string; health: number; load: number; temp: number;
  condition: string; lastUpdated: string; voltage: string; capacity: string;
}> = {
  'Houston North': {
    id: 'TX-047', name: 'Houston North Primary Transformer', location: 'Substation Alpha, Houston North',
    health: 62, load: 87, temp: 78, condition: 'warning', lastUpdated: '2 min ago',
    voltage: '138 kV', capacity: '450 MVA',
  },
  'Houston South': {
    id: 'TX-031', name: 'Houston South Primary Transformer', location: 'Substation Delta, Houston South',
    health: 71, load: 74, temp: 71, condition: 'warning', lastUpdated: '5 min ago',
    voltage: '115 kV', capacity: '380 MVA',
  },
};

const conditionConfig: Record<string, { title: string; text: string; bg: string; border: string; color: string; badge: string; badgeBg: string }> = {
  critical: {
    title: 'Critical Condition',
    text: 'This transformer is in a CRITICAL state. Emergency maintenance teams have been notified. Service interruptions are possible. Our crews are working to restore full capacity as quickly as possible.',
    bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', badge: 'Critical', badgeBg: '#FEE2E2',
  },
  warning: {
    title: 'Elevated Monitoring',
    text: 'This transformer is showing elevated load and temperature readings. Our engineering team is actively monitoring this unit. Minor performance degradation may be observed. No immediate outages are expected, but maintenance is being planned.',
    bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', badge: 'Warning', badgeBg: '#FEF3C7',
  },
  normal: {
    title: 'Normal Operation',
    text: 'This transformer is operating within all normal parameters. No issues detected. Regular scheduled maintenance is keeping this unit in optimal condition.',
    bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A', badge: 'Normal', badgeBg: '#DCFCE7',
  },
};

function HealthBar({ score, large }: { score: number; large?: boolean }) {
  const color = score >= 75 ? C.success : score >= 50 ? C.warning : C.danger;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: large ? 12 : 8, background: C.border, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: large ? 16 : 13, fontWeight: 700, color, minWidth: 40 }}>{score}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const map: Record<string, { bg: string; color: string }> = {
    'RESOLVED':          { bg: '#DCFCE7', color: '#16A34A' },
    'OPEN':              { bg: '#DBEAFE', color: '#1D4ED8' },
    'UNDER REVIEW':      { bg: '#FEF3C7', color: '#D97706' },
    'ASSIGNED':          { bg: '#EDE9FE', color: '#7C3AED' },
    'INVESTIGATING':     { bg: '#FEF3C7', color: '#D97706' },
    'REPAIR IN PROGRESS':{ bg: '#DBEAFE', color: '#1D4ED8' },
    'IN PROGRESS':       { bg: '#DBEAFE', color: '#1D4ED8' },
  };
  const c = map[s] ?? { bg: C.border, color: C.muted };
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {s}
    </span>
  );
}

export default function UserTransformerView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const transformer = user.region ? TRANSFORMER_MAP[user.region] : null;

  if (!transformer) {
    return (
      <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>No transformer found for your region.</div>
        <button
          onClick={() => navigate('/user')}
          style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >← Back to Dashboard</button>
      </div>
    );
  }

  const cfg = conditionConfig[transformer.condition] ?? conditionConfig.normal;
  const areaIncidents = getIncidents().filter((i) => i.region === user.region && i.status !== 'RESOLVED');

  const metrics = [
    { label: 'Voltage',     value: transformer.voltage,         color: C.primary },
    { label: 'Capacity',    value: transformer.capacity,        color: '#7C3AED' },
    { label: 'Load',        value: `${transformer.load}%`,      color: transformer.load > 85 ? C.warning : C.success },
    { label: 'Temperature', value: `${transformer.temp}°C`,     color: transformer.temp > 75 ? C.warning : C.success },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif', color: C.text, maxWidth: 1000 }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>{transformer.id} — Transformer Status</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>{transformer.location} · Public-facing status view</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/user/complaints/new')}
            style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >Report a Problem</button>
          <button
            onClick={() => navigate('/user')}
            style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >← Back to Dashboard</button>
        </div>
      </div>

      {/* Status card */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{transformer.name}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{transformer.location}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Last updated: {transformer.lastUpdated}</div>
          </div>
          <span style={{ background: cfg.badgeBg, color: cfg.color, borderRadius: 6, padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>
            {cfg.badge}
          </span>
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {metrics.map((m) => (
            <div key={m.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Health bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 8, fontWeight: 500 }}>Health Score</div>
          <HealthBar score={transformer.health} large />
        </div>

        {/* Condition explanation */}
        <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: cfg.color, marginBottom: 6 }}>{cfg.title}</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{cfg.text}</div>
        </div>
      </div>

      {/* Recent incidents */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          Recent Incidents in Your Area
        </div>
        {areaIncidents.length === 0 ? (
          <div style={{ color: C.success, fontSize: 13, textAlign: 'center', padding: '24px 0', fontWeight: 600 }}>
            ✓ No active incidents — your area is operating normally
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {areaIncidents.map((inc) => (
              <div key={inc.id} style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{inc.type}</span>
                  <StatusBadge status={inc.status} />
                </div>
                <div style={{ fontSize: 13, color: C.muted }}>
                  Affecting approximately {inc.customersAffected.toLocaleString()} customers · Est. repair: {inc.estimatedRepairTime}
                </div>
                {inc.assignedCrew && (
                  <div style={{ fontSize: 12, color: C.success, marginTop: 4, fontWeight: 500 }}>✓ Repair crew assigned · {inc.assignedCrew}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
