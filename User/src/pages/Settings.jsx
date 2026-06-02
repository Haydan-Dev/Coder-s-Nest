import React, { useState } from 'react';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('account');

    return (
        <div className="settings-page">
            <style>{`
                .settings-page {
                    flex: 1;
                    padding: 40px;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                    color: var(--text-primary);
                }
                .settings-header {
                    margin-bottom: 30px;
                }
                .settings-title {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 8px;
                }
                .settings-subtitle {
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                }
                .settings-layout {
                    display: grid;
                    grid-template-columns: 240px 1fr;
                    gap: 40px;
                    align-items: start;
                }
                
                /* SETTINGS SIDEBAR */
                .settings-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .settings-tab {
                    padding: 12px 16px;
                    border-radius: var(--r-md);
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.95rem;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.2s;
                }
                .settings-tab:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }
                .settings-tab.active {
                    background: var(--accent-light);
                    color: var(--accent);
                }
                .settings-tab svg {
                    width: 18px;
                    height: 18px;
                }

                /* SETTINGS CONTENT */
                .settings-content {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: var(--r-lg);
                    padding: 32px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                }
                .settings-section-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border);
                }
                
                /* FORMS */
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 24px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 24px;
                }
                .form-label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-secondary);
                }
                .form-input {
                    padding: 12px 16px;
                    border-radius: var(--r-md);
                    border: 1px solid var(--border-input);
                    background: var(--bg-main);
                    color: var(--text-primary);
                    font-size: 0.95rem;
                    transition: all 0.2s;
                }
                .form-input:focus {
                    outline: none;
                    border-color: var(--accent);
                    box-shadow: 0 0 0 3px var(--accent-light);
                }
                
                /* TOGGLE SWITCH */
                .toggle-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 0;
                    border-bottom: 1px solid var(--border);
                }
                .toggle-row:last-child {
                    border-bottom: none;
                }
                .toggle-info strong {
                    display: block;
                    font-size: 0.95rem;
                    margin-bottom: 4px;
                }
                .toggle-info span {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }
                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                }
                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: var(--border);
                    transition: .4s;
                    border-radius: 24px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider {
                    background-color: var(--accent);
                }
                input:checked + .slider:before {
                    transform: translateX(20px);
                }

                .save-btn {
                    background: var(--accent);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: var(--r-md);
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 16px;
                }
                .save-btn:hover {
                    background: var(--accent-hover);
                    transform: translateY(-1px);
                }

                /* BILLING CARDS */
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

                /* INVOICE TABLE */
                .invoice-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
                .invoice-table th { text-align: left; padding: 12px 16px; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
                .invoice-table td { padding: 16px; border-bottom: 1px solid var(--border); color: var(--text-primary); }
                .invoice-status { padding: 4px 8px; border-radius: var(--r-sm); font-size: 0.75rem; font-weight: 700; background: rgba(16, 185, 129, 0.1); color: var(--success); }

                /* ACTIVITY LOGS */
                .activity-timeline { display: flex; flex-direction: column; gap: 24px; position: relative; margin-top: 24px; padding-left: 24px; border-left: 2px solid var(--border); }
                .activity-item { position: relative; }
                .activity-dot { position: absolute; left: -31px; top: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--bg-card); border: 2px solid var(--accent); }
                .activity-title { font-weight: 600; font-size: 0.95rem; margin-bottom: 4px; color: var(--text-primary); }
                .activity-meta { font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 12px; }
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
                    <div className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                        Appearance
                    </div>
                    <div className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        Notifications
                    </div>
                    <div className={`settings-tab ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                        Billing & Plans
                    </div>
                    <div className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        Security & Activity
                    </div>
                </aside>

                <main className="settings-content">
                    {activeTab === 'account' && (
                        <div>
                            <h2 className="settings-section-title">Account Details</h2>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input type="text" className="form-input" defaultValue="John" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input type="text" className="form-input" defaultValue="Doe" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input type="email" className="form-input" defaultValue="john@example.com" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bio</label>
                                <textarea className="form-input" rows="4" defaultValue="Full-stack developer building awesome tools." style={{ resize: 'vertical' }}></textarea>
                            </div>
                            <button className="save-btn">Save Changes</button>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div>
                            <h2 className="settings-section-title">Appearance</h2>
                            <div className="toggle-row">
                                <div className="toggle-info">
                                    <strong>Dark Mode</strong>
                                    <span>Switch between light and dark themes.</span>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="toggle-row">
                                <div className="toggle-info">
                                    <strong>Compact Mode</strong>
                                    <span>Reduce padding to fit more content on screen.</span>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div>
                            <h2 className="settings-section-title">Notification Preferences</h2>
                            <div className="toggle-row">
                                <div className="toggle-info">
                                    <strong>Email Notifications</strong>
                                    <span>Receive daily summaries and alerts via email.</span>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="toggle-row">
                                <div className="toggle-info">
                                    <strong>Push Notifications</strong>
                                    <span>Receive alerts directly in your browser.</span>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="toggle-row">
                                <div className="toggle-info">
                                    <strong>Mentions & Tags</strong>
                                    <span>Notify me when someone mentions me in team chat.</span>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div>
                            <h2 className="settings-section-title">Billing & Subscriptions</h2>
                            
                            <div className="billing-cards">
                                <div className="plan-card">
                                    <div className="plan-name">Free Plan</div>
                                    <div className="plan-price">$0<span>/month</span></div>
                                    <div className="plan-features">
                                        <div className="plan-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Up to 3 Projects</div>
                                        <div className="plan-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Community Support</div>
                                    </div>
                                    <button className="save-btn" style={{ width: '100%', background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>Current Plan</button>
                                </div>
                                
                                <div className="plan-card active">
                                    <div className="plan-badge">RECOMMENDED</div>
                                    <div className="plan-name">Pro Plan</div>
                                    <div className="plan-price">$15<span>/month</span></div>
                                    <div className="plan-features">
                                        <div className="plan-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Unlimited Projects</div>
                                        <div className="plan-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Priority AI Access</div>
                                        <div className="plan-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Advanced Analytics</div>
                                    </div>
                                    <button className="save-btn" style={{ width: '100%' }}>Upgrade to Pro</button>
                                </div>
                            </div>

                            <h2 className="settings-section-title" style={{ marginTop: '40px' }}>Payment Method</h2>
                            <div className="toggle-row" style={{ padding: '20px', background: 'var(--bg-main)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '32px', background: '#1a1f36', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', fontStyle: 'italic' }}>VISA</div>
                                    <div>
                                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Visa ending in 4242</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Expires 12/2028</div>
                                    </div>
                                </div>
                                <button className="save-btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', marginTop: 0 }}>Update</button>
                            </div>

                            <h2 className="settings-section-title" style={{ marginTop: '40px' }}>Billing History</h2>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="invoice-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Invoice</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Oct 1, 2024</td>
                                            <td>$15.00</td>
                                            <td style={{ color: 'var(--accent)', cursor: 'pointer' }}>#INV-2024-001</td>
                                            <td><span className="invoice-status">Paid</span></td>
                                        </tr>
                                        <tr>
                                            <td>Nov 1, 2024</td>
                                            <td>$15.00</td>
                                            <td style={{ color: 'var(--accent)', cursor: 'pointer' }}>#INV-2024-002</td>
                                            <td><span className="invoice-status">Paid</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h2 className="settings-section-title">Security & Password</h2>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input type="password" className="form-input" placeholder="••••••••••••" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input type="password" className="form-input" placeholder="••••••••••••" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input type="password" className="form-input" placeholder="••••••••••••" />
                            </div>
                            
                            <div className="toggle-row" style={{ marginTop: '24px', borderTop: '1px solid var(--border)' }}>
                                <div className="toggle-info">
                                    <strong>Two-Factor Authentication (2FA)</strong>
                                    <span>Add an extra layer of security to your account.</span>
                                </div>
                                <button className="save-btn" style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', marginTop: 0 }}>Enable 2FA</button>
                            </div>
                            
                            <button className="save-btn">Update Password</button>

                            <h2 className="settings-section-title" style={{ marginTop: '48px' }}>Recent Activity</h2>
                            <div className="activity-timeline">
                                <div className="activity-item">
                                    <div className="activity-dot"></div>
                                    <div className="activity-title">Logged in from new device</div>
                                    <div className="activity-meta"><span>Oct 24, 2024 • 10:42 AM</span><span>Mac OS • Chrome</span><span>192.168.1.1</span></div>
                                </div>
                                <div className="activity-item">
                                    <div className="activity-dot"></div>
                                    <div className="activity-title">Changed account password</div>
                                    <div className="activity-meta"><span>Oct 20, 2024 • 3:15 PM</span><span>Windows • Edge</span><span>192.168.1.1</span></div>
                                </div>
                                <div className="activity-item">
                                    <div className="activity-dot" style={{ borderColor: 'var(--border)' }}></div>
                                    <div className="activity-title">Enabled Two-Factor Authentication</div>
                                    <div className="activity-meta"><span>Sep 15, 2024 • 9:00 AM</span><span>iOS • Safari</span><span>10.0.0.5</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Settings;
