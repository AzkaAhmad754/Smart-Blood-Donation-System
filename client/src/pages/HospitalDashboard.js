import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import BloodTypeBadge from '../components/BloodTypeBadge';
import StatusBadge from '../components/StatusBadge';
import { Plus, Users, CheckCircle, XCircle, Wifi, WifiOff, Activity } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Dashboard.css';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];

const HospitalDashboard = () => {
  const { user, profile } = useAuth();
  const { socket, connected } = useSocket();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ blood_type: 'O+', quantity: 1, urgency: 'HIGH', notes: '' });
  const [liveStats, setLiveStats] = useState({});

  const fetchRequests = useCallback(async () => {
    try {
      const { data } = await api.get('/requests/mine');
      setRequests(data);
      const stats = {};
      data.forEach((r) => { if (r.stats) stats[r.id] = r.stats; });
      setLiveStats(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    if (!socket || !profile?.id) return;
    socket.emit('join_hospital_room', { hospital_id: profile.id });

    const onDonorAccepted = ({ request_id, donor_name, accepted_count }) => {
      setLiveStats((prev) => ({
        ...prev,
        [request_id]: { ...prev[request_id], donors_accepted: accepted_count },
      }));
      toast.success(`${donor_name} accepted your blood request!`);
    };

    const onBankConfirmed = ({ request_id, bank_name, units_committed }) => {
      setLiveStats((prev) => ({
        ...prev,
        [request_id]: { ...prev[request_id], banks_confirmed: (prev[request_id]?.banks_confirmed || 0) + 1 },
      }));
      toast.success(`${bank_name} confirmed ${units_committed} units!`);
    };

    const onFulfilled = ({ request_id }) => {
      setRequests((prev) => prev.map((r) => r.id === request_id ? { ...r, status: 'fulfilled' } : r));
      toast.success('Blood request fulfilled!', { icon: '🎉' });
    };

    socket.on('donor_accepted', onDonorAccepted);
    socket.on('bank_confirmed', onBankConfirmed);
    socket.on('request_fulfilled', onFulfilled);
    return () => {
      socket.off('donor_accepted', onDonorAccepted);
      socket.off('bank_confirmed', onBankConfirmed);
      socket.off('request_fulfilled', onFulfilled);
    };
  }, [socket, profile]);

  const submitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/requests', form);
      setRequests((prev) => [{ ...data, stats: { donors_notified: 0, donors_accepted: 0, banks_confirmed: 0 } }, ...prev]);
      setShowForm(false);
      setForm({ blood_type: 'O+', quantity: 1, urgency: 'HIGH', notes: '' });
      toast.success('Emergency request posted! Notifying donors...');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post request');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/requests/${id}/status`, { status });
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      toast.success(`Request marked as ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const activeReqs = requests.filter((r) => r.status === 'active');
  const pastReqs = requests.filter((r) => r.status !== 'active');

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Hospital Dashboard</h1>
            <p className="text-muted">{user?.name}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="connection-status">
              {connected ? <><Wifi size={14} className="text-success" /> Live</> : <><WifiOff size={14} /> Offline</>}
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Post Emergency Request
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="stats-row">
          {[
            { label: 'Active Requests', value: activeReqs.length, icon: <Activity size={20} />, color: 'var(--crimson)' },
            { label: 'Total Donors Notified', value: Object.values(liveStats).reduce((s, v) => s + (parseInt(v?.donors_notified) || 0), 0), icon: <Users size={20} />, color: '#3B82F6' },
            { label: 'Donors Accepted', value: Object.values(liveStats).reduce((s, v) => s + (parseInt(v?.donors_accepted) || 0), 0), icon: <CheckCircle size={20} />, color: 'var(--success)' },
            { label: 'Requests Fulfilled', value: pastReqs.filter((r) => r.status === 'fulfilled').length, icon: <CheckCircle size={20} />, color: 'var(--success)' },
          ].map((s, i) => (
            <div key={i} className="stat-mini glass">
              <div style={{ color: s.color }}>{s.icon}</div>
              <div>
                <div className="stat-mini-value">{s.value}</div>
                <div className="stat-mini-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          <button className={`dash-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
            Active Requests {activeReqs.length > 0 && <span className="tab-badge">{activeReqs.length}</span>}
          </button>
          <button className={`dash-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            Request History
          </button>
        </div>

        {/* Active Requests */}
        {tab === 'active' && (
          <div>
            {loading ? (
              <div className="skeleton" style={{ height: 200 }} />
            ) : activeReqs.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-icon">🏥</div>
                <h3>No active requests</h3>
                <p>Post an emergency request to notify donors and blood banks</p>
              </div>
            ) : (
              <div className="request-list">
                {activeReqs.map((req) => {
                  const stats = liveStats[req.id] || req.stats || {};
                  const accepted = parseInt(stats.donors_accepted) || 0;
                  const pct = Math.min(100, (accepted / req.quantity) * 100);
                  return (
                    <div key={req.id} className={`request-card glass urgency-${req.urgency?.toLowerCase()}`}>
                      <div className="request-card-top">
                        <BloodTypeBadge type={req.blood_type} size="lg" />
                        <span className={`badge badge-${req.urgency?.toLowerCase()}`}>{req.urgency}</span>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="request-meta">
                        <span>{req.quantity} unit{req.quantity > 1 ? 's' : ''} needed</span>
                        <span>{new Date(req.created_at).toLocaleString()}</span>
                      </div>
                      {req.notes && <p className="request-notes">{req.notes}</p>}

                      <div className="response-stats">
                        <div className="resp-stat"><Users size={13} /> <span>{stats.donors_notified || 0} notified</span></div>
                        <div className="resp-stat"><CheckCircle size={13} style={{ color: 'var(--success)' }} /> <span>{accepted} accepted</span></div>
                        <div className="resp-stat"><CheckCircle size={13} style={{ color: '#3B82F6' }} /> <span>{stats.banks_confirmed || 0} banks responded</span></div>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                          <span>Fulfillment Progress</span>
                          <span>{accepted}/{req.quantity} units</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="request-actions">
                        <button className="btn btn-success btn-sm" onClick={() => updateStatus(req.id, 'fulfilled')}>
                          <CheckCircle size={13} /> Mark Fulfilled
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => updateStatus(req.id, 'cancelled')}>
                          <XCircle size={13} /> Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div className="card">
            {pastReqs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No past requests</h3>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr><th>Blood Type</th><th>Quantity</th><th>Urgency</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {pastReqs.map((r) => (
                      <tr key={r.id}>
                        <td><BloodTypeBadge type={r.blood_type} size="sm" /></td>
                        <td>{r.quantity} units</td>
                        <td><span className={`badge badge-${r.urgency?.toLowerCase()}`}>{r.urgency}</span></td>
                        <td><StatusBadge status={r.status} /></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Request Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2 style={{ marginBottom: 4 }}>Post Emergency Request</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              This will immediately notify all compatible donors and blood banks in {user?.city}.
            </p>
            <form onSubmit={submitRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Blood Type Needed</label>
                <div className="blood-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {BLOOD_TYPES.map((bt) => (
                    <button key={bt} type="button"
                      className={`bt-btn ${form.blood_type === bt ? 'active' : ''}`}
                      onClick={() => setForm((f) => ({ ...f, blood_type: bt }))}>
                      {bt}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Quantity (units)</label>
                  <input className="form-input" type="number" min={1} max={20} value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Urgency Level</label>
                  <select className="form-input" value={form.urgency} onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}>
                    <option value="CRITICAL">🚨 CRITICAL</option>
                    <option value="HIGH">⚠️ HIGH</option>
                    <option value="NORMAL">📋 NORMAL</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Additional Notes (optional)</label>
                <textarea className="form-input" rows={3} value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Patient condition, ward number, etc." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? 'Posting...' : '🚨 Post Emergency Request'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;
