import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { alertService } from '../utils/alert';

const ViewProfile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [projects, setProjects] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const viewedMember = location.state?.member;
    const isOwnProfile = !viewedMember;

    useEffect(() => {
        if (!isOwnProfile) {
            // We are viewing someone else's profile via state
            setUser({
                full_name: viewedMember.name,
                profile_pic_url: null, // we use init if no pic
                color: viewedMember.color,
                init: viewedMember.init,
                email: 'Hidden for privacy',
                phone_number: 'Hidden for privacy',
                bio: 'This user is a member of the project.',
            });
            setLoading(false);
            return;
        }

        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                setUser(res.data);
                try {
                    const projRes = await api.get('/projects/');
                    setProjects(projRes.data);
                } catch (e) {
                    console.error("Could not load projects", e);
                }
            } catch (err) {
                console.error("Failed to load user data");
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [navigate, isOwnProfile, viewedMember]);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>;
    if (!user) return null;

    const initials = user.init || (user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'JD');
    
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
                    background: ${user?.color || 'linear-gradient(135deg, #1e40af, #6d28d9)'};
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

            <div style={{ marginBottom: '20px' }}>
                <button className="vp-btn" style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }} onClick={() => navigate(-1)}>
                    ← Back
                </button>
            </div>
            
            <div className="vp-banner" style={user.banner_url ? { background: `url(http://localhost:8000${user.banner_url}) center/cover` } : {}}>
                <div className="vp-avatar-wrapper">
                    <div className="vp-avatar">
                        {user.profile_pic_url ? (
                            <img src={`http://localhost:8000${user.profile_pic_url}`} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
                        ) : (
                            initials
                        )}
                    </div>
                </div>
            </div>

            <div className="vp-actions">

                {isOwnProfile && (
                    <button className="vp-btn edit" onClick={() => navigate('/profile-setup')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Edit Profile
                    </button>
                )}
            </div>

            <div className="vp-info-section">
                <h1 className="vp-name">{user.full_name || 'Coder'}</h1>
                <p className="vp-bio">
                    {user.bio || 'This user has not added a bio yet.'}
                </p>
            </div>

            <div className="vp-metrics">
                <div className="vp-metric-card">
                    <div className="vp-metric-val">{projects.length}</div>
                    <div className="vp-metric-label">Projects</div>
                </div>

                <div className="vp-metric-card">
                    <div className="vp-metric-val">0</div>
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
                        <p>{user.email}</p>
                    </div>
                </div>
                <div className="vp-detail-item">
                    <div className="vp-detail-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    </div>
                    <div className="vp-detail-text">
                        <h4>Phone</h4>
                        <p>{user.phone_number || 'Not provided'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewProfile;
