import React from 'react';

const BloodTypeBadge = ({ type, size = 'md' }) => {
  const sizes = {
    sm: { fontSize: '12px', padding: '3px 8px' },
    md: { fontSize: '14px', padding: '5px 12px' },
    lg: { fontSize: '20px', padding: '10px 20px', fontWeight: 800 },
    xl: { fontSize: '28px', padding: '14px 28px', fontWeight: 800 },
  };

  return (
    <span
      className="badge badge-blood"
      style={{
        ...sizes[size],
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        letterSpacing: '0.5px',
      }}
    >
      🩸 {type}
    </span>
  );
};

export default BloodTypeBadge;
