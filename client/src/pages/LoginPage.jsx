import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

export default function LoginPage() {
  const { user, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('manager@cnykra.com');
  const [password, setPassword] = useState('manager123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'manager') {
        navigate('/manager', { replace: true });
      } else {
        navigate('/housekeeper', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/housekeeper');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail, quickPass) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(quickEmail, quickPass);
      if (loggedInUser.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/housekeeper');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper-outer">
      <div className="login-page-container">
        <div className="login-card-wrapper">
          <div className="login-brand-header">
            <div className="login-logo-circle">
              <span className="login-logo-icon">✦</span>
            </div>
            <h1 className="login-brand-title">CNYKRA</h1>
            <p className="login-brand-subtitle">Housekeeping Operations & Turnover OS</p>
          </div>

          {error && <div className="login-error-alert">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="loginEmail">Email Address</label>
              <input
                id="loginEmail"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. manager@cnykra.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="loginPassword">Password</label>
              <input
                id="loginPassword"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="login-demo-section">
            <div className="demo-divider">
              <span>DEMO QUICK LOGIN (ONE-CLICK)</span>
            </div>

            <p className="demo-hint-text">
              1 Manager & 3 Housekeepers seeded with distinct role permissions:
            </p>

            <div className="demo-buttons-grid">
              {/* 1 Seed Manager */}
              <button
                type="button"
                className="demo-profile-card manager"
                onClick={() => handleQuickLogin('manager@cnykra.com', 'manager123')}
                disabled={loading}
              >
                <div className="demo-badge-avatar" style={{ background: '#0f172a' }}>AS</div>
                <div className="demo-info">
                  <span className="demo-name">Arjun Sharma</span>
                  <span className="demo-role">Manager (Full Operational Control)</span>
                  <span className="demo-creds">manager@cnykra.com • manager123</span>
                </div>
              </button>

              {/* Housekeeper 1 */}
              <button
                type="button"
                className="demo-profile-card housekeeper"
                onClick={() => handleQuickLogin('pooja@cnykra.com', 'clean123')}
                disabled={loading}
              >
                <div className="demo-badge-avatar" style={{ background: '#4f46e5' }}>PS</div>
                <div className="demo-info">
                  <span className="demo-name">Pooja Sharma</span>
                  <span className="demo-role">Housekeeper (Floors 1–4 Assigned)</span>
                  <span className="demo-creds">pooja@cnykra.com • clean123</span>
                </div>
              </button>

              {/* Housekeeper 2 */}
              <button
                type="button"
                className="demo-profile-card housekeeper"
                onClick={() => handleQuickLogin('rohan@cnykra.com', 'clean123')}
                disabled={loading}
              >
                <div className="demo-badge-avatar" style={{ background: '#0891b2' }}>RV</div>
                <div className="demo-info">
                  <span className="demo-name">Rohan Verma</span>
                  <span className="demo-role">Housekeeper (Floors 5–8 Assigned)</span>
                  <span className="demo-creds">rohan@cnykra.com • clean123</span>
                </div>
              </button>

              {/* Housekeeper 3 */}
              <button
                type="button"
                className="demo-profile-card housekeeper"
                onClick={() => handleQuickLogin('sunita@cnykra.com', 'clean123')}
                disabled={loading}
              >
                <div className="demo-badge-avatar" style={{ background: '#059669' }}>SP</div>
                <div className="demo-info">
                  <span className="demo-name">Sunita Patel</span>
                  <span className="demo-role">Housekeeper (Floors 9–12 Assigned)</span>
                  <span className="demo-creds">sunita@cnykra.com • clean123</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
