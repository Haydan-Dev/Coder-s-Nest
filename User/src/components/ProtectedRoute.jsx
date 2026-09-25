import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api, { getWsBaseUrl } from '../utils/api';
import { alertService } from '../utils/alert';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [showForceLogoutModal, setShowForceLogoutModal] = useState(false);
  const [systemModal, setSystemModal] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const wsRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // Fallback timeout in case the request hangs indefinitely
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        const res = await Promise.race([
          api.get('/auth/me'),
          timeout
        ]);
        
        if (isMounted) {
          setUser(res.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Auth check failed:", error);
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
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
              
              setSystemModal({
                  type: notif.type,
                  title: notif.title,
                  message: notif.message,
                  isError: notif.type === 'KICK' || notif.type === 'SUSPEND' || notif.type === 'error'
              });
              
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
            } else if (payload.event === 'MEMBER_STATUS_UPDATE') {
              window.dispatchEvent(new CustomEvent('MEMBER_STATUS_UPDATE', { detail: payload.data }));
            } else if (payload.event === 'FORCE_LOGOUT') {
              setShowForceLogoutModal(true);
              sessionStorage.removeItem('cn-access-token');
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              sessionStorage.removeItem('user');
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
      
      {/* Force Logout Modal */}
      {showForceLogoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--bg-panel)', padding: '30px', borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-lg)', maxWidth: '400px', width: '90%', textAlign: 'center',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '60px', height: '60px', backgroundColor: 'var(--danger-light, rgba(239, 68, 68, 0.1))',
              color: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px'
            }}>
              <i className="fa-solid fa-right-from-bracket"></i>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-main)' }}>Session Terminated</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Your session has been forcefully terminated by the administrator. For security reasons, your access has been revoked.
            </p>
          </div>
        </div>
      )}

      {/* System Notification Modal */}
      {systemModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998
        }}>
          <div style={{
            backgroundColor: 'var(--bg-panel)', padding: '30px', borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-lg)', maxWidth: '400px', width: '90%', textAlign: 'center',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '60px', height: '60px', 
              backgroundColor: systemModal.isError ? 'var(--danger-light, rgba(239, 68, 68, 0.1))' : 'var(--accent-light, rgba(59, 130, 246, 0.1))',
              color: systemModal.isError ? 'var(--danger)' : 'var(--accent)', 
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px'
            }}>
              <i className={`fa-solid ${systemModal.isError ? 'fa-triangle-exclamation' : 'fa-bell'}`}></i>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--text-main)' }}>{systemModal.title}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {systemModal.message}
            </p>
            <button 
              onClick={() => setSystemModal(null)}
              className={systemModal.isError ? "btn btn-primary" : "btn btn-primary"}
              style={{ width: '100%', background: systemModal.isError ? 'var(--danger)' : 'var(--accent)' }}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProtectedRoute;
