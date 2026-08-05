import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [toastNotif, setToastNotif] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const wsRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  // WebSocket for real-time global notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      if (wsRef.current) return; // Already connected

      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const wsUrl = backendUrl.replace(/^http/, wsProtocol) + `/notifications/ws/${user.user_id}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'NOTIFICATION') {
            const notif = payload.data;
            setToastNotif(notif);
            
            // Dispatch event to update other components automatically (like Notifications.jsx)
            window.dispatchEvent(new CustomEvent('refresh_notifications', { detail: notif }));
            
            // Auto hide toast after 5s
            setTimeout(() => {
              setToastNotif(prev => prev && prev.id === notif.id ? null : prev);
            }, 5000);

            // Kick user out if they are suspended or removed AND they are currently in a workspace
            if (notif.type === 'KICK' || notif.type === 'SUSPEND') {
               // Only kick if they are in the project this notification refers to
               const inWorkspace = window.location.pathname.startsWith(`/workspace/${notif.reference_id}`) || 
                                   window.location.pathname.startsWith(`/workspace`); // general fallback
               if (inWorkspace) {
                   setTimeout(() => {
                       navigate('/dashboard');
                   }, 3000);
               }
            }
          }
        } catch (err) {
          console.error("Failed to parse notification", err);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
      };

      return () => {
        ws.close();
        wsRef.current = null;
      };
    }
  }, [isAuthenticated, user, navigate]);

  if (isAuthenticated === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-app)' }}>
        <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ width: '40px' }}>
          <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Outlet />
      
      {/* Global Clash-of-Clans style Toast for Notifications */}
      {toastNotif && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.98), rgba(15, 15, 25, 0.98))',
          border: '1px solid rgba(255,255,255,0.1)',
          borderLeft: '4px solid var(--accent, #f59e0b)',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          color: '#ffffff',
          animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent, #f59e0b)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px' }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '4px', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{toastNotif.title}</div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{toastNotif.message}</div>
          </div>
          <style>{`
            @keyframes slideDown {
              from { transform: translate(-50%, -100%); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default ProtectedRoute;
