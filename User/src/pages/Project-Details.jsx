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

    // Edit Project States
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editLang, setEditLang] = useState('');
    const [editColor, setEditColor] = useState('');
    const [editAccess, setEditAccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Invite Modal States
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [isSendingInvite, setIsSendingInvite] = useState(false);

    const handleSendInvite = async () => {
        if (!inviteEmail.trim()) return;
        setIsSendingInvite(true);
        try {
            await api.post(`/projects/${id}/invite`, { email: inviteEmail.trim() });
            if (alertService) alertService.success(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
        } catch (error) {
            if (alertService) alertService.error("Failed to send invitation.");
        } finally {
            setIsSendingInvite(false);
        }
    };

    const handleGenerateCode = async () => {
        setIsGeneratingCode(true);
        try {
            const res = await api.post(`/projects/${id}/generate-code`);
            setInviteCode(res.data.invite_code);
            if (alertService) alertService.success("Invite code generated!");
        } catch (error) {
            if (alertService) alertService.error("Failed to generate code.");
        } finally {
            setIsGeneratingCode(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(inviteCode);
        if (alertService) alertService.success("Code copied to clipboard!");
    };

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await api.get(`/projects/${id}`);
                setProject(response.data);
                setEditName(response.data.name);
                setEditDesc(response.data.desc);
                setEditLang(response.data.lang);
                setEditColor(response.data.color);
                setEditAccess(response.data.access);
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

    const handleSaveDetails = async () => {
        setIsSaving(true);
        try {
            const data = {
                project_name: editName,
                project_description: editDesc,
                language_stack: editLang,
                accent_color: editColor,
                project_visibility: editAccess
            };
            await api.put(`/projects/${id}`, data);
            if (alertService) alertService.success("Project details updated!");
            
            // Refresh data
            const res = await api.get(`/projects/${id}`);
            setProject(res.data);
        } catch (err) {
            if (alertService) alertService.error("Failed to update project details");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="pd-container">
            <style>{`
                .pd-container { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; padding: 20px 0; width: 100%; }
                .pd-header { padding: 40px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-2xl); display: flex; flex-direction: column; gap: 24px; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
                .pd-header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: ${project.color || 'var(--accent)'}; }
                .pd-header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; flex-wrap: wrap; }
                .pd-title { font-size: 2.4rem; font-weight: 800; color: var(--text-primary); margin: 0 0 12px 0; letter-spacing: -0.02em; line-height: 1.2; }
                .pd-desc { font-size: 1.05rem; color: var(--text-secondary); max-width: 700px; line-height: 1.6; margin: 0; }
                
                .pd-badges { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 20px; }
                .pd-badge { padding: 6px 14px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px; }
                .pd-badge.lang { background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border); }
                .pd-badge.access { background: rgba(16,185,129,0.08); color: var(--success); border: 1px solid rgba(16,185,129,0.2); }
                .pd-badge.private { background: rgba(245,158,11,0.08); color: var(--warning); border: 1px solid rgba(245,158,11,0.2); }

                .pd-actions { display: flex; gap: 12px; align-items: center; }

                .pd-tabs { display: flex; gap: 24px; border-bottom: 2px solid var(--border); padding-bottom: 0; margin-top: 10px; overflow-x: auto; scrollbar-width: none; }
                .pd-tabs::-webkit-scrollbar { display: none; }
                .pd-tab { padding: 12px 4px; font-size: 1rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s ease; margin-bottom: -2px; white-space: nowrap; }
                .pd-tab:hover { color: var(--text-primary); }
                .pd-tab.active { color: var(--accent); border-bottom-color: var(--accent); }

                .pd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
                
                .pd-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 24px; display: flex; flex-direction: column; gap: 20px; transition: all 0.3s ease; box-shadow: 0 2px 10px rgba(0,0,0,0.015); }
                .pd-card:hover { border-color: var(--border-hover); box-shadow: 0 6px 20px rgba(0,0,0,0.04); transform: translateY(-2px); }
                .pd-card-title { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; margin: 0; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
                
                .pd-list-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px dashed var(--border); }
                .pd-list-item:last-child { border-bottom: none; padding-bottom: 0; }
                
                .pd-timeline { display: flex; flex-direction: column; gap: 24px; padding-left: 28px; border-left: 2px solid var(--border); margin-left: 12px; margin-top: 10px; }
                .pd-timeline-item { position: relative; display: flex; flex-direction: column; gap: 6px; }
                .pd-timeline-dot { position: absolute; left: -36px; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: var(--bg-main); border: 3px solid var(--accent); }
                .pd-timeline-time { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
                .pd-timeline-content { background: var(--bg-hover); padding: 16px 20px; border-radius: var(--r-lg); border: 1px solid var(--border); font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; }
                .pd-timeline-content strong { color: var(--text-primary); font-weight: 600; }

                /* Modal Styles */
                .pd-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .pd-modal { background: var(--bg-card); width: 100%; max-width: 500px; border-radius: var(--r-xl); padding: 32px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.2); position: relative; }
                .pd-modal-title { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 24px; }
                .pd-modal-close { position: absolute; top: 24px; right: 24px; background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 50%; transition: 0.2s; }
                .pd-modal-close:hover { background: var(--bg-hover); color: var(--text-primary); }
                .pd-modal-section { margin-bottom: 24px; }
                .pd-modal-section h4 { font-size: 0.9rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
            `}</style>

            {isInviteOpen && (
                <div className="pd-modal-overlay" onClick={() => setIsInviteOpen(false)}>
                    <div className="pd-modal animate-scale-in" onClick={e => e.stopPropagation()}>
                        <button className="pd-modal-close" onClick={() => setIsInviteOpen(false)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                        <h2 className="pd-modal-title">Invite</h2>
                        
                        <div className="pd-modal-section">
                            <h4>Invite via Email</h4>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input 
                                    type="email" 
                                    className="form-input" 
                                    placeholder="user@example.com" 
                                    value={inviteEmail} 
                                    onChange={e => setInviteEmail(e.target.value)} 
                                    style={{ flex: 1 }} 
                                />
                                <button className="btn btn-primary" onClick={handleSendInvite} disabled={isSendingInvite || !inviteEmail.trim()}>
                                    {isSendingInvite ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </div>

                        <div className="pd-modal-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginBottom: 0 }}>
                            <h4>Invite via Code</h4>
                            {!inviteCode ? (
                                <button className="btn btn-secondary" onClick={handleGenerateCode} disabled={isGeneratingCode} style={{ width: '100%' }}>
                                    {isGeneratingCode ? 'Generating...' : 'Generate New Code'}
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ flex: 1, padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', textAlign: 'center', letterSpacing: '0.1em' }}>
                                        {inviteCode}
                                    </div>
                                    <button className="btn btn-secondary" onClick={copyCode} style={{ padding: '12px' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                    </button>
                                </div>
                            )}
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>Users can enter this code in their dashboard to join the project.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="pd-header animate-fade-in-up">
                <div className="pd-header-top">
                    <div>
                        <h1 className="pd-title">{project.name}</h1>
                        <p className="pd-desc">{project.desc || "No description provided."}</p>
                        <div className="pd-badges">
                            <span className="pd-badge lang">
                                <span style={{display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: project.color || 'var(--accent)'}}></span>
                                {project.lang}
                            </span>
                            <span className={`pd-badge ${project.access === 'public' ? 'access' : 'private'}`}>{project.access}</span>
                            <span className="pd-badge" style={{ background: project.color || 'var(--accent)', color: '#fff', borderColor: 'transparent' }}>{project.status}</span>
                        </div>
                    </div>
                    <div className="pd-actions">
                        {project.my_permissions?.can_invite_members && (
                            <button className="btn btn-secondary btn-sm" style={{ padding: '10px 18px', borderRadius: '999px', fontSize: '0.9rem' }} onClick={() => setIsInviteOpen(true)}>Invite</button>
                        )}
                        {project.workspaces?.length > 0 && (
                            <button className="btn btn-primary btn-sm" style={{ background: 'var(--success)', borderColor: 'var(--success)', padding: '10px 18px', borderRadius: '999px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate(`/workspace/${project.id}`)}>
                                Open Workspace
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="pd-tabs animate-fade-in-up animate-delay-1">
                <div className={`pd-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>General Settings</div>
                <div className={`pd-tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Members ({project.members?.length || 0})</div>
                <div className={`pd-tab ${activeTab === 'workspaces' ? 'active' : ''}`} onClick={() => setActiveTab('workspaces')}>Workspaces ({project.workspaces?.length || 0})</div>
            </div>

            <div className="animate-fade-in-up animate-delay-2">
                {activeTab === 'overview' && (
                    <div className="pd-grid">
                        {/* Project Details Form */}
                        <div className="pd-card" style={{ gridColumn: 'span 2' }}>
                            <h3 className="pd-card-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                General Settings
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '250px' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Project Name</label>
                                        <input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} disabled={project.my_permissions?.role !== 'Owner' && project.my_permissions?.role !== 'Leader'} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: '250px' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Tech Stack</label>
                                        <select className="form-input" value={editLang} onChange={e => setEditLang(e.target.value)} disabled={project.my_permissions?.role !== 'Owner' && project.my_permissions?.role !== 'Leader'}>
                                            <option value="React">React</option>
                                            <option value="Vue">Vue</option>
                                            <option value="Python">Python</option>
                                            <option value="Node">Node</option>
                                            <option value="HTML">HTML/JS</option>
                                            <option value="TypeScript">TypeScript</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Description</label>
                                    <textarea className="form-input" rows="3" value={editDesc} onChange={e => setEditDesc(e.target.value)} disabled={project.my_permissions?.role !== 'Owner' && project.my_permissions?.role !== 'Leader'}></textarea>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Visibility</label>
                                        <select className="form-input" value={editAccess} onChange={e => setEditAccess(e.target.value)} disabled={project.my_permissions?.role !== 'Owner'}>
                                            <option value="private">Private (Invite Only)</option>
                                            <option value="shared">Shared (Link/Code)</option>
                                            <option value="public">Public</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Accent Color</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {['blue', 'purple', 'green', 'orange', 'red', 'teal'].map(c => (
                                                <div 
                                                    key={c}
                                                    onClick={() => (project.my_permissions?.role === 'Owner' || project.my_permissions?.role === 'Leader') && setEditColor(c)}
                                                    style={{ width: '32px', height: '32px', borderRadius: '50%', background: `var(--${c}, ${c})`, cursor: (project.my_permissions?.role === 'Owner' || project.my_permissions?.role === 'Leader') ? 'pointer' : 'default', border: editColor === c ? '3px solid var(--text-primary)' : '2px solid transparent' }}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {(project.my_permissions?.role === 'Owner' || project.my_permissions?.role === 'Leader') && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                        <button className="btn btn-primary" onClick={handleSaveDetails} disabled={isSaving}>
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Team Snapshot & Details moved to side */}
                        <div className="pd-card">
                            <h3 className="pd-card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> Team Snapshot</h3>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="pd-list-item">
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Total Members</span>
                                    <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{project.members?.length || 0}</span>
                                </div>
                                <div className="pd-list-item">
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Workspaces</span>
                                    <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{project.workspaces?.length || 0}</span>
                                </div>
                                <div className="pd-list-item">
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Last Updated</span>
                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{project.updated}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pd-card" style={{ gridColumn: 'span 2' }}>
                            <h3 className="pd-card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> My Permissions</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {Object.entries(project.my_permissions || {}).map(([key, value]) => {
                                    if (key === 'role') return null;
                                    return (
                                        <div key={key} style={{ padding: '8px 16px', background: value ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: value ? 'var(--success)' : 'var(--danger)', borderRadius: '999px', fontSize: '0.9rem', fontWeight: '600', border: `1px solid ${value ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {value ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
                                            {key.replace(/_/g, ' ')}
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
                            <div key={i} className="pd-card" style={{ flexDirection: 'row', alignItems: 'center', padding: '20px', gap: '16px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: m.color || 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: '700', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>{m.init}</div>
                                    <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: m.online ? 'var(--success)' : 'var(--text-muted)', border: '2.5px solid var(--bg-card)' }}></div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{m.name}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        {m.role}
                                    </div>
                                </div>
                                <button className="btn btn-secondary btn-sm" style={{ padding: '8px 14px', fontSize: '0.85rem', borderRadius: '8px' }} onClick={() => navigate('/view-profile', { state: { member: m } })}>Profile</button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'workspaces' && (
                    <div className="pd-grid">
                        {project.workspaces?.map((w, i) => (
                            <div key={i} className="pd-card" style={{ cursor: 'pointer', padding: '24px' }} onClick={() => navigate(`/workspace/${project.id}`)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--bg-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>{w.emoji || '💻'}</div>
                                    <span style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.08)', color: 'var(--success)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{w.status}</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>{w.name}</div>
                                    <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{w.members} members have access</div>
                                </div>
                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)', fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Enter Workspace 
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetails;
