import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (data) => {
      const notif = { id: data.id, type: 'new_request', data, read: false, timestamp: new Date() };
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
      toast.custom((t) => (
        <div className={`notif-toast urgency-${data.urgency?.toLowerCase()}`}>
          <span className="notif-icon">🩸</span>
          <div>
            <strong>{data.urgency} — {data.blood_type} needed</strong>
            <p>{data.hospital_name} · {data.city}</p>
          </div>
        </div>
      ), { duration: 6000, position: 'top-right' });
    };

    const handleFulfilled = (data) => {
      setNotifications((prev) =>
        prev.map((n) => n.data?.id === data.request_id ? { ...n, fulfilled: true } : n)
      );
      toast.success('A blood request has been fulfilled!', { position: 'top-right' });
    };

    socket.on('new_request', handleNewRequest);
    socket.on('request_fulfilled', handleFulfilled);
    socket.on('alert_cancelled', handleFulfilled);

    return () => {
      socket.off('new_request', handleNewRequest);
      socket.off('request_fulfilled', handleFulfilled);
      socket.off('alert_cancelled', handleFulfilled);
    };
  }, [socket]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAllRead };
};
