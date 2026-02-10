import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { Bell, Menu, X, Droplets, LogOut, User } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'donor') return '/donor/dashboard';
    if (user.role === 'hospital') return '/hospital/dashboard';
    if (user.role === 'blood_bank') return '/bloodbank/dashboard';
    return '/';
  };

  const isLanding = location.pathname === '/';

  return (
    <nav className={`navbar ${isLanding ? 'navbar-transparent' : 'navbar-solid'}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <Droplets size={24} className="brand-icon" />
          <span>Blood<strong>Connect</strong></span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {!user ? (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          ) : (
            <>
              <Link to={getDashboardPath()} className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button className="notif-btn" onClick={markAllRead}>
                <Bell size={18} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>
              <div className="nav-user">
                <User size={16} />
                <span>{user.name?.split(' ')[0]}</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                <LogOut size={14} /> Logout
              </button>
            </>
          )}
        </div>

        <button className="hamburger hide-desktop" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
