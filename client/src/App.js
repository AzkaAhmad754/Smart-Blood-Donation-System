import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import DonorDashboard from './pages/DonorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';

const getDashPath = (role) => {
  if (role === 'donor') return '/donor/dashboard';
  if (role === 'hospital') return '/hospital/dashboard';
  if (role === 'blood_bank') return '/bloodbank/dashboard';
  return '/';
};

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--crimson)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Navigate to={getDashPath(user.role)} replace /> : <Auth mode="login" />} />
        <Route path="/register" element={user ? <Navigate to={getDashPath(user.role)} replace /> : <Auth mode="register" />} />
        <Route path="/donor/dashboard" element={
          <ProtectedRoute role="donor"><DonorDashboard /></ProtectedRoute>
        } />
        <Route path="/hospital/dashboard" element={
          <ProtectedRoute role="hospital"><HospitalDashboard /></ProtectedRoute>
        } />
        <Route path="/bloodbank/dashboard" element={
          <ProtectedRoute role="blood_bank"><BloodBankDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--navy-light)',
                color: 'var(--text-light)',
                border: '1px solid var(--card-border)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: 'var(--success)', secondary: 'white' } },
              error: { iconTheme: { primary: 'var(--danger)', secondary: 'white' } },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
