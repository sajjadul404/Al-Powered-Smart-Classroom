import { useEffect, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Lock, Map, ShieldCheck } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext.jsx';
import { ASSETS } from '../data/seedData';
import { Logo } from '../components/ui/Logo.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { SitemapModal } from '../components/layout/SitemapModal.jsx';

export function LoginPage() {
  const { login, quickLoginRole, setSitemapOpen, pushToast } = usePlatform();
  const [identifier, setIdentifier] = useState('admin@fastrobox.edu');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setFailedAttempts(0);
          setErrorMsg(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    const res = login(identifier, password);
    if (!res.ok) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 3) {
        setLockoutSeconds(60);
        setErrorMsg('Account temporarily locked after 3 incorrect password attempts. Please wait 60 seconds.');
      } else {
        setErrorMsg(`${res.error} (${3 - nextAttempts} attempt(s) remaining before 60s lockout)`);
      }
    } else {
      setFailedAttempts(0);
      setErrorMsg(null);
    }
  };

  const roles = [
    { role: 'Admin', email: 'admin@fastrobox.edu', desc: 'Full 17-page platform & hardware control' },
    { role: 'Teacher', email: 'teacher@fastrobox.edu', desc: 'Classroom, attendance, cameras & emergency' },
    { role: 'Student', email: 'student@fastrobox.edu', desc: 'Personal profile, attendance & notices' },
    { role: 'Guardian', email: 'guardian@fastrobox.edu', desc: 'Linked child status & safety alerts' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row">
      <div className="lg:w-[48%] bg-[#0B1324] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 z-10">
          <Logo light />
          <button
            type="button"
            onClick={() => setSitemapOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Website Sitemap</span>
          </button>
        </div>

        <div className="my-8 lg:my-0 space-y-6 z-10 max-w-lg">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              AI-Powered Smart Classroom Ecosystem
            </p>
            <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
              Safety, Access & Vision Intelligence on ESP32-S3-CAM
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Unified classroom command center integrating RFID + face verification, flame & panic override, 4-second AI hand-raise detection, 3×3 Wi-Fi CSI localization, and resilient offline synchronization.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
            <img
              src={ASSETS.esp32Hardware}
              alt="ESP32-S3-CAM Smart Classroom Hardware Node"
              referrerPolicy="no-referrer"
              className="w-full h-52 object-cover"
            />
            <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-300">
              <span>ESP32-S3-CAM · DHT11 · IR Flame · RFID-RC522</span>
              <span className="font-mono text-emerald-400">12 Project Levels</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between gap-4 z-10">
          <span>FastRobox 1.0 Smart Classroom Platform</span>
          <span>Role-Based Access Control (RBAC)</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Sign in to FastRobox 1.0
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter your institutional credentials or choose a demo role below.
            </p>
          </div>

          {lockoutSeconds > 0 && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-start gap-3"
            >
              <Lock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-800 dark:text-red-300">
                  Account Temporarily Locked
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  3 consecutive incorrect password attempts detected. Sign-in is locked for{' '}
                  <span className="font-mono font-bold tabular-nums">{lockoutSeconds}s</span>.
                </p>
              </div>
            </div>
          )}

          {errorMsg && lockoutSeconds === 0 && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email or Username
              </label>
              <input
                type="text"
                required
                disabled={lockoutSeconds > 0}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@fastrobox.edu"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={lockoutSeconds > 0}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span>Remember me on this workstation</span>
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="font-semibold text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={lockoutSeconds > 0}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {lockoutSeconds > 0 ? `Locked (${lockoutSeconds}s)` : 'Sign In'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Role-Based Demo Accounts (Password: Password123!)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  disabled={lockoutSeconds > 0}
                  onClick={() => quickLoginRole(r.role)}
                  className="text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 transition-colors disabled:opacity-50"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{r.role}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Reset Account Password"
        subtitle="Enter your institutional email to receive an Administrator-verified reset link."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setForgotOpen(false);
            pushToast({
              type: 'success',
              title: 'Reset Request Submitted',
              description: `If ${forgotEmail} exists, recovery instructions were dispatched.`,
            });
            setForgotEmail('');
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Registered Email Address
            </label>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="user@fastrobox.edu"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Send Reset Link
            </button>
          </div>
        </form>
      </Modal>

      <SitemapModal />
    </div>
  );
}
