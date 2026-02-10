import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './InventoryCard.css';

const getStatus = (units) => {
  if (units < 5) return { cls: 'inv-critical', label: 'Critical', color: 'var(--danger)' };
  if (units < 15) return { cls: 'inv-low', label: 'Low', color: 'var(--warning)' };
  return { cls: 'inv-ok', label: 'Good', color: 'var(--success)' };
};

const InventoryCard = ({ item, bankId, onUpdate }) => {
  const [units, setUnits] = useState(item.units);
  const [loading, setLoading] = useState(false);
  const status = getStatus(units);

  const adjust = async (delta) => {
    const newVal = Math.max(0, units + delta);
    setLoading(true);
    try {
      await api.patch(`/inventory/${bankId}`, { blood_type: item.blood_type, units: newVal });
      setUnits(newVal);
      onUpdate && onUpdate(item.blood_type, newVal);
    } catch {
      toast.error('Failed to update inventory');
    } finally {
      setLoading(false);
    }
  };

  const pct = Math.min(100, (units / 30) * 100);

  return (
    <div className={`inv-card ${status.cls}`}>
      <div className="inv-header">
        <span className="inv-type">🩸 {item.blood_type}</span>
        <span className="inv-status-label" style={{ color: status.color }}>{status.label}</span>
      </div>

      <div className="inv-units">{units}</div>
      <div className="inv-unit-label">units available</div>

      <div className="progress-bar" style={{ margin: '12px 0' }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: status.color }} />
      </div>

      <div className="inv-controls">
        <button className="inv-btn" onClick={() => adjust(-1)} disabled={loading || units === 0}>
          <Minus size={14} />
        </button>
        <button className="inv-btn inv-btn-add" onClick={() => adjust(1)} disabled={loading}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

export default InventoryCard;
