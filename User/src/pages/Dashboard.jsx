import React, { useState, useEffect } from 'react';

const DashboardMain = () => {
  // --- 1. Theme Initialization (Without Toggle Button) ---
  useEffect(() => {
    const storedTheme = localStorage.getItem('cn-theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.body.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  // --- 2. Functional States ---
  const [activeModal, setActiveModal] = useState('none'); // 'none' | 'create' | 'join'
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  // --- 3. Handlers ---
  const handleModalBackdrop = (e) => {
    if (e.target === e.currentTarget) setActiveModal('none');
  };

  const handleAIPrompt = () => {
    if (!aiInput.trim()) return;
    setIsAiThinking(true);
    setTimeout(() => {
      setIsAiThinking(false);
      setAiInput('');
    }, 1600);
  };

  const handleInviteChange = (e) => {
    setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ''));
  };

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-page)' }}>
      {/* --- Component Scoped CSS --- */}
      <style>{`
        /* Core Dashboard Layout */
        .dashboard-content { padding: 32px 40px; max-width: 1400px; margin: 0 auto; }
        .dashboard-welcome { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; gap: 20px; flex-wrap: wrap; }
        .welcome-title { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.02em; }
        .welcome-subtitle { font-size: 0.95rem; color: var(--text-muted); }
        
        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 20px; transition: transform 0.15s, box-shadow 0.15s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
        .stat-card-label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-card-value { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; letter-spacing: -0.03em; }
        .stat-card-change { display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: var(--r-full); }
        .stat-card-change.up { background: rgba(16,185,129,0.12); color: var(--success); }
        .stat-card-change svg { width: 12px; height: 12px; }

        /* Section Headings */
        .section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .section-heading-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px; }
        .section-heading-title svg { width: 18px; height: 18px; color: var(--accent); }
        .section-heading-action { font-size: 0.82rem; font-weight: 600; color: var(--accent); cursor: pointer; transition: opacity 0.15s; }
        .section-heading-action:hover { opacity: 0.75; text-decoration: underline; }

        /* Projects Grid */
        .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .project-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 20px; cursor: pointer; transition: all 0.18s; position: relative; overflow: hidden; }
        .project-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .project-card.blue::before { background: #2563eb; } .project-card.purple::before { background: #8b5cf6; } .project-card.green::before { background: #10b981; } .project-card.orange::before { background: #f59e0b; } .project-card.pink::before { background: #ec4899; }
        .project-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: rgba(37,99,235,0.2); }
        .project-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
        .project-card-icon { width: 40px; height: 40px; border-radius: var(--r-md); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; flex-shrink: 0; }
        .project-card-icon.blue { background: rgba(37,99,235,0.12); color: #2563eb; } .project-card-icon.purple { background: rgba(139,92,246,0.12); color: #8b5cf6; } .project-card-icon.green { background: rgba(16,185,129,0.12); color: #10b981; } .project-card-icon.orange { background: rgba(245,158,11,0.12); color: #f59e0b; } .project-card-icon.pink { background: rgba(236,72,153,0.12); color: #ec4899; }
        .project-badge { font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-active { background: rgba(16,185,129,0.12); color: var(--success); } .badge-review { background: rgba(139,92,246,0.12); color: #8b5cf6; } .badge-draft { background: var(--bg-hover); color: var(--text-muted); }
        .project-card-name { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 5px; }
        .project-card-desc { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.55; margin-bottom: 14px; }
        .project-card-footer { display: flex; align-items: center; justify-content: space-between; }
        .project-card-lang { display: flex; align-items: center; gap: 5px; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
        .lang-dot { width: 8px; height: 8px; border-radius: 50%; }
        .project-card-avatars { display: flex; }
        .mini-avatar { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--bg-card); margin-left: -6px; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 700; color: #fff; }
        .mini-avatar:first-child { margin-left: 0; }

        /* Workspace Grid */
        .workspace-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .workspace-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 20px; transition: all 0.18s; cursor: pointer; }
        .workspace-card:hover { box-shadow: var(--shadow-sm); border-color: rgba(37,99,235,0.2); transform: translateY(-2px); }
        .workspace-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .workspace-icon { width: 44px; height: 44px; border-radius: var(--r-md); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .workspace-name { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
        .workspace-members { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }
        .workspace-status-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .ws-status { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 600; }
        .ws-status-dot { width: 7px; height: 7px; border-radius: 50%; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .ws-status.active .ws-status-dot { background: var(--success); } .ws-status.active { color: var(--success); }
        .ws-status.idle .ws-status-dot { background: #f59e0b; } .ws-status.idle { color: #f59e0b; }
        .ws-status.offline .ws-status-dot { background: var(--text-muted); animation: none; } .ws-status.offline { color: var(--text-muted); }
        .ws-last-active { font-size: 0.75rem; color: var(--text-muted); }
        .ws-progress-bar { height: 4px; border-radius: 2px; background: var(--border); margin-bottom: 10px; overflow: hidden; }
        .ws-progress-fill { height: 100%; border-radius: 2px; background: var(--accent); }
        .ws-footer { display: flex; align-items: center; justify-content: space-between; }
        .ws-tag { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: var(--r-full); font-size: 0.72rem; font-weight: 600; background: var(--bg-hover); color: var(--text-muted); }
        .btn-ws { padding: 6px 14px; font-size: 0.78rem; border-radius: var(--r-md); font-weight: 600; cursor: pointer; border: 1.5px solid var(--border); background: var(--bg-hover); color: var(--text-primary); transition: all 0.15s; }
        .btn-ws:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
        .btn-ws.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
        .btn-ws.primary:hover { background: var(--accent-hover); }

        /* CTA Workspaces */
        .cta-workspace-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
        .cta-workspace-card { background: var(--bg-card); border: 2px dashed var(--border); border-radius: var(--r-lg); padding: 28px 24px; text-align: center; cursor: pointer; transition: all 0.2s; }
        .cta-workspace-card:hover { border-color: var(--accent); background: var(--accent-light); transform: translateY(-2px); }
        .cta-ws-icon { width: 52px; height: 52px; border-radius: var(--r-xl); background: var(--bg-hover); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; color: var(--text-secondary); transition: all 0.2s; }
        .cta-workspace-card:hover .cta-ws-icon { background: rgba(37,99,235,0.15); color: var(--accent); }
        .cta-ws-icon svg { width: 24px; height: 24px; }
        .cta-ws-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
        .cta-ws-desc { font-size: 0.8rem; color: var(--text-muted); line-height: 1.6; }

        /* AI Prompt Bar */
        .ai-prompt-bar { background: var(--bg-card); border: 1.5px solid var(--border); border-radius: var(--r-lg); padding: 14px 18px; display: flex; align-items: center; gap: 12px; margin-bottom: 32px; transition: all 0.18s; }
        .ai-prompt-bar:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }
        .ai-prompt-icon { width: 32px; height: 32px; border-radius: var(--r-md); background: linear-gradient(135deg, #2563eb, #8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
        .ai-prompt-icon svg { width: 16px; height: 16px; }
        .ai-prompt-input { flex: 1; border: none; background: transparent; outline: none; font-size: 0.9rem; color: var(--text-primary); }
        .ai-prompt-btn { padding: 7px 16px; border-radius: var(--r-md); background: var(--accent); color: #fff; font-size: 0.8rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
        .ai-prompt-btn:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
        .ai-prompt-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Modals */
        .logout-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 300; align-items: center; justify-content: center; }
        .logout-overlay.active { display: flex; }
        .logout-modal { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 32px; max-width: 360px; width: 90%; box-shadow: var(--shadow-lg); animation: dropIn 0.2s ease; }
        .logout-modal-icon { width: 54px; height: 54px; border-radius: var(--r-xl); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .logout-modal-title { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
        .logout-modal-actions { display: flex; gap: 10px; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) { .cta-workspace-grid, .projects-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .workspace-grid { grid-template-columns: 1fr; } .dashboard-content { padding: 24px 16px; } }
      `}</style>

      {/* --- Modals --- */}
      {/* Create Workspace Modal */}
      <div className={`logout-overlay ${activeModal === 'create' ? 'active' : ''}`} onClick={(e) => handleModalBackdrop(e)}>
        <div className="logout-modal" style={{ maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div className="logout-modal-icon" style={{ background: 'var(--accent-light)', borderColor: 'rgba(37,99,235,0.2)', color: 'var(--accent)', marginBottom: 0, border: '1.5px solid' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '26px', height: '26px'}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <div>
              <div className="logout-modal-title" style={{ marginBottom: '2px' }}>Create Workspace</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Set up a shared environment for your team</div>
            </div>
          </div>
          <div className="auth-form-fields" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="ws-name">Workspace name</label>
              <input id="ws-name" type="text" className="form-input" placeholder="e.g. Frontend Squad" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ws-desc">Description <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
              <input id="ws-desc" type="text" className="form-input" placeholder="What will your team be building?" />
            </div>
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '1.5px solid var(--accent)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-light)' }}>
                  <input type="radio" name="ws-vis" value="private" defaultChecked style={{ accentColor: 'var(--accent)' }}/> Private
                </label>
                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <input type="radio" name="ws-vis" value="public" style={{ accentColor: 'var(--accent)' }}/> Public
                </label>
              </div>
            </div>
          </div>
          <div className="logout-modal-actions" style={{ marginTop: '20px' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal('none')}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setActiveModal('none')}>Create workspace</button>
          </div>
        </div>
      </div>

      {/* Join Workspace Modal */}
      <div className={`logout-overlay ${activeModal === 'join' ? 'active' : ''}`} onClick={(e) => handleModalBackdrop(e)}>
        <div className="logout-modal" style={{ maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div className="logout-modal-icon" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)', color: 'var(--success)', marginBottom: 0, border: '1.5px solid' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '26px', height: '26px'}}>
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <div>
              <div className="logout-modal-title" style={{ marginBottom: '2px' }}>Join Workspace</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enter your invite code to join a team</div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="invite-code">Invite code</label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <span className="input-icon" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input 
                id="invite-code" type="text" className="form-input" 
                placeholder="e.g. NEST-ABCD-1234" 
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', paddingLeft: '40px' }}
                value={inviteCode}
                onChange={handleInviteChange}
              />
            </div>
          </div>
          <div className="logout-modal-actions" style={{ marginTop: '20px' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal('none')}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1, background: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => setActiveModal('none')}>Join workspace</button>
          </div>
        </div>
      </div>

      {/* ========== DASHBOARD CONTENT ========== */}
      <main className="dashboard-content">

        {/* Welcome row */}
        <div className="dashboard-welcome animate-fade-in-up">
          <div>
            <h1 className="welcome-title">Good morning, John 👋</h1>
            <p className="welcome-subtitle">Here's what's happening across your workspaces today.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveModal('join')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '16px', marginRight: '6px'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Join workspace
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveModal('create')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width: '16px', marginRight: '6px'}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Project
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid animate-fade-in-up animate-delay-1">
          <div className="stat-card">
            <div className="stat-card-label">Total Projects</div>
            <div className="stat-card-value">24</div>
            <div className="stat-card-change up">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
              +3 this month
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Active Workspaces</div>
            <div className="stat-card-value">4</div>
            <div className="stat-card-change up">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
              2 online now
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Team Members</div>
            <div className="stat-card-value">8</div>
            <div className="stat-card-change up">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
              +2 this week
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">AI Assists</div>
            <div className="stat-card-value">1.2k</div>
            <div className="stat-card-change up">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
              +240 today
            </div>
          </div>
        </div>

        {/* AI Quick prompt */}
        <div className="ai-prompt-bar animate-fade-in-up animate-delay-2">
          <div className="ai-prompt-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
          </div>
          <input 
            className="ai-prompt-input" 
            placeholder="Ask AI anything — 'Review my latest commit', 'Debug this error', 'Generate tests for…'" 
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAIPrompt()}
          />
          <button className="ai-prompt-btn" onClick={handleAIPrompt} disabled={isAiThinking}>
            {isAiThinking ? (
              <><svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '14px'}}><circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> Thinking…</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width: '14px'}}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Ask AI</>
            )}
          </button>
        </div>

        {/* Recent Projects */}
        <div className="animate-fade-in-up animate-delay-2">
          <div className="section-heading">
            <span className="section-heading-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Recent Projects
            </span>
            <span className="section-heading-action">View all projects →</span>
          </div>

          <div className="projects-grid">
            <div className="project-card blue">
              <div className="project-card-header">
                <div className="project-card-icon blue">API</div>
                <span className="project-badge badge-active">Active</span>
              </div>
              <div className="project-card-name">nest-api-gateway</div>
              <div className="project-card-desc">RESTful API gateway with rate limiting, auth middleware, and real-time WebSocket support.</div>
              <div className="project-card-footer">
                <div className="project-card-lang"><span className="lang-dot" style={{ background: '#3178c6' }}></span> TypeScript</div>
                <div className="project-card-avatars">
                  <div className="mini-avatar" style={{ background: '#2563eb' }}>J</div>
                  <div className="mini-avatar" style={{ background: '#10b981' }}>S</div>
                  <div className="mini-avatar" style={{ background: '#f59e0b' }}>A</div>
                </div>
              </div>
            </div>

            <div className="project-card purple">
              <div className="project-card-header">
                <div className="project-card-icon purple">UI</div>
                <span className="project-badge badge-review">Review</span>
              </div>
              <div className="project-card-name">dashboard-ui</div>
              <div className="project-card-desc">Modern analytics dashboard with Recharts, real-time updates, and dark mode support.</div>
              <div className="project-card-footer">
                <div className="project-card-lang"><span className="lang-dot" style={{ background: '#61dafb' }}></span> React</div>
                <div className="project-card-avatars">
                  <div className="mini-avatar" style={{ background: '#8b5cf6' }}>R</div>
                  <div className="mini-avatar" style={{ background: '#ec4899' }}>M</div>
                </div>
              </div>
            </div>

            <div className="project-card green">
              <div className="project-card-header">
                <div className="project-card-icon green">ML</div>
                <span className="project-badge badge-active">Active</span>
              </div>
              <div className="project-card-name">ml-model-server</div>
              <div className="project-card-desc">Inference server for custom NLP models with FastAPI, ONNX runtime, and GPU acceleration.</div>
              <div className="project-card-footer">
                <div className="project-card-lang"><span className="lang-dot" style={{ background: '#3776ab' }}></span> Python</div>
                <div className="project-card-avatars">
                  <div className="mini-avatar" style={{ background: '#10b981' }}>A</div>
                </div>
              </div>
            </div>

            <div className="project-card orange">
              <div className="project-card-header">
                <div className="project-card-icon orange">APP</div>
                <span className="project-badge badge-draft">Draft</span>
              </div>
              <div className="project-card-name">mobile-app-v2</div>
              <div className="project-card-desc">Cross-platform mobile app with React Native, offline sync, and biometric authentication.</div>
              <div className="project-card-footer">
                <div className="project-card-lang"><span className="lang-dot" style={{ background: '#61dafb' }}></span> React Native</div>
                <div className="project-card-avatars">
                  <div className="mini-avatar" style={{ background: '#f59e0b' }}>M</div>
                  <div className="mini-avatar" style={{ background: '#2563eb' }}>J</div>
                </div>
              </div>
            </div>

            <div className="project-card pink">
              <div className="project-card-header">
                <div className="project-card-icon pink">DB</div>
                <span className="project-badge badge-active">Active</span>
              </div>
              <div className="project-card-name">data-pipeline</div>
              <div className="project-card-desc">ETL pipeline with Apache Kafka, real-time stream processing, and PostgreSQL sink.</div>
              <div className="project-card-footer">
                <div className="project-card-lang"><span className="lang-dot" style={{ background: '#e34c26' }}></span> Go</div>
                <div className="project-card-avatars">
                  <div className="mini-avatar" style={{ background: '#ec4899' }}>R</div>
                  <div className="mini-avatar" style={{ background: '#8b5cf6' }}>S</div>
                  <div className="mini-avatar" style={{ background: '#2563eb' }}>J</div>
                </div>
              </div>
            </div>

            {/* New project card */}
            <div 
              className="project-card" 
              style={{ border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', minHeight: '160px', cursor: 'pointer' }} 
              onClick={() => setActiveModal('create')}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--r-lg)', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>New project</span>
            </div>
          </div>
        </div>

        {/* Active Workspaces */}
        <div className="animate-fade-in-up animate-delay-3">
          <div className="section-heading">
            <span className="section-heading-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Active Workspaces
            </span>
            <span className="section-heading-action">Manage all →</span>
          </div>

          <div className="workspace-grid">
            <div className="workspace-card">
              <div className="workspace-card-header">
                <div className="workspace-icon" style={{ background: 'rgba(37,99,235,0.12)', fontSize: '1.4rem' }}>🚀</div>
                <div>
                  <div className="workspace-name">Frontend Squad</div>
                  <div className="workspace-members">5 members · Pro plan</div>
                </div>
              </div>
              <div className="workspace-status-row">
                <div className="ws-status active"><div className="ws-status-dot"></div>Live now</div>
                <div className="ws-last-active">3 active sessions</div>
              </div>
              <div className="ws-progress-bar"><div className="ws-progress-fill" style={{ width: '72%' }}></div></div>
              <div className="ws-footer">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="ws-tag">React</span>
                  <span className="ws-tag">TypeScript</span>
                </div>
                <button className="btn-ws primary">Open →</button>
              </div>
            </div>

            <div className="workspace-card">
              <div className="workspace-card-header">
                <div className="workspace-icon" style={{ background: 'rgba(139,92,246,0.12)', fontSize: '1.4rem' }}>🤖</div>
                <div>
                  <div className="workspace-name">AI Research</div>
                  <div className="workspace-members">3 members · Pro plan</div>
                </div>
              </div>
              <div className="workspace-status-row">
                <div className="ws-status active"><div className="ws-status-dot"></div>Live now</div>
                <div className="ws-last-active">1 active session</div>
              </div>
              <div className="ws-progress-bar"><div className="ws-progress-fill" style={{ width: '45%', background: '#8b5cf6' }}></div></div>
              <div className="ws-footer">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="ws-tag">Python</span>
                  <span className="ws-tag">LLM</span>
                </div>
                <button className="btn-ws primary">Open →</button>
              </div>
            </div>

            <div className="workspace-card">
              <div className="workspace-card-header">
                <div className="workspace-icon" style={{ background: 'rgba(245,158,11,0.12)', fontSize: '1.4rem' }}>⚡</div>
                <div>
                  <div className="workspace-name">Backend Warriors</div>
                  <div className="workspace-members">6 members · Team plan</div>
                </div>
              </div>
              <div className="workspace-status-row">
                <div className="ws-status idle"><div className="ws-status-dot"></div>Idle</div>
                <div className="ws-last-active">Last active 2h ago</div>
              </div>
              <div className="ws-progress-bar"><div className="ws-progress-fill" style={{ width: '88%', background: '#f59e0b' }}></div></div>
              <div className="ws-footer">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="ws-tag">Go</span>
                  <span className="ws-tag">PostgreSQL</span>
                </div>
                <button className="btn-ws">Resume</button>
              </div>
            </div>

            <div className="workspace-card">
              <div className="workspace-card-header">
                <div className="workspace-icon" style={{ background: 'rgba(107,114,128,0.1)', fontSize: '1.4rem' }}>📱</div>
                <div>
                  <div className="workspace-name">Mobile Team</div>
                  <div className="workspace-members">4 members · Free plan</div>
                </div>
              </div>
              <div className="workspace-status-row">
                <div className="ws-status offline"><div className="ws-status-dot"></div>Offline</div>
                <div className="ws-last-active">Last active 3d ago</div>
              </div>
              <div className="ws-progress-bar"><div className="ws-progress-fill" style={{ width: '30%', background: 'var(--text-muted)' }}></div></div>
              <div className="ws-footer">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="ws-tag">React Native</span>
                </div>
                <button className="btn-ws">Wake up</button>
              </div>
            </div>
          </div>
        </div>

        {/* Create / Join Workspace CTAs */}
        <div className="animate-fade-in-up animate-delay-4">
          <div className="section-heading">
            <span className="section-heading-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Workspaces
            </span>
          </div>

          <div className="cta-workspace-grid">
            <div className="cta-workspace-card" onClick={() => setActiveModal('create')}>
              <div className="cta-ws-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <div className="cta-ws-title">Create Workspace</div>
              <div className="cta-ws-desc">Start a new shared environment for your team. Invite members, set roles, and deploy together.</div>
            </div>

            <div className="cta-workspace-card" onClick={() => setActiveModal('join')}>
              <div className="cta-ws-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              </div>
              <div className="cta-ws-title">Join Workspace</div>
              <div className="cta-ws-desc">Have an invite code? Enter it below to join an existing team workspace instantly.</div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default DashboardMain;