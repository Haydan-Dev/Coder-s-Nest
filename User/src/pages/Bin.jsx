import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';

// --- DATA CONSTANTS ---
const langColors = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3776ab',
  Go: '#00add8', Rust: '#ce422b', 'React Native': '#61dafb',
  React: '#61dafb', Other: '#9ca3af'
};

const avatarColors = { J: '#2563eb', S: '#10b981', A: '#8b5cf6', R: '#ec4899', M: '#f59e0b' };

const BinPage = () => {
  // --- STATES ---
  const [projects, setProjects] = useState([]);
  const [currentView, setCurrentView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // --- LOGIC ---
  useEffect(() => {
    fetchBinProjects();
  }, []);

  const fetchBinProjects = async () => {
    try {
      const res = await api.get('/projects/bin/');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch bin projects', err);
    }
  };

  const filteredProjects = projects.filter((p) => {
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const askDelete = (id, e) => {
    e.stopPropagation();
    setPendingDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmHardDelete = async () => {
    if (pendingDeleteId !== null) {
      try {
        await api.delete(`/projects/${pendingDeleteId}/hard`);
        setProjects((prev) => prev.filter((p) => p.id !== pendingDeleteId));
      } catch (err) {
        console.error('Failed to hard delete project', err);
      } finally {
        setPendingDeleteId(null);
        setIsDeleteModalOpen(false);
      }
    }
  };

  const restoreProject = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/projects/${id}/restore`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to restore project', err);
    }
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
        /* --- BASE RESET & VARS --- */
        * { box-sizing: border-box; }
        :root {
          --bg-main: #f8fafc;
          --bg-card: #ffffff;
          --bg-sidebar: #ffffff;
          --bg-hover: #f1f5f9;
          --text-primary: #0f172a;
          --text-secondary: #334155;
          --text-muted: #64748b;
          --border: #e2e8f0;
          --border-hover: #cbd5e1;
          --accent: #2563eb;
          --accent-hover: #1d4ed8;
          --danger: #ef4444;
          --success: #22c55e;
          --r-md: 8px;
          --r-lg: 12px;
          --r-xl: 16px;
          --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
          --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
        }

        .dashboard-container { min-height: 100vh; background: var(--bg-main); font-family: 'Inter', -apple-system, sans-serif; display: flex; flex-direction: column; }
        .dashboard-content { padding: 32px 40px; max-width: 1400px; margin: 0 auto; width: 100%; }
        .dashboard-welcome { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; gap: 20px; flex-wrap: wrap; }
        .welcome-title { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.02em; }
        .welcome-subtitle { font-size: 0.95rem; color: var(--text-muted); }
        
        .projects-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .toolbar-search { flex: 1; min-width: 250px; position: relative; display: flex; align-items: center; }
        .toolbar-search svg { position: absolute; left: 14px; width: 18px; height: 18px; color: var(--text-muted); }
        .toolbar-search input { width: 100%; background: var(--bg-card); border: 1.5px solid var(--border); border-radius: var(--r-lg); padding: 10px 14px 10px 40px; font-size: 0.9rem; color: var(--text-primary); transition: all 0.2s; }
        .toolbar-search input:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        
        .view-toggle { display: flex; background: var(--bg-card); border: 1.5px solid var(--border); border-radius: var(--r-lg); padding: 4px; gap: 4px; }
        .view-btn { padding: 6px; border: none; background: transparent; border-radius: var(--r-md); cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .view-btn svg { width: 18px; height: 18px; }
        .view-btn:hover { color: var(--text-primary); }
        .view-btn.active { background: var(--bg-hover); color: var(--text-primary); box-shadow: var(--shadow-sm); }
        
        /* Grid View */
        .project-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .proj-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 24px; position: relative; cursor: default; transition: all 0.2s; display: flex; flex-direction: column; overflow: hidden; opacity: 0.8; }
        .proj-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--border-hover); opacity: 1; }
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
        .proj-icon { width: 48px; height: 48px; border-radius: var(--r-lg); display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 800; color: #fff; flex-shrink: 0; filter: grayscale(100%); }
        .proj-card:hover .proj-icon { filter: grayscale(0%); }
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
        .project-table-wrap { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-xl); overflow: hidden; opacity: 0.9; }
        .project-table { width: 100%; border-collapse: collapse; text-align: left; }
        .project-table th { padding: 16px 20px; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); background: var(--bg-hover); }
        .project-table td { padding: 16px 20px; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .project-table tr:last-child td { border-bottom: none; }
        .project-table tbody tr { transition: background 0.15s; }
        .project-table tbody tr:hover { background: var(--bg-hover); }
        .project-name-cell { display: flex; align-items: center; gap: 16px; }
        .project-name-cell .proj-icon { width: 40px; height: 40px; font-size: 0.85rem; filter: grayscale(100%); }
        .project-table tbody tr:hover .proj-icon { filter: grayscale(0%); }
        .proj-name { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; text-decoration: line-through; color: var(--text-muted); }
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
        .avatar-stack { display: flex; align-items: center; filter: grayscale(100%); opacity: 0.6; }
        .tiny-avatar { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: #fff; border: 2px solid var(--bg-card); margin-left: -8px; }
        .tiny-avatar:first-child { margin-left: 0; }
        .row-actions { display: flex; align-items: center; gap: 6px; opacity: 0; transition: opacity 0.2s; }
        tr:hover .row-actions { opacity: 1; }
        .row-btn { width: 32px; height: 32px; border-radius: var(--r-md); border: none; background: var(--bg-card); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); }
        .row-btn:hover { background: var(--bg-hover); color: var(--text-primary); transform: translateY(-1px); }
        .row-btn.success { color: var(--success); }
        .row-btn.success:hover { background: rgba(34,197,94,0.1); }
        .row-btn.danger:hover { background: rgba(239,68,68,0.1); color: var(--danger); }
        
        /* Modals & Empty State */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 100; display: none; align-items: center; justify-content: center; }
        .modal-overlay.active { display: flex; animation: fadeIn 0.2s; }
        .modal { background: var(--bg-card); width: 90%; max-width: 500px; border-radius: var(--r-xl); padding: 32px; box-shadow: var(--shadow-lg); border: 1px solid var(--border); animation: dropIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .modal-title { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
        .modal-sub { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 24px; }
        .modal-actions { display: flex; gap: 12px; margin-top: 24px; }
        .btn { padding: 10px 20px; border-radius: var(--r-md); font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: 1.5px solid transparent; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-primary { background: var(--accent); color: white; border-color: var(--accent); box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
        .btn-secondary { background: var(--bg-card); color: var(--text-primary); border-color: var(--border); }
        
        .empty-state { text-align: center; padding: 64px 20px; background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--r-xl); margin-top: 32px; }
        .empty-icon { width: 64px; height: 64px; background: var(--bg-hover); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: var(--text-muted); }
        .empty-icon svg { width: 32px; height: 32px; }
        .empty-title { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
        .empty-sub { font-size: 0.95rem; color: var(--text-muted); max-width: 400px; margin: 0 auto 24px; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      {/* --- MODALS --- */}
      {isDeleteModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', borderRadius: 'var(--r-xl)', background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', marginBottom: '16px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
            </div>
            <div className="modal-title">Permanently delete?</div>
            <div className="modal-sub">This will <strong>permanently destroy</strong> this project and all its files. This action absolutely cannot be undone.</div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={confirmHardDelete}>Destroy</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN DASHBOARD --- */}
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to="/projects" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                </Link>
                <h1 className="welcome-title">Recycle Bin</h1>
              </div>
              <p className="welcome-subtitle">Deleted projects stay here safely until you choose to permanently destroy them.</p>
            </div>
          </div>

          <div className="projects-toolbar">
            <div className="toolbar-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input type="text" placeholder="Search deleted projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
              <div className="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg></div>
              <div className="empty-title">Bin is empty</div>
              <div className="empty-sub">No deleted projects found.</div>
            </div>
          ) : (
            <>
              {currentView === 'list' ? (
                <div className="project-table-wrap">
                  <table className="project-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Language</th>
                        <th>Status</th>
                        <th>Access</th>
                        <th>Collaborators</th>
                        <th>Deleted</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((p) => (
                        <tr key={p.id}>
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
                              <button className="row-btn success" onClick={(e) => restoreProject(p.id, e)} title="Restore">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                              </button>
                              <button className="row-btn danger" onClick={(e) => askDelete(p.id, e)} title="Permanently Delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="project-cards-grid">
                  {filteredProjects.map((p) => (
                    <div key={p.id} className={`proj-card ${p.color}`}>
                      <div className="proj-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="row-btn success" onClick={(e) => restoreProject(p.id, e)} title="Restore" style={{ width: '28px', height: '28px' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                        </button>
                        <button className="row-btn danger" onClick={(e) => askDelete(p.id, e)} title="Permanently Delete" style={{ width: '28px', height: '28px' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                        </button>
                      </div>
                      <div className="proj-card-header">
                        <div className={`proj-icon ${p.color}`}>{p.name.slice(0, 3).toUpperCase()}</div>
                        <span className={`project-badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
                      </div>
                      <div className="proj-card-name" style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{p.name}</div>
                      <div className="proj-card-desc">{p.desc}</div>
                      <div className="proj-card-footer">
                        <span className="lang-pill"><span className="lang-dot" style={{ background: langColors[p.lang] || '#9ca3af' }}></span>{p.lang}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{p.updated}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BinPage;