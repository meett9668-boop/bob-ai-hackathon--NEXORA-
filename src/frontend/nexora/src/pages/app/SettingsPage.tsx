import React, { useState } from "react";
import { User, Bell, Building, Sliders, Lock, Eye, EyeOff } from "lucide-react";
import { useAppStore } from "../../store/appStore";

const C = {
  bg: "#F8FAFC", surface: "#FFFFFF", border: "#E2E8F0",
  text: "#1E293B", muted: "#64748B", primary: "#3B82F6",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  cardShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
};

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "alerts", label: "Alert Preferences", icon: Sliders },
  { id: "security", label: "Security", icon: Lock },
  { id: "organization", label: "Organization", icon: Building },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? C.primary : C.border,
      border: "none", cursor: "pointer", position: "relative",
      transition: "background 0.2s", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function InputField({ value, onChange, type = "text", placeholder, readOnly }: {
  value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        width: "100%", height: 40, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: "0 12px", fontSize: 14, color: readOnly ? C.muted : C.text,
        background: readOnly ? C.bg : C.surface,
        outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
        cursor: readOnly ? "not-allowed" : "text",
      }}
      onFocus={e => { if (!readOnly) e.target.style.borderColor = C.primary; }}
      onBlur={e => (e.target.style.borderColor = C.border)}
    />
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function SaveButton({ onClick, label = "Save Changes" }: { onClick: () => void; label?: string }) {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  function handleClick() {
    setState("saving");
    setTimeout(() => { onClick(); setState("saved"); setTimeout(() => setState("idle"), 2000); }, 700);
  }
  return (
    <button type="button" onClick={handleClick} disabled={state === "saving"} style={{
      background: state === "saved" ? C.success : C.primary, color: "#fff",
      border: "none", borderRadius: 8, padding: "10px 24px",
      fontSize: 14, fontWeight: 600, cursor: state === "saving" ? "not-allowed" : "pointer",
      transition: "background 0.2s", display: "flex", alignItems: "center", gap: 8,
    }}>
      {state === "saving" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>}
      {state === "saved" ? "✓ Saved!" : state === "saving" ? "Saving..." : label}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}

// ─── Security Section ─────────────────────────────────────────────────────────
function SecuritySection() {
  const { showToast } = useAppStore();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!currentPw) e.current = "Current password is required";
    if (!newPw) e.new = "New password is required";
    else if (newPw.length < 8) e.new = "Minimum 8 characters required";
    if (!confirmPw) e.confirm = "Please confirm your new password";
    else if (newPw !== confirmPw) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setErrors({});
      showToast("Password updated successfully. (Demo mode — no real backend change)", "info");
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  }

  const pwFieldStyle = (hasError: boolean): React.CSSProperties => ({
    width: "100%", height: 40, border: `1px solid ${hasError ? C.danger : C.border}`, borderRadius: 8,
    paddingLeft: 12, paddingRight: 40, fontSize: 14, color: C.text, background: C.surface,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  });

  const EyeBtn = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} style={{
      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
      background: "transparent", border: "none", cursor: "pointer", padding: 4,
      color: C.muted, display: "flex", alignItems: "center",
    }}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <form onSubmit={handleSave}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Security</h2>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Update your password</p>

      {success && (
        <div style={{
          background: "rgba(34,197,94,0.08)", border: `1px solid rgba(34,197,94,0.25)`,
          borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: C.success,
        }}>
          ✓ Password updated successfully. (Demo mode)
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Current Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPw}
            onChange={e => { setCurrentPw(e.target.value); setErrors(p => ({ ...p, current: "" })); }}
            placeholder="Enter current password"
            style={pwFieldStyle(!!errors.current)}
            onFocus={e => (e.target.style.borderColor = errors.current ? C.danger : C.primary)}
            onBlur={e => (e.target.style.borderColor = errors.current ? C.danger : C.border)}
          />
          <EyeBtn show={showCurrent} toggle={() => setShowCurrent(p => !p)} />
        </div>
        {errors.current && <div style={{ fontSize: 12, color: C.danger, marginTop: 4 }}>{errors.current}</div>}
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>New Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showNew ? "text" : "password"}
            value={newPw}
            onChange={e => { setNewPw(e.target.value); setErrors(p => ({ ...p, new: "" })); }}
            placeholder="Enter new password"
            style={pwFieldStyle(!!errors.new)}
            onFocus={e => (e.target.style.borderColor = errors.new ? C.danger : C.primary)}
            onBlur={e => (e.target.style.borderColor = errors.new ? C.danger : C.border)}
          />
          <EyeBtn show={showNew} toggle={() => setShowNew(p => !p)} />
        </div>
        {errors.new && <div style={{ fontSize: 12, color: C.danger, marginTop: 4 }}>{errors.new}</div>}
        {newPw.length > 0 && newPw.length < 8 && !errors.new && (
          <div style={{ fontSize: 12, color: C.warning, marginTop: 4 }}>Password strength: Too short (min 8 characters)</div>
        )}
        {newPw.length >= 8 && (
          <div style={{ fontSize: 12, color: C.success, marginTop: 4 }}>✓ Password length OK</div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Confirm New Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPw}
            onChange={e => { setConfirmPw(e.target.value); setErrors(p => ({ ...p, confirm: "" })); }}
            placeholder="Confirm new password"
            style={pwFieldStyle(!!errors.confirm)}
            onFocus={e => (e.target.style.borderColor = errors.confirm ? C.danger : C.primary)}
            onBlur={e => (e.target.style.borderColor = errors.confirm ? C.danger : C.border)}
          />
          <EyeBtn show={showConfirm} toggle={() => setShowConfirm(p => !p)} />
        </div>
        {errors.confirm && <div style={{ fontSize: 12, color: C.danger, marginTop: 4 }}>{errors.confirm}</div>}
        {confirmPw.length > 0 && newPw === confirmPw && !errors.confirm && (
          <div style={{ fontSize: 12, color: C.success, marginTop: 4 }}>✓ Passwords match</div>
        )}
      </div>

      <div style={{
        background: "rgba(59,130,246,0.06)", border: `1px solid rgba(59,130,246,0.15)`,
        borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: C.primary,
      }}>
        ⓘ Password must be at least 8 characters. This is demo mode — no real backend change occurs.
      </div>

      <button type="submit" disabled={saving} style={{
        background: saving ? "#93c5fd" : C.primary, color: "#fff",
        border: "none", borderRadius: 8, padding: "10px 24px",
        fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 8, transition: "background 0.2s",
      }}>
        {saving && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>}
        {saving ? "Updating..." : "Change Password"}
      </button>
    </form>
  );
}

export default function SettingsPage() {
  const { profile, updateProfile, showToast } = useAppStore();
  const [activeSection, setActiveSection] = useState("profile");

  // Local profile editing state
  const [editMode, setEditMode] = useState(false);
  const [localName, setLocalName] = useState(profile.name);
  const [localEmail, setLocalEmail] = useState(profile.email);
  const [localPhone, setLocalPhone] = useState(profile.phone);
  const [localJobTitle, setLocalJobTitle] = useState(profile.jobTitle);
  const [localOrg, setLocalOrg] = useState(profile.organization);
  const [localLocation, setLocalLocation] = useState(profile.location);

  // Notification toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Alert preferences
  const [criticalAlert, setCriticalAlert] = useState(true);
  const [warningAlert, setWarningAlert] = useState(true);
  const [predictiveAlert, setPredictiveAlert] = useState(true);
  const [maintenanceAlert, setMaintenanceAlert] = useState(false);

  function handleSaveProfile() {
    updateProfile({
      name: localName, email: localEmail, phone: localPhone,
      jobTitle: localJobTitle, organization: localOrg, location: localLocation,
    });
    setEditMode(false);
    showToast("Profile updated successfully.");
  }

  function handleCancelEdit() {
    setLocalName(profile.name);
    setLocalEmail(profile.email);
    setLocalPhone(profile.phone);
    setLocalJobTitle(profile.jobTitle);
    setLocalOrg(profile.organization);
    setLocalLocation(profile.location);
    setEditMode(false);
  }

  const initials = profile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ padding: "28px 32px", background: C.bg, minHeight: "100vh" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 14, color: C.muted, margin: "4px 0 0" }}>Manage your account and preferences</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start" }}>
        {/* Left nav */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.cardShadow, overflow: "hidden" }}>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const active = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                width: "100%", background: active ? "rgba(59,130,246,0.06)" : "transparent",
                border: "none", borderLeft: active ? `3px solid ${C.primary}` : "3px solid transparent",
                cursor: "pointer", padding: "13px 16px",
                display: "flex", alignItems: "center", gap: 10,
                color: active ? C.primary : C.muted,
                fontSize: 14, fontWeight: active ? 600 : 400,
                transition: "all 0.15s", textAlign: "left",
              }}>
                <Icon size={16} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.cardShadow, padding: 28 }}>

          {/* PROFILE */}
          {activeSection === "profile" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Profile</h2>
                  <p style={{ fontSize: 13, color: C.muted }}>Update your personal information</p>
                </div>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} style={{
                    background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: "8px 16px", fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.primary; (e.currentTarget as HTMLButtonElement).style.color = C.primary; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.text; }}
                  >
                    Edit Profile
                  </button>
                ) : null}
              </div>

              {/* Avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "linear-gradient(135deg,#3B82F6,#7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 24, fontWeight: 700,
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{profile.name}</div>
                  <div style={{ fontSize: 13, color: C.muted }}>{profile.jobTitle} · {profile.organization}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <FieldGroup label="Full Name">
                  <InputField value={localName} onChange={setLocalName} readOnly={!editMode} />
                </FieldGroup>
                <FieldGroup label="Email Address">
                  <InputField value={localEmail} onChange={setLocalEmail} type="email" readOnly={!editMode} />
                </FieldGroup>
                <FieldGroup label="Phone Number">
                  <InputField value={localPhone} onChange={setLocalPhone} readOnly={!editMode} />
                </FieldGroup>
                <FieldGroup label="Job Title">
                  <InputField value={localJobTitle} onChange={setLocalJobTitle} readOnly={!editMode} />
                </FieldGroup>
                <FieldGroup label="Organization">
                  <InputField value={localOrg} onChange={setLocalOrg} readOnly={!editMode} />
                </FieldGroup>
                <FieldGroup label="Location">
                  <InputField value={localLocation} onChange={setLocalLocation} readOnly={!editMode} />
                </FieldGroup>
              </div>

              {editMode && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" onClick={handleCancelEdit} style={{
                    padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                    background: C.surface, color: C.text, border: `1px solid ${C.border}`, cursor: "pointer",
                  }}>Cancel</button>
                  <SaveButton onClick={handleSaveProfile} label="Save Changes" />
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === "notifications" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Notifications</h2>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Configure how you receive notifications</p>
              {[
                { label: "Email Notifications", desc: "Receive alerts and updates via email", val: emailNotif, set: setEmailNotif },
                { label: "SMS Notifications", desc: "Receive critical alerts via SMS", val: smsNotif, set: setSmsNotif },
                { label: "Push Notifications", desc: "Browser push notifications for live alerts", val: pushNotif, set: setPushNotif },
                { label: "Weekly Digest", desc: "Weekly summary of grid health and predictions", val: weeklyDigest, set: setWeeklyDigest },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <Toggle on={item.val} onChange={item.set} />
                </div>
              ))}
              <div style={{ marginTop: 24 }}>
                <SaveButton onClick={() => showToast("Notification settings saved.")} />
              </div>
            </div>
          )}

          {/* ALERT PREFERENCES */}
          {activeSection === "alerts" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Alert Preferences</h2>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Choose which alerts you want to receive</p>
              {[
                { label: "Critical Alerts", desc: "Immediate notification for critical equipment failures", val: criticalAlert, set: setCriticalAlert, color: C.danger },
                { label: "Warning Alerts", desc: "Notification for warning-level anomalies", val: warningAlert, set: setWarningAlert, color: C.warning },
                { label: "Predictive Alerts", desc: "AI-generated failure predictions (3–30 days out)", val: predictiveAlert, set: setPredictiveAlert, color: C.primary },
                { label: "Maintenance Reminders", desc: "Scheduled maintenance notifications", val: maintenanceAlert, set: setMaintenanceAlert, color: C.success },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </div>
                  <Toggle on={item.val} onChange={item.set} />
                </div>
              ))}
              <div style={{ marginTop: 24 }}>
                <SaveButton onClick={() => showToast("Alert preferences saved.")} />
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeSection === "security" && <SecuritySection />}

          {/* ORGANIZATION */}
          {activeSection === "organization" && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Organization</h2>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Your organization and account details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <FieldGroup label="Organization Name"><InputField value="India Power Grid Authority" onChange={() => {}} /></FieldGroup>
                <FieldGroup label="Region"><InputField value="India" onChange={() => {}} /></FieldGroup>
                <FieldGroup label="NEXORA Account ID"><InputField value="NGT-2025-001" onChange={() => {}} readOnly /></FieldGroup>
                <FieldGroup label="Plan"><InputField value="Enterprise" onChange={() => {}} readOnly /></FieldGroup>
              </div>
              <div style={{
                background: "rgba(34,197,94,0.06)", border: `1px solid rgba(34,197,94,0.2)`,
                borderRadius: 8, padding: "12px 16px", fontSize: 13, color: C.success, marginBottom: 20,
              }}>
                ✓ Account is active. Next billing cycle: October 1, 2025.
              </div>
              <SaveButton onClick={() => showToast("Organization settings saved.")} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
