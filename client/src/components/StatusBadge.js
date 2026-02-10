import React from 'react';

const StatusBadge = ({ status }) => {
  const config = {
    active: { label: 'Active', cls: 'badge-critical', dot: 'red' },
    fulfilled: { label: 'Fulfilled', cls: 'badge-success', dot: 'green' },
    cancelled: { label: 'Cancelled', cls: 'badge-normal', dot: 'grey' },
    accepted: { label: 'Accepted', cls: 'badge-success', dot: 'green' },
    declined: { label: 'Declined', cls: 'badge-normal', dot: 'grey' },
    pending: { label: 'Pending', cls: 'badge-high', dot: 'red' },
    confirmed: { label: 'Confirmed', cls: 'badge-success', dot: 'green' },
  };

  const c = config[status] || config.pending;

  return (
    <span className={`badge ${c.cls}`}>
      <span className={`pulse-dot ${c.dot}`} />
      {c.label}
    </span>
  );
};

export default StatusBadge;
