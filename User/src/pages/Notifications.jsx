import React, { useState } from 'react';

const Notifications = () => {
    const [activeTab, setActiveTab] = useState('all');

    const notifications = [
        {
            id: 1,
            type: 'mention',
            user: 'Sarah Lee',
            action: 'mentioned you in',
            target: 'Frontend Redesign',
            time: '2 hours ago',
            read: false,
            avatar: 'SL'
        },
        {
            id: 2,
            type: 'project',
            user: 'Mike Chen',
            action: 'assigned you a new task in',
            target: 'API Integration',
            time: '5 hours ago',
            read: false,
            avatar: 'MC'
        },
        {
            id: 3,
            type: 'team',
            user: 'Alex Rivera',
            action: 'invited you to join',
            target: 'Core Developers',
            time: '1 day ago',
            read: true,
            avatar: 'AR'
        },
        {
            id: 4,
            type: 'system',
            user: 'System',
            action: 'Deployment successful for',
            target: 'Production Environment',
            time: '2 days ago',
            read: true,
            avatar: 'SYS'
        }
    ];

    const filteredNotifications = activeTab === 'all' 
        ? notifications 
        : activeTab === 'unread' 
            ? notifications.filter(n => !n.read) 
            : notifications.filter(n => n.type === 'mention');

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
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }
                .notif-card:nth-child(3n) .notif-avatar {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
                <div className={`notif-tab ${activeTab === 'mentions' ? 'active' : ''}`} onClick={() => setActiveTab('mentions')}>
                    Mentions
                </div>
            </div>

            <div className="notif-list">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map(notif => (
                        <div key={notif.id} className={`notif-card ${!notif.read ? 'unread' : ''}`}>
                            <div className="notif-avatar">{notif.avatar}</div>
                            <div className="notif-content">
                                <div className="notif-text">
                                    <strong>{notif.user}</strong> {notif.action} <strong>{notif.target}</strong>
                                </div>
                                <div className="notif-time">{notif.time}</div>
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
