import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { alertService } from '../utils/alert';
import { parseApiError } from '../utils/errorHandler';


const VerifyOTP = () => {
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

  // --- 2. Logic States ---
  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'phone'
  const [isEditingDest, setIsEditingDest] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Prevent direct access to this page without an email in state
  useEffect(() => {
    if (!location.state?.email) {
      alertService.error('Please sign up or log in first.', 'Unauthorized');
      navigate('/signup', { replace: true });
    }
  }, [location.state, navigate]);

  // Retrieve email sent from Signup state
  const initialEmail = location.state?.email || '';

  const [isSuccess, setIsSuccess] = useState(false);

  const [emailDest, setEmailDest] = useState(initialEmail);
  const [phoneCountry, setPhoneCountry] = useState('+91');
  const [phoneDest, setPhoneDest] = useState('');

  const [destError, setDestError] = useState('');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpShake, setOtpShake] = useState(false);
  const inputRefs = useRef([]);

  // --- 3. Timers State ---
  const [timerSec, setTimerSec] = useState(180); // 3 mins
  const [resendSec, setResendSec] = useState(location.state?.next_cooldown || 30);
  const [remainingResends, setRemainingResends] = useState(location.state?.remaining_resends ?? 4);

  useEffect(() => {
    if (isEditingDest || isSuccess || timerSec <= 0) return;
    const interval = setInterval(() => setTimerSec(s => s - 1), 1000);
    return () => clearInterval(interval);
  }, [isEditingDest, isSuccess, timerSec]);

  useEffect(() => {
    if (resendSec <= 0 || isEditingDest || isSuccess) return;
    const interval = setInterval(() => setResendSec(s => s - 1), 1000);
    return () => clearInterval(interval);
  }, [resendSec, isEditingDest, isSuccess]);

  // Focus first OTP input on mount
  useEffect(() => {
    if (!isEditingDest && !isSuccess && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 300);
    }
  }, [isEditingDest, isSuccess]);

  // --- Helpers ---
  const maskEmail = (email) => {
    if (!email) return 'jo***@example.com';
    const [u, d] = email.split('@');
    return (u.length > 2 ? u.slice(0, 2) : u) + '***@' + (d || 'example.com');
  };

  const maskPhone = (phone) => {
    if (!phone) return '••••• 43210';
    const c = phone.replace(/\D/g, '');
    if (c.length < 4) return c;
    return c.slice(0, -4).replace(/./g, '•') + c.slice(-4);
  };

  // --- Handlers ---
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setIsEditingDest(false);
    setTimerSec(180);
    setResendSec(30);
    setRemainingResends(4);
  };

  const handleSendCode = async () => {
    if (activeTab === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDest)) {
        setDestError('Enter a valid email address.');
        return;
      }

      setDestError('');
      try {
        const res = await axios.post("http://127.0.0.1:8000/auth/resend-otp", {
          email: emailDest
        });
        alertService.success(res.data.message || "OTP sent successfully.");
        setIsEditingDest(false);
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        setTimerSec(180);
        setResendSec(res.data.next_cooldown || 30);
        setRemainingResends(res.data.remaining_resends ?? 4);
        setTimeout(() => inputRefs.current[0] && inputRefs.current[0].focus(), 100);
      } catch (error) {
        const errorMessage = parseApiError(error);
        setDestError(errorMessage);
      }
    } else {
      if (!/^\d{6,15}$/.test(phoneDest.replace(/[\s\-]/g, ''))) {
        setDestError('Enter a valid phone number.');
        return;
      }
      setDestError('');
      setIsEditingDest(false);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setTimerSec(180);
      setResendSec(30);
      setTimeout(() => inputRefs.current[0] && inputRefs.current[0].focus(), 100);
    }
  };

  const handleResend = async () => {
    setOtp(['', '', '', '', '', '']);
    setOtpError('');

    try {
      const res = await axios.post("http://127.0.0.1:8000/auth/resend-otp", {
        email: emailDest
      });

      alertService.success(res.data.message || "OTP resent successfully.");
      setTimerSec(180);
      setResendSec(res.data.next_cooldown || 30);
      setRemainingResends(res.data.remaining_resends ?? 4);
      setTimeout(() => inputRefs.current[0] && inputRefs.current[0].focus(), 100);
    } catch (error) {
      const errorMessage = parseApiError(error);
      alertService.error(errorMessage);
    }
  };

  const handleOtpChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    setOtpError('');
    setOtpShake(false);

    if (val && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1].focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    paste.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    const focusIndex = Math.min(paste.length, 5);
    if (inputRefs.current[focusIndex]) inputRefs.current[focusIndex].focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setOtpError('Please enter all 6 digits of your verification code.');
      setOtpShake(true);
      setTimeout(() => setOtpShake(false), 600);
      return;
    }

    setOtpError('');
    setIsVerifying(true);

    try {
      const res = await axios.post("http://127.0.0.1:8000/auth/verify-otp", {
        email: emailDest,
        otp_code: code
      });

      // Store session/tokens returned by verify_and_login
      if (res.data.session) {
        localStorage.setItem("cn-access-token", res.data.session.access_token);
        // refresh_token is securely handled via HttpOnly cookie
      }

      setIsVerifying(false);
      setIsSuccess(true);
    } catch (error) {
      setIsVerifying(false);
      const errorMessage = parseApiError(error);
      setOtpError(errorMessage);
      setOtpShake(true);
      setTimeout(() => setOtpShake(false), 600);
    }
  };

  // --- SVG Timer Math ---
  const RING_CIRC = 2 * Math.PI * 25; // 157.08
  const pct = timerSec / 180;
  const dashOffset = timerSec <= 0 ? RING_CIRC : RING_CIRC * (1 - pct);
  const displayMin = String(Math.floor(timerSec / 60)).padStart(2, '0');
  const displaySec = String(timerSec % 60).padStart(2, '0');
  const isTimerDanger = timerSec <= 60 && timerSec > 0;

  return (
    <>
      {/* Component Scoped CSS injected */}
      <style>{`
        .tab-bar { display: flex; background: var(--bg-hover); border-radius: var(--r-lg); padding: 4px; gap: 4px; }
        .tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border-radius: var(--r-md); border: none; background: transparent; cursor: pointer; font-size: 0.875rem; font-weight: 600; color: var(--text-muted); transition: all 0.2s ease; }
        .tab-btn.active { background: var(--bg-card); color: var(--text-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.10); }
        .tab-btn svg { width: 16px; height: 16px; }
        .otp-digit { width: 56px; height: 64px; text-align: center; font-size: 1.6rem; font-weight: 700; border: 2px solid var(--border-input); border-radius: var(--r-lg); background: var(--bg-input); color: var(--text-primary); outline: none; transition: all 0.18s ease; caret-color: var(--accent); }
        .otp-digit:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.14); transform: scale(1.05); }
        .otp-digit.filled { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
        .otp-digit.error { border-color: var(--danger) !important; background: rgba(239,68,68,0.06) !important; animation: shake 0.35s ease; }
        @keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-5px); } 40%,80% { transform: translateX(5px); } }
        @media (max-width: 480px) { .otp-digit { width: 44px; height: 52px; font-size: 1.3rem; border-radius: var(--r-md); } }
        .info-banner { display: flex; gap: 12px; padding: 14px 16px; border-radius: var(--r-md); border: 1px solid rgba(37,99,235,0.2); background: var(--accent-light); font-size: 0.84rem; color: var(--text-secondary); line-height: 1.6; }
        .info-banner svg { width: 17px; height: 17px; color: var(--accent); flex-shrink: 0; margin-top: 1px; }
        .timer-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .timer-ring-svg { transform: rotate(-90deg); }
        .timer-ring-bg { fill: none; stroke: var(--border); stroke-width: 4; }
        .timer-ring-fill { fill: none; stroke-width: 4; stroke-linecap: round; stroke-dasharray: 157.08; transition: stroke-dashoffset 1s linear, stroke 0.5s; }
        .timer-label { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1rem; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -0.03em; }
        .timer-container { position: relative; width: 72px; height: 72px; }
        .checkmark-circle { width: 80px; height: 80px; border-radius: 50%; background: rgba(16,185,129,0.1); border: 2px solid rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: var(--success); animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .success-title { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; color: var(--text-primary); margin-bottom: 10px; }
        .success-desc { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 28px; max-width: 320px; margin-left: auto; margin-right: auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      <div className="auth-page">
        {/* ========== LEFT PANEL ========== */}
        <aside className="auth-panel">
          <div className="auth-panel-logo">
            <a href="/" className="logo">
              <div className="logo-icon">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5 3 1 9 5 15" /><polyline points="13 3 17 9 13 15" />
                </svg>
              </div>
              Coder's Nest
            </a>
          </div>

          <div className="auth-panel-content">
            <div>
              <h1 className="auth-panel-headline">
                Verify your<br />
                <span className="highlight">identity.</span>
              </h1>
              <p className="auth-panel-desc">
                We protect your account with a one-time code. It's quick, secure, and expires automatically.
              </p>
            </div>

            <div className="auth-panel-features">
              <div className="auth-panel-feature">
                <div className="feature-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                6-digit secure code
              </div>
              <div className="auth-panel-feature">
                <div className="feature-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                Expires in 3 minutes
              </div>
              <div className="auth-panel-feature">
                <div className="feature-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                Works for email &amp; SMS
              </div>
            </div>

            <div className="auth-panel-mockup">
              <div className="mockup-bar">
                <div className="mockup-dot red"></div>
                <div className="mockup-dot yellow"></div>
                <div className="mockup-dot green"></div>
              </div>
              <div className="mockup-code">
                <span className="code-cm">// Verify account ownership</span><br />
                <span className="code-kw">const</span> result = <span className="code-kw">await</span> otp.<span className="code-fn">verify</span>({`{`}<br />
                &nbsp;&nbsp;code: <span className="code-str">"••••••"</span>,<br />
                &nbsp;&nbsp;expiresAt: Date.<span className="code-fn">now</span>() + <span className="code-num">180_000</span>,<br />
                {`}`});<br />
                <span className="code-kw">if</span> (result.<span className="code-fn">valid</span>) {`{`}<br />
                &nbsp;&nbsp;<span className="code-cm">// Account verified ✓</span><br />
                &nbsp;&nbsp;user.<span className="code-fn">activate</span>();<br />
                {`}`}
              </div>
            </div>
          </div>

          <div className="auth-panel-footer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Your data is secure with us.
          </div>
        </aside>

        {/* ========== RIGHT FORM AREA ========== */}
        <main className="auth-form-area">
          <div className="auth-form-inner animate-fade-in-up">

            {/* Top header */}
            <div className="auth-form-header">
              <a
                href={activeTab === 'email' ? '/signup' : '/login'}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', transition: 'color 0.18s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                {activeTab === 'email' ? 'Back to sign up' : 'Back to sign in'}
              </a>
              <div className="auth-form-header-right">
                <button className="theme-toggle" aria-label="Toggle theme" onClick={toggleTheme}>
                  {theme === 'light' ? (
                    <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  ) : (
                    <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ====== VERIFY AREA ====== */}
            {!isSuccess && (
              <div className="verify-area">
                <div className="auth-form-card" style={{ gap: '24px' }}>

                  <div>
                    <h2 className="auth-form-title">Verify your account</h2>
                    <p className="auth-form-subtitle">Enter the 6-digit code sent to you</p>
                  </div>

                  {/* Tab switcher */}
                  <div className="tab-bar" role="tablist">
                    <button className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'email'} onClick={() => handleTabSwitch('email')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      Email OTP
                    </button>
                    <button className={`tab-btn ${activeTab === 'phone' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'phone'} onClick={() => handleTabSwitch('phone')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16.92z" />
                      </svg>
                      Phone OTP
                    </button>
                  </div>

                  {/* Info banner */}
                  {!isEditingDest && (
                    <>
                      <div className="info-banner">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>
                          A 6-digit {activeTab === 'phone' ? 'SMS ' : ''}code was sent to <strong>{activeTab === 'email' ? maskEmail(emailDest) : `${phoneCountry} ${maskPhone(phoneDest)}`}</strong>. {activeTab === 'email' ? 'Check your inbox and enter it below.' : 'Enter it below.'}
                        </span>
                      </div>

                      {/* Destination editor bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-input)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {activeTab === 'email' ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16.92z" />
                              </svg>
                            )}
                          </span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {activeTab === 'email' ? emailDest || 'you@example.com' : `${phoneCountry} ${phoneDest || '98765 43210'}`}
                          </span>
                        </div>
                        <button onClick={() => setIsEditingDest(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', padding: '4px 8px', borderRadius: 'var(--r-sm)' }}>Change</button>
                      </div>
                    </>
                  )}

                  {/* Destination input (Editing Mode) */}
                  {isEditingDest && (
                    <div>
                      {activeTab === 'email' ? (
                        <div className="form-group">
                          <label className="form-label" htmlFor="email-dest">Email address</label>
                          <div className="input-wrapper">
                            <span className="input-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                            </span>
                            <input
                              id="email-dest" type="email" className="form-input has-icon"
                              placeholder="you@example.com" value={emailDest} onChange={(e) => setEmailDest(e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="form-group">
                          <label className="form-label" htmlFor="phone-dest">Phone number</label>
                          <div className="phone-input-group">
                            <select className="phone-country-select" value={phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)}>
                              <option value="+1">🇺🇸 +1</option>
                              <option value="+44">🇬🇧 +44</option>
                              <option value="+91">🇮🇳 +91</option>
                              <option value="+61">🇦🇺 +61</option>
                              <option value="+49">🇩🇪 +49</option>
                              <option value="+33">🇫🇷 +33</option>
                            </select>
                            <div className="input-wrapper" style={{ flex: 1 }}>
                              <input
                                id="phone-dest" type="tel" className="form-input"
                                placeholder="98765 43210" value={phoneDest} onChange={(e) => setPhoneDest(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {destError && <span className="form-error" style={{ display: 'block', marginTop: '4px' }}>{destError}</span>}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button className="btn btn-primary" onClick={handleSendCode} style={{ flex: 1 }}>
                          Send code
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px', width: '16px' }}>
                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </button>
                        <button className="btn btn-secondary" onClick={() => { setIsEditingDest(false); setDestError(''); }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* OTP Input & Timer (Hidden while editing) */}
                  {!isEditingDest && (
                    <>
                      {/* OTP Grid */}
                      <div>
                        <label className="form-label" style={{ marginBottom: '14px', display: 'block', textAlign: 'center', fontSize: '0.95rem' }}>Enter your 6-digit code</label>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          {otp.map((data, index) => (
                            <input
                              key={index}
                              type="text"
                              className={`otp-digit ${data ? 'filled' : ''} ${otpShake ? 'error' : ''}`}
                              maxLength="1"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={data}
                              ref={el => inputRefs.current[index] = el}
                              onChange={e => handleOtpChange(e, index)}
                              onKeyDown={e => handleOtpKeyDown(e, index)}
                              onPaste={handleOtpPaste}
                              aria-label={`Digit ${index + 1}`}
                            />
                          ))}
                        </div>
                        <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.8rem', color: 'var(--danger)', minHeight: '18px' }}>
                          {otpError}
                        </p>
                      </div>

                      {/* Timer + Resend */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div className="timer-wrap">
                          <div className="timer-container">
                            <svg className="timer-ring-svg" width="72" height="72" viewBox="0 0 56 56">
                              <circle className="timer-ring-bg" cx="28" cy="28" r="25" />
                              <circle
                                className="timer-ring-fill"
                                cx="28" cy="28" r="25"
                                style={{
                                  stroke: timerSec <= 0 || isTimerDanger ? 'var(--danger)' : 'var(--accent)',
                                  strokeDashoffset: dashOffset
                                }}
                              />
                            </svg>
                            <span className="timer-label" style={{ color: timerSec <= 0 || isTimerDanger ? 'var(--danger)' : 'var(--text-primary)' }}>
                              {timerSec <= 0 ? 'Expired' : `${displayMin}:${displaySec}`}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 500 }}>remaining</span>
                        </div>

                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Didn't receive the code?
                          </p>
                          <button onClick={handleResend} className="btn btn-secondary btn-sm" disabled={resendSec > 0}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', marginRight: '6px' }}>
                              <polyline points="1 4 1 10 7 10" />
                              <path d="M3.51 15a9 9 0 1 0 .49-3.77" />
                            </svg>
                            Resend code {resendSec > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '4px' }}>({resendSec}s)</span>}
                          </button>
                          {remainingResends !== undefined && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                              {remainingResends} {remainingResends === 1 ? 'resend' : 'resends'} remaining this hour
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Verify Button */}
                      <button className="btn btn-primary btn-lg btn-full" onClick={handleVerify} disabled={isVerifying}>
                        {isVerifying ? (
                          <>
                            <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', marginRight: '8px' }}>
                              <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
                              <path d="M12 2a10 10 0 0 1 10 10" />
                            </svg>
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify &amp; continue
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', marginLeft: '8px' }}>
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                          </>
                        )}
                      </button>

                      <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Having trouble? <a href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Contact support</a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ====== SUCCESS SCREEN ====== */}
            {isSuccess && (
              <div className="success-screen active">
                <div className="checkmark-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h2 className="success-title">
                  {activeTab === 'phone' ? 'Phone verified!' : 'Account verified!'}
                </h2>
                <p className="success-desc">
                  {activeTab === 'phone'
                    ? "Your phone number has been verified. You can now use SMS-based login and recovery."
                    : "Your account has been successfully verified. You're all set to start building."}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px', margin: '0 auto' }}>
                  <a href="/profile-setup" className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
                    Set up your profile
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', marginLeft: '8px' }}>
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>
                  <a href="/dashboard" className="btn btn-ghost btn-sm" style={{ justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Skip for now
                  </a>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
};

export default VerifyOTP;