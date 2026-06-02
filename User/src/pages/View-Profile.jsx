import React from 'react';
import { useNavigate } from 'react-router-dom';

const ViewProfile = () => {
    const navigate = useNavigate();
    return (
        <div className="view-profile-page">
            <style>{`
                .view-profile-page {
                    flex: 1;
                    padding: 40px;
                    max-width: 1000px;
                    margin: 0 auto;
                    width: 100%;
                    color: var(--text-primary);
                }

                /* PROFILE BANNER */
                .vp-banner {
                    width: 100%;
                    height: 200px;
                    border-radius: var(--r-lg);
                    background: linear-gradient(135deg, #2563eb 0%, #8b5cf6 50%, #d946ef 100%);
                    position: relative;
                    margin-bottom: 80px;
                    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.2);
                }
                
                /* AVATAR CONTAINER */
                .vp-avatar-wrapper {
                    position: absolute;
                    bottom: -60px;
                    left: 40px;
                    width: 140px;
                    height: 140px;
                    border-radius: 50%;
                    background: var(--bg-main);
                    padding: 6px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                }
                .vp-avatar {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #1e40af, #6d28d9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    font-weight: 800;
                    color: white;
                    border: 4px solid var(--bg-card);
                }

                /* HEADER ACTIONS */
                .vp-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: -60px;
                    margin-bottom: 40px;
                    gap: 12px;
                }
                .vp-btn {
                    padding: 10px 20px;
                    border-radius: var(--r-md);
                    font-weight: 700;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .vp-btn.edit {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    color: var(--text-primary);
                }
                .vp-btn.edit:hover {
                    background: var(--bg-hover);
                    border-color: var(--border-hover);
                }
                .vp-btn.primary {
                    background: var(--accent);
                    border: none;
                    color: white;
                }
                .vp-btn.primary:hover {
                    background: var(--accent-hover);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(37,99,235,0.3);
                }

                /* PROFILE INFO */
                .vp-info-section {
                    margin-bottom: 40px;
                }
                .vp-name {
                    font-size: 2.2rem;
                    font-weight: 800;
                    margin-bottom: 4px;
                }
                .vp-role {
                    font-size: 1.1rem;
                    color: var(--accent);
                    font-weight: 600;
                    margin-bottom: 16px;
                }
                .vp-bio {
                    font-size: 1rem;
                    line-height: 1.6;
                    color: var(--text-secondary);
                    max-width: 600px;
                }

                /* METRICS */
                .vp-metrics {
                    display: flex;
                    gap: 24px;
                    margin-bottom: 40px;
                }
                .vp-metric-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: var(--r-md);
                    padding: 20px 24px;
                    min-width: 140px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    transition: transform 0.2s;
                }
                .vp-metric-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.08);
                    border-color: var(--border-hover);
                }
                .vp-metric-val {
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--text-primary);
                }
                .vp-metric-label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    letter-spacing: 0.05em;
                }

                /* ABOUT / CONTACT INFO */
                .vp-details-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: var(--r-lg);
                    padding: 30px;
                }
                .vp-detail-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                }
                .vp-detail-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--accent-light);
                    color: var(--accent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .vp-detail-text h4 {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 4px;
                    font-weight: 700;
                }
                .vp-detail-text p {
                    font-size: 1rem;
                    color: var(--text-primary);
                    font-weight: 500;
                }
            `}</style>

            <div className="vp-banner">
                <div className="vp-avatar-wrapper">
                    <div className="vp-avatar">JD</div>
                </div>
            </div>

            <div className="vp-actions">
                <button className="vp-btn edit" onClick={() => navigate('/profile-setup')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Edit Profile
                </button>
                <button className="vp-btn primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                    Share
                </button>
            </div>

            <div className="vp-info-section">
                <h1 className="vp-name">John Doe</h1>
                <div className="vp-role">Senior Full-Stack Engineer</div>
                <p className="vp-bio">
                    Passionate about building scalable web applications and intuitive user interfaces. 
                    I love exploring new frontend frameworks, optimizing backend systems, and mentoring junior developers in the team.
                </p>
            </div>

            <div className="vp-metrics">
                <div className="vp-metric-card">
                    <div className="vp-metric-val">12</div>
                    <div className="vp-metric-label">Projects</div>
                </div>
                <div className="vp-metric-card">
                    <div className="vp-metric-val">4</div>
                    <div className="vp-metric-label">Teams</div>
                </div>
                <div className="vp-metric-card">
                    <div className="vp-metric-val">2.4k</div>
                    <div className="vp-metric-label">Commits</div>
                </div>
            </div>

            <div className="vp-details-grid">
                <div className="vp-detail-item">
                    <div className="vp-detail-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                    </div>
                    <div className="vp-detail-text">
                        <h4>Email</h4>
                        <p>john@example.com</p>
                    </div>
                </div>
                <div className="vp-detail-item">
                    <div className="vp-detail-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    </div>
                    <div className="vp-detail-text">
                        <h4>Location</h4>
                        <p>San Francisco, CA</p>
                    </div>
                </div>
                <div className="vp-detail-item">
                    <div className="vp-detail-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
                    </div>
                    <div className="vp-detail-text">
                        <h4>GitHub</h4>
                        <p>github.com/johndoe</p>
                    </div>
                </div>
                <div className="vp-detail-item">
                    <div className="vp-detail-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                    </div>
                    <div className="vp-detail-text">
                        <h4>Joined</h4>
                        <p>March 2024</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewProfile;
