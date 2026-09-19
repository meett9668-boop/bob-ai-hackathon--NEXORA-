import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getNotificationsByUser, markNotificationRead, markAllNotificationsRead } from '../../store/nexoraStore';
import type { NexoraNotification } from '../../types/extended';

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

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  info:    { icon: 'ℹ️', color: C.primary,  bg: '#EFF6FF', border: '#BFDBFE' },
  warning: { icon: '⚠️', color: C.warning,  bg: '#FFFBEB', border: '#FDE68A' },
  success: { icon: '✅', color: C.success,  bg: '#F0FDF4', border: '#BBF7D0' },
  danger:  { icon: '🚨', color: C.danger,   bg: '#FEF2F2', border: '#FECACA' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function UserNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NexoraNotification[]>([]);

  useEffect(() => {
    function refresh() {
      if (!user) return;
      setNotifications(getNotificationsByUser(user.id));
    }
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [user]);

  if (!user) return null;

  const unread = notifications.filter((n) => !n.read).length;

  function handleMarkRead(id: string) {
    markNotificationRead(id);
    setNotifications(getNotificationsByUser(user!.id));
  }

  function handleMarkAll() {
    markAllNotificationsRead(user!.id);
    setNotifications(getNotificationsByUser(user!.id));
  }

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif', color: C.text, maxWidth: 820 }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Notifications</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
            {unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >Mark All Read</button>
          )}
          <button
            onClick={() => navigate('/user')}
            style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >← Dashboard</button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔔</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>No notifications</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
            You&apos;ll receive updates here about your complaints and area incidents.
          </div>
          <button
            onClick={() => navigate('/user')}
            style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >Back to Dashboard</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
            return (
              <div
                key={n.id}
                style={{
                  background: n.read ? C.surface : cfg.bg,
                  border: `1px solid ${n.read ? C.border : cfg.border}`,
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  opacity: n.read ? 0.75 : 1,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'opacity 0.15s',
                }}
              >
                <div style={{ fontSize: 20, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>{cfg.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: n.read ? C.muted : C.text, lineHeight: 1.5, fontWeight: n.read ? 400 : 500 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                </div>
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    style={{
                      background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6,
                      color: C.primary, fontSize: 12, fontWeight: 600,
                      padding: '4px 12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >Mark Read</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
