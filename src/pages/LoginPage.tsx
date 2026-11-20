import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { usePageSeo } from '../config/site.ts';

interface LocationState {
  from?: string;
  bookingMessage?: string;
}

export function LoginPage() {
  usePageSeo('Login', 'Sign in to reserve a hall or manage your bookings.');
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) || {};

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await login(email.trim(), password);
      if (res.requires2FA) {
        navigate('/admin/login');
        return;
      }
      showToast('Welcome back!', 'success');
      const destination = state.from || (res.user?.role === 'admin' ? '/admin' : '/my-bookings');
      navigate(destination, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section-spacing bg-[#F7F8FA] min-h-[70vh] flex items-center">
      <div className="site-container w-full">
        <div className="card-surface max-w-md mx-auto p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="h2-title">Sign In to Your Account</h1>
            <p className="small-text">Access online hall booking and manage your reservations.</p>
          </div>

          {state.bookingMessage && (
            <div className="p-4 rounded-[10px] bg-[#EDEFF7] text-[#201853] text-[14px] font-medium flex items-start gap-2.5">
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#45459E]" strokeWidth={1.75} />
              <span>{state.bookingMessage}</span>
            </div>
          )}

          {error && (
            <div role="alert" className="p-3.5 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-[14px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-[14px] font-medium text-[#1F2937]">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-[14px] font-medium text-[#1F2937]">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="p-3.5 rounded-[10px] bg-[#F7F8FA] text-[13px] text-[#6B7280] space-y-1">
            <div className="font-medium text-[#1F2937]">Demo Customer Account</div>
            <div>Email: customer@example.com &middot; Password: Customer123!</div>
          </div>

          <p className="small-text text-center">
            New to our venue?{' '}
            <Link
              to="/register"
              state={{ from: state.from, bookingMessage: state.bookingMessage }}
              className="font-semibold text-[#201853] hover:text-[#45459E]"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
