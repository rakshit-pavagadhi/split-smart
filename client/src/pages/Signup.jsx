import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { useGoogleLogin } from '@react-oauth/google';

const Signup = () => {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const googleSignupHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        await loginWithGoogle(tokenResponse.access_token);
        toast.success('Account created! Welcome to SplitSmart 🎉');
        navigate('/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google Signup failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error('Google Signup failed'),
  });

  const getPasswordStrength = () => {
    if (!password) return { width: '0%', color: '#475569', label: '' };
    if (password.length < 4) return { width: '25%', color: '#f43f5e', label: 'Weak' };
    if (password.length < 6) return { width: '50%', color: '#f59e0b', label: 'Fair' };
    if (password.length < 8) return { width: '75%', color: '#06b6d4', label: 'Good' };
    return { width: '100%', color: '#10b981', label: 'Strong' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password);
      toast.success('Account created! Welcome to SplitSmart 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-dark bg-pattern" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div className="animate-scaleIn" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="animate-float" style={{ fontSize: '48px', marginBottom: '12px' }}>💸</div>
          <h1 className="gradient-text" style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>
            SplitSmart
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>
            Create your free account
          </p>
        </div>

        <div className="glass animate-pulse-glow" style={{ borderRadius: '20px', padding: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
            Get started
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>
            Join thousands splitting expenses smarter
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
                Full name
              </label>
              <div style={{ position: 'relative' }}>
                <HiOutlineUser size={18} style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: '#64748b',
                }} />
                <input
                  id="signup-name"
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <HiOutlineMail size={18} style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: '#64748b',
                }} />
                <input
                  id="signup-email"
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <HiOutlineLockClosed size={18} style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: '#64748b',
                }} />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                  }}
                >
                  {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                </button>
              </div>
              {/* Password strength bar */}
              {password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{
                    height: '3px', borderRadius: '2px',
                    background: '#1e293b', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: strength.width,
                      background: strength.color,
                      transition: 'all 0.3s ease', borderRadius: '2px',
                    }} />
                  </div>
                  <p style={{ fontSize: '11px', color: strength.color, marginTop: '4px', textAlign: 'right' }}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <button
              id="signup-submit"
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '4px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="animate-spin-slow" style={{ display: 'inline-block' }}>⚡</span>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            margin: '24px 0', color: '#475569',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(99,102,241,0.1)' }} />
            <span style={{ fontSize: '12px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(99,102,241,0.1)' }} />
          </div>

          <button type="button" onClick={() => googleSignupHandler()} className="btn-secondary" style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          
          <p style={{ textAlign: 'center', marginTop: '16px', color: '#475569', fontSize: '12px' }}>
            By signing up, you agree to our Terms of Service
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
