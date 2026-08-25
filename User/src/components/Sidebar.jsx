import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { getBaseUrl } from '../utils/api';

const Sidebar = ({ onLogout, isOpen, isMini, toggleSidebar }) => {
  // State definitions that replace your vanilla JS variables
  const [activePage, setActivePage] = useState('Home');
  const [unreadCount, setUnreadCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const fetchUserAndCounts = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        
        // Fetch projects count
        const projRes = await api.get('/projects/');
        setProjectsCount(projRes.data.length);
        
        // Fetch unread notifications/invites
        const invRes = await api.get('/projects/invitations/');
        setUnreadCount(invRes.data.filter(inv => inv.unread).length);
      } catch (err) {
        console.error('Failed to fetch user or counts in sidebar', err);
      }
    };
    
    fetchUserAndCounts();

    const handleRefresh = () => fetchUserAndCounts();
    window.addEventListener('refresh_notifications', handleRefresh);
    window.addEventListener('refresh_projects', handleRefresh); // Custom event if needed later

    return () => {
      window.removeEventListener('refresh_notifications', handleRefresh);
      window.removeEventListener('refresh_projects', handleRefresh);
    };
  }, []);

  // Sync active page with current URL
  React.useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.startsWith('/dashboard')) setActivePage('Home');
    else if (path.startsWith('/projects') || path.startsWith('/project/')) setActivePage('Projects');
    else if (path.startsWith('/workspace')) setActivePage('Workspace');
    else if (path.startsWith('/messages')) setActivePage('Messages');
    else if (path.startsWith('/ai-assistant')) setActivePage('AI Assistant');
    else if (path.startsWith('/notifications')) setActivePage('Notifications');
    else if (path.startsWith('/settings')) setActivePage('Settings');
    else if (path.startsWith('/activity')) setActivePage('Activity');
    else if (path.startsWith('/useradminpanel') || path.startsWith('/admin')) setActivePage('Admin Panel');
    else if (path.startsWith('/bin')) setActivePage('Recycle Bin');
    else if (path.startsWith('/teams')) setActivePage('Teams');
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed on backend', e);
    } finally {
      sessionStorage.removeItem('cn-access-token');
      if (onLogout) onLogout();
      else navigate('/login');
    }
  };

  // Helper to handle nav clicks
  const handleNavClick = (pageName) => {
    setActivePage(pageName);

    // Route to respective pages
    switch (pageName) {
      case 'Home':
        navigate('/dashboard');
        break;
      case 'Projects':
        navigate('/projects');
        break;
      case 'Recycle Bin':
        navigate('/bin');
        break;
      case 'Teams':
        navigate('/Teams');
        break;
      case 'Workspace':
        // If already in a workspace (with or without ID), don't strip the ID!
        if (!location.pathname.startsWith('/workspace')) {
          navigate('/workspace');
        }
        break;
      case 'AI Assistant':
        navigate('/ai-assistant');
        break;
      case 'Messages':
        navigate('/messages');
        break;
      case 'Settings':
        navigate('/settings');
        break;
      case 'Notifications':
        navigate('/notifications');
        break;
      case 'Activity':
        navigate('/activity');
        break;
      case 'Admin Panel':
        navigate('/UserAdminPanel');
        break;
      default:
        break;
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} ${isMini ? 'mini' : ''}`}>
      <div className="sidebar-header">
        <a href="/" className="logo" onClick={(e) => e.preventDefault()}>
          <img src="/logo-light.png" alt="Coder's Nest" className="logo-light-img" />
          <img src="/logo-dark.png" alt="Coder's Nest" className="logo-dark-img" />
        </a>
        <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-title">Main</span>

        <div
          className={`nav-item ${activePage === 'Home' ? 'active' : ''}`}
          onClick={() => handleNavClick('Home')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </div>

        <div
          className={`nav-item ${activePage === 'Projects' ? 'active' : ''}`}
          onClick={() => handleNavClick('Projects')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Projects
          {projectsCount > 0 && <span className="nav-item-badge">{projectsCount}</span>}
        </div>


        <div
          className={`nav-item ${activePage === 'Messages' ? 'active' : ''}`}
          onClick={() => handleNavClick('Messages')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Messages
        </div>

        <div
          className={`nav-item ai-item ${activePage === 'AI Assistant' ? 'active' : ''}`}
          onClick={() => handleNavClick('AI Assistant')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
          </svg>
          AI Assistant
          <span className="ai-badge">NEW</span>
        </div>

        <span className="sidebar-section-title">Account</span>

        <div
          className={`nav-item ${activePage === 'Notifications' ? 'active' : ''}`}
          onClick={() => handleNavClick('Notifications')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Notifications
          {unreadCount > 0 && <span className="nav-item-badge alert">{unreadCount}</span>}
        </div>

        <div
          className={`nav-item ${activePage === 'Settings' ? 'active' : ''}`}
          onClick={() => handleNavClick('Settings')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </div>


        <div
          className={`nav-item ${activePage === 'Admin Panel' ? 'active' : ''}`}
          onClick={() => handleNavClick('Admin Panel')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Admin Panel
        </div>

        <div
          className={`nav-item ${activePage === 'Recycle Bin' ? 'active' : ''}`}
          onClick={() => handleNavClick('Recycle Bin')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
          Recycle Bin
        </div>

        <div
          className="nav-item"
          style={{ marginTop: 'auto' }}
          onClick={handleLogout}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--danger)' }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span style={{ color: 'var(--danger)' }}>Sign out</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => setIsProfileOpen(!isProfileOpen)}>
          <div className="user-avatar" style={user?.profile_pic_url ? {background: `url(${getBaseUrl()}${user.profile_pic_url}) center/cover`, color: 'transparent'} : {}}>
            {user?.profile_pic_url ? '' : (user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U')}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.full_name || 'Loading...'}</div>
            <div className="user-email">{user?.email || 'Loading...'}</div>
          </div>
          <div className="user-chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>

        {/* Dropdown UI toggle logic removed to fix stray line */}
      </div>
    </aside>
  );
};

export default Sidebar;