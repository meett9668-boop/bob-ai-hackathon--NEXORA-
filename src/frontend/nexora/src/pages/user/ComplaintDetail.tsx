import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getComplaintById } from '../../store/nexoraStore';
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

const STATUS_STEPS = ['OPEN', 'UNDER REVIEW', 'ASSIGNED', 'INVESTIGATING', 'REPAIR IN PROGRESS', 'RESOLVED'];

const card: React.CSSProperties = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
  padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: C.border, color: C.muted };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {status}
    </span>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function ComplaintDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<NexoraComplaint | null>(null);

  useEffect(() => {
    function refresh() {
      if (!id) return;
      setComplaint(getComplaintById(id) ?? null);
    }
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, [id]);

  if (!user) return null;

  if (!complaint) {
    return (
      <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Complaint not found.</div>
        <button
          onClick={() => navigate('/user/complaints')}
          style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >← Back to My Complaints</button>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(complaint.status);

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif', color: C.text, maxWidth: 820 }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>{complaint.id}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>{complaint.problemType} · {complaint.location}</p>
        </div>
        <button
          onClick={() => navigate('/user/complaints')}
          style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >← My Complaints</button>
      </div>

      {/* Status stepper */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Status</span>
          <StatusPill status={complaint.status} />
        </div>
        <div style={{ display: 'flex' }}>
          {STATUS_STEPS.map((step, idx) => {
            const done = idx < currentStepIdx;
            const current = idx === currentStepIdx;
            const sc = STATUS_COLORS[step] ?? { bg: C.border, color: C.muted };
            return (
              <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {idx > 0 && (
                  <div style={{
                    position: 'absolute', top: 9, right: '50%', left: '-50%', height: 2,
                    background: done || current ? C.primary : C.border,
                  }} />
                )}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', zIndex: 1,
                  background: done ? C.primary : current ? sc.bg : C.bg,
                  border: `2px solid ${done || current ? sc.color : C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {done && <span style={{ fontSize: 10, color: '#fff', fontWeight: 800 }}>✓</span>}
                  {current && <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, display: 'block' }} />}
                </div>
                <div style={{
                  fontSize: 9, color: done || current ? sc.color : C.muted,
                  textAlign: 'center', marginTop: 5, fontWeight: current ? 700 : 400,
                  textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2, padding: '0 2px',
                }}>{step}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details & description */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={card}>
          <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, fontWeight: 600 }}>Complaint Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Problem Type',       value: complaint.problemType },
              { label: 'Location',           value: complaint.location },
              { label: 'Urgency',            value: complaint.urgency.toUpperCase(), color: URGENCY_COLORS[complaint.urgency] },
              { label: 'Linked Transformer', value: complaint.linkedTransformerId ?? '—' },
              { label: 'Assigned Team',      value: complaint.assignedTeam ?? 'Not yet assigned' },
              { label: 'Submitted',          value: formatTime(complaint.createdAt) },
              { label: 'Last Updated',       value: formatTime(complaint.updatedAt) },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: C.muted }}>{row.label}</span>
                <span style={{ color: row.color ?? C.text, fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, fontWeight: 600 }}>Description</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{complaint.description}</div>
          {complaint.adminNotes && (
            <>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>Admin Notes</div>
              <div style={{ fontSize: 13, color: C.primary, lineHeight: 1.6 }}>{complaint.adminNotes}</div>
            </>
          )}
          {complaint.status === 'RESOLVED' && (
            <div style={{ marginTop: 14, padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.success }}>✓ Issue Resolved</div>
              <div style={{ fontSize: 12, color: '#16A34A', marginTop: 4 }}>Your complaint has been resolved. Thank you for your report.</div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div style={card}>
        <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, fontWeight: 600 }}>Activity Timeline</div>
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: C.border, borderRadius: 2 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...complaint.timeline].reverse().map((ev, idx) => (
              <div key={idx} style={{ position: 'relative', paddingLeft: 8 }}>
                <div style={{
                  position: 'absolute', left: -22, top: 3,
                  width: 10, height: 10, borderRadius: '50%',
                  background: C.primary, border: `2px solid #BFDBFE`,
                }} />
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{formatTime(ev.timestamp)}</div>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{ev.message}</div>
                {ev.actor && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>— {ev.actor}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
