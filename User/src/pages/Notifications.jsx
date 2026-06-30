import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Notifications = () => {
    const [activeTab, setActiveTab] = useState('all');
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

    const filteredNotifications = activeTab === 'all' 
        ? notifications 
        : activeTab === 'unread' 
            ? notifications.filter(n => n.unread) 
            : notifications.filter(n => n.type === 'invite');

    return (
        <div className="notifications-page">
            <style>{`
                .notifications-page {
                    flex: 1;
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    width: 100%;
                    color: var(--text-primary);
                }
                .notif-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }
                .notif-title {
                    font-size: 2rem;
                    font-weight: 800;
                }
                .notif-actions button {
                    background: transparent;
                    border: 1px solid var(--border);
                    color: var(--text-secondary);
                    padding: 8px 16px;
                    border-radius: var(--r-md);
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .notif-actions button:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }
                
                /* TABS */
                .notif-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 24px;
                    border-bottom: 1px solid var(--border);
                    padding-bottom: 12px;
                }
                .notif-tab {
                    padding: 8px 16px;
                    border-radius: 99px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .notif-tab:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }
                .notif-tab.active {
                    background: var(--accent-light);
                    color: var(--accent);
                }
                
                /* LIST */
                .notif-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .notif-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 20px;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: var(--r-lg);
                    transition: all 0.2s;
                    position: relative;
                }
                .notif-card.unread {
                    border-left: 4px solid var(--accent);
                    background: var(--bg-hover);
                }
                .notif-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.05);
                }
                
                /* AVATAR */
                .notif-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 1rem;
                    flex-shrink: 0;
                }
                .notif-card:nth-child(even) .notif-avatar {
                    /* Removed hardcoded gradient to use api gradient */
                }
                .notif-card:nth-child(3n) .notif-avatar {
                    /* Removed hardcoded gradient to use api gradient */
                }
                
                /* CONTENT */
                .notif-content {
                    flex: 1;
                }
                .notif-text {
                    font-size: 1rem;
                    line-height: 1.5;
                    color: var(--text-secondary);
                    margin-bottom: 6px;
                }
                .notif-text strong {
                    color: var(--text-primary);
                    font-weight: 700;
                }
                .notif-time {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    font-weight: 500;
                }
                .notif-empty {
                    text-align: center;
                    padding: 60px 0;
                    color: var(--text-muted);
                    font-size: 1.1rem;
                }
            `}</style>

            <div className="notif-header">
                <h1 className="notif-title">Notifications</h1>
                <div className="notif-actions">
                    <button>Mark all as read</button>
                </div>
            </div>

            <div className="notif-tabs">
                <div className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                    All
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
                    filteredNotifications.map(notif => (
                        <div key={notif.id} className={`notif-card ${notif.unread ? 'unread' : ''}`}>
                            <div className="notif-avatar" style={{ background: notif.gradient }}>{notif.avatar}</div>
                            <div className="notif-content">
                                <div className="notif-text">
                                    {notif.text}
                                </div>
                                {notif.type === 'invite' && notif.status === 'Pending' && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                        <button style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }} onClick={() => handleDeclineInvite(notif.id)}>Decline</button>
                                        <button style={{ padding: '8px 16px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }} onClick={() => handleAcceptInvite(notif.id)}>Accept</button>
                                    </div>
                                )}
                                {notif.type === 'invite' && notif.status !== 'Pending' && (
                                    <div style={{ marginTop: '12px', fontSize: '0.9rem', fontWeight: '600', color: notif.status === 'Accepted' ? '#22c55e' : '#ef4444' }}>
                                        {notif.status}
                                    </div>
                                )}
                                <div className="notif-time" style={{ marginTop: '8px' }}>{notif.time}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="notif-empty">
                        No notifications found in this category.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
