import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, Eye, EyeOff, Lock, Map, ShieldCheck } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext.jsx';
import { ASSETS } from '../data/seedData';
import { Logo } from '../components/ui/Logo.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { SitemapModal } from '../components/layout/SitemapModal.jsx';

const ROLE_OPTIONS = [
  { role: 'Admin', placeholderEmail: 'admin@fastrobox.edu', label: 'Admin — Full Platform & Hardware Control' },
  { role: 'Teacher', placeholderEmail: 'teacher@fastrobox.edu', label: 'Teacher — Classroom, Attendance & Safety' },
  { role: 'Student', placeholderEmail: 'student@fastrobox.edu', label: 'Student — Personal Profile & Attendance' },
  { role: 'Guardian', placeholderEmail: 'guardian@fastrobox.edu', label: 'Guardian — Linked Child & Safety Alerts' },
];

export function LoginPage() {
  const { login, setSitemapOpen, pushToast } = usePlatform();
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const currentRoleOption = ROLE_OPTIONS.find((r) => r.role === selectedRole) ?? ROLE_OPTIONS[0];

  const handleRoleChange = (nextRole) => {
    setSelectedRole(nextRole);
    setErrorMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0 || submitting) return;

    setSubmitting(true);
    try {
      const res = await login(identifier, password, selectedRole);
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
    } finally {
      setSubmitting(false);
    }
  };

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
            <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
              AI-Powered Smart Classroom
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Do-Something
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
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Sign in to FastRobox 1.0
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select your role and enter your authorized email and password to continue.
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
              <label
                htmlFor="login-role"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Role
              </label>
              <div className="relative">
                <select
                  id="login-role"
                  disabled={lockoutSeconds > 0 || submitting}
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-10 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.role} value={opt.role}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-identifier"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email or Username
              </label>
              <input
                id="login-identifier"
                type="text"
                required
                autoComplete="username"
                disabled={lockoutSeconds > 0 || submitting}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={currentRoleOption.placeholderEmail}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  disabled={lockoutSeconds > 0 || submitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
              disabled={lockoutSeconds > 0 || submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {lockoutSeconds > 0
                ? `Locked (${lockoutSeconds}s)`
                : submitting
                ? 'Verifying Credentials...'
                : `Sign In as ${selectedRole}`}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
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
