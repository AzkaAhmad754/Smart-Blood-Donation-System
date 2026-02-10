import React, { useState } from 'react';
import BloodTypeBadge from './BloodTypeBadge';
import { MapPin, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './AlertCard.css';

const urgencyConfig = {
  CRITICAL: { cls: 'urgency-critical', icon: '🚨', label: 'CRITICAL' },
  HIGH: { cls: 'urgency-high', icon: '⚠️', label: 'HIGH' },
  NORMAL: { cls: 'urgency-normal', icon: '📋', label: 'NORMAL' },
};

const AlertCard = ({ request, onRespond, fulfilled }) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [responded, setResponded] = useState(null);

  const urg = urgencyConfig[request.urgency] || urgencyConfig.NORMAL;
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      await api.post('/responses/donor', { request_id: request.id, status: 'accepted' });
      setResponded('accepted');
      toast.success('You have committed to donate. Thank you!');
      onRespond && onRespond(request.id, 'accepted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to respond');
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await api.post('/responses/donor', { request_id: request.id, status: 'declined' });
      setResponded('declined');
      onRespond && onRespond(request.id, 'declined');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to respond');
    } finally {
      setLoading(false);
    }
  };

  if (fulfilled || responded === 'declined') return null;

  return (
    <>
      <div className={`alert-card ${urg.cls} ${fulfilled ? 'fulfilled' : ''} animate-fade-up`}>
        <div className="alert-card-header">
          <BloodTypeBadge type={request.blood_type} size="lg" />
          <span className={`badge badge-${request.urgency?.toLowerCase()}`}>
            {urg.icon} {urg.label}
          </span>
        </div>

        <div className="alert-card-body">
          <h3>{request.hospital_name || 'Hospital'}</h3>
          <div className="alert-meta">
            <span><MapPin size={13} /> {request.city}</span>
            <span><Clock size={13} /> {timeAgo(request.created_at)}</span>
            <span><AlertTriangle size={13} /> {request.quantity} unit{request.quantity > 1 ? 's' : ''} needed</span>
          </div>
          {request.notes && <p className="alert-notes">{request.notes}</p>}
        </div>

        {responded === 'accepted' ? (
          <div className="alert-responded">
            <CheckCircle size={16} className="text-success" />
            <span>You accepted this request</span>
          </div>
        ) : (
          <div className="alert-actions">
            <button className="btn btn-success" onClick={() => setShowModal(true)} disabled={loading}>
              <CheckCircle size={15} /> Accept
            </button>
            <button className="btn btn-danger" onClick={handleDecline} disabled={loading}>
              <XCircle size={15} /> Decline
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 8 }}>Confirm Donation</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              You are about to commit to donate <strong>{request.blood_type}</strong> blood to{' '}
              <strong>{request.hospital_name}</strong>. Please only accept if you are genuinely available.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-success btn-lg" onClick={handleAccept} disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Confirming...' : '✓ Yes, I will donate'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertCard;
