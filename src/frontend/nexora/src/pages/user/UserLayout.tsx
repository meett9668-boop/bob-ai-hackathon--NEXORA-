import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getNotificationsByUser } from "../../store/nexoraStore";
import {
  LayoutDashboard, Zap, ClipboardList, Bell, LogOut,
  ChevronLeft, ChevronRight, PlusCircle,
} from "lucide-react";

const USER_NAV = [
  { label: "My Dashboard",    icon: LayoutDashboard, path: "/user" },
  { label: "Transformer",     icon: Zap,             path: "/user/transformer" },
  { label: "My Complaints",   icon: ClipboardList,   path: "/user/complaints" },
  { label: "Report a Problem",icon: PlusCircle,      path: "/user/complaints/new" },
  { label: "Notifications",   icon: Bell,            path: "/user/notifications" },
];

const C = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  text: "#1E293B",
  muted: "#64748B",
  primary: "#3B82F6",
  sidebar: "#0F2645",
  sidebarActive: "#3B82F6",
  sidebarText: "rgba(255,255,255,0.7)",
  sidebarTextActive: "#FFFFFF",
  sidebarBorder: "rgba(255,255,255,0.08)",
};

const SIDEBAR_W = 240;
const HEADER_H = 64;

interface UserLayoutProps { children: React.ReactNode }

export default function UserLayout({ children }: UserLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const sidebarWidth = collapsed ? 68 : SIDEBAR_W;

  function handleLogout() { logout(); navigate("/login"); }

  const googleUser = user as (typeof user & { photoUrl?: string; loginMethod?: string }) | null;
  const displayName = googleUser?.name ?? "Customer";
  const displayEmail = googleUser?.email ?? "";
  const photoUrl = googleUser?.photoUrl;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  // Count unread notifications
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!user) return;
    const refresh = () => {
      const notifs = getNotificationsByUser(user.id);
      setUnread(notifs.filter((n) => !n.read).length);
    };
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [user]);

  const SidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? "20px 0" : "20px 20px",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        borderBottom: `1px solid ${C.sidebarBorder}`,
        height: HEADER_H, boxSizing: "border-box",
      }}>
        {!collapsed && (
          <button
            onClick={() => navigate("/user")}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg,#3B82F6,#38bdf8)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="rgba(255,255,255,0.3)" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", letterSpacing: "-0.2px", lineHeight: 1 }}>NEXORA</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Customer Portal</div>
            </div>
          </button>
        )}
        {collapsed && (
          <button onClick={() => navigate("/user")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg,#3B82F6,#38bdf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="rgba(255,255,255,0.3)" />
              </svg>
            </div>
          </button>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: C.sidebarText, padding: 4, borderRadius: 4, display: "flex", alignItems: "center",
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
        {!collapsed && (
          <div style={{ padding: "0 16px 8px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            My Portal
          </div>
        )}
        {USER_NAV.map(item => {
          const active = location.pathname === item.path || (item.path !== "/user" && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              style={{
                width: "100%", background: active ? C.sidebarActive : "transparent",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center",
                gap: collapsed ? 0 : 12,
                padding: collapsed ? "12px 0" : "11px 20px",
                justifyContent: collapsed ? "center" : "flex-start",
                color: active ? C.sidebarTextActive : C.sidebarText,
                fontSize: 14, fontWeight: active ? 600 : 400,
                transition: "background 0.15s, color 0.15s",
                position: "relative",
                marginBottom: 2,
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Icon size={18} />
              {!collapsed && (
                <span style={{ flex: 1, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {item.label}
                  {item.path === "/user/notifications" && unread > 0 && (
                    <span style={{
                      background: "#EF4444", color: "#fff", borderRadius: 10,
                      fontSize: 10, fontWeight: 700, padding: "1px 6px", marginLeft: 6,
                    }}>{unread}</span>
                  )}
                </span>
              )}
            </button>
          );
        })}

        {/* Divider to admin dashboard */}
        {!collapsed && user?.role === "admin" && (
          <>
            <div style={{ margin: "12px 20px", borderTop: `1px solid ${C.sidebarBorder}` }} />
            <div style={{ padding: "0 16px 8px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Admin Access
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                width: "100%", background: "transparent", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12, padding: "11px 20px",
                color: C.sidebarText, fontSize: 14, fontWeight: 400,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <LayoutDashboard size={18} />
              <span>Admin Dashboard</span>
            </button>
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{
        padding: collapsed ? "16px 0" : "16px 20px",
        borderTop: `1px solid ${C.sidebarBorder}`,
        display: "flex", alignItems: "center",
        gap: collapsed ? 0 : 12,
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        {photoUrl ? (
          <img src={photoUrl} alt={displayName} referrerPolicy="no-referrer"
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255,255,255,0.2)" }} />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg,#10b981,#3B82F6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
        )}
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Customer</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.4)", padding: 4,
                display: "flex", alignItems: "center", borderRadius: 4,
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth,
        background: C.sidebar, height: "100vh",
        position: "sticky", top: 0, flexShrink: 0,
        transition: "width 0.2s, min-width 0.2s, max-width 0.2s",
        zIndex: 30, overflowX: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {SidebarContent}
      </aside>

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <header ref={bellRef} style={{
          height: HEADER_H, background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center",
          padding: "0 24px", gap: 16,
          position: "sticky", top: 0, zIndex: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: C.muted }}>
              <span style={{ color: C.primary, fontWeight: 600 }}>NEXORA</span> Customer Portal
            </div>
          </div>

          {/* Notification bell */}
          <button
            onClick={() => navigate("/user/notifications")}
            style={{
              position: "relative", background: "transparent",
              border: `1px solid transparent`,
              cursor: "pointer", padding: 8, borderRadius: 8,
              display: "flex", alignItems: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <Bell size={18} color={C.muted} />
            {unread > 0 && (
              <span style={{
                position: "absolute", top: 5, right: 5,
                width: 16, height: 16, borderRadius: "50%",
                background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid #fff",
              }}>{unread > 9 ? "9+" : unread}</span>
            )}
          </button>

          {/* User badge */}
          <button
            onClick={() => navigate("/user")}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "transparent", border: "none", cursor: "pointer",
              padding: "4px 8px", borderRadius: 8,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={displayName} referrerPolicy="no-referrer"
                style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.border}` }} />
            ) : (
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg,#10b981,#3B82F6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 13, fontWeight: 700,
              }}>
                {initials}
              </div>
            )}
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{displayName}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{displayEmail || "Customer"}</div>
            </div>
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
