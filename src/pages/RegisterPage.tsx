import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { usePageSeo } from '../config/site.ts';

interface LocationState {
  from?: string;
}

export function RegisterPage() {
  usePageSeo('Create Account', 'Register an account to reserve a wedding or event hall online.');
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) || {};

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      showToast('Account created successfully.', 'success');
      navigate(state.from || '/my-bookings', { replace: true });
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
            <h1 className="h2-title">Create Your Account</h1>
            <p className="small-text">Register to check hall availability and book your event date.</p>
          </div>

          {error && (
            <div role="alert" className="p-3.5 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-[14px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="block text-[14px] font-medium text-[#1F2937]">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Claire Bennett"
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="block text-[14px] font-medium text-[#1F2937]">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-phone" className="block text-[14px] font-medium text-[#1F2937]">
                Phone Number
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 314-7890"
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="block text-[14px] font-medium text-[#1F2937]">
                Password (min 8 characters)
              </label>
              <input
                id="reg-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-confirm" className="block text-[14px] font-medium text-[#1F2937]">
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="input-field"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="small-text text-center">
            Already have an account?{' '}
            <Link
              to="/login"
              state={{ from: state.from }}
              className="font-semibold text-[#201853] hover:text-[#45459E]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
