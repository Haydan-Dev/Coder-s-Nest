import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { alertService } from '../utils/alert';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await api.get(`/projects/${id}`);
                setProject(response.data);
            } catch (error) {
                console.error("Error fetching project details:", error);
                if (alertService) alertService.error("Failed to load project details.");
                navigate('/teams');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProject();
    }, [id, navigate]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '16px' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>Loading project data...</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
            <style>{`
                .pd-header { padding: 32px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-xl); display: flex; flex-direction: column; gap: 24px; position: relative; overflow: hidden; }
                .pd-header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: ${project.color || 'var(--accent)'}; }
                .pd-title-row { display: flex; justify-content: space-between; align-items: flex-start; }
                .pd-title { font-size: 2rem; font-weight: 800; color: var(--text-primary); margin: 0 0 8px 0; letter-spacing: -0.02em; }
                .pd-desc { font-size: 1rem; color: var(--text-secondary); max-width: 600px; line-height: 1.6; margin: 0; }
                
                .pd-badges { display: flex; gap: 8px; align-items: center; }
                .pd-badge { padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
                .pd-badge.lang { background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border); }
                .pd-badge.access { background: rgba(16,185,129,0.1); color: var(--success); border: 1px solid rgba(16,185,129,0.2); }
                .pd-badge.private { background: rgba(245,158,11,0.1); color: var(--warning); border: 1px solid rgba(245,158,11,0.2); }

                .pd-tabs { display: flex; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 2px; }
                .pd-tab { padding: 12px 24px; font-size: 0.95rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
                .pd-tab:hover { color: var(--text-primary); }
                .pd-tab.active { color: var(--accent); border-bottom-color: var(--accent); }

                .pd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
                
                .pd-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 24px; display: flex; flex-direction: column; gap: 16px; }
                .pd-card-title { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; margin: 0; }
                
                .pd-timeline { display: flex; flex-direction: column; gap: 20px; padding-left: 20px; border-left: 2px solid var(--border); margin-left: 10px; }
                .pd-timeline-item { position: relative; display: flex; flex-direction: column; gap: 4px; }
                .pd-timeline-dot { position: absolute; left: -27px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: var(--bg-main); border: 2px solid var(--accent); }
                .pd-timeline-time { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
                .pd-timeline-content { background: var(--bg-hover); padding: 12px 16px; border-radius: var(--r-md); border: 1px solid var(--border); font-size: 0.9rem; color: var(--text-secondary); }
                .pd-timeline-content strong { color: var(--text-primary); }
            `}</style>

            <div className="pd-header animate-fade-in-up">
                <div className="pd-title-row">
                    <div>
                        <h1 className="pd-title">{project.name}</h1>
                        <p className="pd-desc">{project.desc || "No description provided."}</p>
                    </div>
                    <div className="pd-badges">
                        <span className="pd-badge lang">{project.lang}</span>
                        <span className={`pd-badge ${project.access === 'public' ? 'access' : 'private'}`}>{project.access}</span>
                        <span className="pd-badge lang" style={{ background: project.color, color: '#fff', borderColor: 'transparent' }}>{project.status}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/teams')}>← Back to Teams</button>
                    {project.my_permissions?.can_invite_members && (
                        <button className="btn btn-primary btn-sm">Manage Invites</button>
                    )}
                    {project.workspaces?.length > 0 && (
                        <button className="btn btn-primary btn-sm" style={{ background: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => navigate(`/workspace/${project.id}`)}>Open Workspace</button>
                    )}
                </div>
            </div>

            <div className="pd-tabs animate-fade-in-up animate-delay-1">
                <div className={`pd-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</div>
                <div className={`pd-tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Members ({project.members?.length || 0})</div>
                <div className={`pd-tab ${activeTab === 'workspaces' ? 'active' : ''}`} onClick={() => setActiveTab('workspaces')}>Workspaces ({project.workspaces?.length || 0})</div>
                <div className={`pd-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Activity Log</div>
            </div>

            <div className="animate-fade-in-up animate-delay-2">
                {activeTab === 'overview' && (
                    <div className="pd-grid">
                        <div className="pd-card">
                            <h3 className="pd-card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> Team Snapshot</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Members</span>
                                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{project.members?.length || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Workspaces</span>
                                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{project.workspaces?.length || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Last Updated</span>
                                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{project.updated}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pd-card">
                            <h3 className="pd-card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> My Permissions</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {Object.entries(project.my_permissions || {}).map(([key, value]) => {
                                    if (key === 'role') return null;
                                    return (
                                        <div key={key} style={{ padding: '6px 12px', background: value ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: value ? 'var(--success)' : 'var(--danger)', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: '600', border: `1px solid ${value ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                                            {key.replace(/_/g, ' ')} {value ? '✓' : '✕'}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="pd-grid">
                        {project.members?.map((m, i) => (
                            <div key={i} className="pd-card" style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: m.color || 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '700' }}>{m.init}</div>
                                    <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', borderRadius: '50%', background: m.online ? 'var(--success)' : 'var(--border)', border: '2px solid var(--bg-card)' }}></div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>{m.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{m.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'workspaces' && (
                    <div className="pd-grid">
                        {project.workspaces?.map((w, i) => (
                            <div key={i} className="pd-card" style={{ cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => navigate(`/workspace/${project.id}`)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{w.emoji || '💻'}</div>
                                    <span style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>{w.status}</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{w.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{w.members} members have access</div>
                                </div>
                                <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Enter Workspace <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="pd-card" style={{ maxWidth: '800px' }}>
                        <h3 className="pd-card-title" style={{ marginBottom: '16px' }}>Project Activity Log</h3>
                        {project.activity_logs?.length > 0 ? (
                            <div className="pd-timeline">
                                {project.activity_logs.map((log, i) => (
                                    <div key={i} className="pd-timeline-item">
                                        <div className="pd-timeline-dot"></div>
                                        <div className="pd-timeline-time">{log.time}</div>
                                        <div className="pd-timeline-content">
                                            <strong style={{ color: log.user_color }}>{log.user_name}</strong> {log.action} <strong>{log.entity_type}</strong>
                                            {log.metadata && <pre style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-main)', borderRadius: '4px', fontSize: '0.75rem', overflowX: 'auto', border: '1px solid var(--border)' }}>{JSON.stringify(log.metadata, null, 2)}</pre>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48" style={{ marginBottom: '16px', opacity: 0.5 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                <div>No activity recorded yet for this project.</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetails;
