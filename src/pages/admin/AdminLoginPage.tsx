import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { usePageSeo } from '../../config/site.ts';

export function AdminLoginPage() {
  usePageSeo('Administrator Sign In', 'Restricted management portal login.');
  const { user, login, verify2FA } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preAuthToken, setPreAuthToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password, true);
      if (res.requires2FA && res.preAuthToken) {
        setPreAuthToken(res.preAuthToken);
      } else if (res.user?.role === 'admin') {
        showToast('Signed in to Admin Dashboard.', 'success');
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await verify2FA(preAuthToken, totpCode.trim());
      showToast('Two-factor authentication verified.', 'success');
      navigate('/admin', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-5">
      <div className="card-surface max-w-md w-full p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[10px] bg-[#201853] text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="h2-title">Admin Portal</h1>
            <p className="small-text">Restricted management access</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-3.5 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-[14px]">
            {error}
          </div>
        )}

        {!preAuthToken ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-[14px] font-medium text-[#1F2937]">
                Administrator Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aureliahall.com"
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-[14px] font-medium text-[#1F2937]">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                className="input-field"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              <Lock className="w-4 h-4" strokeWidth={1.75} />
              <span>{submitting ? 'Verifying...' : 'Sign In'}</span>
            </button>

            <div className="p-3.5 rounded-[10px] bg-[#F7F8FA] text-[13px] text-[#6B7280] space-y-1">
              <div className="font-medium text-[#1F2937]">Demo Admin Credentials</div>
              <div>Email: admin@aureliahall.com &middot; Password: AdminSecure123!</div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleTotpSubmit} className="space-y-4">
            <p className="body-text">
              Enter the 6-digit verification code from your authenticator app.
            </p>
            <div className="space-y-1.5">
              <label htmlFor="admin-totp" className="block text-[14px] font-medium text-[#1F2937]">
                6-Digit TOTP Code
              </label>
              <input
                id="admin-totp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="123456"
                className="input-field tabular-nums tracking-widest text-center text-[20px]"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Verifying Code...' : 'Verify & Open Dashboard'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
