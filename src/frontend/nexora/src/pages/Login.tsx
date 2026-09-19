import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Mail, Lock, Eye, EyeOff, X, AlertTriangle } from 'lucide-react';

// ─── Error Banner ────────────────────────────────────────────────────────────
function ErrorBanner({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 8, padding: '10px 14px',
      fontSize: 13, color: '#EF4444', marginBottom: 16,
      display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <AlertTriangle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: '#EF4444', display: 'flex' }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Google Not Configured Info Modal ────────────────────────────────────────
function GoogleNotConfiguredModal({ onClose, onDemo }: { onClose: () => void; onDemo: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440,
        padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: 'transparent',
          border: 'none', cursor: 'pointer', padding: 4, color: '#64748B', display: 'flex',
        }}>
          <X size={18} />
        </button>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <AlertTriangle size={24} color="#F59E0B" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>Google Sign-In Not Configured</h3>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 12px' }}>
          To enable real Google authentication, add your Google OAuth Client ID to the frontend environment:
        </p>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#374151', fontFamily: 'monospace' }}>
          VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
        </div>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px' }}>
          See <code style={{ fontSize: 12, background: '#F1F5F9', padding: '1px 4px', borderRadius: 4 }}>.env.example</code> for all required variables.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, height: 42, background: '#F8FAFC', color: '#0F172A', border: '1px solid #E2E8F0',
            borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Close</button>
          <button onClick={onDemo} style={{
            flex: 2, height: 42, background: '#2563EB', color: '#fff', border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Use Demo Account</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showNotConfigured, setShowNotConfigured] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleScriptLoaded = useRef(false);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const googleConfigured = !!GOOGLE_CLIENT_ID;

  // ── Load Google Identity Services script ────────────────────────────────────
  useEffect(() => {
    if (!googleConfigured || googleScriptLoaded.current) return;

    const scriptId = 'google-gsi-script';
    if (document.getElementById(scriptId)) {
      initGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleScriptLoaded.current = true;
      initGoogleButton();
    };
    script.onerror = () => {
      setError('Failed to load Google Sign-In. Please check your connection.');
    };
    document.head.appendChild(script);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleConfigured]);

  function initGoogleButton() {
    if (!window.google?.accounts?.id || !googleBtnRef.current || !GOOGLE_CLIENT_ID) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      width: googleBtnRef.current.offsetWidth || 300,
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
    });
  }

  async function handleGoogleCallback(response: { credential: string }) {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(response.credential);
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error ?? 'Google sign-in failed. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred during Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const ok = login(email.trim(), password);
      setLoading(false);
      if (!ok) {
        setError('Invalid email or password. Try the demo credentials below.');
        return;
      }
      const stored = localStorage.getItem('nexora_auth');
      const user = stored ? JSON.parse(stored) : null;
      navigate(user?.role === 'admin' ? '/dashboard' : '/user', { replace: true });
    }, 600);
  }

  const inputBase: React.CSSProperties = {
    width: '100%', height: 44,
    background: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    fontSize: 14, color: '#0F172A',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #0B2545 0%, #071629 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '20px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decorations */}
      <div style={{ position: 'absolute', top: '5%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, zIndex: 1 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="rgba(255,255,255,0.3)" />
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: '-0.2px' }}>NEXORA</span>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#ffffff', borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        padding: '36px 32px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Welcome Back</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>Sign in to access your dashboard</p>
        </div>

        {error && <ErrorBanner msg={error} onClose={() => setError('')} />}
        {googleLoading && (
          <div style={{ background: 'rgba(37,99,235,0.06)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#2563EB', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Signing in with Google...
          </div>
        )}

        {/* Google Sign-In Button */}
        <div style={{ marginBottom: 20 }}>
          {googleConfigured ? (
            <div
              ref={googleBtnRef}
              style={{ width: '100%', minHeight: 44, display: 'flex', justifyContent: 'center' }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNotConfigured(true)}
              style={{
                width: '100%', height: 44,
                background: '#fff', border: '1.5px solid #dadce0',
                borderRadius: 8, fontSize: 14, color: '#3c4043',
                cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(60,64,67,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 20px' }}>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>Or sign in with password</span>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: 6 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@nexora.com"
                required
                style={{ ...inputBase, paddingLeft: 38, paddingRight: 12 }}
                onFocus={e => (e.target.style.borderColor = '#2563EB')}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ ...inputBase, paddingLeft: 38, paddingRight: 40 }}
                onFocus={e => (e.target.style.borderColor = '#2563EB')}
                onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                  color: '#94a3b8', display: 'flex', alignItems: 'center',
                }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#64748B', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: '#2563EB', cursor: 'pointer' }}
              />
              Remember me
            </label>
            <a href="#" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}>
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: 44,
              background: loading ? '#93c5fd' : '#2563EB',
              color: '#ffffff', border: 'none', borderRadius: 8,
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8'; }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#2563EB'; }}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: '16px 0 16px' }}>
          Don't have an account? Contact your administrator.
        </p>

        {/* Demo credentials hint */}
        <div style={{
          background: '#F5F8FC', border: '1px solid #E2E8F0',
          borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#64748B',
        }}>
          <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>Demo Credentials</div>
          <div>
            <button
              type="button"
              onClick={() => { setEmail('admin@nexora.com'); setPassword('admin123'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: 12, padding: 0, textDecoration: 'underline' }}
            >
              Admin: admin@nexora.com / admin123
            </button>
          </div>
          <div style={{ marginTop: 4 }}>
            <button
              type="button"
              onClick={() => { setEmail('user@nexora.com'); setPassword('user123'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: 12, padding: 0, textDecoration: 'underline' }}
            >
              User: user@nexora.com / user123
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {showNotConfigured && (
        <GoogleNotConfiguredModal
          onClose={() => setShowNotConfigured(false)}
          onDemo={() => {
            setShowNotConfigured(false);
            setEmail('admin@nexora.com');
            setPassword('admin123');
          }}
        />
      )}
    </div>
  );
}
