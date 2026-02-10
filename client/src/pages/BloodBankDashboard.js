import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import InventoryCard from '../components/InventoryCard';
import BloodTypeBadge from '../components/BloodTypeBadge';
import StatusBadge from '../components/StatusBadge';
import { Droplets, Bell, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Dashboard.css';

const BloodBankDashboard = () => {
  const { user, profile } = useAuth();
  const { socket, connected } = useSocket();
  const [inventory, setInventory] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inventory');
  const [dispatching, setDispatching] = useState(null);
  const [unitsInput, setUnitsInput] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const [invRes, reqRes] = await Promise.all([
        api.get('/inventory/me'),
        api.get(`/requests?city=${user?.city}`),
      ]);
      setInventory(invRes.data.inventory || []);
      setIncomingRequests(reqRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_bank_room', { city: user?.city });

    const onNew = (req) => {
      setIncomingRequests((prev) => {
        if (prev.find((r) => r.id === req.id)) return prev;
        return [req, ...prev];
      });
    };
    const onFulfilled = ({ request_id }) => {
      setIncomingRequests((prev) => prev.map((r) => r.id === request_id ? { ...r, status: 'fulfilled' } : r));
    };

    socket.on('new_request', onNew);
    socket.on('request_fulfilled', onFulfilled);
    socket.on('alert_cancelled', onFulfilled);
    return () => {
      socket.off('new_request', onNew);
      socket.off('request_fulfilled', onFulfilled);
      socket.off('alert_cancelled', onFulfilled);
    };
  }, [socket, user]);

  const confirmDispatch = async (requestId) => {
    const units = parseInt(unitsInput[requestId]) || 1;
    setDispatching(requestId);
    try {
      await api.post('/responses/bank', { request_id: requestId, units_committed: units });
      setIncomingRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, responded: true } : r));
      toast.success(`Confirmed dispatch of ${units} units!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to confirm dispatch');
    } finally {
      setDispatching(null);
    }
  };

  const handleInventoryUpdate = (blood_type, units) => {
    setInventory((prev) => prev.map((i) => i.blood_type === blood_type ? { ...i, units } : i));
  };

  const totalUnits = inventory.reduce((s, i) => s + i.units, 0);
  const criticalTypes = inventory.filter((i) => i.units < 5).length;
  const activeRequests = incomingRequests.filter((r) => r.status === 'active' && !r.responded);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Blood Bank Dashboard</h1>
            <p className="text-muted">{user?.name} · {user?.city}</p>
          </div>
          <div className="connection-status">
            {connected ? <><Wifi size={14} className="text-success" /> Live</> : <><WifiOff size={14} /> Offline</>}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {[
            { label: 'Total Units', value: totalUnits, icon: <Droplets size={20} />, color: '#3B82F6' },
            { label: 'Critical Types', value: criticalTypes, icon: <Bell size={20} />, color: 'var(--danger)' },
            { label: 'Active Requests', value: activeRequests.length, icon: <Bell size={20} />, color: 'var(--warning)' },
            { label: 'Dispatched Today', value: incomingRequests.filter((r) => r.responded).length, icon: <CheckCircle size={20} />, color: 'var(--success)' },
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
          <button className={`dash-tab ${tab === 'inventory' ? 'active' : ''}`} onClick={() => setTab('inventory')}>
            <Droplets size={15} /> Inventory
          </button>
          <button className={`dash-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
            <Bell size={15} /> Incoming Requests
            {activeRequests.length > 0 && <span className="tab-badge">{activeRequests.length}</span>}
          </button>
        </div>

        {/* Inventory Grid */}
        {tab === 'inventory' && (
          <div>
            {loading ? (
              <div className="inv-grid">
                {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}
              </div>
            ) : (
              <div className="inv-grid">
                {inventory.map((item) => (
                  <InventoryCard
                    key={item.blood_type}
                    item={item}
                    bankId={profile?.id}
                    onUpdate={handleInventoryUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Incoming Requests */}
        {tab === 'requests' && (
          <div className="request-list">
            {loading ? (
              <div className="skeleton" style={{ height: 200 }} />
            ) : incomingRequests.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-icon">📭</div>
                <h3>No incoming requests</h3>
                <p>Hospital requests in {user?.city} will appear here</p>
              </div>
            ) : (
              incomingRequests.map((req) => (
                <div key={req.id} className={`request-card glass ${req.status !== 'active' || req.responded ? 'opacity-60' : `urgency-${req.urgency?.toLowerCase()}`}`}>
                  <div className="request-card-top">
                    <BloodTypeBadge type={req.blood_type} size="lg" />
                    <span className={`badge badge-${req.urgency?.toLowerCase()}`}>{req.urgency}</span>
                    <StatusBadge status={req.responded ? 'confirmed' : req.status} />
                  </div>
                  <div className="request-meta">
                    <span>{req.hospital_name}</span>
                    <span>{req.quantity} units needed</span>
                    <span>{new Date(req.created_at).toLocaleString()}</span>
                  </div>

                  {req.status === 'active' && !req.responded && (
                    <div className="dispatch-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Units to commit</label>
                        <input
                          className="form-input"
                          type="number"
                          min={1}
                          max={req.quantity}
                          value={unitsInput[req.id] || ''}
                          onChange={(e) => setUnitsInput((p) => ({ ...p, [req.id]: e.target.value }))}
                          placeholder={`Max ${req.quantity}`}
                        />
                      </div>
                      <button
                        className="btn btn-success"
                        onClick={() => confirmDispatch(req.id)}
                        disabled={dispatching === req.id}
                        style={{ alignSelf: 'flex-end' }}
                      >
                        <CheckCircle size={15} />
                        {dispatching === req.id ? 'Confirming...' : 'Confirm Dispatch'}
                      </button>
                    </div>
                  )}

                  {req.responded && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: 'var(--success)', fontSize: 13 }}>
                      <CheckCircle size={15} /> Dispatch confirmed
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodBankDashboard;
