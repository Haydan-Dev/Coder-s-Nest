import React, { useState } from 'react';

// --- DATA CONSTANTS ---
const initialTeams = [
    {
        id: 1, name: 'Frontend Squad', emoji: '🚀', desc: 'Building the next-gen UI with React, TypeScript, and a11y in mind.',
        plan: 'Pro', workspaces: ['frontend-staging', 'frontend-prod'],
        members: [
            { init: 'JD', name: 'John Doe', role: 'admin', online: true, color: '#2563eb' },
            { init: 'SK', name: 'Sarah K.', role: 'member', online: true, color: '#10b981' },
            { init: 'AM', name: 'Alex M.', role: 'member', online: false, color: '#f59e0b' },
            { init: 'RL', name: 'Ryan L.', role: 'member', online: true, color: '#8b5cf6' },
            { init: 'MJ', name: 'Maya J.', role: 'member', online: false, color: '#ec4899' },
        ],
        tags: ['React', 'TypeScript', 'Figma'],
    },
    {
        id: 2, name: 'AI Research', emoji: '🤖', desc: 'Exploring LLMs, fine-tuning, and deploying AI-powered developer tools.',
        plan: 'Pro', workspaces: ['ai-dev'],
        members: [
            { init: 'JD', name: 'John Doe', role: 'member', online: true, color: '#2563eb' },
            { init: 'AM', name: 'Alex M.', role: 'admin', online: false, color: '#f59e0b' },
            { init: 'NK', name: 'Nadia K.', role: 'member', online: true, color: '#06b6d4' },
            { init: 'BW', name: 'Ben W.', role: 'member', online: false, color: '#8b5cf6' },
            { init: 'LR', name: 'Liam R.', role: 'member', online: false, color: '#10b981' },
            { init: 'ZP', name: 'Zoe P.', role: 'member', online: true, color: '#ec4899' },
        ],
        tags: ['Python', 'LLM', 'FastAPI'],
    },
];

const workspacesData = [
    { id: 'fs', name: 'Frontend Squad', emoji: '🚀', status: 'active', members: 5 },
    { id: 'ai', name: 'AI Research', emoji: '🤖', status: 'active', members: 6 },
    { id: 'bw', name: 'Backend Warriors', emoji: '⚡', status: 'idle', members: 6 },
    { id: 'mt', name: 'Mobile Team', emoji: '📱', status: 'offline', members: 4 },
];

const TeamPage = () => {
    // --- STATES ---
    const [teams, setTeams] = useState(initialTeams);
    const [activeWs, setActiveWs] = useState('fs');

    // Modal Visibility States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    // Form States - Create Team
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamDesc, setNewTeamDesc] = useState('');
    const [newTeamRole, setNewTeamRole] = useState('admin');
    const [linkedWs, setLinkedWs] = useState('');

    // Form States - Join Team
    const [inviteCode, setInviteCode] = useState('');

    // Form States - Invite Members
    const [inviteTargetTeamId, setInviteTargetTeamId] = useState(null);
    const [inviteEmailInput, setInviteEmailInput] = useState('');
    const [inviteEmails, setInviteEmails] = useState([]);
    const [inviteRole, setInviteRole] = useState('member');
    const [linkCopied, setLinkCopied] = useState(false);

    // --- LOGIC FUNCTIONS ---
    const handleCreateTeam = () => {
        if (!newTeamName.trim()) return;
        const newTeam = {
            id: Date.now(),
            name: newTeamName.trim(),
            emoji: '✨',
            desc: newTeamDesc.trim() || "A new team on Coder's Nest.",
            plan: 'Free',
            workspaces: linkedWs ? [linkedWs] : [],
            members: [{ init: 'JD', name: 'John Doe', role: newTeamRole, online: true, color: '#2563eb' }],
            tags: [],
        };
        setTeams([newTeam, ...teams]);
        setIsCreateOpen(false);
        setNewTeamName('');
        setNewTeamDesc('');
        setNewTeamRole('admin');
        setLinkedWs('');
    };

    const handleJoinTeam = () => {
        if (!inviteCode.trim()) return;
        setIsJoinOpen(false);
        setInviteCode('');
    };

    const openInviteModal = (teamId) => {
        setInviteTargetTeamId(teamId);
        setInviteEmails([]);
        setInviteEmailInput('');
        setIsInviteOpen(true);
        setLinkCopied(false);
    };

    const addInviteEmail = () => {
        const val = inviteEmailInput.trim();
        if (!val || !val.includes('@') || inviteEmails.includes(val)) return;
        setInviteEmails([...inviteEmails, val]);
        setInviteEmailInput('');
    };

    const removeInviteEmail = (email) => {
        setInviteEmails(inviteEmails.filter((e) => e !== email));
    };

    const copyInviteLink = () => {
        navigator.clipboard?.writeText('https://codersnest.app/invite/NEST-X7K2-4891').catch(() => { });
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    return (
        <>
            <style>{`
                /* Stats Grid */
                .stats-grid { display: grid; gap: 16px; margin-bottom: 32px; }
                .stat-card { background: var(--bg-card); border: 1.5px solid var(--border); border-radius: var(--r-lg); padding: 20px; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
                .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border-color: var(--border-hover); }
                .stat-card-label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
                .stat-card-value { font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
                .stat-card-change { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; font-weight: 500; }
                .stat-card-change svg { width: 14px; height: 14px; }
                .stat-card-change.up { color: var(--success); }
                
                /* Section Headers */
                .sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
                .sec-head-title { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
                .sec-head-title svg { color: var(--text-muted); width: 18px; height: 18px; }
                .sec-head-action { font-size: 0.85rem; font-weight: 600; color: var(--accent); cursor: pointer; transition: color 0.2s; }
                .sec-head-action:hover { color: var(--accent-hover); }

                /* Teams Grid */
                .teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-bottom: 40px; }
                .team-card { background: var(--bg-card); border: 1.5px solid var(--border); border-radius: var(--r-xl); display: flex; flex-direction: column; transition: all 0.2s; overflow: hidden; }
                .team-card:hover { border-color: var(--border-hover); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.05); }
                .team-card-head { padding: 20px; border-bottom: 1px solid var(--border); display: flex; gap: 16px; align-items: flex-start; }
                .team-emoji { width: 48px; height: 48px; border-radius: var(--r-lg); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
                .team-card-name { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
                .team-card-desc { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                
                /* Team Members List */
                .team-card-body { padding: 20px; flex: 1; background: rgba(250,250,250,0.02); }
                .team-members-list { display: flex; flex-direction: column; gap: 12px; }
                .team-member-row { display: flex; align-items: center; gap: 12px; }
                .member-status-dot { width: 8px; height: 8px; border-radius: 50%; border: 2px solid var(--bg-card); flex-shrink: 0; }
                .member-status-dot.online { background: var(--success); box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
                .member-status-dot.offline { background: var(--border); }
                .member-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
                .member-info { flex: 1; min-width: 0; }
                .member-name { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .member-role-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }
                .member-role-badge.admin { background: rgba(245,158,11,0.1); color: var(--warning); border: 1px solid rgba(245,158,11,0.2); }
                .member-role-badge.member { background: var(--bg-hover); color: var(--text-secondary); border: 1px solid var(--border); }
                .member-role-badge svg { width: 12px; height: 12px; }
                
                /* Team Footer */
                .team-card-footer { padding: 16px 20px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 16px; background: var(--bg-card); }
                .team-footer-tags { display: flex; flex-wrap: wrap; gap: 6px; }
                .tag { padding: 4px 10px; background: var(--bg-hover); color: var(--text-secondary); border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
                .team-footer-btns { display: flex; gap: 8px; }
                .team-action-btn { flex: 1; padding: 8px; border-radius: var(--r-md); border: 1.5px solid var(--border); background: transparent; color: var(--text-primary); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center; }
                .team-action-btn:hover { background: var(--bg-hover); border-color: var(--border-hover); }
                .team-action-btn.primary { background: var(--accent-light); border-color: rgba(37,99,235,0.2); color: var(--accent); }
                .team-action-btn.primary:hover { background: var(--accent); color: white; }

                /* Premium Workspace Selection */
                .workspace-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
                .workspace-card { background: var(--bg-card); border: 1.5px solid var(--border); border-radius: var(--r-xl); padding: 20px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 16px; }
                .workspace-card:hover { border-color: var(--border-hover); transform: translateY(-3px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.08); }
                .workspace-card.active { border-color: var(--accent); background: linear-gradient(180deg, rgba(37,99,235,0.05) 0%, var(--bg-card) 100%); box-shadow: 0 4px 20px -4px rgba(37,99,235,0.15); }
                
                .ws-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .ws-emoji-wrap { width: 48px; height: 48px; border-radius: 14px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid var(--border); transition: transform 0.3s; }
                .workspace-card:hover .ws-emoji-wrap { transform: scale(1.05) rotate(-5deg); }
                .workspace-card.active .ws-emoji-wrap { border-color: var(--accent); }
                
                .ws-status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--bg-hover); border-radius: 999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); }
                .ws-dot { width: 6px; height: 6px; border-radius: 50%; }
                .ws-dot.active { background: var(--success); box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
                .ws-dot.idle { background: var(--warning); box-shadow: 0 0 0 2px rgba(245,158,11,0.2); }
                .ws-dot.offline { background: var(--border); }
                
                .ws-card-body { flex: 1; }
                .ws-card-title { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; letter-spacing: -0.01em; }
                .ws-card-members { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
                
                .ws-card-footer { margin-top: auto; }
                .ws-btn { width: 100%; padding: 10px; border-radius: var(--r-md); font-size: 0.85rem; font-weight: 600; text-align: center; transition: all 0.2s; border: 1.5px solid var(--border); background: transparent; color: var(--text-primary); }
                .workspace-card:hover .ws-btn { background: var(--bg-hover); }
                .workspace-card.active .ws-btn { background: var(--accent); border-color: var(--accent); color: white; }

                /* Premium Header Action Buttons */
                .header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
                .header-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: var(--r-md); font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1.5px solid transparent; }
                .header-btn svg { width: 16px; height: 16px; transition: transform 0.3s; }
                
                .header-btn.secondary { background: var(--bg-card); color: var(--text-primary); border-color: var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
                .header-btn.secondary:hover { border-color: var(--border-hover); background: var(--bg-hover); transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.05); }
                .header-btn.secondary:hover svg { transform: translateX(-2px); }
                
                .header-btn.primary { background: linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%); color: white; border: none; box-shadow: 0 4px 12px rgba(37,99,235,0.25); position: relative; overflow: hidden; padding: 11.5px 20px; }
                .header-btn.primary:hover { box-shadow: 0 6px 16px rgba(37,99,235,0.4); transform: translateY(-2px); }
                .header-btn.primary::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: 0.5s; }
                .header-btn.primary:hover::after { left: 100%; }
                .header-btn.primary:hover svg { transform: rotate(90deg) scale(1.1); }

                /* Premium Modals & Forms */
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; opacity: 0; pointer-events: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .modal-overlay.active { opacity: 1; pointer-events: auto; }
                .modal { background: #ffffff; width: 90%; max-width: 600px; border-radius: var(--r-xl); border: 1px solid var(--border); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); padding: 32px; transform: scale(0.95) translateY(10px); opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); max-height: 90vh; overflow-y: auto; }
                .modal-overlay.active .modal { transform: scale(1) translateY(0); opacity: 1; }
                .modal-title { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; letter-spacing: -0.02em; }
                .modal-sub { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 24px; line-height: 1.5; }
                
                .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
                .form-label { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
                .form-input { padding: 12px 16px; border-radius: var(--r-md); border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 0.95rem; transition: all 0.2s; outline: none; width: 100%; box-sizing: border-box; }
                .form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }
                .form-input::placeholder { color: var(--text-muted); }
                
                .modal-actions { display: flex; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }

                /* Modal Specifics */
                .role-option { display: flex; align-items: center; gap: 16px; padding: 16px; border: 1.5px solid var(--border); border-radius: var(--r-md); cursor: pointer; transition: all 0.2s; }
                .role-option:hover { border-color: var(--border-hover); background: var(--bg-hover); }
                .role-option.selected { border-color: var(--accent); background: var(--accent-light); }
                .role-option-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
                .role-option-desc { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; }
                
                .invite-link-box { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--bg-hover); border: 1px dashed var(--border-hover); border-radius: var(--r-md); }
                .invite-link-text { flex: 1; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: all; }
                .invite-link-copy { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--text-primary); cursor: pointer; padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-sm); transition: all 0.2s; white-space: nowrap; }
                .invite-link-copy:hover { background: var(--text-primary); color: var(--bg-main); }
                .invite-link-copy svg { width: 14px; height: 14px; }
                
                @media (max-width: 768px) { .teams-grid { grid-template-columns: 1fr; } .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }
            `}</style>
            {/* --- CREATE TEAM MODAL --- */}
            {isCreateOpen && (
                <div className="modal-overlay active" onClick={() => setIsCreateOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--r-lg)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <div>
                                <div className="modal-title" style={{ margin: '0 0 2px' }}>Create new team</div>
                                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>Invite members and assign roles after creation</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div className="form-group">
                                <label className="form-label">Team name <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input type="text" className="form-input" placeholder="e.g. Frontend Squad" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input type="text" className="form-input" placeholder="What does this team work on?" value={newTeamDesc} onChange={(e) => setNewTeamDesc(e.target.value)} />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ marginBottom: '8px' }}>Your role</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div className={`role-option ${newTeamRole === 'admin' ? 'selected' : ''}`} onClick={() => setNewTeamRole('admin')}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: 'var(--r-md)', background: newTeamRole === 'admin' ? 'rgba(37,99,235,.1)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: newTeamRole === 'admin' ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                        </div>
                                        <div><div className="role-option-title">Admin</div><div className="role-option-desc">Full control — manage members, roles, settings, and billing.</div></div>
                                    </div>
                                    <div className={`role-option ${newTeamRole === 'member' ? 'selected' : ''}`} onClick={() => setNewTeamRole('member')}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: 'var(--r-md)', background: newTeamRole === 'member' ? 'rgba(37,99,235,.1)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: newTeamRole === 'member' ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        </div>
                                        <div><div className="role-option-title">Member</div><div className="role-option-desc">Can view and contribute to projects but cannot change team settings.</div></div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Linked workspace</label>
                                <select className="form-input" style={{ cursor: 'pointer' }} value={linkedWs} onChange={(e) => setLinkedWs(e.target.value)}>
                                    <option value="">None (create standalone team)</option>
                                    <option value="Frontend Squad">Frontend Squad workspace</option>
                                    <option value="AI Research">AI Research workspace</option>
                                    <option value="Backend Warriors">Backend Warriors workspace</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsCreateOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateTeam}>Create team</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- JOIN TEAM MODAL --- */}
            {isJoinOpen && (
                <div className="modal-overlay active" onClick={() => setIsJoinOpen(false)}>
                    <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--r-lg)', background: 'rgba(16,185,129,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                            </div>
                            <div>
                                <div className="modal-title" style={{ margin: '0 0 2px' }}>Join a team</div>
                                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>Enter your invite code to join instantly</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div className="form-group">
                                <label className="form-label">Invite code</label>
                                <div className="input-wrapper">
                                    <span className="input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                                    <input type="text" className="form-input has-icon" placeholder="NEST-XXXX-1234" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '.05em', textTransform: 'uppercase' }} value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ''))} />
                                </div>
                            </div>
                            {inviteCode.length >= 6 && (
                                <div style={{ background: 'var(--accent-light)', border: '1px solid rgba(37,99,235,.2)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
                                    <div style={{ fontSize: '.8rem', color: 'var(--accent)', fontWeight: '700', marginBottom: '4px' }}>Team found!</div>
                                    <div style={{ fontSize: '.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>Backend Warriors</div>
                                    <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>6 members · Node.js & Go stack</div>
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsJoinOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1, background: 'var(--success)', borderColor: 'var(--success)' }} onClick={handleJoinTeam}>Join team</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- INVITE MEMBERS MODAL --- */}
            {isInviteOpen && (
                <div className="modal-overlay active" onClick={() => setIsInviteOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-title">Invite to team</div>
                        <div className="modal-sub">Invite members to {teams.find((t) => t.id === inviteTargetTeamId)?.name || 'team'}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div className="form-group">
                                <label className="form-label">Invite by email</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="email" className="form-input" placeholder="colleague@company.com" style={{ flex: 1 }} value={inviteEmailInput} onChange={(e) => setInviteEmailInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addInviteEmail()} />
                                    <button className="btn btn-primary btn-sm" onClick={addInviteEmail} style={{ whiteSpace: 'nowrap' }}>Add</button>
                                </div>
                            </div>

                            {inviteEmails.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {inviteEmails.map((email) => (
                                        <div key={email} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'var(--bg-hover)', borderRadius: 'var(--r-md)', fontSize: '.83rem' }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
                                            <span style={{ flex: 1, color: 'var(--text-primary)' }}>{email}</span>
                                            <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => removeInviteEmail(email)}>✕</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label" style={{ marginBottom: '8px' }}>Role</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['member', 'admin'].map((role) => (
                                        <label key={role} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', border: `1.5px solid ${inviteRole === role ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: '.82rem', fontWeight: '600', color: inviteRole === role ? 'var(--accent)' : 'var(--text-secondary)', background: inviteRole === role ? 'var(--accent-light)' : 'transparent' }}>
                                            <input type="radio" name="inv-role" value={role} checked={inviteRole === role} onChange={(e) => setInviteRole(e.target.value)} style={{ accentColor: 'var(--accent)' }} /> {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ marginBottom: '8px' }}>Or share invite link</label>
                                <div className="invite-link-box">
                                    <div className="invite-link-text">https://codersnest.app/invite/NEST-X7K2-4891</div>
                                    <div className="invite-link-copy" onClick={copyInviteLink}>
                                        {linkCopied ? '✓ Copied!' : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy link</>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsInviteOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setIsInviteOpen(false)}>Send invites</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MAIN DASHBOARD CONTENT --- */}
            <main className="dashboard-content">
                <div className="dashboard-welcome animate-fade-in-up">
                    <div>
                        <h1 className="welcome-title">Teams & Workspace</h1>
                        <p className="welcome-subtitle">Manage your teams, assign roles, and link workspaces.</p>
                    </div>
                    <div className="header-actions">
                        <button className="header-btn secondary" onClick={() => setIsJoinOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                            Join team
                        </button>
                        <button className="header-btn primary" onClick={() => setIsCreateOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            New team
                        </button>
                    </div>
                </div>

                <div className="stats-grid animate-fade-in-up animate-delay-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', marginBottom: '28px' }}>
                    <div className="stat-card"><div className="stat-card-label">Teams</div><div className="stat-card-value">{teams.length}</div><div className="stat-card-change up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>You're in {teams.length} teams</div></div>
                    <div className="stat-card"><div className="stat-card-label">Total Members</div><div className="stat-card-value">{[...new Set(teams.flatMap(t => t.members.map(m => m.name)))].length}</div><div className="stat-card-change up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>Active online</div></div>
                    <div className="stat-card"><div className="stat-card-label">Admin Roles</div><div className="stat-card-value">{teams.filter(t => t.members.find(m => m.init === 'JD' && m.role === 'admin')).length}</div><div className="stat-card-change up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>Admin access</div></div>
                    <div className="stat-card"><div className="stat-card-label">Pending Invites</div><div className="stat-card-value">2</div><div className="stat-card-change up" style={{ color: 'var(--text-muted)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>Awaiting response</div></div>
                </div>

                <div className="animate-fade-in-up animate-delay-2">
                    <div className="sec-head">
                        <span className="sec-head-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> Your Teams</span>
                    </div>
                    <div className="teams-grid">
                        {teams.map((t) => (
                            <div key={t.id} className="team-card">
                                <div className="team-card-head">
                                    <div className="team-emoji" style={{ background: 'var(--bg-hover)' }}>{t.emoji}</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="team-card-name">{t.name}</div>
                                        <div className="team-card-desc">{t.desc}</div>
                                    </div>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '999px', fontSize: '.68rem', fontWeight: '700', background: 'var(--accent-light)', color: 'var(--accent)', whiteSpace: 'nowrap', flexShrink: 0 }}>{t.plan}</span>
                                </div>
                                <div className="team-card-body">
                                    <div style={{ fontSize: '.72rem', fontWeight: '700', letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Members ({t.members.length})</div>
                                    <div className="team-members-list">
                                        {t.members.map((m, i) => (
                                            <div key={i} className="team-member-row">
                                                <div className={`member-status-dot ${m.online ? 'online' : 'offline'}`}></div>
                                                <div className="member-avatar" style={{ background: m.color }}>{m.init}</div>
                                                <div className="member-info">
                                                    <div className="member-name">{m.name} {m.init === 'JD' && <span style={{ fontSize: '.7rem', color: 'var(--text-muted)', fontWeight: '400' }}>(You)</span>}</div>
                                                </div>
                                                <span className={`member-role-badge ${m.role}`}>
                                                    {m.role === 'admin' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                                                    {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="team-card-footer">
                                    <div className="team-footer-tags">
                                        {t.tags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                                    </div>
                                    <div className="team-footer-btns">
                                        <button className="team-action-btn" onClick={() => openInviteModal(t.id)}>+ Invite</button>
                                        <button className="team-action-btn primary" onClick={() => console.log(`Open team ${t.id}`)}>Open →</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="team-card" style={{ border: '2px dashed var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }} onClick={() => setIsCreateOpen(true)}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '52px', height: '52px', borderRadius: 'var(--r-xl)', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', margin: '0 auto 12px' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                </div>
                                <div style={{ fontSize: '.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>Create new team</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="animate-fade-in-up animate-delay-3">
                    <div className="sec-head">
                        <span className="sec-head-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> Workspace Selection</span>
                        <span className="sec-head-action">Manage all →</span>
                    </div>
                    <p style={{ fontSize: '.84rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.6' }}>Select the workspace to use for your current session. Switching workspaces does not affect other team members.</p>
                    <div className="workspace-grid">
                        {workspacesData.map((w) => (
                            <div key={w.id} className={`workspace-card ${w.id === activeWs ? 'active' : ''}`} onClick={() => setActiveWs(w.id)}>
                                <div className="ws-card-header">
                                    <div className="ws-emoji-wrap">{w.emoji}</div>
                                    <div className="ws-status-badge">
                                        <span className={`ws-dot ${w.status}`}></span>
                                        {w.status}
                                    </div>
                                </div>
                                <div className="ws-card-body">
                                    <h3 className="ws-card-title">{w.name}</h3>
                                    <p className="ws-card-members">{w.members} members access</p>
                                </div>
                                <div className="ws-card-footer">
                                    <div className="ws-btn">{w.id === activeWs ? 'Current Session' : 'Switch Workspace'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
};

export default TeamPage;