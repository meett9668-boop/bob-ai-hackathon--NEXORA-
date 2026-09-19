import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAppStore } from "../../store/appStore";
import {
  LayoutDashboard, Cpu, TrendingUp, Bell, FileText, Map, Settings,
  LogOut, Search, ChevronLeft, ChevronRight, X, CheckCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Equipment", icon: Cpu, path: "/equipment" },
  { label: "Predictions", icon: TrendingUp, path: "/predictions" },
  { label: "Alerts", icon: Bell, path: "/alerts" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Maps", icon: Map, path: "/maps" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const C = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  text: "#1E293B",
  muted: "#64748B",
  primary: "#3B82F6",
  hover: "#2563EB",
  sidebar: "#0F2645",
  sidebarActive: "#3B82F6",
  sidebarText: "rgba(255,255,255,0.7)",
  sidebarTextActive: "#FFFFFF",
  sidebarBorder: "rgba(255,255,255,0.08)",
};

const SIDEBAR_W = 240;
const HEADER_H = 64;

interface AppLayoutProps { children: React.ReactNode }

// ─── Global Toast ────────────────────────────────────────────────────────────
function GlobalToast() {
  const { toast } = useAppStore();
  if (!toast) return null;
  const bg = toast.type === "error" ? "#EF4444" : toast.type === "info" ? "#3B82F6" : "#22C55E";
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: bg, color: "#fff", borderRadius: 10,
      padding: "12px 20px", fontSize: 13, fontWeight: 500,
      boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
      display: "flex", alignItems: "center", gap: 8,
      animation: "slideUp 0.25s ease",
      maxWidth: 360,
    }}>
      {toast.type === "error" ? "✕" : "✓"} {toast.message}
      <style>{`@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

// ─── Notification Dropdown ───────────────────────────────────────────────────
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markNotifRead, markAllNotifsRead } = useAppStore();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function handleNotifClick(n: typeof notifications[0]) {
    markNotifRead(n.id);
    if (n.link) navigate(n.link);
    onClose();
  }

  const severityColor = (s: string) =>
    s === "Critical" ? "#EF4444" : s === "Warning" ? "#F59E0B" : "#3B82F6";

  return (
    <div ref={ref} style={{
      position: "absolute", top: HEADER_H + 4, right: 0,
      width: 380, background: C.surface,
      border: `1px solid ${C.border}`, borderRadius: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      zIndex: 200, overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Notifications</span>
        <button
          onClick={() => { markAllNotifsRead(); }}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: C.primary, fontSize: 12, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <CheckCheck size={14} /> Mark all read
        </button>
      </div>
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {notifications.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>No notifications</div>
        )}
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => handleNotifClick(n)}
            style={{
              padding: "14px 18px",
              borderBottom: `1px solid ${C.border}`,
              background: n.read ? C.surface : "rgba(59,130,246,0.03)",
              cursor: "pointer",
              transition: "background 0.12s",
              display: "flex", gap: 12, alignItems: "flex-start",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={e => (e.currentTarget.style.background = n.read ? C.surface : "rgba(59,130,246,0.03)")}
          >
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: n.read ? C.border : severityColor(n.severity),
              flexShrink: 0, marginTop: 5,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: C.text, marginBottom: 2 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 4 }}>{n.desc}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Search Dropdown ─────────────────────────────────────────────────────────
function SearchDropdown({ query, onClose }: { query: string; onClose: () => void }) {
  const { equipment, notifications } = useAppStore();
  const navigate = useNavigate();
  const q = query.toLowerCase();

  if (!q) return null;

  const eqResults = equipment.filter(e =>
    e.id.toLowerCase().includes(q) ||
    e.name.toLowerCase().includes(q) ||
    e.location.toLowerCase().includes(q) ||
    e.type.toLowerCase().includes(q) ||
    e.status.toLowerCase().includes(q) ||
    (e.region ?? "").toLowerCase().includes(q)
  ).slice(0, 5);

  const alertResults = notifications.filter(n =>
    n.title.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q)
  ).slice(0, 3);

  if (eqResults.length === 0 && alertResults.length === 0) {
    return (
      <div style={{
        position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.10)", zIndex: 200,
        padding: 16, fontSize: 13, color: C.muted, textAlign: "center",
      }}>
        No results found for "{query}"
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      boxShadow: "0 8px 32px rgba(0,0,0,0.10)", zIndex: 200, overflow: "hidden",
    }}>
      {eqResults.length > 0 && (
        <>
          <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", background: C.bg }}>Equipment</div>
          {eqResults.map(e => (
            <div
              key={e.id}
              onClick={() => { navigate(`/equipment/${e.id}`); onClose(); }}
              style={{
                padding: "10px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
                transition: "background 0.1s",
                borderBottom: `1px solid ${C.border}`,
              }}
              onMouseEnter={ev => (ev.currentTarget.style.background = C.bg)}
              onMouseLeave={ev => (ev.currentTarget.style.background = C.surface)}
            >
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: e.status === "Critical" ? "#EF4444" : e.status === "Warning" ? "#F59E0B" : "#22C55E",
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{e.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{e.type} · {e.location}</div>
              </div>
              <span style={{
                marginLeft: "auto", fontSize: 11, fontWeight: 600,
                color: e.status === "Critical" ? "#EF4444" : e.status === "Warning" ? "#F59E0B" : "#22C55E",
              }}>{e.status}</span>
            </div>
          ))}
        </>
      )}
      {alertResults.length > 0 && (
        <>
          <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", background: C.bg }}>Alerts</div>
          {alertResults.map(n => (
            <div
              key={n.id}
              onClick={() => { navigate(n.link ?? "/alerts"); onClose(); }}
              style={{
                padding: "10px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
                transition: "background 0.1s",
              }}
              onMouseEnter={ev => (ev.currentTarget.style.background = C.bg)}
              onMouseLeave={ev => (ev.currentTarget.style.background = C.surface)}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: n.severity === "Critical" ? "#EF4444" : "#F59E0B", flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: C.text }}>{n.title}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── AppLayout ───────────────────────────────────────────────────────────────
export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount, profile } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const sidebarWidth = collapsed ? 68 : SIDEBAR_W;

  // Close search dropdown on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function handleNav(path: string) { navigate(path); }
  function handleLogout() { logout(); navigate("/login"); }

  // Use real Google user data when available, fall back to profile store
  const googleUser = user as (typeof user & { photoUrl?: string; loginMethod?: string }) | null;
  const displayName = googleUser?.loginMethod === "google" ? (googleUser.name ?? profile.name) : profile.name;
  const displayEmail = googleUser?.loginMethod === "google" ? googleUser.email : profile.email;
  const photoUrl = googleUser?.photoUrl;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  // Only call demo users "Utility Manager"; Google users get "User" by default
  const displayRole = user?.role === "admin"
    ? (googleUser?.loginMethod === "google" ? "Admin" : "Utility Manager")
    : "Grid Operator";

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
            onClick={() => navigate("/dashboard")}
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
            <span style={{ fontWeight: 700, fontSize: 17, color: "#fff", letterSpacing: "-0.2px" }}>NEXORA</span>
          </button>
        )}
        {collapsed && (
          <button onClick={() => navigate("/dashboard")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
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
            Main Menu
          </div>
        )}
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
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
              {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: collapsed ? "16px 0" : "16px 20px",
        borderTop: `1px solid ${C.sidebarBorder}`,
        display: "flex", alignItems: "center",
        gap: collapsed ? 0 : 12,
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={displayName}
            referrerPolicy="no-referrer"
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255,255,255,0.2)" }}
          />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg,#3B82F6,#7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
        )}
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{displayRole}</div>
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
      {/* Desktop Sidebar */}
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
        {/* Top header */}
        <header style={{
          height: HEADER_H, background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center",
          padding: "0 24px", gap: 16,
          position: "sticky", top: 0, zIndex: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}>
          {/* Search */}
          <div ref={searchRef} style={{ flex: 1, maxWidth: 420, position: "relative" }}>
            <Search size={15} color={C.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search equipment, location, alerts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={e => { setSearchFocused(true); e.target.style.borderColor = C.primary; }}
              onBlur={e => (e.target.style.borderColor = C.border)}
              onKeyDown={e => { if (e.key === "Escape") { setSearchFocused(false); setSearchQuery(""); } }}
              style={{
                width: "100%", height: 38, border: `1px solid ${C.border}`,
                borderRadius: 8, paddingLeft: 36, paddingRight: searchQuery ? 32 : 12,
                fontSize: 13, color: C.text, background: C.bg,
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchFocused(false); }}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}
              >
                <X size={14} color={C.muted} />
              </button>
            )}
            {searchFocused && searchQuery.length >= 1 && (
              <SearchDropdown query={searchQuery} onClose={() => { setSearchFocused(false); setSearchQuery(""); }} />
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Notification bell */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setNotifOpen(o => !o)}
              style={{
                position: "relative", background: notifOpen ? C.bg : "transparent",
                border: `1px solid ${notifOpen ? C.border : "transparent"}`,
                cursor: "pointer", padding: 8, borderRadius: 8,
                display: "flex", alignItems: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
              onMouseLeave={e => { if (!notifOpen) e.currentTarget.style.background = "transparent"; }}
            >
              <Bell size={18} color={C.muted} />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 5, right: 5,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid #fff",
                }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>
            {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
          </div>

          {/* User */}
          <button
            onClick={() => navigate("/settings")}
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
              <img
                src={photoUrl}
                alt={displayName}
                referrerPolicy="no-referrer"
                style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.border}` }}
              />
            ) : (
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg,#3B82F6,#7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 13, fontWeight: 700,
              }}>
                {initials}
              </div>
            )}
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{displayName}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{displayEmail || displayRole}</div>
            </div>
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: 0 }}>
          {children}
        </main>
      </div>

      <GlobalToast />
    </div>
  );
}
