import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { alertService } from '../utils/alert';

const Login = () => {
  // --- 1. Theme State ---
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Initial theme load
    const storedTheme = localStorage.getItem('cn-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(storedTheme);
    document.body.classList.toggle('dark', storedTheme === 'dark');

    // Add spinner style globally if not present
    if (!document.getElementById('spinner-style')) {
      const style = document.createElement('style');
      style.id = 'spinner-style';
      style.textContent = `
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('cn-theme', newTheme);
  };

  // --- 2. Form State & Validation Logic ---
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2FA State
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [otpError, setOtpError] = useState('');
  const [timer, setTimer] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // --- TIMERS EFFECT ---
  useEffect(() => {
    let interval;
    if (show2FA && timer > 0) interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [show2FA, timer]);

  useEffect(() => {
    let interval;
    if (show2FA && resendCooldown > 0) interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [show2FA, resendCooldown]);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Enter a valid email address.';
        }
        break;
      case 'password':
        if (value.length < 6) {
          error = 'Password must be at least 6 characters.';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error dynamically as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run all validations on submit
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post("http://localhost:8000/auth/login", {
        email: formData.email,
        password: formData.password
      });

      if (res.data.message === "2FA required") {
        setTempToken(res.data.temp_token);
        setShow2FA(true);
        setTimer(300);
        setResendCooldown(30); // Initial cooldown
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        return;
      }

      // Save tokens
      sessionStorage.setItem('cn-access-token', res.data.access_token);
      // refresh_token is now securely handled via HttpOnly cookies

      alertService.success('Login successful!');
      window.location.href = '/dashboard';
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Something went wrong. Please try again.";
      alertService.error(errorMessage, 'Login Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 2FA LOGIC ---
  const handleOtpChange = (index, value) => {
    const val = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) otpRefs.current[index + 1].focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1].focus();
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1].focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1].focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasteData.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    const focusIdx = Math.min(pasteData.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleVerify2FA = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setOtpError('Please enter all 6 digits.');
      return;
    }
    setOtpError('');
    setIsSubmitting(true);

    try {
      const res = await axios.post('http://localhost:8000/auth/verify-login-2fa', {
        email: formData.email,
        otp_code: code,
        temp_token: tempToken
      });

      sessionStorage.setItem('cn-access-token', res.data.access_token);
      // refresh_token is securely handled via HttpOnly cookie
      alertService.success('Login successful!');
      window.location.href = '/dashboard';
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Invalid or expired OTP.";
      setOtpError(errorMessage);
      alertService.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend2FA = async () => {
    try {
      const res = await axios.post("http://localhost:8000/auth/login", {
        email: formData.email,
        password: formData.password
      });
      alertService.success('A new 2FA code has been sent.');
      setOtp(['', '', '', '', '', '']);
      setTimer(300);
      setResendCooldown(res.data.next_cooldown || 30); // Note: Since login doesn't return next_cooldown right now we default to 30. We could add next_cooldown to login response.
      setOtpError('');
      otpRefs.current[0]?.focus();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to resend 2FA code.';
      alertService.error(errorMessage);
    }
  };

  return (
    <div className="auth-page">
      {/* ========== LEFT PANEL ========== */}
      <aside className="auth-panel">
        <div className="auth-panel-logo">
          <a href="/" className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 3 1 9 5 15" />
                <polyline points="13 3 17 9 13 15" />
              </svg>
            </div>
            Coder's Nest
          </a>
        </div>

        <div className="auth-panel-content">
          <div>
            <h1 className="auth-panel-headline">
              Where Developers<br />
              Build <span className="highlight">Together.</span>
            </h1>
            <p className="auth-panel-desc">
              Real-time collaboration, AI assistance, and a powerful environment to build, share and grow together.
            </p>
          </div>

          <div className="auth-panel-features">
            <div className="auth-panel-feature">
              <div className="feature-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              Real-time Collaboration
            </div>
            <div className="auth-panel-feature">
              <div className="feature-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                </svg>
              </div>
              AI-Powered Assistance
            </div>
            <div className="auth-panel-feature">
              <div className="feature-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              Build, Share, Deploy
            </div>
          </div>

          {/* Decorative code block */}
          <div className="auth-panel-mockup">
            <div className="mockup-bar">
              <div className="mockup-dot red"></div>
              <div className="mockup-dot yellow"></div>
              <div className="mockup-dot green"></div>
            </div>
            <div className="mockup-code">
              <span className="code-cm">// Welcome back, developer</span><br />
              <span className="code-kw">const</span> <span className="code-fn">session</span> = <span className="code-kw">await</span> auth.<span className="code-fn">signIn</span>({`{`}<br />
              &nbsp;&nbsp;email: <span className="code-str">"you@example.com"</span>,<br />
              &nbsp;&nbsp;password: <span className="code-str">"••••••••••"</span>,<br />
              {`}`});<br />
              <span className="code-kw">if</span> (session.<span className="code-fn">ok</span>) {`{`}<br />
              &nbsp;&nbsp;router.<span className="code-fn">push</span>(<span className="code-str">"/dashboard"</span>);<br />
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

          <div className="auth-form-header">
            <div>{/* spacer */}</div>
            <div className="auth-form-header-right">
              <span className="auth-form-header-link">No account? <a href="/signup">Sign up</a></span>
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

          <div className="auth-form-card">
            {!show2FA ? (
              <>
                <div>
                  <h2 className="auth-form-title">Welcome back</h2>
                  <p className="auth-form-subtitle">Sign in to your Coder's Nest account</p>
                </div>

                {/* Social logins */}
                <div className="social-buttons">
                  <button className="social-btn" type="button">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub
                  </button>
                  <button className="social-btn" type="button">
                    <svg viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                  <button className="social-btn" type="button">
                    <svg viewBox="0 0 24 24" width="17" height="17">
                      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                    </svg>
                    Microsoft
                  </button>
                </div>

                <div className="divider">or continue with email</div>

                {/* Login form */}
                <form onSubmit={handleSubmit} data-form-type="login">
                  <div className="auth-form-fields">

                    <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                      <label className="form-label" htmlFor="email">Email address</label>
                      <div className="input-wrapper">
                        <span className="input-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </span>
                        <input
                          id="email" type="email" name="email"
                          className="form-input has-icon" placeholder="you@example.com"
                          value={formData.email} onChange={handleChange} onBlur={handleBlur}
                        />
                      </div>
                      {errors.email && <span className="form-error">{errors.email}</span>}
                    </div>

                    <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
                      <div className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label" htmlFor="password">Password</label>
                        <a href="/forgot-password" className="forgot-link">Forgot password?</a>
                      </div>
                      <div className="input-wrapper">
                        <span className="input-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </span>
                        <input
                          id="password" type={showPassword ? 'text' : 'password'} name="password"
                          className="form-input has-icon has-suffix" placeholder="••••••••••••"
                          value={formData.password} onChange={handleChange} onBlur={handleBlur}
                        />
                        <span className="input-suffix">
                          <button type="button" className="pw-toggle" aria-label="Show password" onClick={() => setShowPassword(!showPassword)}>
                            {!showPassword ? (
                              <svg className="icon-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg className="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </span>
                      </div>
                      {errors.password && <span className="form-error">{errors.password}</span>}
                    </div>

                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', marginRight: '8px' }}>
                            <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
                            <path d="M12 2a10 10 0 0 1 10 10" />
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign in
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px', width: '20px' }}>
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="divider">or</div>

                <button className="social-btn-phone" type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', marginRight: '8px' }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16.92z" />
                  </svg>
                  Sign in with phone number
                </button>
              </>
            ) : (
              <>
                <div>
                  <h2 className="auth-form-title">Two-Factor Authentication</h2>
                  <p className="auth-form-subtitle">Enter the 6-digit code sent to your email.</p>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <label className="form-label" style={{ marginBottom: '14px', display: 'block' }}>Verification code</label>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        className={`otp-digit ${digit ? 'filled' : ''} ${otpError ? 'error' : ''}`}
                        maxLength="1"
                        inputMode="numeric"
                        value={digit}
                        ref={(el) => (otpRefs.current[index] = el)}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        style={{ width: '52px', height: '58px', textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', borderRadius: 'var(--r-md)', border: `2px solid ${otpError ? 'var(--danger)' : digit ? 'var(--accent)' : 'var(--border-input)'}`, outline: 'none' }}
                      />
                    ))}
                  </div>
                  {otpError && <p className="form-error" style={{ textAlign: 'center', marginTop: '10px', display: 'block' }}>{otpError}</p>}
                </div>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Code expires in <strong style={{ color: timer <= 60 ? 'var(--danger)' : 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{timer > 0 ? `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : 'Expired'}</strong>
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Didn't receive it?
                    <button type="button" onClick={resend2FA} style={{ background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer', color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent)', fontWeight: '600', fontSize: '0.85rem', padding: '0 0 0 5px' }} disabled={resendCooldown > 0}>
                      Resend code {resendCooldown > 0 && `(${resendCooldown}s)`}
                    </button>
                  </p>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <button type="button" className="btn btn-primary btn-lg btn-full" disabled={isSubmitting || timer <= 0} onClick={handleVerify2FA}>
                    {isSubmitting ? 'Verifying...' : 'Verify Code'}
                  </button>
                </div>
              </>
            )}

            <div className="auth-form-footer">
              Don't have an account? <a href="/signup">Create one free</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;