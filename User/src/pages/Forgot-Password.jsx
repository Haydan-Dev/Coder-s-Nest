import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { alertService } from '../utils/alert';
import '../css/style.css';
import '../css/forgot-password.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    // --- CORE STATES ---
    const [step, setStep] = useState(1);
    const [method, setMethod] = useState('email');
    const [resetToken, setResetToken] = useState('');

    // Step 1: Contact Info
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('+91');
    const [contactError, setContactError] = useState('');

    // Step 2: OTP
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef([]);
    const [otpError, setOtpError] = useState('');
    const [timer, setTimer] = useState(300); // 5 mins
    const [resendCooldown, setResendCooldown] = useState(30);
    const [isVerifying, setIsVerifying] = useState(false);

    // Step 3: New Password
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfPw, setShowConfPw] = useState(false);
    const [pwError, setPwError] = useState({ new: '', confirm: '' });
    const [isSaving, setIsSaving] = useState(false);

    // --- TIMERS EFFECT ---
    useEffect(() => {
        let interval;
        if (step === 2 && timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    useEffect(() => {
        let interval;
        if (step === 2 && resendCooldown > 0) {
            interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [step, resendCooldown]);

    // --- STEP 1 LOGIC ---
    const handleSendCode = async () => {
        if (method === 'email') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setContactError('Enter a valid email address.');
                return;
            }
        } else {
            if (!/^\d{6,15}$/.test(phone.replace(/[\s\-]/g, ''))) {
                setContactError('Enter a valid phone number.');
                return;
            }
        }
        setContactError('');

        try {
            const res = await axios.post('http://localhost:8000/auth/forgot-password', { email });
            alertService.success('If an account exists, a reset code was sent.');
            setStep(2);
            setTimer(300);
            setResendCooldown(res.data.next_cooldown || 30);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Failed to request password reset. Try again.';
            alertService.error(errorMessage);
        }
    };

    // --- STEP 2 LOGIC ---
    const handleOtpChange = (index, value) => {
        const val = value.replace(/\D/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = val;
        setOtp(newOtp);

        if (val && index < 5) {
            otpRefs.current[index + 1].focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1].focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1].focus();
        if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1].focus();
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        pasteData.split('').forEach((char, i) => {
            newOtp[i] = char;
        });
        setOtp(newOtp);
        const focusIdx = Math.min(pasteData.length, 5);
        otpRefs.current[focusIdx]?.focus();
    };

    const handleVerifyCode = async () => {
        const code = otp.join('');
        if (code.length < 6) {
            setOtpError('Please enter all 6 digits.');
            return;
        }
        setOtpError('');
        setIsVerifying(true);

        try {
            const res = await axios.post('http://localhost:8000/auth/verify-reset-otp', {
                email,
                otp_code: code
            });
            setResetToken(res.data.reset_token);
            setStep(3);
        } catch (err) {
            const errorMessage = err.response?.data?.detail || "Invalid or expired OTP.";
            setOtpError(errorMessage);
        } finally {
            setIsVerifying(false);
        }
    };

    const resendCode = async () => {
        try {
            const res = await axios.post('http://localhost:8000/auth/forgot-password', { email });
            alertService.success('A new code has been sent.');
            setOtp(['', '', '', '', '', '']);
            setTimer(300);
            setResendCooldown(res.data.next_cooldown || 30);
            setOtpError('');
            otpRefs.current[0]?.focus();
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Failed to resend code.';
            alertService.error(errorMessage);
        }
    };

    // --- STEP 3 LOGIC ---
    const handleSavePassword = async (e) => {
        e.preventDefault();
        let valid = true;
        const errors = { new: '', confirm: '' };

        if (newPassword.length < 8) {
            errors.new = 'Password must be at least 8 characters.';
            valid = false;
        }
        if (newPassword !== confirmPassword) {
            errors.confirm = 'Passwords do not match.';
            valid = false;
        }

        setPwError(errors);
        if (!valid) return;

        setIsSaving(true);
        try {
            await axios.post('http://localhost:8000/auth/reset-password', {
                token: resetToken,
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            setStep(4);
        } catch (err) {
            const errorMessage = err.response?.data?.detail || "Failed to reset password.";
            setPwError({ new: errorMessage, confirm: '' });
        } finally {
            setIsSaving(false);
        }
    };

    const getStrength = (pw) => {
        let s = 0;
        if (pw.length >= 8) s++;
        if (/[A-Z]/.test(pw)) s++;
        if (/[0-9]/.test(pw)) s++;
        if (/[^A-Za-z0-9]/.test(pw)) s++;
        return Math.min(s - 1, 3);
    };

    const pwScore = getStrength(newPassword);
    const pwMap = [
        { pct: '25%', color: '#ef4444', text: 'Weak' },
        { pct: '50%', color: '#f59e0b', text: 'Fair' },
        { pct: '75%', color: '#3b82f6', text: 'Good' },
        { pct: '100%', color: '#10b981', text: 'Strong' },
    ];

    // --- HELPER RENDERS ---
    const formatTime = (seconds) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    const maskEmail = (e) => {
        if (!e) return '';
        const [u, d] = e.split('@');
        return u.slice(0, 2) + '***@' + d;
    };

    const maskPhone = (p) => {
        const clean = p.replace(/\D/g, '');
        return clean.slice(0, -4).replace(/./g, '*') + clean.slice(-4);
    };

    return (
        <div className="auth-page">
            {/* ========== LEFT PANEL ========== */}
            <aside className="auth-panel">
                <div className="auth-panel-logo">
                    <a href="#" className="logo">
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
                        <h1 className="auth-panel-headline">Locked out?<br />We've got <span className="highlight">you covered.</span></h1>
                        <p className="auth-panel-desc">Reset your password securely. We'll send you a one-time code to verify your identity — it takes less than 2 minutes.</p>
                    </div>
                    <div className="auth-panel-features">
                        <div className="auth-panel-feature">
                            <div className="feature-icon-wrap">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            </div>
                            Secure verification
                        </div>
                        <div className="auth-panel-feature">
                            <div className="feature-icon-wrap">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            </div>
                            Code expires in 10 minutes
                        </div>
                        <div className="auth-panel-feature">
                            <div className="feature-icon-wrap">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            </div>
                            End-to-end encrypted
                        </div>
                    </div>
                </div>
                <div className="auth-panel-footer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    Your data is secure with us.
                </div>
            </aside>

            {/* ========== RIGHT FORM AREA ========== */}
            <main className="auth-form-area">
                <div className="auth-form-inner animate-fade-in-up">
                    <div className="auth-form-header">
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                            </svg>
                            Back to login
                        </a>
                    </div>

                    {/* Steps Indicator */}
                    {step < 4 && (
                        <div className="steps">
                            <div className="step">
                                <div className={`step-circle ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
                                    {step > 1 ? <svg viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="2 6 5 9 10 3" /></svg> : '1'}
                                </div>
                                <span className={`step-label ${step >= 1 ? 'active' : ''}`}>Verify identity</span>
                            </div>
                            <div className={`step-line ${step > 1 ? 'done' : ''}`}></div>
                            <div className="step">
                                <div className={`step-circle ${step >= 2 ? (step > 2 ? 'done' : 'active') : ''}`}>
                                    {step > 2 ? <svg viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="2 6 5 9 10 3" /></svg> : '2'}
                                </div>
                                <span className={`step-label ${step >= 2 ? 'active' : ''}`}>Enter code</span>
                            </div>
                            <div className={`step-line ${step > 2 ? 'done' : ''}`}></div>
                            <div className="step">
                                <div className={`step-circle ${step >= 3 ? 'active' : ''}`}>3</div>
                                <span className={`step-label ${step >= 3 ? 'active' : ''}`}>New password</span>
                            </div>
                        </div>
                    )}

                    {/* ====== SCREEN 1: Choose method ====== */}
                    {step === 1 && (
                        <div className="auth-form-card">
                            <div>
                                <h2 className="auth-form-title">Reset your password</h2>
                                <p className="auth-form-subtitle">Choose how you'd like to receive your reset code</p>
                            </div>

                            <div className="method-cards">
                                <label className={`method-card ${method === 'email' ? 'selected' : ''}`} onClick={() => setMethod('email')}>
                                    <input type="radio" name="reset-method" value="email" checked={method === 'email'} readOnly />
                                    <div className="method-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg></div>
                                    <div className="method-info">
                                        <div className="method-title">Email address</div>
                                        <div className="method-desc">We'll send a 6-digit code to your email</div>
                                    </div>
                                    <div className="method-check"><svg viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3" /></svg></div>
                                </label>

                                <label className={`method-card ${method === 'phone' ? 'selected' : ''}`} onClick={() => setMethod('phone')}>
                                    <input type="radio" name="reset-method" value="phone" checked={method === 'phone'} readOnly />
                                    <div className="method-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16.92z" /></svg></div>
                                    <div className="method-info">
                                        <div className="method-title">Phone number</div>
                                        <div className="method-desc">We'll send an SMS with a 6-digit code</div>
                                    </div>
                                    <div className="method-check"><svg viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3" /></svg></div>
                                </label>
                            </div>

                            {method === 'email' ? (
                                <div className="form-group">
                                    <label className="form-label">Email address</label>
                                    <div className="input-wrapper">
                                        <span className="input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg></span>
                                        <input type="email" className={`form-input has-icon ${contactError ? 'error' : ''}`} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ borderColor: contactError ? 'var(--danger)' : '' }} />
                                    </div>
                                    {contactError && <span className="form-error" style={{ display: 'block' }}>{contactError}</span>}
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">Phone number</label>
                                    <div className="phone-input-group">
                                        <select className="phone-country-select" value={country} onChange={(e) => setCountry(e.target.value)}>
                                            <option value="+1">🇺🇸 +1</option>
                                            <option value="+44">🇬🇧 +44</option>
                                            <option value="+91">🇮🇳 +91</option>
                                            <option value="+61">🇦🇺 +61</option>
                                        </select>
                                        <div className="input-wrapper" style={{ flex: 1 }}>
                                            <input type="tel" className="form-input" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ borderColor: contactError ? 'var(--danger)' : '' }} />
                                        </div>
                                    </div>
                                    {contactError && <span className="form-error" style={{ display: 'block' }}>{contactError}</span>}
                                </div>
                            )}

                            <button className="btn btn-primary btn-lg btn-full" onClick={handleSendCode}>
                                Send reset code
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                            </button>
                        </div>
                    )}

                    {/* ====== SCREEN 2: OTP ====== */}
                    {step === 2 && (
                        <div className="auth-form-card">
                            <div>
                                <h2 className="auth-form-title">Enter verification code</h2>
                                <p className="auth-form-subtitle">We sent a 6-digit code to your {method}</p>
                            </div>

                            <div className="info-alert">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                <span>A 6-digit code was sent to <strong>{method === 'email' ? maskEmail(email) : `${country} ${maskPhone(phone)}`}</strong>. It expires in <strong>10 minutes</strong>.</span>
                            </div>

                            <div>
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
                                    Code expires in <strong style={{ color: timer <= 60 ? 'var(--danger)' : 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{timer > 0 ? formatTime(timer) : 'Expired'}</strong>
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                    Didn't receive it?
                                    <button onClick={resendCode} style={{ background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer', color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent)', fontWeight: '600', fontSize: '0.85rem', padding: '0 0 0 5px' }} disabled={resendCooldown > 0}>
                                        Resend code {resendCooldown > 0 && `(${resendCooldown}s)`}
                                    </button>
                                </p>
                            </div>

                            <button className="btn btn-primary btn-lg btn-full" onClick={handleVerifyCode} disabled={isVerifying}>
                                {isVerifying ? 'Verifying...' : (
                                    <>
                                        Verify code
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    </>
                                )}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>
                                    ← Change contact method
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ====== SCREEN 3: New password ====== */}
                    {step === 3 && (
                        <div className="auth-form-card">
                            <div>
                                <h2 className="auth-form-title">Create new password</h2>
                                <p className="auth-form-subtitle">Your identity has been verified. Choose a strong new password.</p>
                            </div>

                            <form onSubmit={handleSavePassword}>
                                <div className="auth-form-fields">
                                    <div className={`form-group ${pwError.new ? 'has-error' : ''}`}>
                                        <label className="form-label">New password</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                                            <input type={showNewPw ? 'text' : 'password'} className="form-input has-icon has-suffix" placeholder="Min. 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                            <span className="input-suffix">
                                                <button type="button" className="pw-toggle" onClick={() => setShowNewPw(!showNewPw)}>
                                                    {showNewPw ? (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    ) : (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                                    )}
                                                </button>
                                            </span>
                                        </div>

                                        {newPassword && (
                                            <>
                                                <div style={{ height: '4px', borderRadius: '2px', marginTop: '8px', background: 'var(--border)', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: pwMap[pwScore].pct, background: pwMap[pwScore].color, transition: 'all 0.3s' }}></div>
                                                </div>
                                                <p style={{ fontSize: '0.75rem', marginTop: '4px', color: pwMap[pwScore].color }}>{pwMap[pwScore].text}</p>
                                            </>
                                        )}
                                        {pwError.new && <span className="form-error" style={{ display: 'block' }}>{pwError.new}</span>}
                                    </div>

                                    <div className={`form-group ${pwError.confirm ? 'has-error' : ''}`}>
                                        <label className="form-label">Confirm new password</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                                            <input type={showConfPw ? 'text' : 'password'} className="form-input has-icon has-suffix" placeholder="••••••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                            <span className="input-suffix">
                                                <button type="button" className="pw-toggle" onClick={() => setShowConfPw(!showConfPw)}>
                                                    {showConfPw ? (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    ) : (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                                    )}
                                                </button>
                                            </span>
                                        </div>
                                        {pwError.confirm && <span className="form-error" style={{ display: 'block' }}>{pwError.confirm}</span>}
                                    </div>
                                </div>

                                <div style={{ marginTop: '24px' }}>
                                    <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={isSaving}>
                                        {isSaving ? 'Saving...' : (
                                            <>
                                                Save new password
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ====== SCREEN 4: Success ====== */}
                    {step === 4 && (
                        <div className="auth-form-card">
                            <div className="success-state">
                                <div className="success-icon-wrap" style={{ margin: '0 auto 20px', width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="30" height="30"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                </div>
                                <h2 className="success-title" style={{ textAlign: 'center', marginBottom: '10px' }}>Password updated!</h2>
                                <p className="success-desc" style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '30px' }}>Your password has been changed successfully. You can now sign in with your new password.</p>
                                <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
                                    Back to sign in
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" style={{ marginLeft: '8px' }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default ResetPassword;