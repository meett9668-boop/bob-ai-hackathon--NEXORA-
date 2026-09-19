import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { addComplaint, addNotification } from '../../store/nexoraStore';

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

const PROBLEM_TYPES = [
  'Power Outage', 'Flickering Lights', 'No Power to Partial Area',
  'Sparking / Arcing', 'Burning Smell', 'Transformer Noise',
  'Fallen Power Line', 'Other',
] as const;

const TRANSFORMER_MAP: Record<string, string> = {
  'Houston North': 'TX-047',
  'Houston South': 'TX-031',
};

const ADMIN_USER_IDS = ['usr-admin-001'];

const card: React.CSSProperties = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
  padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: C.surface,
  border: `1px solid ${C.border}`, borderRadius: 8,
  color: C.text, padding: '10px 14px', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'Inter, system-ui, sans-serif',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: C.muted,
  marginBottom: 6, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
};

export default function ComplaintForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [photoB64, setPhotoB64] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoB64(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !location.trim() || !problemType || !description.trim()) return;
    const currentUser = user;
    setSubmitting(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      const complaint = addComplaint({
        userId: currentUser.id,
        userName: currentUser.name,
        userRegion: currentUser.region ?? 'Unknown',
        location: location.trim(),
        problemType,
        description: description.trim(),
        urgency,
        status: 'OPEN',
        createdAt: now,
        updatedAt: now,
        linkedTransformerId: currentUser.region ? TRANSFORMER_MAP[currentUser.region] : undefined,
        timeline: [{
          timestamp: now,
          status: 'OPEN',
          message: `Complaint submitted by ${currentUser.name}. Problem type: ${problemType}.`,
          actor: currentUser.name,
        }],
        photoUrl: photoB64,
      });
      for (const adminId of ADMIN_USER_IDS) {
        addNotification({
          userId: adminId,
          message: `New complaint ${complaint.id} from ${currentUser.name}: ${problemType} at ${location.trim()}.`,
          type: urgency === 'critical' || urgency === 'high' ? 'warning' : 'info',
          read: false,
          createdAt: now,
          relatedEntityId: complaint.id,
        });
      }
      setSubmitting(false);
      setSubmitted({ id: complaint.id });
    }, 800);
  }

  if (submitted) {
    return (
      <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 600 }}>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>Complaint Submitted!</div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
            Your complaint has been received. Our team will review it shortly.
          </div>
          <div style={{ background: '#EFF6FF', border: `1px solid #BFDBFE`, borderRadius: 10, padding: '16px', marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Complaint ID</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.primary, fontFamily: 'monospace' }}>{submitted.id}</div>
            <div style={{ fontSize: 12, color: C.success, marginTop: 6, fontWeight: 600 }}>STATUS: OPEN</div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/user/complaints')}
              style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >View My Complaints</button>
            <button
              onClick={() => navigate('/user')}
              style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const urgencyConfig = {
    low:      { bg: '#F0FDF4', border: '#86EFAC', color: '#16A34A', label: 'Low' },
    medium:   { bg: '#F8FAFC', border: '#CBD5E1', color: '#475569', label: 'Medium' },
    high:     { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', label: 'High' },
    critical: { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', label: 'Critical' },
  };

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif', color: C.text, maxWidth: 780 }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Report a Problem</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Submit a service issue or infrastructure concern in your area</p>
        </div>
        <button
          onClick={() => navigate('/user')}
          style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >← Cancel</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Location */}
          <div>
            <label style={labelStyle}>Location / Address *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 123 Main St, Houston North, or intersection of Oak Ave & 5th"
              required
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = C.primary)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          {/* Problem Type */}
          <div>
            <label style={labelStyle}>Problem Type *</label>
            <select
              value={problemType}
              onChange={(e) => setProblemType(e.target.value)}
              required
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => (e.target.style.borderColor = C.primary)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            >
              <option value="">Select problem type…</option>
              {PROBLEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you're experiencing — include any details about affected equipment, when it started, and how widespread the issue appears to be."
              required
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
              onFocus={e => (e.target.style.borderColor = C.primary)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          {/* Urgency */}
          <div>
            <label style={labelStyle}>Urgency Level *</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(['low', 'medium', 'high', 'critical'] as const).map((level) => {
                const cfg = urgencyConfig[level];
                const selected = urgency === level;
                return (
                  <label
                    key={level}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8,
                      border: `1.5px solid ${selected ? cfg.border : C.border}`,
                      background: selected ? cfg.bg : C.surface,
                      color: selected ? cfg.color : C.muted,
                      cursor: 'pointer', fontSize: 13, fontWeight: selected ? 700 : 400,
                      textTransform: 'capitalize', transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="radio" name="urgency" value={level}
                      checked={selected} onChange={() => setUrgency(level)}
                      style={{ display: 'none' }}
                    />
                    {level}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label style={labelStyle}>
              Photo (optional)
              <span style={{ color: C.muted, textTransform: 'none', fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>
                — Stored locally in your browser for this demo session
              </span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${C.border}`, borderRadius: 8,
                padding: '20px', textAlign: 'center', color: C.muted,
                fontSize: 13, cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
            >
              {photoB64 ? (
                <div>
                  <img src={photoB64} alt="preview" style={{ maxHeight: 120, borderRadius: 6 }} />
                  <div style={{ marginTop: 8, color: C.success, fontSize: 12, fontWeight: 600 }}>Photo attached ✓</div>
                </div>
              ) : (
                <>📎 Click to attach a photo</>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          </div>

          {/* Submit row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            <button
              type="button"
              onClick={() => navigate('/user')}
              style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting ? '#93C5FD' : C.primary,
                border: 'none', borderRadius: 8,
                color: '#fff', fontSize: 14, fontWeight: 600,
                padding: '10px 28px',
                cursor: submitting ? 'default' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
