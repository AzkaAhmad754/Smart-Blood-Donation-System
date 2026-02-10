import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Droplets, Heart, Building2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];

const Auth = ({ mode = 'login' }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, user } = useAuth();

  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [role, setRole] = useState(searchParams.get('role') || 'donor');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', password: '', city: 'Lahore',
    phone: '', blood_type: 'O+', license_number: '',
  });

  useEffect(() => {
    if (user) {
      const paths = { donor: '/donor/dashboard', hospital: '/hospital/dashboard', blood_bank: '/bloodbank/dashboard' };
      navigate(paths[user.role] || '/');
    }
  }, [user, navigate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const { user: u } = await login(form.email, form.password);
        toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
        const paths = { donor: '/donor/dashboard', hospital: '/hospital/dashboard', blood_bank: '/bloodbank/dashboard' };
        navigate(paths[u.role] || '/');
      } else {
        const { user: u } = await register({ ...form, role });
        toast.success('Account created! Welcome to BloodConnect.');
        const paths = { donor: '/donor/dashboard', hospital: '/hospital/dashboard', blood_bank: '/bloodbank/dashboard' };
        navigate(paths[u.role] || '/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const roleIcons = { donor: <Heart size={16} />, hospital: <Building2 size={16} />, blood_bank: <Droplets size={16} /> };
  const roleLabels = { donor: 'Donor', hospital: 'Hospital', blood_bank: 'Blood Bank' };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-logo">
            <Droplets size={32} style={{ color: 'var(--crimson)' }} />
            <span>Blood<strong>Connect</strong></span>
          </Link>
          <h2>Saving lives,<br /><span className="gradient-text">one connection</span><br />at a time.</h2>
          <div className="auth-stats">
            {[['230M+', 'Population served'], ['Real-time', 'Emergency alerts'], ['3 roles', 'Donors, Hospitals, Banks']].map(([v, l]) => (
              <div key={l} className="auth-stat">
                <strong>{v}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-tabs">
            <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Login</button>
            <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Register</button>
          </div>

          {!isLogin && (
            <div className="role-pills">
              {['donor', 'hospital', 'blood_bank'].map((r) => (
                <button
                  key={r}
                  className={`role-pill ${role === r ? 'active' : ''}`}
                  onClick={() => setRole(r)}
                >
                  {roleIcons[r]} {roleLabels[r]}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="auth-error">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">
                  {role === 'donor' ? 'Full Name' : role === 'hospital' ? 'Hospital Name' : 'Blood Bank Name'}
                </label>
                <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Enter name" />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="you@example.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="pass-wrap">
                <input className="form-input" type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} required placeholder="••••••••" minLength={6} />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <select className="form-input" value={form.city} onChange={(e) => set('city', e.target.value)}>
                      {CITIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="03001234567" />
                  </div>
                </div>

                {role === 'donor' && (
                  <div className="form-group">
                    <label className="form-label">Blood Type</label>
                    <div className="blood-type-grid">
                      {BLOOD_TYPES.map((bt) => (
                        <button key={bt} type="button"
                          className={`bt-btn ${form.blood_type === bt ? 'active' : ''}`}
                          onClick={() => set('blood_type', bt)}>
                          {bt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(role === 'hospital' || role === 'blood_bank') && (
                  <div className="form-group">
                    <label className="form-label">License Number</label>
                    <input className="form-input" value={form.license_number} onChange={(e) => set('license_number', e.target.value)} required placeholder="e.g. HOSP-LHR-001" />
                  </div>
                )}
              </>
            )}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Login to BloodConnect' : `Register as ${roleLabels[role]}`}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setIsLogin(!isLogin)} className="auth-switch-btn">
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
