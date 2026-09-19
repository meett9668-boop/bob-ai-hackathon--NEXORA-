import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getComplaintsByUser, getIncidents, getNotificationsByUser } from '../../store/nexoraStore';
import type { NexoraComplaint, NexoraIncident, NexoraNotification } from '../../types/extended';

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

const TRANSFORMER_MAP: Record<string, { id: string; name: string; health: number; load: number; temp: number; condition: string; lastUpdated: string }> = {
  'Houston North': { id: 'TX-047', name: 'Houston North Transformer', health: 62, load: 87, temp: 78, condition: 'warning', lastUpdated: '2 min ago' },
  'Houston South': { id: 'TX-031', name: 'Houston South Transformer', health: 71, load: 74, temp: 71, condition: 'warning', lastUpdated: '5 min ago' },
};

function HealthBar({ score }: { score: number }) {
  const color = score >= 75 ? C.success : score >= 50 ? C.warning : C.danger;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 36 }}>{score}%</span>
    </div>
  );
}

function ConditionBadge({ condition }: { condition: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    critical: { bg: '#FEE2E2', color: '#DC2626', label: 'Critical' },
    warning:  { bg: '#FEF3C7', color: '#D97706', label: 'Warning' },
    normal:   { bg: '#DCFCE7', color: '#16A34A', label: 'Normal' },
  };
  const s = map[condition] ?? map.normal;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
      {s.label}
    </span>
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
  };
  const c = map[s] ?? { bg: C.border, color: C.muted };
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {s}
    </span>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<NexoraComplaint[]>([]);
  const [incidents, setIncidents] = useState<NexoraIncident[]>([]);
  const [notifications, setNotifications] = useState<NexoraNotification[]>([]);

  useEffect(() => {
    function refresh() {
      if (!user) return;
      setComplaints(getComplaintsByUser(user.id));
      setIncidents(getIncidents().filter((i) => i.region === user.region));
      setNotifications(getNotificationsByUser(user.id).filter((n) => !n.read));
    }
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [user]);

  if (!user) return null;

  const transformer = user.region ? TRANSFORMER_MAP[user.region] : null;
  const openComplaints = complaints.filter((c) => c.status !== 'RESOLVED').length;
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const unread = notifications.length;

  const conditionMsg: Record<string, string> = {
    critical: 'This transformer is in a CRITICAL state. Emergency repairs may be in progress.',
    warning:  'This transformer is showing WARNING signs. Increased monitoring is active.',
    normal:   'This transformer is operating normally. No issues detected.',
  };

  const card: React.CSSProperties = {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
    padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  };

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif', color: C.text, maxWidth: 1200 }}>

      {/* Page title */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Welcome back, {user.name}</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
          Region: <strong>{user.region ?? 'All Regions'}</strong> · Customer Portal
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Open Complaints',     value: openComplaints,       color: openComplaints > 0 ? C.warning : C.success,  bg: openComplaints > 0 ? '#FEF3C7' : '#DCFCE7' },
          { label: 'Active Area Incidents', value: activeIncidents.length, color: activeIncidents.length > 0 ? C.danger : C.success, bg: activeIncidents.length > 0 ? '#FEE2E2' : '#DCFCE7' },
          { label: 'Unread Notifications', value: unread,               color: C.primary,   bg: '#DBEAFE' },
          { label: 'Area Health Score',    value: transformer ? `${transformer.health}%` : 'N/A', color: C.primary, bg: '#EFF6FF' },
        ].map((stat) => (
          <div key={stat.label} style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Transformer card */}
        {transformer ? (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                My Nearest Transformer
              </div>
              <ConditionBadge condition={transformer.condition} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 2 }}>{transformer.id}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
              {transformer.name} · Last updated {transformer.lastUpdated}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Health Score</div>
                <HealthBar score={transformer.health} />
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: C.muted }}>Load</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: transformer.load > 85 ? C.warning : C.success }}>{transformer.load}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: C.muted }}>Temperature</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: transformer.temp > 75 ? C.warning : C.success }}>{transformer.temp}°C</div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5, padding: '10px 14px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
              {conditionMsg[transformer.condition] ?? conditionMsg.normal}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => navigate('/user/transformer')}
                style={{ flex: 1, background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >View Transformer</button>
              <button
                onClick={() => navigate('/user/complaints/new')}
                style={{ flex: 1, background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >Report Problem</button>
            </div>
          </div>
        ) : (
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: C.muted, fontSize: 13 }}>No transformer assigned to your region.</div>
          </div>
        )}

        {/* Incidents card */}
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Active Incidents in My Area
          </div>
          {activeIncidents.length === 0 ? (
            <div style={{ color: C.success, fontSize: 13, textAlign: 'center', padding: '32px 0', fontWeight: 600 }}>
              ✓ No active incidents in your area
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeIncidents.slice(0, 4).map((inc) => (
                <div key={inc.id} style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.danger }}>{inc.id}</span>
                    <StatusBadge status={inc.status} />
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{inc.type}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {inc.customersAffected.toLocaleString()} customers affected · ETA: {inc.estimatedRepairTime}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'View Transformer', icon: '⚡', path: '/user/transformer', accent: C.primary, bg: '#EFF6FF' },
          { label: 'Report a Problem', icon: '🔧', path: '/user/complaints/new', accent: C.warning, bg: '#FFFBEB' },
          { label: 'My Complaints',    icon: '📋', path: '/user/complaints', accent: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Outage Status',    icon: '📊', path: '/predictions', accent: C.success, bg: '#F0FDF4' },
        ].map((nav) => (
          <button
            key={nav.label}
            onClick={() => navigate(nav.path)}
            style={{
              background: nav.bg, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '20px 16px',
              cursor: 'pointer', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              transition: 'box-shadow 0.15s, border-color 0.15s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; e.currentTarget.style.borderColor = nav.accent; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = C.border; }}
          >
            <div style={{ fontSize: 26 }}>{nav.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: nav.accent }}>{nav.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
