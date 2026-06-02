import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ onLogout, isOpen }) => {
  // State definitions that replace your vanilla JS variables
  const [activePage, setActivePage] = useState('Home');
  const [unreadCount, setUnreadCount] = useState(3);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

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
      case 'Teams':
        navigate('/Teams');
        break;
      case 'Workspace':
        navigate('/workspace');
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
      case 'Admin Panel':
        navigate('/UserAdminPanel');
        break;
      case 'Admin Dashboard':
        navigate('/useradmindashboard');
        break;
      default:
        break;
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <a href="/" className="logo" onClick={(e) => e.preventDefault()}>
          <div className="logo-icon">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5 3 1 9 5 15" />
              <polyline points="13 3 17 9 13 15" />
            </svg>
          </div>
          Coder's Nest
        </a>
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
          <span className="nav-item-badge">6</span>
        </div>

        <div
          className={`nav-item ${activePage === 'Teams' ? 'active' : ''}`}
          onClick={() => handleNavClick('Teams')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Teams
          <span className="nav-item-badge">2</span>
        </div>

        <div
          className={`nav-item ${activePage === 'Workspace' ? 'active' : ''}`}
          onClick={() => handleNavClick('Workspace')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          Workspace
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
          {unreadCount > 0 && <span className="nav-item-badge" id="sidebar-notif-badge">{unreadCount}</span>}
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
          className={`nav-item ${activePage === 'Admin Dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('Admin Dashboard')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          Admin Dashboard
        </div>

        <div
          className="nav-item"
          style={{ marginTop: 'auto' }}
          onClick={() => { if (onLogout) onLogout(); else navigate('/login'); }}
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
          <div className="user-avatar">JD</div>
          <div className="user-info">
            <div className="user-name">John Doe</div>
            <div className="user-email">john@example.com</div>
          </div>
          <div className="user-chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>

        {/* Dropdown UI toggle logic */}
        {isProfileOpen && (
          <div className="dropdown-menu open" id="profile-dropdown">
            {/* Tere profile dropdown ke andar ka HTML yahan map hoga */}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;