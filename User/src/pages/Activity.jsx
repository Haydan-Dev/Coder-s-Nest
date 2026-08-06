import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Activity = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const res = await api.get('/activity-logs/me');
            setActivities(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch activity logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
        
        const handleRefresh = () => fetchActivities();
        window.addEventListener('refresh_notifications', handleRefresh);
        return () => window.removeEventListener('refresh_notifications', handleRefresh);
    }, []);

    // Helper to format ISO string to readable date
    const formatDate = (isoString) => {
        if (!isoString) return 'Just now';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    };

    // Helper to format activity messages cleanly
    const formatActivityMessage = (log) => {
        const actionStr = (log.action || '').toUpperCase();
        const meta = log.metadata || {};
        
        const projectName = meta.project_name ? (
            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>'{meta.project_name}'</span>
        ) : 'the project';

        const targetUser = meta.email ? (
            <span style={{ color: 'var(--accent)', fontWeight: '600' }}>
                {meta.target_name ? `${meta.target_name} (${meta.email})` : meta.email}
            </span>
        ) : 'a user';

        let content = null;

        if (actionStr.includes('INVITED_MEMBER') || actionStr.includes('INVITED')) {
            content = (
                <>You <strong style={{ color: 'var(--text-primary)' }}>invited</strong> {targetUser} to join {projectName}{meta.role ? ` as a ${meta.role}` : ''}.</>
            );
        } else if (actionStr.includes('REMOVED_MEMBER') || actionStr.includes('REMOVED')) {
            content = (
                <>You <strong style={{ color: 'var(--text-primary)' }}>removed</strong> {targetUser} from {projectName}.</>
            );
        } else if (actionStr.includes('ACCEPTED')) {
            content = (
                <>You <strong style={{ color: 'var(--text-primary)' }}>accepted</strong> the invitation to join {projectName}{meta.role ? ` as a ${meta.role}` : ''}.</>
            );
        } else if (actionStr.includes('REJECTED') || actionStr.includes('DECLINED')) {
            content = (
                <>You <strong style={{ color: 'var(--text-primary)' }}>declined</strong> the invitation to join {projectName}.</>
            );
        } else if (actionStr.includes('ROLE_UPDATED')) {
            content = (
                <>You <strong style={{ color: 'var(--text-primary)' }}>changed the role</strong> of {targetUser}{meta.role ? ` to ${meta.role}` : ''} in {projectName}.</>
            );
        } else if (actionStr.includes('PROJECT_CREATED')) {
            content = (
                <>You <strong style={{ color: 'var(--text-primary)' }}>created</strong> the project {projectName}.</>
            );
        } else if (actionStr.includes('PROJECT_DELETED')) {
            content = (
                <>You <strong style={{ color: 'var(--text-primary)' }}>deleted</strong> the project {projectName}.</>
            );
        } else {
            // Fallback for unknown actions
            let cleanAction = log.action.replace(/_/g, ' ').toLowerCase();
            if (cleanAction.startsWith('you ')) cleanAction = cleanAction.substring(4);
            
            content = (
                <>
                    You <strong style={{ color: 'var(--text-primary)' }}>{cleanAction}</strong>
                    {meta.target_name || meta.email ? ` ${targetUser}` : ''}
                    {meta.project_name ? <> in {projectName}</> : ''}.
                </>
            );
        }

        return (
            <div className="timeline-content" style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {content}
            </div>
        );
    };

    return (
        <div className="activity-page">
            <style>{`
                .activity-page {
                    flex: 1;
                    padding: 40px;
                    max-width: 800px;
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

                .activity-header {
                    margin-bottom: 40px;
                }

                .activity-title {
                    font-size: 2.4rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-muted) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.5px;
                    margin-bottom: 8px;
                }
                
                .activity-subtitle {
                    color: var(--text-muted);
                    font-size: 1.05rem;
                }

                /* TIMELINE */
                .timeline-container {
                    position: relative;
                    padding-left: 24px;
                }

                .timeline-container::before {
                    content: '';
                    position: absolute;
                    left: 7px;
                    top: 8px;
                    bottom: 0;
                    width: 2px;
                    background: linear-gradient(180deg, var(--accent) 0%, rgba(var(--accent-rgb, 99, 102, 241), 0.1) 100%);
                    border-radius: 2px;
                }

                .timeline-item {
                    position: relative;
                    margin-bottom: 32px;
                    padding: 24px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }

                .timeline-item:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(255, 255, 255, 0.1);
                    transform: translateX(4px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
                }

                .timeline-dot {
                    position: absolute;
                    left: -29px;
                    top: 32px;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: var(--bg-main);
                    border: 2px solid var(--accent);
                    box-shadow: 0 0 10px rgba(var(--accent-rgb, 99, 102, 241), 0.4);
                    z-index: 1;
                }

                .timeline-time {
                    font-size: 0.85rem;
                    color: var(--accent);
                    font-weight: 700;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .timeline-content {
                    font-size: 1.05rem;
                    line-height: 1.5;
                    color: var(--text-secondary);
                }

                .timeline-content strong {
                    color: var(--text-primary);
                }

                /* EMPTY STATE */
                .activity-empty {
                    text-align: center;
                    padding: 80px 20px;
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
                    margin: 0 auto 20px;
                    box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);
                }
            `}</style>

            <div className="activity-header">
                <h1 className="activity-title">Activity Log</h1>
                <p className="activity-subtitle">A timeline of your recent actions across all projects.</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading activity logs...</div>
            ) : activities.length > 0 ? (
                <div className="timeline-container">
                    {activities.map((log) => (
                        <div key={log.id} className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-time">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                {formatDate(log.created_at)}
                            </div>
                            {formatActivityMessage(log)}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="activity-empty">
                    <div className="empty-icon">📭</div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No Activity Yet</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>You haven't performed any logged actions recently.</p>
                </div>
            )}
        </div>
    );
};

export default Activity;
