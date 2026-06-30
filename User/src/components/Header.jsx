import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from '../utils/api';

export default function Topbar({ toggleSidebar }) {
  const [theme, setTheme] = useState(localStorage.getItem('cn-theme') || 'light');
  
  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const navigate = useNavigate();

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/projects/invitations/');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleAcceptInvite = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/projects/invitations/${id}/accept`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to accept invite', err);
    }
  };

  const handleDeclineInvite = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/projects/invitations/${id}/reject`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to decline invite', err);
    }
  };

  useEffect(() => {
    const unread = notifications.filter((n) => n.unread).length;
    setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    const closeDropdowns = (e) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target) &&
        profileRef.current &&
        !profileRef.current.contains(e.target)
      ) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("click", closeDropdowns);

    return () => {
      document.removeEventListener("click", closeDropdowns);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem('cn-theme', newTheme);
  };

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, unread: false } : n
      )
    );
  };

  const markAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        unread: false,
      }))
    );
  };

  return (
    <>
      <style>{`

        .topbar{
          width:100%;
          height:60px;
          padding:0 24px;
          border-bottom:1px solid var(--border);
          background:var(--bg-topbar);
          backdrop-filter:blur(18px);
          display:flex;
          align-items:center;
          gap:18px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .mobile-menu-btn{
          width:44px;
          height:44px;
          border:none;
          border-radius:12px;
          background:var(--bg-card);
          color:var(--text-secondary);
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          transition:.2s;
        }

        .mobile-menu-btn:hover{
          background:var(--bg-hover);
          color:var(--text-primary);
        }

        .mobile-menu-btn svg{
          width:20px;
          height:20px;
        }

        .topbar-title{
          font-size:1.1rem;
          font-weight:800;
          color:var(--text-primary);
        }

        .topbar-spacer{
          flex:1;
        }

        .topbar-search{
          width:100%;
          height:36px;
          border:1px solid var(--border);
          background:var(--bg-card);
          border-radius:14px;
          display:flex;
          align-items:center;
          gap:10px;
          padding:0 14px;
        }

        .topbar-search svg{
          width:18px;
          height:18px;
          color:var(--text-muted);
          flex-shrink:0;
        }

        .topbar-search input{
          flex:1;
          background:transparent;
          border:none;
          outline:none;
          color:var(--text-primary);
          font-size:.9rem;
        }

        .topbar-search input::placeholder{
          color:var(--text-muted);
        }

        .topbar-actions{
          display:flex;
          align-items:center;
          gap:12px;
        }

        .theme-toggle,
        .topbar-icon-btn{
          width:44px;
          height:44px;
          border:none;
          border-radius:14px;
          background:var(--bg-card);
          color:var(--text-secondary);
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          position:relative;
          transition:.2s;
        }

        .theme-toggle:hover,
        .topbar-icon-btn:hover{
          background:var(--bg-hover);
          color:var(--text-primary);
        }

        .theme-toggle svg,
        .topbar-icon-btn svg{
          width:19px;
          height:19px;
        }

        .notif-dot{
          position:absolute;
          top:10px;
          right:10px;
          width:9px;
          height:9px;
          border-radius:50%;
          background:#ef4444;
          border:2px solid var(--bg-card);
        }

        .dropdown{
          position:relative;
        }

        .topbar-avatar{
          width:36px;
          height:36px;
          border-radius:50%;
          background:linear-gradient(135deg,#2563eb,#7c3aed);
          color:white;
          font-weight:800;
          font-size:.95rem;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          border:2px solid rgba(255,255,255,.08);
        }

        .dropdown-menu{
          position:absolute;
          top:54px;
          right:0;
          width:240px;
          background:var(--bg-card);
          border:1px solid var(--border);
          border-radius:14px;
          overflow:hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12);
          opacity:0;
          transform:translateY(-10px);
          transition:.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index:999;
          visibility:hidden;
        }

        .dropdown-menu.open{
          opacity:1;
          visibility:visible;
          transform:translateY(0);
        }

        .notif-dropdown{
          width:320px;
        }

        .notif-dropdown-header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:14px 16px 10px;
          border-bottom:1px solid var(--border);
        }

        .notif-dropdown-title{
          color:var(--text-primary);
          font-weight:700;
          font-size:0.9rem;
        }

        .notif-mark-all{
          font-size:.8rem;
          font-weight:700;
          color:var(--accent);
          cursor:pointer;
        }

        .notif-item{
          position:relative;
          display:flex;
          gap:12px;
          padding:16px 18px;
          cursor:pointer;
          transition:.18s;
        }

        .notif-item:hover{
          background:var(--bg-hover);
        }

        .notif-avatar{
          width:42px;
          height:42px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#fff;
          font-weight:700;
          flex-shrink:0;
        }

        .notif-text{
          color:var(--text-secondary);
          font-size:.85rem;
          line-height:1.55;
        }

        .notif-text strong{
          color:var(--text-primary);
        }

        .notif-time{
          display:block;
          margin-top:5px;
          color:var(--text-muted);
          font-size:.75rem;
        }

        .notif-dot-indicator{
          position:absolute;
          left:8px;
          top:24px;
          width:8px;
          height:8px;
          border-radius:50%;
          background:var(--accent);
        }

        .dropdown-header{
          padding:14px 16px;
          border-bottom:1px solid var(--border);
          background: rgba(0, 0, 0, 0.02);
        }

        .dropdown-name{
          color:var(--text-primary);
          font-weight:700;
          font-size:0.9rem;
        }

        .dropdown-email{
          margin-top:2px;
          color:var(--text-muted);
          font-size:.75rem;
        }

        .dropdown-item{
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px 16px;
          color:var(--text-secondary);
          cursor:pointer;
          transition:.15s;
          font-size:.85rem;
          font-weight:500;
        }

        .dropdown-item:hover{
          background:var(--bg-hover);
          color:var(--text-primary);
        }

        .dropdown-item svg{
          width:17px;
          height:17px;
        }

        .dropdown-divider{
          height:1px;
          background:var(--border);
          margin:4px 0;
        }

        .dropdown-item.danger{
          color:#f87171;
        }

        .dropdown-item.danger:hover{
          background:rgba(239,68,68,.08);
          color:#ef4444;
        }

        @media(max-width:900px){
          .topbar-search{
            display:none;
          }

          .notif-dropdown{
            width:320px;
          }
        }

        @media(max-width:520px){
          .topbar{
            padding:0 14px;
            gap:10px;
          }

          .topbar-title{
            display:none;
          }

          .dropdown-menu{
            right:-10px;
          }
        }
      `}</style>

      <header className="topbar">
        <button className="mobile-menu-btn" aria-label="Open menu" onClick={toggleSidebar}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <span className="topbar-title">Home</span>

        <div className="topbar-spacer"></div>

        <div className="topbar-search">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="search"
            placeholder="Search projects, files, teams…"
          />
        </div>

        <div className="topbar-actions">
          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
              </svg>
            )}
          </button>

          {/* Notifications */}
          <div className="dropdown" ref={notifRef}>
            <button
              className="topbar-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>

              {unreadCount > 0 && (
                <span className="notif-dot"></span>
              )}
            </button>

            <div
              className={`dropdown-menu notif-dropdown ${notifOpen ? "open" : ""
                }`}
            >
              <div className="notif-dropdown-header">
                <span className="notif-dropdown-title">
                  Notifications ({unreadCount})
                </span>

                <span
                  className="notif-mark-all"
                  onClick={markAllRead}
                >
                  Mark all read
                </span>
              </div>

              {notifications.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="notif-item"
                  onClick={() => markRead(item.id)}
                >
                  {item.unread && (
                    <div className="notif-dot-indicator"></div>
                  )}

                  <div
                    className="notif-avatar"
                    style={{
                      background: item.gradient,
                    }}
                  >
                    {item.avatar}
                  </div>

                  <div className="notif-text" style={{ flex: 1 }}>
                    {item.text}
                    {item.type === 'invite' && item.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button style={{ flex: 1, padding: '6px 0', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }} onClick={(e) => handleDeclineInvite(item.id, e)}>Decline</button>
                        <button style={{ flex: 1, padding: '6px 0', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }} onClick={(e) => handleAcceptInvite(item.id, e)}>Accept</button>
                      </div>
                    )}
                    {item.type === 'invite' && item.status !== 'Pending' && (
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: '600', color: item.status === 'Accepted' ? '#22c55e' : '#ef4444' }}>
                        {item.status}
                      </div>
                    )}
                    <span className="notif-time">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
              <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                 <Link to="/notifications" onClick={() => setNotifOpen(false)} style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none' }}>View all notifications</Link>
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="dropdown" ref={profileRef}>
            <div
              className="topbar-avatar"
              onClick={(e) => {
                e.stopPropagation();
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
            >
              JD
            </div>

            <div
              className={`dropdown-menu ${profileOpen ? "open" : ""
                }`}
            >
              <div className="dropdown-header">
                <div className="dropdown-name">
                  John Doe
                </div>

                <div className="dropdown-email">
                  john@example.com
                </div>
              </div>

              <div className="dropdown-item" onClick={() => { setProfileOpen(false); navigate('/view-profile'); }}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>

                View Profile
              </div>

              <div className="dropdown-item" onClick={() => { setProfileOpen(false); navigate('/settings'); }}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>

                Settings
              </div>

              <div className="dropdown-item danger" onClick={() => { setProfileOpen(false); navigate('/login'); }}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>

                Sign out
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}