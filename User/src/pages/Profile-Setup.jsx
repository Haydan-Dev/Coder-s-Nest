import React, { useState, useEffect, useRef } from 'react';

const ProfileSetup = () => {
  // --- 1. Theme State ---
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('cn-theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(storedTheme);
    document.body.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('cn-theme', newTheme);
  };

  // --- 2. Profile States ---
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | available | taken
  
  const [role, setRole] = useState('developer'); // 'developer' | 'student'
  
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [bio, setBio] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [usernameError, setUsernameError] = useState(false);

  // Constants
  const TAKEN_NAMES = ['admin', 'root', 'john', 'sarah', 'codersnest', 'support'];
  const ALL_SKILLS = [
    'TypeScript', 'JavaScript', 'Python', 'React', 'Node.js', 
    'Go', 'Rust', 'Docker', 'PostgreSQL', 'GraphQL', 'Machine Learning', 'UI/UX'
  ];

  // --- 3. Handlers & Effects ---
  
  // Avatar Handlers
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const removePhoto = () => {
    setAvatarPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Initials Generator
  const getInitials = (name) => {
    if (!name.trim()) return 'JD';
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (parts[0]?.[0] || '?').toUpperCase();
  };

  // Username Logic (Debounced Validation)
  const handleUsernameChange = (e) => {
    // Format on the fly: lowercase, only alphanumeric & underscore
    const val = e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase();
    setUsername(val);
    setUsernameError(false);
  };

  useEffect(() => {
    if (!username) {
      setUsernameStatus('idle');
      return;
    }
    
    setUsernameStatus('checking');
    const timer = setTimeout(() => {
      if (TAKEN_NAMES.includes(username)) {
        setUsernameStatus('taken');
      } else {
        setUsernameStatus('available');
      }
    }, 700);
    
    return () => clearTimeout(timer);
  }, [username]);

  // Skills Handler
  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  // Save/Skip Flow
  const saveProfile = () => {
    if (!username.trim()) {
      setUsernameError(true);
      setTimeout(() => setUsernameError(false), 1500);
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setShowToast(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1600);
    }, 1000);
  };

  const skipSetup = () => {
    window.location.href = '/dashboard';
  };

  return (
    <>
      {/* Component Scoped CSS */}
      <style>{`
        .auth-page { height: 100vh; display: flex; overflow: hidden; }
        .auth-panel { width: 380px; flex-shrink: 0; background: var(--bg-panel); display: flex; flex-direction: column; padding: 36px 40px; position: relative; overflow: hidden; }
        .auth-panel::before { content: ''; position: absolute; width: 360px; height: 360px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,.25) 0%, transparent 70%); top: -80px; left: -80px; pointer-events: none; }
        .auth-panel::after { content: ''; position: absolute; width: 280px; height: 280px; border-radius: 50%; background: radial-gradient(circle, rgba(139,92,246,.2) 0%, transparent 70%); bottom: 40px; right: -60px; pointer-events: none; }
        .panel-logo { display:flex; align-items:center; gap:10px; margin-bottom:auto; }
        .panel-logo-icon { width:36px; height:36px; border-radius:9px; background:var(--accent); display:flex; align-items:center; justify-content:center; }
        .panel-logo-icon svg { width:18px; height:18px; color:#fff; }
        .panel-logo-name { font-size:1.1rem; font-weight:800; color:#fff; }
        .panel-body { margin-bottom:auto; padding-top: 40px; }
        .panel-title { font-size:1.9rem; font-weight:800; color:#fff; line-height:1.2; margin-bottom:14px; }
        .panel-title span { color:var(--accent); }
        .panel-desc { font-size:.9rem; color:rgba(255,255,255,.55); line-height:1.7; margin-bottom:32px; }
        .panel-steps { display:flex; flex-direction:column; gap:12px; }
        .panel-step { display:flex; align-items:flex-start; gap:12px; }
        .step-num { width:28px; height:28px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:.7rem; font-weight:800; }
        .step-num.done { background:var(--success); color:#fff; }
        .step-num.done::after { content:'✓'; }
        .step-num.active { background:var(--accent); color:#fff; }
        .step-num.pending { background:rgba(255,255,255,.08); color:rgba(255,255,255,.4); border:1.5px solid rgba(255,255,255,.12); }
        .step-info { padding-top:3px; }
        .step-label { font-size:.84rem; font-weight:700; }
        .step-label.done { color:rgba(255,255,255,.4); text-decoration:line-through; }
        .step-label.active { color:#fff; }
        .step-label.pending { color:rgba(255,255,255,.3); }
        .step-sub { font-size:.75rem; color:rgba(255,255,255,.3); margin-top:2px; }
        .step-sub.active { color:rgba(255,255,255,.5); }
        .panel-footer { font-size:.75rem; color:rgba(255,255,255,.3); margin-top:40px; display:flex; align-items:center; gap:6px; }
        .panel-footer svg { width:13px; height:13px; }
        .auth-form-side { flex: 1; display: flex; flex-direction: column; background: var(--bg-page); }
        .auth-form-topbar { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 16px 32px; border-bottom: 1px solid var(--border); }
        .auth-form-topbar span { font-size:.84rem; color:var(--text-muted); }
        .auth-form-topbar a { font-size:.84rem; font-weight:700; color:var(--accent); text-decoration:none; }
        .auth-form-body { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding: 40px 32px; overflow-y: auto; }
        .auth-card { width: 100%; max-width: 480px; margin-top: auto; margin-bottom: auto; }
        .auth-card-title { font-size:1.6rem; font-weight:800; color:var(--text-primary); margin-bottom:6px; }
        .auth-card-sub { font-size:.875rem; color:var(--text-muted); margin-bottom:32px; line-height:1.6; }
        .progress-bar-wrap { height: 4px; background: var(--border); border-radius: 99px; overflow: hidden; margin-bottom: 28px; }
        .progress-bar-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--accent), #8b5cf6); transition: width .4s ease; }
        .progress-label { display: flex; justify-content: space-between; font-size: .75rem; color: var(--text-muted); margin-bottom: 8px; }
        .avatar-upload-row { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; padding: 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-xl); }
        .avatar-preview-wrap { position: relative; flex-shrink: 0; }
        .avatar-preview { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 800; color: #fff; overflow: hidden; border: 3px solid var(--border); transition: border-color .15s; }
        .avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-preview-wrap:hover .avatar-preview { border-color: var(--accent); }
        .avatar-upload-badge { position: absolute; bottom: 0; right: 0; width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #fff; border: 2px solid var(--bg-card); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; }
        .avatar-upload-badge:hover { background: var(--accent-hover); }
        .avatar-upload-badge svg { width: 12px; height: 12px; }
        .avatar-upload-info { flex: 1; }
        .avatar-upload-title { font-size: .9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
        .avatar-upload-sub { font-size: .78rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 10px; }
        .avatar-upload-btns { display: flex; gap: 8px; }
        .avatar-btn { padding: 6px 14px; border-radius: var(--r-md); font-size: .78rem; font-weight: 700; cursor: pointer; border: 1.5px solid var(--border); background: var(--bg-hover); color: var(--text-secondary); transition: all .15s; }
        .avatar-btn:hover { border-color: var(--accent); color: var(--accent); }
        .avatar-btn.primary { background: var(--accent-light); color: var(--accent); border-color: rgba(37,99,235,.2); }
        .avatar-btn.primary:hover { background: rgba(37,99,235,.15); }
        .avatar-btn.danger { color: var(--danger); border-color: rgba(239,68,68,.2); background: transparent; }
        .avatar-btn.danger:hover { background: rgba(239,68,68,.07); border-color: var(--danger); }
        .username-prefix { display: flex; align-items: center; background: var(--bg-card); border: 1.5px solid var(--border-input); border-radius: var(--r-md); overflow: hidden; transition: border-color .15s; }
        .username-prefix:focus-within { border-color: var(--accent); }
        .username-prefix.error { border-color: var(--danger); }
        .username-at { padding: 0 12px; font-size: .9rem; font-weight: 700; color: var(--text-muted); background: var(--bg-hover); border-right: 1.5px solid var(--border-input); height: 44px; display: flex; align-items: center; font-family: var(--font-mono); flex-shrink: 0; }
        .username-input { flex: 1; border: none; outline: none; background: transparent; color: var(--text-primary); padding: 0 14px; height: 44px; font-size: .9rem; font-family: var(--font-mono); font-weight: 600; }
        .username-status { display: flex; align-items: center; gap: 5px; font-size: .75rem; margin-top: 6px; }
        .username-status svg { width: 13px; height: 13px; }
        .username-status.available { color: var(--success); }
        .username-status.taken { color: var(--danger); }
        .username-status.checking { color: var(--text-muted); }
        .role-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .role-card { border: 2px solid var(--border); border-radius: var(--r-lg); padding: 16px 14px; cursor: pointer; transition: all .18s; text-align: center; position: relative; background: var(--bg-card); }
        .role-card:hover { border-color: rgba(37,99,235,.4); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
        .role-card.selected { border-color: var(--accent); background: var(--accent-light); }
        .role-card.selected .role-card-check { opacity: 1; transform: scale(1); }
        .role-card.future { opacity: .55; cursor: not-allowed; }
        .role-card.future:hover { transform: none; box-shadow: none; border-color: var(--border); }
        .role-card-check { position: absolute; top: 8px; right: 8px; width: 18px; height: 18px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(.6); transition: all .18s; }
        .role-card-check svg { width: 10px; height: 10px; }
        .role-emoji { font-size: 1.8rem; margin-bottom: 8px; display: block; }
        .role-name { font-size: .85rem; font-weight: 800; color: var(--text-primary); margin-bottom: 3px; }
        .role-desc { font-size: .72rem; color: var(--text-muted); line-height: 1.5; }
        .role-future-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 999px; background: var(--bg-hover); color: var(--text-muted); font-size: .62rem; font-weight: 700; margin-top: 5px; }
        .role-future-badge svg { width: 9px; height: 9px; }
        .skills-wrap { display: flex; flex-wrap: wrap; gap: 7px; }
        .skill-tag { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: var(--r-full); border: 1.5px solid var(--border); font-size: .78rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all .15s; background: var(--bg-card); }
        .skill-tag:hover { border-color: var(--accent); color: var(--accent); }
        .skill-tag.selected { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
        .form-textarea { width: 100%; border: 1.5px solid var(--border-input); border-radius: var(--r-md); padding: 12px 14px; font-size: .875rem; font-family: var(--font-sans); color: var(--text-primary); background: var(--bg-input); outline: none; resize: vertical; min-height: 80px; transition: border-color .15s; line-height: 1.6; }
        .form-textarea:focus { border-color: var(--accent); }
        .char-counter { text-align: right; font-size: .72rem; color: var(--text-muted); margin-top: 4px; }
        .btn-save { width: 100%; height: 48px; border-radius: var(--r-md); background: var(--accent); color: #fff; border: none; font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all .18s; margin-top: 24px; }
        .btn-save:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,.35); }
        .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-skip { width: 100%; height: 40px; border-radius: var(--r-md); background: transparent; color: var(--text-muted); border: 1.5px solid var(--border); font-size: .875rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all .15s; margin-top: 10px; }
        .btn-skip:hover { border-color: var(--text-secondary); color: var(--text-secondary); }
        .form-section { margin-bottom: 24px; }
        .form-section-label { font-size: .72rem; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; }
        .toast { position: fixed; bottom: 28px; right: 28px; z-index: 999; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 14px 18px; display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-lg); min-width: 260px; animation: toastIn .25s ease; pointer-events: none; }
        .toast.hidden { display: none; }
        @keyframes toastIn { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        .toast-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .toast-icon.success { background: rgba(16,185,129,.12); color: var(--success); }
        .toast-icon svg { width: 16px; height: 16px; }
        .toast-text .toast-title { font-size: .875rem; font-weight: 700; color: var(--text-primary); }
        .toast-text .toast-sub { font-size: .78rem; color: var(--text-muted); margin-top: 2px; }
        .spin { animation: spin 1s linear infinite; } 
        @keyframes spin { to { transform: rotate(360deg); } }
        @media(max-width:860px) { .auth-panel { display:none; } }
        @media(max-width:520px) { .role-grid { grid-template-columns:1fr 1fr; } .auth-form-body { padding:24px 16px; } }
      `}</style>

      {/* Toast Notification */}
      <div className={`toast ${!showToast ? 'hidden' : ''}`}>
        <div className="toast-icon success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div className="toast-text">
          <div className="toast-title">Profile saved!</div>
          <div className="toast-sub">Taking you to your dashboard…</div>
        </div>
      </div>

      <div className="auth-page">
        {/* LEFT PANEL */}
        <div className="auth-panel">
          <div className="panel-logo">
            <div className="panel-logo-icon">
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 3 1 9 5 15" /><polyline points="13 3 17 9 13 15" /></svg>
            </div>
            <span className="panel-logo-name">Coder's Nest</span>
          </div>

          <div className="panel-body">
            <h2 className="panel-title">Almost there,<br /><span>let's set up<br />your profile.</span></h2>
            <p className="panel-desc">A complete profile helps your teammates know who you are and what you work on.</p>

            <div className="panel-steps">
              <div className="panel-step">
                <div className="step-num done"></div>
                <div className="step-info">
                  <div className="step-label done">Create account</div>
                  <div className="step-sub">Email &amp; password verified</div>
                </div>
              </div>
              <div className="panel-step">
                <div className="step-num done"></div>
                <div className="step-info">
                  <div className="step-label done">Verify email</div>
                  <div className="step-sub">OTP confirmed</div>
                </div>
              </div>
              <div className="panel-step">
                <div className="step-num active">3</div>
                <div className="step-info">
                  <div className="step-label active">Set up profile</div>
                  <div className="step-sub active">Photo, username, role</div>
                </div>
              </div>
              <div className="panel-step">
                <div className="step-num pending">4</div>
                <div className="step-info">
                  <div className="step-label pending">Go to Dashboard</div>
                  <div className="step-sub">Start building</div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-footer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            Your data is secure with us.
          </div>
        </div>

        {/* RIGHT FORM SIDE */}
        <div className="auth-form-side">
          <div className="auth-form-topbar">
            <span>Already done?</span>
            <a href="/dashboard">Go to Dashboard →</a>
            <button className="theme-toggle" aria-label="Toggle theme" onClick={toggleTheme}>
              {theme === 'light' ? (
                <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              ) : (
                <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              )}
            </button>
          </div>

          <div className="auth-form-body">
            <div className="auth-card">
              <h1 className="auth-card-title">Set up your profile</h1>
              <p className="auth-card-sub">Tell us a bit about yourself. You can update this anytime from settings.</p>

              {/* Progress */}
              <div className="progress-label"><span>Step 3 of 4</span><span>75% complete</span></div>
              <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: '75%' }}></div></div>

              {/* Profile picture */}
              <div className="form-section">
                <div className="form-section-label">Profile picture</div>
                <div className="avatar-upload-row">
                  <div className="avatar-preview-wrap">
                    <div className="avatar-preview">
                      {!avatarPreview ? (
                        <span>{getInitials(displayName)}</span>
                      ) : (
                        <img src={avatarPreview} alt="Avatar Preview" />
                      )}
                    </div>
                    <div className="avatar-upload-badge" onClick={() => fileInputRef.current.click()} title="Upload photo">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                    </div>
                    <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                  </div>
                  <div className="avatar-upload-info">
                    <div className="avatar-upload-title">Profile photo</div>
                    <div className="avatar-upload-sub">Upload a clear photo so teammates can recognise you. PNG, JPG up to 5 MB.</div>
                    <div className="avatar-upload-btns">
                      <button className="avatar-btn primary" onClick={() => fileInputRef.current.click()}>
                        Upload photo
                      </button>
                      {avatarPreview && (
                        <button className="avatar-btn danger" onClick={removePhoto}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="form-section">
                <div className="form-section-label">Username <span style={{ color: 'var(--danger)' }}>*</span></div>
                <div className={`username-prefix ${usernameError ? 'error' : ''}`}>
                  <span className="username-at">@</span>
                  <input
                    className="username-input"
                    type="text"
                    placeholder="johndoe"
                    maxLength="30"
                    value={username}
                    onChange={handleUsernameChange}
                  />
                </div>
                {usernameStatus !== 'idle' && (
                  <div className={`username-status ${usernameStatus}`}>
                    {usernameStatus === 'checking' && (
                      <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg> Checking…</>
                    )}
                    {usernameStatus === 'taken' && (
                      <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg> @{username} is already taken</>
                    )}
                    {usernameStatus === 'available' && (
                      <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> @{username} is available</>
                    )}
                  </div>
                )}
                <div style={{ fontSize: '.73rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                  Letters, numbers, and underscores only. This is your unique handle on Coder's Nest.
                </div>
              </div>

              {/* Display name */}
              <div className="form-section">
                <div className="form-section-label">Display name</div>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </span>
                  <input 
                    type="text" 
                    className="form-input has-icon" 
                    placeholder="John Doe" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                  />
                </div>
              </div>

              {/* Role selection */}
              <div className="form-section">
                <div className="form-section-label">I am a… <span style={{ color: 'var(--danger)' }}>*</span></div>
                <div className="role-grid">
                  <div className={`role-card ${role === 'developer' ? 'selected' : ''}`} onClick={() => setRole('developer')}>
                    <div className="role-card-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span className="role-emoji">💻</span>
                    <div className="role-name">Developer</div>
                    <div className="role-desc">Building software, contributing to codebases.</div>
                  </div>

                  <div className={`role-card ${role === 'student' ? 'selected' : ''}`} onClick={() => setRole('student')}>
                    <div className="role-card-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span className="role-emoji">🎓</span>
                    <div className="role-name">Student</div>
                    <div className="role-desc">Learning to code, working on projects &amp; assignments.</div>
                  </div>

                  <div className="role-card future" title="Coming soon">
                    <div className="role-card-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span className="role-emoji">🛡️</span>
                    <div className="role-name">Admin</div>
                    <div className="role-desc">Managing teams, billing, and org settings.</div>
                    <div className="role-future-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      Coming soon
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills (optional) */}
              <div className="form-section">
                <div className="form-section-label">Skills <span style={{ color: 'var(--text-muted)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
                <div className="skills-wrap">
                  {ALL_SKILLS.map(skill => (
                    <div 
                      key={skill} 
                      className={`skill-tag ${selectedSkills.includes(skill) ? 'selected' : ''}`} 
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="form-section">
                <div className="form-section-label">Bio <span style={{ color: 'var(--text-muted)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
                <textarea 
                  className="form-textarea" 
                  placeholder="e.g. Full-stack developer based in Mumbai, passionate about building developer tools…" 
                  maxLength="160" 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                ></textarea>
                <div className="char-counter"><span>{bio.length}</span>/160</div>
              </div>

              {/* Submit */}
              <button className="btn-save" onClick={saveProfile} disabled={isSaving}>
                {isSaving ? (
                  <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" className="spin"><path d="M21 12a9 9 0 1 1-4.22-7.65"/></svg> Saving…</>
                ) : (
                  <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><polyline points="20 6 9 17 4 12" /></svg> Save profile &amp; go to Dashboard</>
                )}
              </button>
              <button className="btn-skip" onClick={skipSetup}>
                Skip for now — I'll set it up later
              </button>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSetup;