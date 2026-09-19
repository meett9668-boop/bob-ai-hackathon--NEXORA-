import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getComplaintsByUser } from '../../store/nexoraStore';
import type { NexoraComplaint } from '../../types/extended';

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

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'OPEN':               { bg: '#DBEAFE', color: '#1D4ED8' },
  'UNDER REVIEW':       { bg: '#FEF3C7', color: '#D97706' },
  'ASSIGNED':           { bg: '#EDE9FE', color: '#7C3AED' },
  'INVESTIGATING':      { bg: '#FEF3C7', color: '#D97706' },
  'REPAIR IN PROGRESS': { bg: '#DBEAFE', color: '#1D4ED8' },
  'RESOLVED':           { bg: '#DCFCE7', color: '#16A34A' },
};

const URGENCY_COLORS: Record<string, string> = {
  low: C.success, medium: C.muted, high: C.warning, critical: C.danger,
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: C.border, color: C.muted };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {status}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function MyComplaints() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<NexoraComplaint[]>([]);

  useEffect(() => {
    function refresh() {
      if (!user) return;
      setComplaints(getComplaintsByUser(user.id));
    }
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [user]);

  if (!user) return null;

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif', color: C.text, maxWidth: 900 }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>My Complaints</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
            {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} submitted
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/user/complaints/new')}
            style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >+ New Complaint</button>
          <button
            onClick={() => navigate('/user')}
            style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >← Dashboard</button>
        </div>
      </div>

      {complaints.length === 0 ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>No complaints yet</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
            If you're experiencing a power issue in your area, let us know.
          </div>
          <button
            onClick={() => navigate('/user/complaints/new')}
            style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >Report a Problem</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {complaints.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/user/complaints/${c.id}`)}
              style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '16px 20px', cursor: 'pointer',
                display: 'flex', alignItems: 'flex-start', gap: 16,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; e.currentTarget.style.borderColor = C.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = C.border; }}
            >
              {/* Urgency indicator */}
              <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: URGENCY_COLORS[c.urgency] ?? C.muted, flexShrink: 0 }} />

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.primary, fontFamily: 'monospace' }}>{c.id}</span>
                  <StatusPill status={c.status} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>{c.problemType}</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>📍 {c.location}</div>
                <div style={{ display: 'flex', gap: 24, fontSize: 12, color: C.muted }}>
                  <span>Urgency: <span style={{ color: URGENCY_COLORS[c.urgency], fontWeight: 600 }}>{c.urgency.toUpperCase()}</span></span>
                  <span>Submitted: {timeAgo(c.createdAt)}</span>
                  {c.assignedTeam && <span>Team: {c.assignedTeam}</span>}
                </div>
              </div>

              <div style={{ color: C.muted, fontSize: 18, alignSelf: 'center' }}>›</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
