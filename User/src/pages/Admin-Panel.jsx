import React, { useState } from 'react';

// ============================================================
// INITIAL DATA
// ============================================================
const initialUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', init: 'JD', color: '#2563eb', role: 'admin', status: 'active', online: 'online', last: 'Just now', joined: 'Jan 2024' },
    { id: 2, name: 'Sarah Kim', email: 'sarah@example.com', init: 'SK', color: '#10b981', role: 'admin', status: 'active', online: 'online', last: '2 min ago', joined: 'Jan 2024' },
    { id: 3, name: 'Alex M.', email: 'alex@example.com', init: 'AM', color: '#f59e0b', role: 'admin', status: 'active', online: 'away', last: '18 min ago', joined: 'Feb 2024' },
    { id: 4, name: 'Ryan Lee', email: 'ryan@example.com', init: 'RL', color: '#8b5cf6', role: 'member', status: 'active', online: 'online', last: '5 min ago', joined: 'Feb 2024' },
    { id: 5, name: 'Maya Johnson', email: 'maya@example.com', init: 'MJ', color: '#ec4899', role: 'member', status: 'active', online: 'offline', last: '1 hour ago', joined: 'Mar 2024' },
    { id: 6, name: 'Nadia K.', email: 'nadia@example.com', init: 'NK', color: '#06b6d4', role: 'member', status: 'active', online: 'online', last: '12 min ago', joined: 'Mar 2024' },
    { id: 7, name: 'Ben W.', email: 'ben@example.com', init: 'BW', color: '#8b5cf6', role: 'member', status: 'inactive', online: 'offline', last: '3 days ago', joined: 'Apr 2024' },
    { id: 8, name: 'Liam R.', email: 'liam@example.com', init: 'LR', color: '#10b981', role: 'member', status: 'active', online: 'online', last: '30 min ago', joined: 'Apr 2024' },
    { id: 9, name: 'Zoe P.', email: 'zoe@example.com', init: 'ZP', color: '#ec4899', role: 'member', status: 'active', online: 'online', last: '8 min ago', joined: 'May 2024' },
    { id: 10, name: 'Tom H.', email: 'tom@example.com', init: 'TH', color: '#f59e0b', role: 'viewer', status: 'active', online: 'offline', last: '2 days ago', joined: 'May 2024' },
];

const initialWorkspaces = [
    {
        name: 'Frontend Squad', emoji: '🚀', members: 5,
        perms: [
            { label: 'Code read access', desc: 'Members can view all files', on: true },
            { label: 'Code write access', desc: 'Members can push commits', on: true },
            { label: 'Create files & folders', desc: 'Members can create new files', on: true },
            { label: 'Delete files', desc: 'Members can permanently delete files', on: false },
            { label: 'Invite new members', desc: 'Members can invite others to join', on: false },
            { label: 'Manage workspace settings', desc: 'Members can edit workspace config', on: false },
        ]
    },
    {
        name: 'AI Research', emoji: '🤖', members: 6,
        perms: [
            { label: 'Code read access', desc: 'Members can view all files', on: true },
            { label: 'Code write access', desc: 'Members can push commits', on: true },
            { label: 'Create files & folders', desc: 'Members can create new files', on: true },
            { label: 'Delete files', desc: 'Members can permanently delete files', on: true },
            { label: 'Invite new members', desc: 'Members can invite others to join', on: true },
            { label: 'Manage workspace settings', desc: 'Members can edit workspace config', on: false },
        ]
    },
];

const initialActivities = [
    { id: 1, type: 'auth', icon: 'login', time: '2 min ago', user: { init: 'SK', color: '#10b981', name: 'Sarah Kim' }, ws: 'Frontend Squad', ip: '192.168.1.42', text: 'Sarah Kim signed in from a new browser (Chrome / macOS)' },
    { id: 2, type: 'member', icon: 'role', time: '14 min ago', user: { init: 'JD', color: '#2563eb', name: 'John Doe' }, ws: 'AI Research', ip: '192.168.1.10', text: 'John Doe changed role of Ryan Lee from Viewer to Member' },
    { id: 3, type: 'commit', icon: 'commit', time: '22 min ago', user: { init: 'RL', color: '#8b5cf6', name: 'Ryan Lee' }, ws: 'Frontend Squad', ip: '—', text: 'Ryan Lee pushed 12 commits to nest-api-gateway / main' },
    { id: 4, type: 'file', icon: 'file', time: '35 min ago', user: { init: 'MJ', color: '#ec4899', name: 'Maya Johnson' }, ws: 'Frontend Squad', ip: '—', text: 'Maya Johnson deleted file src/legacy/old-auth.ts' },
];

const AdminPanel = () => {
    // --- STATES ---
    const [currentTab, setCurrentTab] = useState('users'); // 'users', 'roles', 'perms', 'activity'

    // Data States
    const [users, setUsers] = useState(initialUsers);
    const [workspaces, setWorkspaces] = useState(initialWorkspaces);
    const [activities] = useState(initialActivities);

    // Filter States (Users)
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // Filter States (Activity)
    const [activitySearch, setActivitySearch] = useState('');
    const [activityTypeFilter, setActivityTypeFilter] = useState('all');

    // Modal States
    const [isRemoveOpen, setIsRemoveOpen] = useState(false);
    const [pendingRemoveId, setPendingRemoveId] = useState(null);

    const [isSuspendOpen, setIsSuspendOpen] = useState(false);
    const [pendingSuspendId, setPendingSuspendId] = useState(null);
    const [suspendReason, setSuspendReason] = useState('');

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmails, setInviteEmails] = useState([]);
    const [inviteInput, setInviteInput] = useState('');
    const [inviteRole, setInviteRole] = useState('member');

    // --- LOGIC FUNCTIONS (USERS) ---
    const filteredUsers = users.filter((u) => {
        const matchesSearch = !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = !roleFilter || u.role === roleFilter;
        const matchesStatus = !statusFilter || u.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const toggleSelectUser = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredUsers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredUsers.map(u => u.id));
        }
    };

    const changeUserRole = (id, newRole) => {
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
        console.log(`Changed role for user ${id} to ${newRole}`);
    };

    const confirmRemove = () => {
        setUsers(users.filter(u => u.id !== pendingRemoveId));
        setIsRemoveOpen(false);
        setPendingRemoveId(null);
    };

    const confirmSuspend = () => {
        setUsers(users.map(u => u.id === pendingSuspendId ? { ...u, status: 'suspended' } : u));
        setIsSuspendOpen(false);
        setPendingSuspendId(null);
    };

    const handleUnsuspend = (id) => {
        setUsers(users.map(u => u.id === id ? { ...u, status: 'active' } : u));
    };

    const handleBulkRemove = () => {
        setUsers(users.filter(u => !selectedIds.includes(u.id) || u.id === 1)); // prevent removing self
        setSelectedIds([]);
    };

    // --- LOGIC FUNCTIONS (PERMISSIONS) ---
    const togglePermission = (wsIndex, permIndex) => {
        const newWs = [...workspaces];
        newWs[wsIndex].perms[permIndex].on = !newWs[wsIndex].perms[permIndex].on;
        setWorkspaces(newWs);
    };

    const lockAllPerms = (wsIndex) => {
        const newWs = [...workspaces];
        newWs[wsIndex].perms.forEach(p => p.on = false);
        setWorkspaces(newWs);
    };

    const unlockAllPerms = (wsIndex) => {
        const newWs = [...workspaces];
        newWs[wsIndex].perms.forEach(p => p.on = true);
        setWorkspaces(newWs);
    };

    // --- LOGIC FUNCTIONS (INVITE) ---
    const addInvitePill = () => {
        if (inviteInput.includes('@') && !inviteEmails.includes(inviteInput)) {
            setInviteEmails([...inviteEmails, inviteInput]);
            setInviteInput('');
        }
    };

    const removeInvitePill = (email) => {
        setInviteEmails(inviteEmails.filter(e => e !== email));
    };

    const sendInvites = () => {
        console.log("Sending invites to", inviteEmails, "as", inviteRole);
        setInviteEmails([]);
        setIsInviteOpen(false);
    };

    // --- RENDER HELPERS ---
    const renderUsersTab = () => (
        <div className="animate-fade-in-up animate-delay-2">
            <div className="section-title-row">
                <div className="section-title">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    All Members
                </div>
                <button className="btn-primary" onClick={() => setIsInviteOpen(true)}>+ Invite member</button>
            </div>

            {selectedIds.length > 0 && (
                <div className="bulk-bar visible" style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-hover)', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>
                    <span>{selectedIds.length} members selected</span>
                    <button className="btn btn-sm" onClick={() => console.log('Bulk role change clicked')}>Change role</button>
                    <button className="btn btn-sm danger" style={{ background: 'var(--danger)', color: 'white', border: 'none' }} onClick={handleBulkRemove}>Remove selected</button>
                    <button className="btn btn-sm" onClick={() => setSelectedIds([])}>✕ Clear</button>
                </div>
            )}

            <div className="toolbar-row">
                <input type="text" className="search-input" placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">All roles</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                </select>
                <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ width: '48px', textAlign: 'center' }}><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0} style={{ width: '16px', height: '16px', borderRadius: '4px' }} /></th>
                            <th>MEMBER</th>
                            <th>ROLE</th>
                            <th>STATUS</th>
                            <th>LAST ACTIVE</th>
                            <th>JOINED</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No members match your filters.</td></tr>
                        ) : (
                            filteredUsers.map(u => (
                                <tr key={u.id}>
                                    <td style={{ textAlign: 'center' }}><input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleSelectUser(u.id)} style={{ width: '16px', height: '16px', borderRadius: '4px' }} /></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}>{u.init}</div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#111827' }}>{u.name} {u.id === 1 && <span style={{ color: '#9ca3af', fontWeight: 'normal' }}>(You)</span>}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ color: '#374151', fontWeight: '500', textTransform: 'capitalize' }}>{u.role}</div>
                                    </td>
                                    <td>
                                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', background: u.status === 'active' ? '#d1fae5' : u.status === 'suspended' ? '#fee2e2' : '#f3f4f6', color: u.status === 'active' ? '#059669' : u.status === 'suspended' ? '#dc2626' : '#6b7280' }}>
                                            {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                                        </span>
                                    </td>
                                    <td style={{ color: '#6b7280' }}>{u.last}</td>
                                    <td style={{ color: '#6b7280' }}>{u.joined}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <button className="page-btn"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                <button className="page-btn active">1</button>
                <button className="page-btn">2</button>
                <button className="page-btn"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
            </div>
        </div>
    );

    const renderRolesTab = () => (
        <div className="animate-fade-in-up animate-delay-2">
            <div className="section-head"><span className="section-head-title">Role Definitions & Capabilities</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                {/* Simple visual placeholders for role cards */}
                <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)' }}>
                    <h3 style={{ color: 'var(--accent)', margin: '0 0 10px' }}>Admin</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Full access to manage all members, billing, and settings.</p>
                </div>
                <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)' }}>
                    <h3 style={{ margin: '0 0 10px' }}>Member</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Standard access. Can push code and collaborate, but cannot manage users.</p>
                </div>
                <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)' }}>
                    <h3 style={{ color: 'var(--success)', margin: '0 0 10px' }}>Viewer</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Read-only access to projects and files.</p>
                </div>
            </div>
        </div>
    );

    const renderPermsTab = () => (
        <div className="animate-fade-in-up animate-delay-2">
            <div className="section-head"><span className="section-head-title">Workspace Access Control</span></div>
            <p style={{ fontSize: '.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Control what members can do in each workspace.</p>

            {workspaces.map((ws, wsIndex) => (
                <div key={wsIndex} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>{ws.emoji} {ws.name} ({ws.members} members)</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-sm" onClick={() => lockAllPerms(wsIndex)}>Lock all</button>
                            <button className="btn btn-sm btn-primary" onClick={() => unlockAllPerms(wsIndex)}>Unlock all</button>
                        </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {ws.perms.map((p, pIndex) => (
                                <tr key={pIndex} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>{p.label}</td>
                                    <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.desc}</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', justifyContent: 'flex-end' }}>
                                            <input type="checkbox" checked={p.on} onChange={() => togglePermission(wsIndex, pIndex)} />
                                            <span style={{ fontSize: '0.85rem', color: p.on ? 'var(--success)' : 'var(--text-muted)' }}>{p.on ? 'Enabled' : 'Disabled'}</span>
                                        </label>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );

    const renderActivityTab = () => {
        const filteredActivities = activities.filter(a => {
            const matchType = activityTypeFilter === 'all' || a.type === activityTypeFilter;
            const matchSearch = !activitySearch || a.text.toLowerCase().includes(activitySearch.toLowerCase()) || a.user.name.toLowerCase().includes(activitySearch.toLowerCase());
            return matchType && matchSearch;
        });

        return (
            <div className="animate-fade-in-up animate-delay-2">
                <div className="section-head">
                    <span className="section-head-title">Activity Log</span>
                    <div style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 'bold' }}>Live monitoring</div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    {['all', 'auth', 'member', 'file', 'commit', 'setting'].map(type => (
                        <button key={type} className={`btn btn-sm ${activityTypeFilter === type ? 'btn-primary' : ''}`} onClick={() => setActivityTypeFilter(type)}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <input type="search" className="form-input" placeholder="Search events..." value={activitySearch} onChange={(e) => setActivitySearch(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn btn-sm">Export CSV</button>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                    {filteredActivities.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No events match your search.</div>
                    ) : (
                        filteredActivities.map(a => (
                            <div key={a.id} style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: a.user.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{a.user.init}</div>
                                <div>
                                    <div style={{ fontSize: '0.9rem' }}>{a.text}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '10px' }}>
                                        <span>{a.time}</span>
                                        {a.ws !== '—' && <span>| Ws: {a.ws}</span>}
                                        {a.ip !== '—' && <span>| IP: {a.ip}</span>}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
            <style>{`
                .admin-top-nav { height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; background: #ffffff; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 100; }
                .nav-left { display: flex; align-items: center; gap: 12px; }
                .nav-logo-icon { width: 32px; height: 32px; background: #f97316; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
                .nav-title { font-weight: 800; font-size: 1.1rem; color: #111827; }
                .nav-right { display: flex; align-items: center; gap: 16px; }
                .nav-btn-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid #e5e7eb; background: #ffffff; color: #6b7280; cursor: pointer; transition: 0.2s; }
                .nav-btn-icon:hover { background: #f3f4f6; }
                .nav-profile { width: 36px; height: 36px; background: #f97316; color: white; font-weight: 700; font-size: 0.9rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

                .admin-panel-container { padding: 40px; max-width: none; width: 100%; color: #111827; font-family: 'Inter', sans-serif; background: #f9fafb; flex: 1; }
                .admin-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .welcome-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 8px; color: #111827; letter-spacing: -0.02em; }
                .welcome-subtitle { color: #6b7280; font-size: 0.95rem; font-weight: 500; }
                .admin-badge { background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; padding: 6px 14px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }

                /* Stats Cards */
                .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 32px; }
                .stat-card { background: #ffffff; border: 1px solid #f3f4f6; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
                .stat-val { font-size: 2rem; font-weight: 800; line-height: 1; color: #111827; margin-bottom: 8px; }
                .stat-label { color: #9ca3af; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 12px; text-transform: uppercase; }
                .stat-sub { font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 6px; }
                .stat-sub.green { color: #10b981; }
                .stat-sub.yellow { color: #f59e0b; }
                .stat-sub.red { color: #ef4444; }

                /* Tabs */
                .tabs-container { background: #f3f4f6; padding: 6px; border-radius: 12px; display: inline-flex; gap: 4px; margin-bottom: 32px; }
                .tab-btn { padding: 10px 16px; border-radius: 8px; border: none; background: transparent; color: #6b7280; font-weight: 600; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
                .tab-btn:hover { color: #374151; }
                .tab-btn.active { background: #ffffff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .tab-badge { background: #2563eb; color: #ffffff; font-size: 0.75rem; padding: 2px 8px; border-radius: 9999px; }
                .tab-badge.red { background: #ef4444; }

                /* Toolbar */
                .section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .section-title { font-size: 1.2rem; font-weight: 800; color: #111827; display: flex; align-items: center; gap: 10px; }
                .toolbar-row { display: flex; gap: 12px; margin-bottom: 16px; }
                .search-input { flex: 1; padding: 12px 16px 12px 40px; border: 1px solid #e5e7eb; border-radius: 8px; background: #ffffff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E") no-repeat 14px center; font-size: 0.9rem; color: #374151; outline: none; }
                .search-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
                .filter-select { padding: 12px 36px 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #ffffff; font-size: 0.9rem; color: #374151; cursor: pointer; outline: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }

                /* Table */
                .admin-table-wrap { background: #ffffff; border-radius: 12px; border: 1px solid #f3f4f6; overflow: hidden; }
                .admin-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .admin-table thead { background: #f9fafb; }
                .admin-table th { padding: 16px; font-size: 0.75rem; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f3f4f6; text-align: left; }
                .admin-table td { padding: 16px; font-size: 0.9rem; color: #374151; border-bottom: 1px solid #f3f4f6; }
                .admin-table tbody tr:last-child td { border-bottom: none; }
                .admin-table tbody tr:hover { background: #f9fafb; }

                /* Pagination */
                .pagination { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
                .page-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: #ffffff; border: 1px solid #e5e7eb; color: #374151; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
                .page-btn.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }
                .page-btn:hover:not(.active) { background: #f3f4f6; }

                /* Reset buttons */
                .btn-primary { background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s; }
                .btn-primary:hover { background: #1d4ed8; }

                /* Modals */
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: 0.2s; backdrop-filter: blur(4px); }
                .modal-overlay.active { opacity: 1; pointer-events: auto; }
                .modal { background: #ffffff; padding: 24px; border-radius: 12px; width: 440px; max-width: 90%; box-shadow: 0 15px 40px rgba(0,0,0,0.2); transform: translateY(20px); transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid #e5e7eb; }
                .modal-overlay.active .modal { transform: translateY(0); }
                .modal h3 { font-size: 1.35rem; font-weight: 700; margin-bottom: 12px; color: #111827; }
                .modal p { font-size: 0.95rem; color: #6b7280; margin-bottom: 16px; line-height: 1.5; }
            `}</style>

            {/* --- MODALS --- */}
            {isRemoveOpen && (
                <div className="modal-overlay active" onClick={() => setIsRemoveOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Remove Member</h3>
                        <p>Are you sure you want to remove this user? They will lose access immediately.</p>
                        <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button className="btn btn-secondary" onClick={() => setIsRemoveOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ background: 'var(--danger)', border: 'none' }} onClick={confirmRemove}>Remove</button>
                        </div>
                    </div>
                </div>
            )}

            {isSuspendOpen && (
                <div className="modal-overlay active" onClick={() => setIsSuspendOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Suspend Account</h3>
                        <p>Suspending this user will block login attempts.</p>
                        <textarea className="form-input" rows="2" placeholder="Reason (optional)" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} style={{ marginTop: '10px' }}></textarea>
                        <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button className="btn btn-secondary" onClick={() => setIsSuspendOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ background: '#f59e0b', border: 'none' }} onClick={confirmSuspend}>Suspend</button>
                        </div>
                    </div>
                </div>
            )}

            {isInviteOpen && (
                <div className="modal-overlay active" onClick={() => setIsInviteOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Invite New Members</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <input type="email" className="form-input" placeholder="colleague@company.com" value={inviteInput} onChange={(e) => setInviteInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addInvitePill()} style={{ flex: 1 }} />
                            <button className="btn btn-primary btn-sm" onClick={addInvitePill}>Add</button>
                        </div>

                        {inviteEmails.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                                {inviteEmails.map(email => (
                                    <div key={email} style={{ background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {email} <span style={{ cursor: 'pointer', color: 'var(--danger)' }} onClick={() => removeInvitePill(email)}>✕</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <select className="form-input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ marginTop: '15px' }}>
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            <option value="viewer">Viewer</option>
                        </select>

                        <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button className="btn btn-secondary" onClick={() => setIsInviteOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={sendInvites}>Send Invites</button>
                        </div>
                    </div>
                </div>
            )}



            <div className="admin-panel-container">
                {/* --- MAIN PAGE CONTENT --- */}
                <div style={{ paddingBottom: '60px' }}>

                <div className="admin-header-row">
                    <div>
                        <h1 className="welcome-title">Admin & Permissions</h1>
                        <p className="welcome-subtitle">Manage members, roles, workspace access, and monitor platform activity.</p>
                    </div>
                    <div className="admin-badge">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        Admin access
                    </div>
                </div>

                {/* Dashboard Stats (Top Row) */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-val">{users.length}</div>
                        <div className="stat-label">TOTAL MEMBERS</div>
                        <div className="stat-sub green">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                            +2 this month
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-val">{users.filter(u => u.online === 'online').length}</div>
                        <div className="stat-label">ONLINE NOW</div>
                        <div className="stat-sub green">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="#10b981" stroke="none"><circle cx="12" cy="12" r="6"></circle></svg>
                            58% active
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-val">{users.filter(u => u.role === 'admin').length}</div>
                        <div className="stat-label">ADMINS</div>
                        <div className="stat-sub yellow">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            25% of team
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-val">2</div>
                        <div className="stat-label">PENDING INVITES</div>
                        <div className="stat-sub yellow">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            Awaiting response
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-val">{users.filter(u => u.status === 'suspended').length}</div>
                        <div className="stat-label">SUSPENDED</div>
                        <div className="stat-sub red">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                            1 blocked account
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="tabs-container">
                    <button className={`tab-btn ${currentTab === 'users' ? 'active' : ''}`} onClick={() => setCurrentTab('users')}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Manage Users
                        <span className="tab-badge">{users.length}</span>
                    </button>
                    <button className={`tab-btn ${currentTab === 'roles' ? 'active' : ''}`} onClick={() => setCurrentTab('roles')}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        Role Control
                    </button>
                    <button className={`tab-btn ${currentTab === 'perms' ? 'active' : ''}`} onClick={() => setCurrentTab('perms')}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Workspace Permissions
                    </button>
                    <button className={`tab-btn ${currentTab === 'activity' ? 'active' : ''}`} onClick={() => setCurrentTab('activity')}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                        Activity Monitor
                        <span className="tab-badge red">Live</span>
                    </button>
                </div>

                {/* Tab Content */}
                {currentTab === 'users' && renderUsersTab()}
                {currentTab === 'roles' && renderRolesTab()}
                {currentTab === 'perms' && renderPermsTab()}
                {currentTab === 'activity' && renderActivityTab()}
                </div>

            </div>
        </div>
    );
};

export default AdminPanel;