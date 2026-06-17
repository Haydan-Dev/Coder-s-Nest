import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import api from '../utils/api';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Hit the secure endpoint to validate the token
        // If it's expired, the api.js interceptor will silently catch it, 
        // refresh it via cookie, and retry this automatically!
        await api.get('/auth/me');
        setIsAuthenticated(true);
      } catch (error) {
        // If it gets here, even the refresh token failed
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [location.pathname]); // Re-check if they somehow try to jump pages

  // While validating with backend, show a simple loader
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

  // If validation failed, send to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If valid, render the protected child routes
  return <Outlet />;
};

export default ProtectedRoute;
