import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

// --- DATA CONSTANTS ---
const langColors = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3776ab',
  Go: '#00add8', Rust: '#ce422b', 'React Native': '#61dafb',
  React: '#61dafb', Other: '#9ca3af'
};

const avatarColors = { J: '#2563eb', S: '#10b981', A: '#8b5cf6', R: '#ec4899', M: '#f59e0b' };

const swatchColors = {
  blue: '#3b82f6',
  purple: '#a855f7',
  green: '#22c55e',
  orange: '#f97316',
  pink: '#ec4899',
  cyan: '#06b6d4'
};



const filterCycle = ['All', 'Active', 'Review', 'Draft', 'shared', 'public'];

const ProjectPage = () => {
  // --- STATES ---
  const [projects, setProjects] = useState([]);
  const [currentView, setCurrentView] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIdx, setFilterIdx] = useState(0);

  // Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  // Create Form States
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLang, setNewLang] = useState('TypeScript');
  const [newColor, setNewColor] = useState('blue');
  const [newVis, setNewVis] = useState('private');

  // Edit Form States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLang, setEditLang] = useState(''); // locked visually
  const [editColor, setEditColor] = useState('blue');
  const [editVis, setEditVis] = useState('private');

  // Chat Drawer States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatTab, setActiveChatTab] = useState('channels'); // 'channels' | 'members'
  const [activeChannel, setActiveChannel] = useState('general');
  const [channels, setChannels] = useState([
    { id: 'general', name: 'general', isDefault: true },
  ]);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  // Share Project State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareProjectId, setShareProjectId] = useState(null);
  const [shareProjectName, setShareProjectName] = useState('');
  const [generatedInviteCode, setGeneratedInviteCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  // --- LOGIC ---
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const filterMode = filterCycle[filterIdx];

  const filteredProjects = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterMode === 'All' || p.status === filterMode || p.access === filterMode.toLowerCase();
    return matchSearch && matchFilter;
  });

  const cycleFilter = () => {
    setFilterIdx((prev) => (prev + 1) % filterCycle.length);
  };

  const askDelete = (id, e) => {
    e.stopPropagation();
    setPendingDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (pendingDeleteId !== null) {
      try {
        await api.delete(`/projects/${pendingDeleteId}`);
        setProjects((prev) => prev.filter((p) => p.id !== pendingDeleteId));
      } catch (err) {
        console.error('Failed to delete project', err);
      } finally {
        setPendingDeleteId(null);
        setIsDeleteModalOpen(false);
      }
    }
  };

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) {
      setIsCreatingChannel(false);
      return;
    }
    const newChan = {
      id: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newChannelName.trim(),
      isDefault: false
    };
    setChannels([...channels, newChan]);
    setNewChannelName('');
    setIsCreatingChannel(false);
    setActiveChannel(newChan.id);
  };

  const deleteChannel = (id, e) => {
    e.stopPropagation();
    setChannels(channels.filter(c => c.id !== id));
    if (activeChannel === id) setActiveChannel('general');
  };

  const openShareModal = (p, e) => {
    e.stopPropagation();
    setShareProjectName(p.name);
    setShareProjectId(p.id);
    setGeneratedInviteCode(''); 
    setIsShareModalOpen(true);
  };

  const generateInviteCode = async () => {
    try {
      const res = await api.post(`/projects/${shareProjectId}/generate-code`);
      setGeneratedInviteCode(res.data.invite_code);
    } catch (err) {
      console.error('Failed to generate invite code', err);
    }
  };

  const inviteByEmail = async () => {
    if (!inviteEmail) return;
    try {
      await api.post(`/projects/${shareProjectId}/invite`, { email: inviteEmail });
      alert(`Invite sent to ${inviteEmail}!`);
      setInviteEmail('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send invite');
    }
  };

  const joinProject = async () => {
    if (!joinCode) return;
    try {
      await api.post('/projects/join-by-code', { code: joinCode });
      setIsJoinModalOpen(false);
      setJoinCode('');
      fetchProjects(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to join project');
    }
  };

  const createProject = async () => {
    if (!newName.trim()) return;
    try {
      const res = await api.post('/projects/', {
        name: newName.trim(),
        desc: newDesc.trim() || 'A brand new project.',
        lang: newLang,
        color: newColor,
        status: 'Draft',
        access: newVis
      });
      setProjects([res.data, ...projects]);
      setIsCreateModalOpen(false);
      // Reset form
      setNewName('');
      setNewDesc('');
      setNewLang('TypeScript');
      setNewColor('blue');
      setNewVis('private');
    } catch (err) {
      console.error('Failed to create project', err);
    }
  };

  const openEditModal = (p, e) => {
    e.stopPropagation();
    setEditingProject(p);
    setEditName(p.name);
    setEditDesc(p.desc);
    setEditLang(p.lang);
    setEditColor(p.color);
    setEditVis(p.access.toLowerCase());
    setIsEditModalOpen(true);
  };

  const updateProject = async () => {
    if (!editName.trim() || !editingProject) return;
    try {
      const res = await api.put(`/projects/${editingProject.id}`, {
        name: editName.trim(),
        desc: editDesc.trim(),
        color: editColor,
        access: editVis
      });
      setProjects((prev) => prev.map(p => p.id === editingProject.id ? res.data : p));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update project', err);
    }
  };

  const openProject = (id) => {
    // Navigate logic
    console.log(`Opening project ${id}`);
  };

  // --- HELPER COMPONENTS ---
  const AccessIcon = ({ type }) => {
    if (type === 'private') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    if (type === 'shared') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>;
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
  };

  return (
    <>
      <style>{`
        /* Core Layout */
        .dashboard-content { padding: 32px 40px; max-width: 1400px; margin: 0 auto; width: 100%; }
        .dashboard-welcome { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; gap: 20px; flex-wrap: wrap; }
        .welcome-title { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.02em; }
        .welcome-subtitle { font-size: 0.95rem; color: var(--text-muted); }
        
        .chat-drawer-btn { display: flex; align-items: center; gap: 8px; background: var(--bg-card); border: 1.5px solid var(--border); padding: 10px 16px; border-radius: var(--r-md); color: var(--text-primary); font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.9rem; }
        .chat-drawer-btn:hover { background: var(--bg-hover); border-color: var(--accent); color: var(--accent); }
        .chat-drawer-btn svg { width: 18px; height: 18px; }

        /* Project Chat Drawer */
        .project-chat-drawer { position: fixed; top: 0; right: -350px; width: 350px; height: 100vh; background: var(--bg-sidebar); border-left: 1px solid var(--border); box-shadow: -4px 0 24px rgba(0,0,0,0.1); transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1); z-index: 105; display: flex; flex-direction: column; }
        .project-chat-drawer.open { right: 0; }
        .drawer-header { height: 60px; padding: 0 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .drawer-title { font-weight: 700; font-size: 1.1rem; }
        .drawer-close { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; transition: 0.2s; }
        .drawer-close:hover { background: var(--bg-hover); color: var(--danger); }
        .drawer-tabs { display: flex; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .drawer-tab { flex: 1; padding: 12px 0; text-align: center; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: var(--text-muted); border-bottom: 2px solid transparent; transition: 0.2s; }
        .drawer-tab.active { color: var(--accent); border-bottom-color: var(--accent); background: var(--accent-light); }
        .drawer-tab:hover:not(.active) { background: var(--bg-hover); color: var(--text-primary); }
        .drawer-content { flex: 1; overflow-y: auto; padding: 16px; }
        .chat-channel { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--r-md); cursor: pointer; transition: 0.2s; color: var(--text-secondary); font-weight: 500; font-size: 0.95rem; }
        .chat-channel:hover { background: var(--bg-hover); color: var(--text-primary); }
        .chat-channel.active { background: var(--bg-active); color: var(--accent); }
        .chat-channel-icon { font-size: 1.2rem; opacity: 0.7; }
        .chan-delete-btn { opacity: 0; transition: opacity 0.2s; }
        .chat-channel:hover .chan-delete-btn { opacity: 1; }
        .chan-delete-btn:hover { color: var(--danger) !important; background: rgba(239,68,68,0.1) !important; border-radius: 4px; }
        .member-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: var(--r-md); cursor: pointer; transition: 0.2s; }
        .member-item:hover { background: var(--bg-hover); }
        .member-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.8rem; position: relative; }
        .status-dot { position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--bg-sidebar); }
        .status-online { background: var(--success); }
        .status-offline { background: var(--text-muted); }
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); backdrop-filter: blur(2px); z-index: 100; opacity: 0; pointer-events: none; transition: 0.3s; }
        .drawer-overlay.active { opacity: 1; pointer-events: all; }
        
        
        /* Stats */
        .proj-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .proj-stat { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 20px; display: flex; flex-direction: column; }
        .proj-stat-val { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
        .proj-stat-lbl { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        
        /* Toolbar */
        .projects-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .toolbar-search { flex: 1; min-width: 250px; position: relative; display: flex; align-items: center; }
        .toolbar-search svg { position: absolute; left: 14px; width: 18px; height: 18px; color: var(--text-muted); }
        .toolbar-search input { width: 100%; background: var(--bg-card); border: 1.5px solid var(--border); border-radius: var(--r-lg); padding: 10px 14px 10px 40px; font-size: 0.9rem; color: var(--text-primary); transition: all 0.2s; }
        .toolbar-search input:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .toolbar-filter { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: var(--bg-card); border: 1.5px solid var(--border); border-radius: var(--r-lg); cursor: pointer; user-select: none; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); transition: all 0.2s; }
        .toolbar-filter:hover { background: var(--bg-hover); border-color: var(--border-hover); }
        .toolbar-filter svg { width: 16px; height: 16px; color: var(--text-muted); }
        .view-toggle { display: flex; background: var(--bg-card); border: 1.5px solid var(--border); border-radius: var(--r-lg); padding: 4px; gap: 4px; }
        .view-btn { padding: 6px; border: none; background: transparent; border-radius: var(--r-md); cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .view-btn svg { width: 18px; height: 18px; }
        .view-btn:hover { color: var(--text-primary); }
        .view-btn.active { background: var(--bg-hover); color: var(--text-primary); box-shadow: var(--shadow-sm); }
        
        /* Grid View */
        .project-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .proj-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 24px; position: relative; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; overflow: hidden; }
        .proj-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--border-hover); }
        .proj-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--border); transition: background 0.2s; }
        .proj-card.blue::before { background: #3b82f6; }
        .proj-card.purple::before { background: #a855f7; }
        .proj-card.green::before { background: #22c55e; }
        .proj-card.orange::before { background: #f97316; }
        .proj-card.pink::before { background: #ec4899; }
        .proj-card.cyan::before { background: #06b6d4; }
        .proj-card-actions { position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; opacity: 0; transform: translateY(-4px); transition: all 0.2s; }
        .proj-card:hover .proj-card-actions { opacity: 1; transform: translateY(0); }
        .proj-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .proj-icon { width: 48px; height: 48px; border-radius: var(--r-lg); display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 800; color: #fff; flex-shrink: 0; }
        .proj-icon.blue { background: linear-gradient(135deg, #60a5fa, #2563eb); }
        .proj-icon.purple { background: linear-gradient(135deg, #c084fc, #7e22ce); }
        .proj-icon.green { background: linear-gradient(135deg, #4ade80, #16a34a); }
        .proj-icon.orange { background: linear-gradient(135deg, #fb923c, #ea580c); }
        .proj-icon.pink { background: linear-gradient(135deg, #f472b6, #db2777); }
        .proj-icon.cyan { background: linear-gradient(135deg, #22d3ee, #0891b2); }
        .proj-card-name { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; line-height: 1.3; }
        .proj-card-desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 24px; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .proj-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border); }
        
        /* Table View */
        .project-table-wrap { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-xl); overflow: hidden; }
        .project-table { width: 100%; border-collapse: collapse; text-align: left; }
        .project-table th { padding: 16px 20px; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); background: var(--bg-hover); }
        .project-table td { padding: 16px 20px; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .project-table tr:last-child td { border-bottom: none; }
        .project-table tbody tr { transition: background 0.15s; cursor: pointer; }
        .project-table tbody tr:hover { background: var(--bg-hover); }
        .project-name-cell { display: flex; align-items: center; gap: 16px; }
        .project-name-cell .proj-icon { width: 40px; height: 40px; font-size: 0.85rem; }
        .proj-name { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
        .proj-desc { font-size: 0.8rem; color: var(--text-muted); max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        /* Pills & Badges */
        .lang-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
        .lang-dot { width: 8px; height: 8px; border-radius: 50%; }
        .project-badge { display: inline-flex; padding: 4px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-active { background: rgba(34,197,94,0.15); color: #16a34a; }
        .badge-review { background: rgba(245,158,11,0.15); color: #d97706; }
        .badge-draft { background: var(--bg-hover); color: var(--text-muted); }
        .access-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); padding: 4px 10px; border-radius: var(--r-md); background: var(--bg-hover); }
        .access-pill.public { color: #2563eb; background: rgba(37,99,235,0.1); }
        
        /* Avatars & Buttons */
        .avatar-stack { display: flex; align-items: center; }
        .tiny-avatar { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: #fff; border: 2px solid var(--bg-card); margin-left: -8px; }
        .tiny-avatar:first-child { margin-left: 0; }
        .row-actions { display: flex; align-items: center; gap: 6px; opacity: 0; transition: opacity 0.2s; }
        tr:hover .row-actions { opacity: 1; }
        .row-btn { width: 32px; height: 32px; border-radius: var(--r-md); border: none; background: var(--bg-card); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); }
        .row-btn:hover { background: var(--bg-hover); color: var(--text-primary); transform: translateY(-1px); }
        .row-btn.danger:hover { background: rgba(239,68,68,0.1); color: var(--danger); }
        
        /* Modals & Empty State */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 100; display: none; align-items: center; justify-content: center; }
        .modal-overlay.active { display: flex; animation: fadeIn 0.2s; }
        .modal { background: var(--bg-card); width: 90%; max-width: 500px; border-radius: var(--r-xl); padding: 32px; box-shadow: var(--shadow-lg); border: 1px solid var(--border); animation: dropIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .modal-title { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
        .modal-sub { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 24px; }
        .modal-actions { display: flex; gap: 12px; margin-top: 24px; }
        .color-picker { display: flex; gap: 12px; }
        .color-swatch { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative; }
        .color-swatch:hover { transform: scale(1.1); }
        .color-swatch.selected { box-shadow: 0 0 0 2px var(--bg-card), 0 0 0 4px var(--accent); }
        .empty-state { text-align: center; padding: 64px 20px; background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--r-xl); margin-top: 32px; }
        .empty-icon { width: 64px; height: 64px; background: var(--bg-hover); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: var(--text-muted); }
        .empty-icon svg { width: 32px; height: 32px; }
        .empty-title { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
        .empty-sub { font-size: 0.95rem; color: var(--text-muted); max-width: 400px; margin: 0 auto 24px; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (max-width: 768px) { .dashboard-content { padding: 24px 16px; } .project-table-wrap { overflow-x: auto; } }
      `}</style>

      {/* --- MODALS --- */}
      {isShareModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsShareModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--r-lg)', background: 'rgba(37,99,235,0.1)', border: '1.5px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </div>
              <div>
                <div className="modal-title" style={{ margin: '0 0 2px' }}>Share Project</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invite your team to {shareProjectName}</div>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Invite via Email</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="email" className="form-input" placeholder="colleague@example.com" style={{ flex: 1, background: 'var(--bg-main)' }} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                <button className="btn btn-primary" onClick={inviteByEmail} style={{ padding: '0 16px' }}>Send</button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              <span style={{ padding: '0 10px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>or share code</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="form-input" placeholder="Click generate..." style={{ flex: 1, fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '1px', textAlign: 'center', background: 'var(--bg-main)' }} value={generatedInviteCode} readOnly />
                {generatedInviteCode ? (
                  <button className="btn btn-secondary" onClick={() => { navigator.clipboard.writeText(generatedInviteCode); alert('Copied to clipboard!'); }} style={{ padding: '0 16px' }}>Copy</button>
                ) : (
                  <button className="btn btn-secondary" onClick={generateInviteCode} style={{ padding: '0 16px' }}>Generate</button>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>Anyone with this code can join the project.</div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsShareModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', borderRadius: 'var(--r-xl)', background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', marginBottom: '16px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
            </div>
            <div className="modal-title">Delete project?</div>
            <div className="modal-sub">This will move <strong>{projects.find((p) => p.id === pendingDeleteId)?.name || 'this project'}</strong> to the bin. You can restore or delete it later from the bin.</div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={confirmDelete}>Move to Bin</button>
            </div>
          </div>
        </div>
      )}

      {isJoinModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsJoinModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--r-lg)', background: 'var(--bg-hover)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              </div>
              <div>
                <div className="modal-title" style={{ margin: '0 0 2px' }}>Join project</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enter an invite code to join a team</div>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="join-code">Invite code</label>
              <input id="join-code" type="text" className="form-input" placeholder="e.g. X8J-9M2-KQL" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ''))} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsJoinModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={joinProject} disabled={!joinCode}>Join project</button>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--r-lg)', background: 'var(--accent-light)', border: '1.5px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </div>
              <div>
                <div className="modal-title" style={{ margin: '0 0 2px' }}>Create new project</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Set up a new repository-backed project</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-name-input">Project name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input id="proj-name-input" type="text" className="form-input" placeholder="my-awesome-project" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-desc-input">Description</label>
                <textarea id="proj-desc-input" className="form-input" rows="2" placeholder="A short description of what this project does…" style={{ resize: 'vertical' }} value={newDesc} onChange={(e) => setNewDesc(e.target.value)}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Language / Stack</label>
                <select className="form-input" style={{ cursor: 'pointer' }} value={newLang} onChange={(e) => setNewLang(e.target.value)}>
                  <option value="TypeScript">TypeScript</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="Python">Python</option>
                  <option value="Go">Go</option>
                  <option value="Rust">Rust</option>
                  <option value="Java">Java</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '8px' }}>Accent color</label>
                <div className="color-picker">
                  {['blue', 'purple', 'green', 'orange', 'pink', 'cyan'].map((c) => (
                    <div key={c} className={`color-swatch ${newColor === c ? 'selected' : ''}`} data-color={c} style={{ background: swatchColors[c] }} onClick={() => setNewColor(c)}></div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Visibility</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['private', 'shared', 'public'].map((v) => (
                    <label key={v} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', border: `1.5px solid ${newVis === v ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: '0.84rem', fontWeight: '600', color: newVis === v ? 'var(--accent)' : 'var(--text-secondary)', background: newVis === v ? 'var(--accent-light)' : 'transparent' }}>
                      <input type="radio" name="vis" value={v} checked={newVis === v} onChange={(e) => setNewVis(e.target.value)} style={{ accentColor: 'var(--accent)' }} /> {v.charAt(0).toUpperCase() + v.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={createProject} disabled={!newName.trim()}>Create project</button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--r-lg)', background: 'var(--accent-light)', border: '1.5px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </div>
              <div>
                <div className="modal-title" style={{ margin: '0 0 2px' }}>Edit project</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Update your project details</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-name-input">Project name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input id="edit-name-input" type="text" className="form-input" placeholder="my-awesome-project" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-desc-input">Description</label>
                <textarea id="edit-desc-input" className="form-input" rows="2" placeholder="A short description of what this project does…" style={{ resize: 'vertical' }} value={editDesc} onChange={(e) => setEditDesc(e.target.value)}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Language / Stack <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '6px' }}>(Cannot be changed)</span></label>
                <div className="form-input" style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', cursor: 'not-allowed', opacity: 0.8 }}>
                  {editLang}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '8px' }}>Accent color</label>
                <div className="color-picker">
                  {['blue', 'purple', 'green', 'orange', 'pink', 'cyan'].map((c) => (
                    <div key={c} className={`color-swatch ${editColor === c ? 'selected' : ''}`} data-color={c} style={{ background: swatchColors[c] }} onClick={() => setEditColor(c)}></div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Visibility</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['private', 'shared', 'public'].map((v) => (
                    <label key={v} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', border: `1.5px solid ${editVis === v ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: '0.84rem', fontWeight: '600', color: editVis === v ? 'var(--accent)' : 'var(--text-secondary)', background: editVis === v ? 'var(--accent-light)' : 'transparent' }}>
                      <input type="radio" name="vis" value={v} checked={editVis === v} onChange={(e) => setEditVis(e.target.value)} style={{ accentColor: 'var(--accent)' }} /> {v.charAt(0).toUpperCase() + v.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={updateProject} disabled={!editName.trim()}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="dashboard-content">
        <div className="dashboard-welcome animate-fade-in-up">
          <div>
            <h1 className="welcome-title">Projects</h1>
            <p className="welcome-subtitle">Manage and collaborate on your workspaces.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsJoinModalOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              Join project
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setIsCreateModalOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              New project
            </button>
            <button className="chat-drawer-btn" onClick={() => setIsChatOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Project Chat
            </button>
          </div>
        </div>

        <div className="proj-stats animate-fade-in-up animate-delay-1">
          <div className="proj-stat"><span className="proj-stat-val">{projects.length}</span><span className="proj-stat-lbl">Total projects</span></div>
          <div className="proj-stat"><span className="proj-stat-val">{projects.filter(p => p.status === 'Active').length}</span><span className="proj-stat-lbl">Active</span></div>
          <div className="proj-stat"><span className="proj-stat-val">{projects.filter(p => p.access === 'shared').length}</span><span className="proj-stat-lbl">Shared</span></div>
          <div className="proj-stat"><span className="proj-stat-val">{Array.from(new Set(projects.flatMap(p => p.collaborators))).length}</span><span className="proj-stat-lbl">Collaborators</span></div>
        </div>

        <div className="projects-toolbar animate-fade-in-up animate-delay-1">
          <div className="toolbar-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="search" placeholder="Search projects…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="toolbar-filter" onClick={cycleFilter}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            <span>{filterMode.charAt(0).toUpperCase() + filterMode.slice(1)}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
          <div className="view-toggle">
            <button className={`view-btn ${currentView === 'list' ? 'active' : ''}`} onClick={() => setCurrentView('list')} title="List view">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            </button>
            <button className={`view-btn ${currentView === 'grid' ? 'active' : ''}`} onClick={() => setCurrentView('grid')} title="Grid view">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            </button>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg></div>
            <div className="empty-title">No projects found</div>
            <div className="empty-sub">Try a different search term or create your first project to get started.</div>
            <button className="btn btn-primary btn-sm" onClick={() => setIsCreateModalOpen(true)}>+ New project</button>
          </div>
        ) : (
          <>
            {currentView === 'list' ? (
              <div className="animate-fade-in-up animate-delay-2">
                <div className="project-table-wrap">
                  <table className="project-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Language</th>
                        <th>Status</th>
                        <th>Access</th>
                        <th>Collaborators</th>
                        <th>Updated</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((p) => (
                        <tr key={p.id} onDoubleClick={() => openProject(p.id)}>
                          <td>
                            <div className="project-name-cell">
                              <div className={`proj-icon ${p.color}`}>{p.name.slice(0, 3).toUpperCase()}</div>
                              <div>
                                <div className="proj-name">{p.name}</div>
                                <div className="proj-desc">{p.desc}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="lang-pill"><span className="lang-dot" style={{ background: langColors[p.lang] || '#9ca3af' }}></span>{p.lang}</span></td>
                          <td><span className={`project-badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td>
                          <td><span className={`access-pill ${p.access}`}><AccessIcon type={p.access} /> {p.access.charAt(0).toUpperCase() + p.access.slice(1)}</span></td>
                          <td>
                            <div className="avatar-stack">
                              {p.collaborators.map((a, i) => (
                                <div key={i} className="tiny-avatar" style={{ background: avatarColors[a] || '#6b7280' }}>{a}</div>
                              ))}
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{p.updated}</td>
                          <td>
                            <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                              <button className="row-btn" onClick={(e) => openShareModal(p, e)} title="Share">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                              </button>
                              <button className="row-btn" onClick={(e) => openEditModal(p, e)} title="Edit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </button>
                              <button className="row-btn danger" onClick={(e) => askDelete(p.id, e)} title="Delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in-up animate-delay-2">
                <div className="project-cards-grid">
                  {filteredProjects.map((p) => (
                    <div key={p.id} className={`proj-card ${p.color}`} onClick={() => openProject(p.id)}>
                      <div className="proj-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="row-btn" onClick={(e) => openShareModal(p, e)} title="Share" style={{ width: '28px', height: '28px' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                        </button>
                        <button className="row-btn" onClick={(e) => openEditModal(p, e)} title="Edit" style={{ width: '28px', height: '28px' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button className="row-btn danger" onClick={(e) => askDelete(p.id, e)} title="Delete" style={{ width: '28px', height: '28px' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                        </button>
                      </div>
                      <div className="proj-card-header">
                        <div className={`proj-icon ${p.color}`}>{p.name.slice(0, 3).toUpperCase()}</div>
                        <span className={`project-badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
                      </div>
                      <div className="proj-card-name">{p.name}</div>
                      <div className="proj-card-desc">{p.desc}</div>
                      <div className="proj-card-footer">
                        <span className="lang-pill"><span className="lang-dot" style={{ background: langColors[p.lang] || '#9ca3af' }}></span>{p.lang}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`access-pill ${p.access}`} style={{ fontSize: '.68rem', padding: '2px 8px' }}><AccessIcon type={p.access} /> {p.access.charAt(0).toUpperCase() + p.access.slice(1)}</span>
                          <div className="avatar-stack">
                            {p.collaborators.map((a, i) => (
                              <div key={i} className="tiny-avatar" style={{ background: avatarColors[a] || '#6b7280' }}>{a}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="proj-card" style={{ border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', minHeight: '180px', cursor: 'pointer', background: 'transparent' }} onClick={() => setIsCreateModalOpen(true)}>
                    <div style={{ width: '44px', height: '44px', borderRadius: 'var(--r-lg)', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </div>
                    <span style={{ fontSize: '.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>New project</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* --- CHAT DRAWER --- */}
      <div className={`drawer-overlay ${isChatOpen ? 'active' : ''}`} onClick={() => setIsChatOpen(false)}></div>
      <div className={`project-chat-drawer ${isChatOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title">Project Chat</div>
          <button className="drawer-close" onClick={() => setIsChatOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="drawer-tabs">
          <div className={`drawer-tab ${activeChatTab === 'channels' ? 'active' : ''}`} onClick={() => setActiveChatTab('channels')}>Channels</div>
          <div className={`drawer-tab ${activeChatTab === 'members' ? 'active' : ''}`} onClick={() => setActiveChatTab('members')}>Members</div>
        </div>
        <div className="drawer-content">
          {activeChatTab === 'channels' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 12px 8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Channels</span>
                <button onClick={() => setIsCreatingChannel(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '4px' }} className="hover:bg-gray-100" title="Create Channel">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
              </div>

              {isCreatingChannel && (
                <form onSubmit={handleCreateChannel} style={{ padding: '0 4px 8px 4px', display: 'flex', gap: '6px' }}>
                  <input type="text" autoFocus placeholder="channel-name" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))} style={{ flex: 1, padding: '6px 10px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-primary)', outline: 'none' }} />
                  <button type="submit" style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', padding: '0 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>Add</button>
                  <button type="button" onClick={() => setIsCreatingChannel(false)} style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0 8px', fontSize: '0.8rem', cursor: 'pointer' }}>✕</button>
                </form>
              )}

              {channels.map(chan => (
                <div key={chan.id} className={`chat-channel ${activeChannel === chan.id ? 'active' : ''}`} onClick={() => setActiveChannel(chan.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="chat-channel-icon">#</span> {chan.name}
                  </div>
                  {!chan.isDefault && (
                    <button className="chan-delete-btn" onClick={(e) => deleteChannel(chan.id, e)} title="Delete Channel" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>Online (3)</div>

              <div className="member-item">
                <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa)' }}>
                  J<div className="status-dot status-online"></div>
                </div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>John Doe</div>
              </div>

              <div className="member-item">
                <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #4ade80)' }}>
                  S<div className="status-dot status-online"></div>
                </div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Sarah Lee</div>
              </div>

              <div className="member-item">
                <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)' }}>
                  A<div className="status-dot status-online"></div>
                </div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Alex Rivera</div>
              </div>

              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 8px 4px' }}>Offline (2)</div>

              <div className="member-item" style={{ opacity: 0.7 }}>
                <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                  M<div className="status-dot status-offline"></div>
                </div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Mike Chen</div>
              </div>

              <div className="member-item" style={{ opacity: 0.7 }}>
                <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)' }}>
                  R<div className="status-dot status-offline"></div>
                </div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Rachel Adams</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectPage;