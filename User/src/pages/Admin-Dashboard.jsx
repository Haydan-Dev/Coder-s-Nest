import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
    const navigate = useNavigate();

    // --- STATES ---
    const [activeModal, setActiveModal] = useState(null); // 'logout', 'create-team', 'create-project'
    const [activeDropdown, setActiveDropdown] = useState(null); // 'profile', 'notif'
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('cn-refresh-token');
            if (refreshToken) {
                await axios.post('http://127.0.0.1:8000/auth/logout', { refresh_token: refreshToken });
            }
        } catch (e) {
            console.error('Logout failed', e);
        } finally {
            localStorage.removeItem('cn-access-token');
            localStorage.removeItem('cn-refresh-token');
            navigate('/login');
        }
    };

    const [notifications, setNotifications] = useState([
        { id: 1, user: 'Sarah K.', action: 'opened a PR on', target: 'dashboard-ui', text: '"Add dark mode"', time: '2 hours ago', avatar: 'SK', bg: 'linear-gradient(135deg,#10b981,#059669)', unread: true },
        { id: 2, user: 'Ryan L.', action: 'requested to join', target: 'Frontend Squad', text: '', time: '3 hours ago', avatar: 'RL', bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', unread: true },
        { id: 3, user: 'Maya J.', action: 'deleted', target: 'legacy/old-auth.ts', text: 'in Frontend Squad', time: '5 hours ago', avatar: 'MJ', bg: 'linear-gradient(135deg,#f59e0b,#d97706)', unread: true },
        { id: 4, user: 'Marco V.', action: 'had 3 failed login attempts', target: 'account flagged', text: '', time: 'Yesterday', avatar: 'MV', bg: 'linear-gradient(135deg,#ef4444,#dc2626)', unread: true },
        { id: 5, user: 'System', action: 'Deployment of', target: 'nest-api-gateway', text: 'completed successfully', time: '2 days ago', avatar: 'CN', bg: 'linear-gradient(135deg,#2563eb,#1d4ed8)', unread: false },
    ]);

    const dropdownRef = useRef(null);

    // --- LOGIC ---
    const unreadCount = notifications.filter(n => n.unread).length;

    const markRead = (id, e) => {
        e.stopPropagation();
        setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
    };

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    const toggleDropdown = (dd, e) => {
        e.stopPropagation();
        setActiveDropdown(prev => prev === dd ? null : dd);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="dashboard-page">
            {/* --- MODALS --- */}
            {activeModal === 'logout' && (
                <div className="logout-overlay active" onClick={() => setActiveModal(null)}>
                    <div className="logout-modal" onClick={e => e.stopPropagation()}>
                        <div className="logout-modal-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        </div>
                        <div className="logout-modal-title">Sign out?</div>
                        <div className="logout-modal-desc">You'll be signed out of your admin session on this device.</div>
                        <div className="logout-modal-actions">
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleLogout}>Sign out</button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'create-team' && (
                <div className="modal-overlay active" onClick={() => setActiveModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '46px', height: '46px', borderRadius: 'var(--r-lg)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Create New Team</div>
                                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>You will be set as the owner & admin</div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Team name</label>
                            <input type="text" className="form-input" placeholder="e.g. DevOps Warriors" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(optional)</span></label>
                            <input type="text" className="form-input" placeholder="What will this team work on?" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Visibility</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '1.5px solid var(--accent)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: '.84rem', fontWeight: '600', color: 'var(--accent)', background: 'var(--accent-light)' }}>
                                    <input type="radio" name="team-vis" value="private" defaultChecked style={{ accentColor: 'var(--accent)' }} /> Private
                                </label>
                                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: '.84rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    <input type="radio" name="team-vis" value="public" style={{ accentColor: 'var(--accent)' }} /> Public
                                </label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>Create team</button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'create-project' && (
                <div className="modal-overlay active" onClick={() => setActiveModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '46px', height: '46px', borderRadius: 'var(--r-lg)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                            </div>
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>New Project</div>
                                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>Assign to one of your teams</div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Project name</label>
                            <input type="text" className="form-input" placeholder="e.g. auth-service-v2" style={{ fontFamily: 'var(--font-mono)' }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Assign to team</label>
                            <select className="form-input" style={{ cursor: 'pointer' }}>
                                <option>Frontend Squad</option>
                                <option>AI Research</option>
                                <option>Backend Warriors</option>
                                <option>Mobile Team</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Primary language</label>
                            <select className="form-input" style={{ cursor: 'pointer' }}>
                                <option>TypeScript</option>
                                <option>Python</option>
                                <option>Go</option>
                                <option>Rust</option>
                                <option>Java</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>Create project</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DASHBOARD SPECIFIC CSS --- */}
            <style>{`
                .admin-banner { display: flex; align-items: center; gap: 20px; padding: 24px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 16px; margin-bottom: 32px; }
                .admin-banner-icon { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #f97316, #ea580c); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; box-shadow: 0 4px 10px rgba(234, 88, 12, 0.2); }
                .admin-banner-icon svg { width: 24px; height: 24px; }
                .admin-banner-title { font-size: 1.15rem; font-weight: 800; color: #111827; margin-bottom: 4px; }
                .admin-banner-sub { color: #9ca3af; font-size: 0.95rem; }
                .admin-banner-btn { margin-left: auto; border: 1px solid #fca5a5; color: #ef4444; background: transparent; border-radius: 20px; padding: 6px 16px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; }
                
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
                .stat-card { background: white; padding: 24px; border-radius: 16px; border: 1px solid #f3f4f6; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); }
                .stat-card-label { color: #9ca3af; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
                .stat-card-value { font-size: 2.5rem; font-weight: 800; color: #111827; margin-bottom: 12px; line-height: 1; }
                .stat-card-change.up { display: flex; align-items: center; gap: 4px; color: #10b981; font-size: 0.85rem; font-weight: 700; }
                .stat-card-change.up svg { width: 14px; height: 14px; }
                
                .section-heading { margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
                .section-heading-title { display: flex; align-items: center; gap: 8px; font-size: 1.15rem; font-weight: 800; color: #111827; }
                .section-heading-title svg { width: 20px; height: 20px; color: #3b82f6; }
                .section-heading-action { font-size: 0.9rem; font-weight: 600; color: #3b82f6; cursor: pointer; }
                
                .quick-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
                .quick-action-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: white; border: 1px solid #f3f4f6; border-radius: 16px; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
                .quick-action-card:hover { border-color: #cbd5e1; transform: translateY(-2px); }
                .qa-icon { width: 44px; height: 44px; border-radius: 12px; background: #f8fafc; color: #64748b; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .qa-icon svg { width: 20px; height: 20px; }
                .qa-title { font-weight: 800; color: #111827; font-size: 0.95rem; margin-bottom: 2px; }
                .qa-sub { color: #9ca3af; font-size: 0.8rem; }

                /* Teams Section */
                .teams-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
                .team-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); border: 1px solid #f3f4f6; position: relative; display: flex; flex-direction: column; }
                .team-card.border-blue { border-left: 4px solid #3b82f6; }
                .team-card.border-purple { border-left: 4px solid #8b5cf6; }
                .team-card.border-orange { border-left: 4px solid #f59e0b; }
                .team-card.border-green { border-left: 4px solid #10b981; }
                
                .team-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .team-info { display: flex; gap: 12px; align-items: center; }
                .team-icon { font-size: 1.4rem; background: #f8fafc; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
                .team-title { font-weight: 800; font-size: 1.05rem; color: #111827; margin-bottom: 2px; }
                .team-plan { font-size: 0.8rem; color: #9ca3af; }
                
                .team-meta { text-align: right; }
                .team-badge { border: 1px solid #fca5a5; color: #ef4444; padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; background: #fef2f2; display: inline-flex; align-items: center; gap: 4px; margin-bottom: 4px; }
                .team-status { font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
                .team-status.live { color: #10b981; }
                .team-status.idle { color: #f59e0b; }
                .team-status.offline { color: #9ca3af; }
                .status-dot { width: 6px; height: 6px; border-radius: 50%; }
                
                .team-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; padding: 12px; border-radius: 12px; margin-bottom: 20px; text-align: center; }
                .team-stat-val { font-weight: 800; font-size: 1.25rem; color: #111827; }
                .team-stat-lbl { font-size: 0.65rem; color: #9ca3af; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
                
                .team-activity { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .avatars { display: flex; align-items: center; }
                .avatar { width: 24px; height: 24px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 800; border: 2px solid white; margin-left: -6px; }
                .avatar:first-child { margin-left: 0; }
                .last-active { font-size: 0.75rem; color: #9ca3af; font-weight: 500; }
                
                .team-tags { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
                .team-tag { padding: 4px 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; font-size: 0.75rem; font-weight: 700; border-radius: 6px; }
                
                .team-progress { height: 4px; background: #f1f5f9; border-radius: 2px; margin-bottom: 16px; overflow: hidden; }
                .team-progress-bar { height: 100%; border-radius: 2px; }
                
                .team-actions { display: flex; gap: 8px; margin-top: auto; }
                .btn-solid { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; flex: 1; justify-content: center; }
                .btn-outline { border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; background: white; font-size: 0.85rem; font-weight: 700; color: #334155; cursor: pointer; transition: 0.2s; }
                .btn-outline:hover { background: #f8fafc; }
                .btn-outline.danger { color: #ef4444; border-color: #fee2e2; }
                .btn-outline.danger:hover { background: #fef2f2; }

                /* Projects Section */
                .projects-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                .project-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); border: 1px solid #f3f4f6; border-top: 4px solid transparent; display: flex; flex-direction: column; }
                .project-card.top-blue { border-top-color: #3b82f6; }
                .project-card.top-purple { border-top-color: #8b5cf6; }
                .project-card.top-orange { border-top-color: #f59e0b; }
                .project-card.top-green { border-top-color: #10b981; }
                .project-card.top-pink { border-top-color: #ec4899; }
                
                .proj-header { display: flex; justify-content: space-between; margin-bottom: 16px; align-items: center; }
                .proj-icon { padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; }
                .proj-status { font-size: 0.75rem; font-weight: 800; }
                
                .proj-title { font-weight: 800; font-size: 1.05rem; color: #111827; margin-bottom: 8px; }
                .proj-desc { font-size: 0.85rem; color: #6b7280; line-height: 1.5; margin-bottom: 16px; min-height: 60px; }
                
                .proj-team { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 20px; }
                
                .proj-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
                .proj-tech { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; color: #475569; }
                .proj-tech-dot { width: 8px; height: 8px; border-radius: 50%; }
                
                .new-proj-card { border: 2px dashed #cbd5e1; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: #94a3b8; font-weight: 700; gap: 12px; min-height: 240px; background: transparent; transition: 0.2s; }
                .new-proj-card:hover { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,0.02); }
            `}</style>
            
            {/* --- MAIN CONTENT --- */}

                <main className="dashboard-content">
                    <div className="dashboard-welcome animate-fade-in-up">
                        <div>
                            <h1 className="welcome-title">Welcome, John 👋</h1>
                            <p className="welcome-subtitle">Here's an overview of all the teams and projects you manage.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setActiveModal('create-team')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                New Team
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => setActiveModal('create-project')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                New Project
                            </button>
                            <button className="btn btn-primary btn-sm" style={{ background: '#f97316', borderColor: '#f97316' }} onClick={() => navigate('/UserAdminPanel')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                Admin Panel
                            </button>
                        </div>
                    </div>

                    <div className="admin-banner animate-fade-in-up animate-delay-1">
                        <div className="admin-banner-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <div>
                            <div className="admin-banner-title">You are the top-level administrator</div>
                            <div className="admin-banner-sub">All teams and projects on this dashboard are directly under your ownership. No parent hierarchy above you.</div>
                        </div>
                        <button className="admin-banner-btn" onClick={() => navigate('/UserAdminPanel')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            Admin Panel
                        </button>
                    </div>

                    <div className="stats-grid animate-fade-in-up animate-delay-1">
                        <div className="stat-card">
                            <div className="stat-card-label">Teams Managed</div><div className="stat-card-value">4</div>
                            <div className="stat-card-change up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>+1 this month</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Total Projects</div><div className="stat-card-value">6</div>
                            <div className="stat-card-change up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>+2 this month</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Members Under You</div><div className="stat-card-value">12</div>
                            <div className="stat-card-change up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>+2 this week</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label">Active Sessions</div><div className="stat-card-value">7</div>
                            <div className="stat-card-change up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>Online right now</div>
                        </div>
                    </div>

                    <div className="animate-fade-in-up animate-delay-2">
                        <div className="section-heading">
                            <span className="section-heading-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> Quick Actions
                            </span>
                        </div>
                        <div className="quick-actions">
                            <div className="quick-action-card" onClick={() => setActiveModal('create-team')}>
                                <div className="qa-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
                                <div><div className="qa-title">Create Team</div><div className="qa-sub">New workspace & team</div></div>
                            </div>
                            <div className="quick-action-card" onClick={() => setActiveModal('create-project')}>
                                <div className="qa-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg></div>
                                <div><div className="qa-title">New Project</div><div className="qa-sub">Assign to a team</div></div>
                            </div>
                            <div className="quick-action-card">
                                <div className="qa-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg></div>
                                <div><div className="qa-title">Invite Member</div><div className="qa-sub">Add to your team</div></div>
                            </div>
                            <div className="quick-action-card">
                                <div className="qa-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div>
                                <div><div className="qa-title">Activity Log</div><div className="qa-sub">Monitor all actions</div></div>
                            </div>
                        </div>
                    </div>

                    <div className="animate-fade-in-up animate-delay-3">
                        <div className="section-heading">
                            <span className="section-heading-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> Teams I Manage
                            </span>
                            <span className="section-heading-action">+ Create team</span>
                        </div>
                        
                        <div className="teams-grid">
                            <div className="team-card border-blue">
                                <div className="team-header">
                                    <div className="team-info">
                                        <div className="team-icon" style={{color: '#ef4444'}}>🚀</div>
                                        <div>
                                            <div className="team-title">Frontend Squad</div>
                                            <div className="team-plan">Pro plan • 3 projects</div>
                                        </div>
                                    </div>
                                    <div className="team-meta">
                                        <div className="team-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> Owner</div>
                                        <div className="team-status live"><div className="status-dot" style={{background: '#10b981'}}></div> Live now</div>
                                    </div>
                                </div>
                                <div className="team-stats">
                                    <div><div className="team-stat-val">5</div><div className="team-stat-lbl">Members</div></div>
                                    <div><div className="team-stat-val">3</div><div className="team-stat-lbl">Projects</div></div>
                                    <div><div className="team-stat-val">3</div><div className="team-stat-lbl">Online</div></div>
                                </div>
                                <div className="team-activity">
                                    <div className="avatars">
                                        <div className="avatar" style={{background: '#10b981'}}>SK</div>
                                        <div className="avatar" style={{background: '#f59e0b'}}>AM</div>
                                        <div className="avatar" style={{background: '#3b82f6'}}>MJ</div>
                                        <div className="avatar" style={{background: '#06b6d4'}}>NK</div>
                                        <div className="avatar" style={{background: '#e2e8f0', color: '#64748b', fontSize: '0.6rem'}}>+1</div>
                                    </div>
                                    <div className="last-active">Last active: just now</div>
                                </div>
                                <div className="team-tags">
                                    <span className="team-tag">React</span>
                                    <span className="team-tag">TypeScript</span>
                                    <span className="team-tag">Vite</span>
                                </div>
                                <div className="team-progress"><div className="team-progress-bar" style={{background: '#3b82f6', width: '70%'}}></div></div>
                                <div className="team-actions">
                                    <button className="btn-solid">Open workspace &rarr;</button>
                                    <button className="btn-outline">Manage</button>
                                    <button className="btn-outline danger">Settings</button>
                                </div>
                            </div>
                            
                            <div className="team-card border-purple">
                                <div className="team-header">
                                    <div className="team-info">
                                        <div className="team-icon">🤖</div>
                                        <div>
                                            <div className="team-title">AI Research</div>
                                            <div className="team-plan">Pro plan • 2 projects</div>
                                        </div>
                                    </div>
                                    <div className="team-meta">
                                        <div className="team-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> Owner</div>
                                        <div className="team-status live"><div className="status-dot" style={{background: '#10b981'}}></div> Live now</div>
                                    </div>
                                </div>
                                <div className="team-stats">
                                    <div><div className="team-stat-val">4</div><div className="team-stat-lbl">Members</div></div>
                                    <div><div className="team-stat-val">2</div><div className="team-stat-lbl">Projects</div></div>
                                    <div><div className="team-stat-val">2</div><div className="team-stat-lbl">Online</div></div>
                                </div>
                                <div className="team-activity">
                                    <div className="avatars">
                                        <div className="avatar" style={{background: '#8b5cf6'}}>RL</div>
                                        <div className="avatar" style={{background: '#10b981'}}>LR</div>
                                        <div className="avatar" style={{background: '#ec4899'}}>ZR</div>
                                        <div className="avatar" style={{background: '#e2e8f0', color: '#64748b', fontSize: '0.6rem'}}>+1</div>
                                    </div>
                                    <div className="last-active">Last active: 12 min ago</div>
                                </div>
                                <div className="team-tags">
                                    <span className="team-tag">Python</span>
                                    <span className="team-tag">LLM</span>
                                    <span className="team-tag">PyTorch</span>
                                </div>
                                <div className="team-progress"><div className="team-progress-bar" style={{background: '#8b5cf6', width: '50%'}}></div></div>
                                <div className="team-actions">
                                    <button className="btn-solid" style={{background: '#3b82f6'}}>Open workspace &rarr;</button>
                                    <button className="btn-outline">Manage</button>
                                    <button className="btn-outline danger">Settings</button>
                                </div>
                            </div>
                            
                            <div className="team-card border-orange">
                                <div className="team-header">
                                    <div className="team-info">
                                        <div className="team-icon" style={{color: '#f97316'}}>⚡</div>
                                        <div>
                                            <div className="team-title">Backend Warriors</div>
                                            <div className="team-plan">Team plan • 1 project</div>
                                        </div>
                                    </div>
                                    <div className="team-meta">
                                        <div className="team-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> Owner</div>
                                        <div className="team-status idle"><div className="status-dot" style={{background: '#f59e0b'}}></div> Idle</div>
                                    </div>
                                </div>
                                <div className="team-stats">
                                    <div><div className="team-stat-val">6</div><div className="team-stat-lbl">Members</div></div>
                                    <div><div className="team-stat-val">1</div><div className="team-stat-lbl">Projects</div></div>
                                    <div><div className="team-stat-val">0</div><div className="team-stat-lbl">Online</div></div>
                                </div>
                                <div className="team-activity">
                                    <div className="avatars">
                                        <div className="avatar" style={{background: '#f59e0b'}}>TH</div>
                                        <div className="avatar" style={{background: '#06b6d4'}}>DS</div>
                                        <div className="avatar" style={{background: '#64748b'}}>MV</div>
                                        <div className="avatar" style={{background: '#e2e8f0', color: '#64748b', fontSize: '0.6rem'}}>+3</div>
                                    </div>
                                    <div className="last-active">Last active: 2h ago</div>
                                </div>
                                <div className="team-tags">
                                    <span className="team-tag">Go</span>
                                    <span className="team-tag">PostgreSQL</span>
                                    <span className="team-tag">Docker</span>
                                </div>
                                <div className="team-progress"><div className="team-progress-bar" style={{background: '#f59e0b', width: '90%'}}></div></div>
                                <div className="team-actions">
                                    <button className="btn-outline" style={{flex: 1, color: '#111827'}}>Resume &rarr;</button>
                                    <button className="btn-outline">Manage</button>
                                    <button className="btn-outline danger">Settings</button>
                                </div>
                            </div>
                            
                            <div className="team-card border-green">
                                <div className="team-header">
                                    <div className="team-info">
                                        <div className="team-icon">📱</div>
                                        <div>
                                            <div className="team-title">Mobile Team</div>
                                            <div className="team-plan">Free plan • 0 projects</div>
                                        </div>
                                    </div>
                                    <div className="team-meta">
                                        <div className="team-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> Owner</div>
                                        <div className="team-status offline"><div className="status-dot" style={{background: '#9ca3af'}}></div> Offline</div>
                                    </div>
                                </div>
                                <div className="team-stats">
                                    <div><div className="team-stat-val">2</div><div className="team-stat-lbl">Members</div></div>
                                    <div><div className="team-stat-val">0</div><div className="team-stat-lbl">Projects</div></div>
                                    <div><div className="team-stat-val">0</div><div className="team-stat-lbl">Online</div></div>
                                </div>
                                <div className="team-activity">
                                    <div className="avatars">
                                        <div className="avatar" style={{background: '#10b981'}}>LR</div>
                                        <div className="avatar" style={{background: '#ec4899'}}>ZP</div>
                                    </div>
                                    <div className="last-active">Last active: 3 days ago</div>
                                </div>
                                <div className="team-tags">
                                    <span className="team-tag">React Native</span>
                                    <span className="team-tag">Expo</span>
                                </div>
                                <div className="team-progress"><div className="team-progress-bar" style={{background: '#10b981', width: '20%'}}></div></div>
                                <div className="team-actions">
                                    <button className="btn-outline" style={{flex: 1, color: '#111827'}}>Wake up</button>
                                    <button className="btn-outline">Manage</button>
                                    <button className="btn-outline" style={{color: '#3b82f6', borderColor: '#bfdbfe', background: '#eff6ff'}}>+ Add project</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="animate-fade-in-up animate-delay-3" style={{marginBottom: '40px'}}>
                        <div className="section-heading">
                            <span className="section-heading-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> Projects Under My Teams
                            </span>
                            <span className="section-heading-action">+ New project</span>
                        </div>
                        
                        <div className="projects-grid">
                            <div className="project-card top-blue">
                                <div className="proj-header">
                                    <div className="proj-icon" style={{background: '#eff6ff', color: '#3b82f6'}}>API</div>
                                    <div className="proj-status" style={{color: '#10b981'}}>Active</div>
                                </div>
                                <div className="proj-title">nest-api-gateway</div>
                                <div className="proj-desc">RESTful API gateway with rate limiting, auth middleware, and real-time WebSocket support.</div>
                                <div className="proj-team"><span style={{color: '#ef4444'}}>🚀</span> Frontend Squad</div>
                                <div className="proj-footer">
                                    <div className="proj-tech"><div className="proj-tech-dot" style={{background: '#3b82f6'}}></div> TypeScript</div>
                                    <div className="avatars">
                                        <div className="avatar" style={{background: '#10b981'}}>S</div>
                                        <div className="avatar" style={{background: '#f59e0b'}}>A</div>
                                        <div className="avatar" style={{background: '#06b6d4'}}>N</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="project-card top-purple">
                                <div className="proj-header">
                                    <div className="proj-icon" style={{background: '#f3e8ff', color: '#8b5cf6'}}>UI</div>
                                    <div className="proj-status" style={{color: '#f59e0b'}}>Review</div>
                                </div>
                                <div className="proj-title">dashboard-ui</div>
                                <div className="proj-desc">Modern analytics dashboard with Recharts, real-time updates, and full dark mode.</div>
                                <div className="proj-team"><span style={{color: '#ef4444'}}>🚀</span> Frontend Squad</div>
                                <div className="proj-footer">
                                    <div className="proj-tech"><div className="proj-tech-dot" style={{background: '#06b6d4'}}></div> React</div>
                                    <div className="avatars">
                                        <div className="avatar" style={{background: '#ec4899'}}>M</div>
                                        <div className="avatar" style={{background: '#10b981'}}>S</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="project-card top-orange">
                                <div className="proj-header">
                                    <div className="proj-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>AUTH</div>
                                    <div className="proj-status" style={{color: '#9ca3af'}}>Draft</div>
                                </div>
                                <div className="proj-title">auth-service-v2</div>
                                <div className="proj-desc">OAuth2 + JWT authentication service with refresh token rotation and SSO support.</div>
                                <div className="proj-team"><span style={{color: '#ef4444'}}>🚀</span> Frontend Squad</div>
                                <div className="proj-footer">
                                    <div className="proj-tech"><div className="proj-tech-dot" style={{background: '#3b82f6'}}></div> TypeScript</div>
                                    <div className="avatars">
                                        <div className="avatar" style={{background: '#06b6d4'}}>N</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="project-card top-green">
                                <div className="proj-header">
                                    <div className="proj-icon" style={{background: '#d1fae5', color: '#10b981'}}>ML</div>
                                    <div className="proj-status" style={{color: '#10b981'}}>Active</div>
                                </div>
                                <div className="proj-title">ml-model-server</div>
                                <div className="proj-desc">Inference server for custom NLP models with FastAPI, ONNX runtime, and GPU acceleration.</div>
                                <div className="proj-team"><span>🤖</span> AI Research</div>
                                <div className="proj-footer">
                                    <div className="proj-tech"><div className="proj-tech-dot" style={{background: '#3b82f6'}}></div> Python</div>
                                    <div className="avatars">
                                        <div className="avatar" style={{background: '#8b5cf6'}}>R</div>
                                        <div className="avatar" style={{background: '#10b981'}}>L</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="project-card top-green">
                                <div className="proj-header">
                                    <div className="proj-icon" style={{background: '#d1fae5', color: '#10b981'}}>LLM</div>
                                    <div className="proj-status" style={{color: '#10b981'}}>Active</div>
                                </div>
                                <div className="proj-title">llm-inference</div>
                                <div className="proj-desc">High-throughput inference API for fine-tuned LLMs with streaming and batching support.</div>
                                <div className="proj-team"><span>🤖</span> AI Research</div>
                                <div className="proj-footer">
                                    <div className="proj-tech"><div className="proj-tech-dot" style={{background: '#3b82f6'}}></div> Python</div>
                                    <div className="avatars">
                                        <div className="avatar" style={{background: '#ec4899'}}>Z</div>
                                        <div className="avatar" style={{background: '#8b5cf6'}}>R</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="project-card top-pink">
                                <div className="proj-header">
                                    <div className="proj-icon" style={{background: '#fce7f3', color: '#ec4899'}}>DB</div>
                                    <div className="proj-status" style={{color: '#10b981'}}>Active</div>
                                </div>
                                <div className="proj-title">data-pipeline</div>
                                <div className="proj-desc">ETL pipeline with Apache Kafka, real-time stream processing, and PostgreSQL sink.</div>
                                <div className="proj-team"><span style={{color: '#f97316'}}>⚡</span> Backend Warriors</div>
                                <div className="proj-footer">
                                    <div className="proj-tech"><div className="proj-tech-dot" style={{background: '#06b6d4'}}></div> Go</div>
                                    <div className="avatars">
                                        <div className="avatar" style={{background: '#f59e0b'}}>T</div>
                                        <div className="avatar" style={{background: '#06b6d4'}}>D</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="new-proj-card">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="32" height="32"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                New project
                            </div>
                        </div>
                    </div>

                </main>
        </div>
    );
};

export default AdminDashboard;