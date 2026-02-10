import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import AlertCard from '../components/AlertCard';
import BloodTypeBadge from '../components/BloodTypeBadge';
import StatusBadge from '../components/StatusBadge';
import { Bell, History, User, Wifi, WifiOff } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Dashboard.css';

const DonorDashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { socket, connected } = useSocket();
  const [activeRequests, setActiveRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState(profile?.availability ?? true);
  const [tab, setTab] = useState('alerts');
  const [fulfilledIds, setFulfilledIds] = useState(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, histRes] = await Promise.all([
        api.get(`/requests?city=${user?.city}`),
        api.get('/donors/history'),
      ]);
      setActiveRequests(reqRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (req) => {
      setActiveRequests((prev) => {
        if (prev.find((r) => r.id === req.id)) return prev;
        return [req, ...prev];
      });
    };
    const onFulfilled = ({ request_id }) => {
      setFulfilledIds((prev) => new Set([...prev, request_id]));
      setActiveRequests((prev) => prev.filter((r) => r.id !== request_id));
    };
    socket.on('new_request', onNew);
    socket.on('request_fulfilled', onFulfilled);
    socket.on('alert_cancelled', onFulfilled);
    return () => {
      socket.off('new_request', onNew);
      socket.off('request_fulfilled', onFulfilled);
      socket.off('alert_cancelled', onFulfilled);
    };
  }, [socket]);

  const toggleAvailability = async () => {
    const newVal = !availability;
    try {
      await api.patch('/donors/availability', { availability: newVal });
      setAvailability(newVal);
      if (socket) socket.emit('donor_available', { donor_user_id: user.id });
      toast.success(newVal ? 'You are now available for donations' : 'You are now unavailable');
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const handleRespond = (id, status) => {
    if (status === 'declined') {
      setActiveRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Donor Dashboard</h1>
            <p className="text-muted">Welcome back, {user?.name?.split(' ')[0]}</p>
          </div>
          <div className="connection-status">
            {connected ? <><Wifi size={14} className="text-success" /> Live</> : <><WifiOff size={14} /> Offline</>}
          </div>
        </div>

        {/* Profile Card */}
        <div className="profile-card glass">
          <div className="profile-info">
            <div className="profile-avatar">
              <User size={28} />
            </div>
            <div>
              <h2>{user?.name}</h2>
              <p className="text-muted">{user?.city} · {user?.phone}</p>
            </div>
            {profile?.blood_type && <BloodTypeBadge type={profile.blood_type} size="xl" />}
          </div>

          <div className="availability-toggle">
            <div>
              <div className="avail-label">
                <span className={`pulse-dot ${availability ? 'green' : 'grey'}`} />
                <strong>{availability ? 'Available to Donate' : 'Unavailable'}</strong>
              </div>
              <p className="text-muted" style={{ fontSize: 12 }}>
                {availability ? 'You will receive emergency alerts' : 'You will not receive alerts'}
              </p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={availability} onChange={toggleAvailability} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          <button className={`dash-tab ${tab === 'alerts' ? 'active' : ''}`} onClick={() => setTab('alerts')}>
            <Bell size={15} /> Alerts
            {activeRequests.length > 0 && <span className="tab-badge">{activeRequests.length}</span>}
          </button>
          <button className={`dash-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            <History size={15} /> My History
          </button>
        </div>

        {/* Alerts Tab */}
        {tab === 'alerts' && (
          <div className="alerts-grid">
            {loading ? (
              [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180 }} />)
            ) : activeRequests.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <div className="empty-icon">🩸</div>
                <h3>No active requests</h3>
                <p>You'll be notified when a compatible blood request is posted in {user?.city}</p>
              </div>
            ) : (
              activeRequests.map((req) => (
                <AlertCard
                  key={req.id}
                  request={req}
                  onRespond={handleRespond}
                  fulfilled={fulfilledIds.has(req.id)}
                />
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div className="card">
            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No donation history yet</h3>
                <p>Your accepted requests will appear here</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Hospital</th>
                      <th>Blood Type</th>
                      <th>Urgency</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td>{h.hospital_name}</td>
                        <td><BloodTypeBadge type={h.blood_type} size="sm" /></td>
                        <td><span className={`badge badge-${h.urgency?.toLowerCase()}`}>{h.urgency}</span></td>
                        <td><StatusBadge status={h.status} /></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                          {new Date(h.request_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;
