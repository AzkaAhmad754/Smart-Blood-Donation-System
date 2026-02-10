import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Zap, Shield, Users, Building2, Droplets, ArrowRight, ChevronRight } from 'lucide-react';
import './Landing.css';

const STATS = [
  { value: 230, suffix: 'M+', label: 'Pakistan Population' },
  { value: 2.5, suffix: '%', label: 'Voluntary Donors' },
  { value: 2, suffix: 's', label: 'Someone needs blood' },
  { value: 50, suffix: 'K+', label: 'Lives saved yearly' },
];

const AnimatedCounter = ({ target, suffix, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const isDecimal = target % 1 !== 0;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count}{suffix}</span>;
};

const BloodDrop = ({ style }) => (
  <svg viewBox="0 0 40 55" className="blood-drop-svg" style={style}>
    <path d="M20 2 C20 2 2 22 2 35 C2 45.5 10.1 53 20 53 C29.9 53 38 45.5 38 35 C38 22 20 2 20 2Z"
      fill="rgba(192,21,42,0.15)" stroke="rgba(192,21,42,0.3)" strokeWidth="1" />
  </svg>
);

const Landing = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          {[...Array(6)].map((_, i) => (
            <BloodDrop key={i} style={{
              width: `${40 + i * 20}px`,
              left: `${10 + i * 15}%`,
              top: `${10 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }} />
          ))}
        </div>

        <div className={`hero-content ${visible ? 'visible' : ''}`}>
          <div className="hero-badge">
            <span className="pulse-dot red" />
            <span>Live Emergency Alerts Active</span>
          </div>

          <h1 className="hero-title">
            Every <span className="gradient-text">2 Seconds</span>,<br />
            Someone Needs Blood
          </h1>

          <p className="hero-subtitle">
            BloodConnect bridges the gap between donors, hospitals, and blood banks across Pakistan —
            in real time, when every second counts.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              <Heart size={18} /> Join as Donor
            </Link>
            <Link to="/register?role=hospital" className="btn btn-secondary btn-lg">
              Post Emergency Request <ArrowRight size={16} />
            </Link>
          </div>

          <div className="urgency-ticker">
            <span className="ticker-label">🔴 LIVE</span>
            <div className="ticker-track">
              <div className="ticker-content">
                {[
                  '12 urgent requests in Lahore',
                  '3 O- donors needed in Karachi',
                  'AB+ critical at Shaukat Khanum',
                  '7 requests fulfilled today',
                  'B+ needed in Islamabad',
                  '2 blood banks dispatched in Rawalpindi',
                ].map((t, i) => <span key={i}>{t} &nbsp;•&nbsp; </span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="stat-card glass">
                <div className="stat-value">
                  {visible && <AnimatedCounter target={s.value} suffix={s.suffix} />}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <div className="container">
          <div className="section-header">
            <h2>How <span className="gradient-text">BloodConnect</span> Works</h2>
            <p>Three simple steps that save lives</p>
          </div>
          <div className="steps-grid">
            {[
              { icon: <Building2 size={32} />, step: '01', title: 'Hospital Posts Request', desc: 'A hospital posts an emergency blood request with blood type, urgency level, and quantity needed.' },
              { icon: <Zap size={32} />, step: '02', title: 'System Matches Instantly', desc: 'Our engine finds compatible donors and blood banks in the same city and sends real-time alerts.' },
              { icon: <Heart size={32} />, step: '03', title: 'Donor Responds', desc: 'Donors accept or decline. Once fulfilled, all alerts are cancelled system-wide automatically.' },
            ].map((s, i) => (
              <div key={i} className="step-card glass">
                <div className="step-number">{s.step}</div>
                <div className="step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < 2 && <ChevronRight size={20} className="step-arrow hide-mobile" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="roles-section">
        <div className="container">
          <div className="section-header">
            <h2>Join as <span className="gradient-text">Who You Are</span></h2>
            <p>Every role matters in saving lives</p>
          </div>
          <div className="roles-grid">
            {[
              {
                icon: <Heart size={40} />,
                role: 'donor',
                title: 'Blood Donor',
                desc: 'Register your blood type, set availability, and receive real-time alerts when your blood is needed nearby.',
                features: ['Real-time emergency alerts', 'Accept/decline requests', 'Track donation history'],
                color: 'var(--crimson)',
              },
              {
                icon: <Building2 size={40} />,
                role: 'hospital',
                title: 'Hospital',
                desc: 'Post emergency blood requests and watch responses come in live from donors and blood banks.',
                features: ['Post emergency requests', 'Live response dashboard', 'Manage request history'],
                color: '#3B82F6',
              },
              {
                icon: <Droplets size={40} />,
                role: 'blood_bank',
                title: 'Blood Bank',
                desc: 'Manage your inventory and respond to hospital requests in your region with confirmed dispatch.',
                features: ['Inventory management', 'Region-based alerts', 'Confirm dispatch'],
                color: 'var(--success)',
              },
            ].map((r, i) => (
              <Link to={`/register?role=${r.role}`} key={i} className="role-card glass" style={{ '--role-color': r.color }}>
                <div className="role-icon" style={{ color: r.color }}>{r.icon}</div>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
                <ul className="role-features">
                  {r.features.map((f, j) => <li key={j}><Shield size={12} /> {f}</li>)}
                </ul>
                <div className="role-cta">
                  Register as {r.title} <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-brand">
            <Droplets size={28} style={{ color: 'var(--crimson)' }} />
            <span>Blood<strong>Connect</strong></span>
          </div>
          <p className="footer-mission">
            Connecting lives across Pakistan — one donation at a time.
          </p>
          <div className="footer-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
          <p className="footer-copy">© 2024 BloodConnect. Built to save lives.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
