import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { alertService } from '../utils/alert';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('account');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    
    const [billing, setBilling] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [userRes, billingRes] = await Promise.all([
                api.get('/users/me'),
                api.get('/billing/my-plan').catch(() => ({ data: null }))
            ]);
            
            const u = userRes.data;
            setFullName(u.full_name || '');
            setUsername(u.username || '');
            setEmail(u.email || '');
            setBio(u.bio || '');
            setTwoFactorEnabled(u.two_factor_enabled || false);
            
            if (billingRes.data) {
                setBilling(billingRes.data);
            }
        } catch (err) {
            if(alertService) alertService.error('Failed to load settings data.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAccount = async () => {
        setIsSaving(true);
        try {
            await api.put('/users/me', { full_name: fullName, username, bio });
            if(alertService) alertService.success('Account details updated!');
        } catch (err) {
            if(alertService) alertService.error(err.response?.data?.detail || 'Failed to update account.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) return;
        if (newPassword !== confirmPassword) {
            if(alertService) alertService.error('Passwords do not match!');
            return;
        }
        setIsSaving(true);
        try {
            await api.put('/users/me/password', { current_password: currentPassword, new_password: newPassword });
            if(alertService) alertService.success('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            if(alertService) alertService.error(err.response?.data?.detail || 'Failed to update password.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle2FA = async () => {
        if (twoFactorEnabled) {
            try {
                await api.post('/auth/disable-2fa');
                setTwoFactorEnabled(false);
                if(alertService) alertService.success('2FA Disabled');
            } catch (err) {
                if(alertService) alertService.error('Failed to disable 2FA');
            }
        } else {
            try {
                await api.post('/auth/enable-2fa-request');
                setOtpModalOpen(true);
                if(alertService) alertService.success('OTP sent to email');
            } catch (err) {
                if(alertService) alertService.error('Failed to request 2FA');
            }
        }
    };

    const handleVerify2FA = async () => {
        try {
            await api.post(`/auth/enable-2fa-verify/${otpCode}`);
            setTwoFactorEnabled(true);
            setOtpModalOpen(false);
            setOtpCode('');
            if(alertService) alertService.success('2FA Enabled Successfully!');
        } catch (err) {
            if(alertService) alertService.error('Invalid OTP');
        }
    };

    const handleSubscribe = async (planName) => {
        try {
            const res = await api.post('/billing/subscribe', { plan_name: planName, billing_cycle: 'Monthly' });
            setBilling(res.data);
            if(alertService) alertService.success(`Subscribed to ${planName}!`);
        } catch (err) {
            if(alertService) alertService.error('Subscription failed');
        }
    };

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div><style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style></div>;

    const currentPlan = billing?.plan_name || 'Free Plan';

    return (
        <div className="settings-page">
            <style>{`
                .settings-page { flex: 1; padding: 40px; max-width: 1200px; margin: 0 auto; width: 100%; color: var(--text-primary); }
                .settings-header { margin-bottom: 30px; }
                .settings-title { font-size: 2rem; font-weight: 800; margin-bottom: 8px; }
                .settings-subtitle { color: var(--text-secondary); font-size: 0.95rem; }
                .settings-layout { display: grid; grid-template-columns: 240px 1fr; gap: 40px; align-items: start; }
                .settings-nav { display: flex; flex-direction: column; gap: 6px; }
                .settings-tab { padding: 12px 16px; border-radius: var(--r-md); cursor: pointer; font-weight: 600; font-size: 0.95rem; color: var(--text-secondary); display: flex; align-items: center; gap: 12px; transition: all 0.2s; }
                .settings-tab:hover { background: var(--bg-hover); color: var(--text-primary); }
                .settings-tab.active { background: var(--accent-light); color: var(--accent); }
                .settings-tab svg { width: 18px; height: 18px; }
                .settings-content { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
                .settings-section-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
                .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
                .form-label { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); }
                .form-input { padding: 12px 16px; border-radius: var(--r-md); border: 1px solid var(--border-input); background: var(--bg-main); color: var(--text-primary); font-size: 0.95rem; transition: all 0.2s; }
                .form-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
                .form-input:disabled { opacity: 0.7; cursor: not-allowed; }
                .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--border); }
                .toggle-row:last-child { border-bottom: none; }
                .toggle-info strong { display: block; font-size: 0.95rem; margin-bottom: 4px; }
                .toggle-info span { font-size: 0.85rem; color: var(--text-muted); }
                .save-btn { background: var(--accent); color: white; border: none; padding: 12px 24px; border-radius: var(--r-md); font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 16px; }
                .save-btn:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
                .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .billing-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px; }
                .plan-card { background: var(--bg-main); border: 1.5px solid var(--border); border-radius: var(--r-lg); padding: 24px; position: relative; overflow: hidden; transition: 0.2s; }
                .plan-card.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
                .plan-badge { position: absolute; top: 16px; right: 16px; background: var(--accent-light); color: var(--accent); font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
                .plan-name { font-size: 1.25rem; font-weight: 800; margin-bottom: 8px; }
                .plan-price { font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 16px; }
                .plan-price span { font-size: 1rem; color: var(--text-muted); font-weight: 500; }
                .plan-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
                .plan-feature { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); }
                .plan-feature svg { color: var(--success); width: 16px; height: 16px; }
                .invoice-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
                .invoice-table th { text-align: left; padding: 12px 16px; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
                .invoice-table td { padding: 16px; border-bottom: 1px solid var(--border); color: var(--text-primary); }
                .invoice-status { padding: 4px 8px; border-radius: var(--r-sm); font-size: 0.75rem; font-weight: 700; background: rgba(16, 185, 129, 0.1); color: var(--success); }
                .activity-timeline { display: flex; flex-direction: column; gap: 24px; position: relative; margin-top: 24px; padding-left: 24px; border-left: 2px solid var(--border); }
                .activity-item { position: relative; }
                .activity-dot { position: absolute; left: -31px; top: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--bg-card); border: 2px solid var(--accent); }
                .activity-title { font-weight: 600; font-size: 0.95rem; margin-bottom: 4px; color: var(--text-primary); }
                .activity-meta { font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 12px; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .modal-content { background: var(--bg-card); padding: 32px; border-radius: var(--r-xl); width: 100%; max-width: 400px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
            `}</style>

            <div className="settings-header">
                <h1 className="settings-title">Settings</h1>
                <p className="settings-subtitle">Manage your account preferences and configurations</p>
            </div>

            <div className="settings-layout">
                <aside className="settings-nav">
                    <div className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        Account
                    </div>
                    <div className={`settings-tab ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                        Billing & Plans
                    </div>
                    <div className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        Security & 2FA
                    </div>
                </aside>

                <main className="settings-content">
                    {activeTab === 'account' && (
                        <div>
                            <h2 className="settings-section-title">Account Details</h2>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Username</label>
                                    <input type="text" className="form-input" value={username} onChange={e => setUsername(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address (Read Only)</label>
                                <input type="email" className="form-input" value={email} disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bio</label>
                                <textarea className="form-input" rows="4" value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'vertical' }}></textarea>
                            </div>
                            <button className="save-btn" onClick={handleSaveAccount} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div>
                            <h2 className="settings-section-title">Billing & Subscriptions</h2>
                            
                            <div className="billing-cards">
                                <div className={`plan-card ${currentPlan === 'Free Plan' ? 'active' : ''}`}>
                                    <div className="plan-name">Free Plan</div>
                                    <div className="plan-price">$0<span>/month</span></div>
                                    <div className="plan-features">
                                        <div className="plan-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Up to 3 Projects</div>
                                        <div className="plan-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Community Support</div>
                                    </div>
                                    {currentPlan === 'Free Plan' ? (
                                        <button className="save-btn" style={{ width: '100%', background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} disabled>Current Plan</button>
                                    ) : (
                                        <button className="save-btn" style={{ width: '100%' }} onClick={() => handleSubscribe('Free Plan')}>Downgrade to Free</button>
                                    )}
                                </div>
                                
                                <div className={`plan-card ${currentPlan === 'Pro Plan' ? 'active' : ''}`}>
                                    {currentPlan !== 'Pro Plan' && <div className="plan-badge">RECOMMENDED</div>}
                                    <div className="plan-name">Pro Plan</div>
                                    <div className="plan-price">$15<span>/month</span></div>
                                    <div className="plan-features">
                                        <div className="plan-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Unlimited Projects</div>
                                        <div className="plan-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Priority AI Access</div>
                                    </div>
                                    {currentPlan === 'Pro Plan' ? (
                                        <button className="save-btn" style={{ width: '100%', background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} disabled>Current Plan</button>
                                    ) : (
                                        <button className="save-btn" style={{ width: '100%' }} onClick={() => handleSubscribe('Pro Plan')}>Upgrade to Pro</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h2 className="settings-section-title">Security & Password</h2>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input type="password" className="form-input" placeholder="••••••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input type="password" className="form-input" placeholder="••••••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input type="password" className="form-input" placeholder="••••••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                            </div>
                            
                            <button className="save-btn" onClick={handleUpdatePassword} disabled={isSaving || !currentPassword || !newPassword}>Update Password</button>

                            <div className="toggle-row" style={{ marginTop: '32px', borderTop: '1px solid var(--border)' }}>
                                <div className="toggle-info">
                                    <strong>Two-Factor Authentication (2FA)</strong>
                                    <span>{twoFactorEnabled ? '2FA is currently enabled for your account.' : 'Add an extra layer of security to your account.'}</span>
                                </div>
                                <button className="save-btn" style={{ background: twoFactorEnabled ? 'rgba(239, 68, 68, 0.1)' : 'transparent', border: `1px solid ${twoFactorEnabled ? 'var(--danger)' : 'var(--accent)'}`, color: twoFactorEnabled ? 'var(--danger)' : 'var(--accent)', marginTop: 0 }} onClick={handleToggle2FA}>
                                    {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            
            {otpModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Verify 2FA Setup</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>We've sent an OTP to your email. Enter it below to enable Two-Factor Authentication.</p>
                        
                        <input type="text" className="form-input" style={{ width: '100%', marginBottom: '24px', textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.5rem', fontWeight: 'bold' }} placeholder="000000" value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={6} />
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="save-btn" style={{ flex: 1, background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)', marginTop: 0 }} onClick={() => { setOtpModalOpen(false); setOtpCode(''); }}>Cancel</button>
                            <button className="save-btn" style={{ flex: 1, marginTop: 0 }} onClick={handleVerify2FA} disabled={otpCode.length < 6}>Verify & Enable</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
