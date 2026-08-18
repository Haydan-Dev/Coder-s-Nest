import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api, { getWsBaseUrl } from '../utils/api';
import { alertService } from '../utils/alert';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
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
    let reconnectTimeout = null;
    let isActive = true;

    const connectWebSocket = () => {
      if (isAuthenticated && user && isActive) {
        if (wsRef.current) return; // Already connected

        const wsUrl = `${getWsBaseUrl()}/notifications/ws/${user.user_id}`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.event === 'NOTIFICATION') {
              const notif = payload.data;
              
              // Show toast using the system's alertService (respects theme)
              if (notif.type === 'KICK' || notif.type === 'SUSPEND' || notif.type === 'error') {
                  alertService.warning(notif.message, notif.title);
              } else {
                  alertService.info(notif.message, notif.title);
              }
              
              // Dispatch event to update other components automatically (like Notifications.jsx)
              window.dispatchEvent(new CustomEvent('refresh_notifications', { detail: notif }));

              // Kick user out if they are suspended or removed AND they are currently in a workspace
              if (notif.type === 'KICK' || notif.type === 'SUSPEND') {
                 const inWorkspace = window.location.pathname.startsWith(`/workspace/${notif.reference_id}`) || 
                                     window.location.pathname.startsWith(`/workspace`);
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
          if (isActive) {
            console.log("Global WebSocket closed, reconnecting in 3 seconds...");
            reconnectTimeout = setTimeout(connectWebSocket, 3000);
          }
        };
      }
    };

    connectWebSocket();

    return () => {
      isActive = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
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
    </>
  );
};

export default ProtectedRoute;
