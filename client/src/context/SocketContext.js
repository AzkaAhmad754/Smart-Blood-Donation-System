import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { initSocket, disconnectSocket } from '../utils/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      const s = initSocket(token);
      socketRef.current = s;

      s.on('connect', () => {
        setConnected(true);
        // Register based on role
        if (user.role === 'donor') {
          s.emit('donor_available', { donor_user_id: user.id });
        }
        if (user.role === 'blood_bank') {
          s.emit('join_bank_room', { city: user.city });
        }
      });

      s.on('disconnect', () => setConnected(false));

      return () => {
        disconnectSocket();
        setConnected(false);
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
