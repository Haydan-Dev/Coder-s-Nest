import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Notifications = () => {
    const [activeTab, setActiveTab] = useState('alerts');
    const [alerts, setAlerts] = useState([]);
    const [invites, setInvites] = useState([]);

    const fetchNotifications = async () => {
        try {
            const [invitesRes, notifsRes] = await Promise.all([
                api.get('/projects/invitations/'),
                api.get('/notifications/')
            ]);
            
            const sortedAlerts = [...notifsRes.data].sort((a, b) => new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0));
            setAlerts(sortedAlerts);
            
            const sortedInvites = [...invitesRes.data].sort((a, b) => new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0));
            setInvites(sortedInvites);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        
        const handleRefresh = () => fetchNotifications();
        window.addEventListener('refresh_notifications', handleRefresh);
        return () => window.removeEventListener('refresh_notifications', handleRefresh);
    }, []);

    const handleAcceptInvite = async (id) => {
        try {
            await api.post(`/projects/invitations/${id}/accept`);
            fetchNotifications();
        } catch (err) {
            console.error('Failed to accept invite', err);
        }
    };

    const handleDeclineInvite = async (id) => {
        try {
            await api.post(`/projects/invitations/${id}/reject`);
            fetchNotifications();
        } catch (err) {
            console.error('Failed to decline invite', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const handleMarkRead = async (notif) => {
        if (!notif.id.toString().startsWith('notif_')) return; 
        try {
            await api.put(`/notifications/${notif.db_id}/read`);
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    let filteredNotifications = [];
    if (activeTab === 'alerts') {
        filteredNotifications = alerts;
    } else if (activeTab === 'invites') {
        filteredNotifications = invites;
    } else if (activeTab === 'unread') {
        filteredNotifications = [...alerts.filter(n => n.unread), ...invites.filter(n => n.unread)];
    }

    return (
        <div className="notifications-page">
            <style>{`
                .notifications-page {
                    flex: 1;
                    padding: 40px;
                    max-width: 850px;
                    margin: 0 auto;
                    width: 100%;
                    color: var(--text-primary);
                    font-family: 'Inter', sans-serif;
                    animation: fadeIn 0.4s ease-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .notif-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 35px;
                }

                .notif-title {
                    font-size: 2.4rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-muted) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.5px;
                }

                .notif-actions button {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: var(--text-secondary);
                    padding: 10px 20px;
                    border-radius: 99px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    backdrop-filter: blur(10px);
                }

                .notif-actions button:hover {
                    background: var(--accent);
                    color: white;
                    border-color: var(--accent);
                    box-shadow: 0 4px 15px rgba(var(--accent-rgb, 99, 102, 241), 0.4);
                    transform: translateY(-1px);
                }
                
                /* TABS */
                .notif-tabs-container {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 6px;
                    border-radius: 16px;
                    display: inline-flex;
                    margin-bottom: 30px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .notif-tab {
                    padding: 10px 24px;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }

                .notif-tab:hover {
                    color: var(--text-primary);
                }

                .notif-tab.active {
                    background: var(--bg-card);
                    color: var(--text-primary);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                /* LIST */
                .notif-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .notif-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 20px;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                }

                .notif-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%);
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                }

                .notif-card:hover {
                    transform: translateY(-3px);
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(255, 255, 255, 0.1);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.15);
                }

                .notif-card:hover::before {
                    opacity: 1;
                }

                .notif-card.unread {
                    border-left: 4px solid var(--accent);
                    background: rgba(var(--accent-rgb, 99, 102, 241), 0.05);
                }

                .notif-card.unread .notif-text {
                    color: var(--text-primary);
                    font-weight: 500;
                }
                
                /* AVATAR */
                .notif-avatar-wrapper {
                    position: relative;
                }

                .notif-avatar {
                    width: 52px;
                    height: 52px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.4rem;
                    flex-shrink: 0;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.1);
                    transform: rotate(-3deg);
                    transition: transform 0.3s;
                }

                .notif-card:hover .notif-avatar {
                    transform: rotate(3deg) scale(1.05);
                }
                
                /* CONTENT */
                .notif-content {
                    flex: 1;
                    padding-top: 4px;
                }

                .notif-text {
                    font-size: 1.05rem;
                    line-height: 1.6;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                    transition: color 0.2s;
                }

                .notif-text strong {
                    color: var(--text-primary);
                    font-weight: 700;
                }

                .notif-time {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                /* BUTTONS */
                .action-btns {
                    display: flex;
                    gap: 12px;
                    margin-top: 16px;
                }

                .btn-decline, .btn-accept {
                    padding: 8px 20px;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }

                .btn-decline {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border-color: rgba(239, 68, 68, 0.2);
                }

                .btn-decline:hover {
                    background: rgba(239, 68, 68, 0.2);
                    transform: translateY(-1px);
                }

                .btn-accept {
                    background: rgba(34, 197, 94, 0.1);
                    color: #22c55e;
                    border-color: rgba(34, 197, 94, 0.2);
                }

                .btn-accept:hover {
                    background: rgba(34, 197, 94, 0.2);
                    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
                    transform: translateY(-1px);
                }

                .status-badge {
                    margin-top: 14px;
                    display: inline-block;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    background: rgba(255,255,255,0.05);
                }

                /* EMPTY STATE */
                .notif-empty {
                    text-align: center;
                    padding: 80px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px dashed rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                }

                .empty-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    margin-bottom: 20px;
                    box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);
                }

                .empty-text {
                    font-size: 1.2rem;
                    color: var(--text-secondary);
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                .empty-subtext {
                    font-size: 0.95rem;
                    color: var(--text-muted);
                }
            `}</style>

            <div className="notif-header">
                <h1 className="notif-title">Notifications</h1>
                <div className="notif-actions">
                    <button onClick={handleMarkAllRead}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Mark all as read
                    </button>
                </div>
            </div>

            <div className="notif-tabs-container">
                <div className={`notif-tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
                    Alerts
                </div>
                <div className={`notif-tab ${activeTab === 'unread' ? 'active' : ''}`} onClick={() => setActiveTab('unread')}>
                    Unread
                </div>
                <div className={`notif-tab ${activeTab === 'invites' ? 'active' : ''}`} onClick={() => setActiveTab('invites')}>
                    Invites
                </div>
            </div>

            <div className="notif-list">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notif, idx) => (
                        <div key={`${notif.id}_${idx}`} className={`notif-card ${notif.unread ? 'unread' : ''}`} onMouseEnter={() => { if(notif.unread) handleMarkRead(notif) }}>
                            
                            <div className="notif-avatar-wrapper">
                                <div className="notif-avatar" style={{ background: notif.gradient }}>
                                    {notif.avatar}
                                </div>
                            </div>
                            
                            <div className="notif-content">
                                <div className="notif-text">
                                    {notif.text}
                                </div>
                                <div className="notif-time">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    {notif.time}
                                </div>

                                {notif.type === 'invite' && notif.status === 'Pending' && (
                                    <div className="action-btns">
                                        <button className="btn-decline" onClick={() => handleDeclineInvite(notif.id)}>Decline</button>
                                        <button className="btn-accept" onClick={() => handleAcceptInvite(notif.id)}>Accept Invite</button>
                                    </div>
                                )}
                                
                                {notif.type === 'invite' && notif.status !== 'Pending' && (
                                    <div className="status-badge" style={{ color: notif.status === 'Accepted' ? '#22c55e' : '#ef4444', border: `1px solid ${notif.status === 'Accepted' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                                        {notif.status}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="notif-empty">
                        <div className="empty-icon">📭</div>
                        <div className="empty-text">All caught up!</div>
                        <div className="empty-subtext">No new notifications in this category.</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
