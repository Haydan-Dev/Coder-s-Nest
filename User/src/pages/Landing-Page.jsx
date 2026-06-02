import React, { useState } from 'react';

const LandingPage = () => {
  // State for Billing Toggle
  const [billing, setBilling] = useState('monthly');
  const proPrice = billing === 'monthly' ? '$12' : '$10';

  // Smooth Scroll Handler
  const scrollToSection = (e, targetId) => {
    e.preventDefault();
    if (targetId === '#') return;
    const targetSection = document.getElementById(targetId.substring(1));
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <a href="/" className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 3 1 9 5 15" />
                <polyline points="13 3 17 9 13 15" />
              </svg>
            </div>
            Coder's Nest
          </a>

          <nav className="nav-links">
            <a href="#features" className="nav-link" onClick={(e) => scrollToSection(e, '#features')}>Features</a>
            <a href="#pricing" className="nav-link" onClick={(e) => scrollToSection(e, '#pricing')}>Pricing</a>
            <a href="#" className="nav-link">Docs</a>
            <a href="#" className="nav-link">Blog</a>
          </nav>

          <div className="nav-actions">
            <button className="theme-toggle" aria-label="Toggle theme">
              <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'none' }}>
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </button>
            <a href="/login" className="btn btn-ghost btn-sm">Sign in</a>
            <a href="/signup" className="btn btn-primary btn-sm">Get started free</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge animate-fade-in-up">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Now with AI-powered code assistance
          </div>

          <h1 className="hero-title animate-fade-in-up animate-delay-1">
            Where Developers<br />
            <span className="highlight">Build Together.</span>
          </h1>

          <p className="hero-desc animate-fade-in-up animate-delay-2">
            Real-time collaboration, AI assistance, and a powerful environment to build, share and grow together. Join thousands of developers already building on Coder's Nest.
          </p>

          <div className="hero-actions animate-fade-in-up animate-delay-3">
            <a href="/signup" className="btn btn-primary btn-lg">
              Start building free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
            <a href="/login" className="btn btn-secondary btn-lg">Sign in</a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div>
          <div className="section-tag">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Why Coder's Nest
          </div>
          <h2 className="section-title">Everything you need to build faster</h2>
          <p className="section-desc">A complete development environment that grows with your team. From solo hacks to large-scale collaboration.</p>
        </div>

        <div className="features-grid">
          {/* Feature Cards */}
          <div className="feature-card">
            <div className="feature-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
            <div className="feature-card-title">Real-time Collaboration</div>
            <div className="feature-card-desc">Work with your team in real time. See live cursors, edits, and comments as they happen — just like pair programming, from anywhere.</div>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg></div>
            <div className="feature-card-title">AI-Powered Assistance</div>
            <div className="feature-card-desc">Intelligent code completion, bug detection, and documentation — powered by cutting-edge AI that understands your codebase.</div>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg></div>
            <div className="feature-card-title">Instant Environments</div>
            <div className="feature-card-desc">Zero-config development environments that spin up in seconds. No more "works on my machine" — every developer gets the same setup.</div>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg></div>
            <div className="feature-card-title">One-Click Deploy</div>
            <div className="feature-card-desc">Ship your project to production with a single click. Built-in CI/CD, automatic HTTPS, and global CDN for every project.</div>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div>
            <div className="feature-card-title">Code Reviews</div>
            <div className="feature-card-desc">Streamlined pull requests, inline comments, and AI-assisted review suggestions that catch issues before they hit production.</div>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></div>
            <div className="feature-card-title">Enterprise Security</div>
            <div className="feature-card-desc">SOC 2 compliant, end-to-end encrypted workspaces, SSO/SAML support, and audit logs for complete visibility.</div>
          </div>
        </div>
      </section>

      {/* Middle CTA Section */}
      <section className="cta-section">
        <div className="cta-card">
          <h2 className="cta-title">Ready to start building?</h2>
          <p className="cta-desc">Join over 50,000 developers already using Coder's Nest. Free forever for individuals.</p>
          <div className="cta-actions">
            <a href="/signup" className="btn-cta-primary">
              Create free account
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" style={{ marginLeft: '8px' }}>
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
            <a href="/login" className="btn-cta-secondary">Sign in instead</a>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '100px 24px', background: 'var(--bg-page)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div className="section-tag" style={{ justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Simple pricing
            </div>
            <h2 className="section-title" style={{ marginTop: '8px' }}>Plans for every team</h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: '1.7' }}>
              Start free. Scale when you're ready. No hidden fees, no surprises — cancel any time.
            </p>
            
            {/* React State Driven Toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginTop: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '9999px', padding: '4px 6px' }}>
              <button 
                onClick={() => setBilling('monthly')}
                style={{
                  padding: '7px 18px', borderRadius: '9999px', border: 'none', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                  background: billing === 'monthly' ? 'var(--accent)' : 'transparent',
                  color: billing === 'monthly' ? '#fff' : 'var(--text-muted)'
                }}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBilling('annual')}
                style={{
                  padding: '7px 18px', borderRadius: '9999px', border: 'none', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                  background: billing === 'annual' ? 'var(--accent)' : 'transparent',
                  color: billing === 'annual' ? '#fff' : 'var(--text-muted)'
                }}
              >
                Annual <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.12)', color: 'var(--success)', padding: '2px 6px', borderRadius: '9999px', marginLeft: '4px', fontWeight: '700' }}>−20%</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '24px', alignItems: 'start' }}>
            
            {/* Free Tier */}
            <div 
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Free</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontSize: '2.6rem', fontWeight: '800', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>$0</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/month</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>Perfect for solo developers exploring Coder's Nest.</p>
              <a 
                href="/signup" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 20px', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none', marginBottom: '28px' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              >
                Get started free
              </a>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>3 active projects</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>1 workspace</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>50 AI assists / month</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>Community support</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>2 GB storage</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" /></svg>No team collaboration</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" /></svg>No custom domain</div>
              </div>
            </div>

            {/* Pro Tier */}
            <div 
              style={{ background: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '20px', padding: '32px', position: 'relative', overflow: 'hidden', transition: 'all 0.2s', transform: 'translateY(-8px)' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-14px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(37,99,235,0.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ position: 'absolute', top: '0', right: '0', background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.1em', padding: '6px 16px', borderBottomLeftRadius: '12px', textTransform: 'uppercase' }}>Most Popular</div>
              <div style={{ position: 'absolute', inset: '0', background: 'radial-gradient(circle at 80% 10%,rgba(255,255,255,0.12),transparent 60%)', pointerEvents: 'none' }}></div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', position: 'relative' }}>Pro</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px', position: 'relative' }}>
                <span style={{ fontSize: '2.6rem', fontWeight: '800', letterSpacing: '-0.04em', color: '#fff' }}>{proPrice}</span>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>/mo per seat</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '24px', position: 'relative' }}>For growing teams who need real-time collaboration and AI power.</p>
              <a 
                href="/signup" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', border: 'none', background: '#fff', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none', marginBottom: '28px', position: 'relative' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Start Pro trial
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </a>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>Unlimited projects</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>Up to 10 workspaces</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>Unlimited AI assists</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>Real-time collaboration</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>50 GB storage</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>Priority email support</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>Custom domain</div>
              </div>
            </div>

            {/* Enterprise Tier */}
            <div 
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Enterprise</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontSize: '2.6rem', fontWeight: '800', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>Custom</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>Tailored for large organizations with advanced security and compliance needs.</p>
              <a 
                href="#" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px 20px', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none', marginBottom: '28px' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              >
                Contact sales →
              </a>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>Everything in Pro</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>Unlimited workspaces &amp; seats</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>SSO / SAML login</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>Audit logs &amp; compliance</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>1 TB storage</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>Dedicated Slack support</div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', alignItems: 'center' }}><svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="3 8 6 11 13 4" /></svg>99.99% SLA uptime</div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div style={{ marginTop: '56px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '20px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Can I switch plans?</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>Yes, upgrade or downgrade at any time. Changes take effect at the next billing cycle with prorated adjustments.</div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Is there a free trial?</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>Pro includes a 14-day free trial with no credit card required. Enterprise has a custom pilot program.</div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>What payment methods?</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>We accept all major credit cards, PayPal, and bank transfers for annual Enterprise contracts.</div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Open-source discount?</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>Public open-source projects get Pro features for free. Apply through our OSS program.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <div className="footer-inner">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 3 1 9 5 15" />
                <polyline points="13 3 17 9 13 15" />
              </svg>
            </div>
            Coder's Nest
          </div>
          <p className="footer-copy">© 2026 Coder's Nest. All rights reserved.</p>
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy</a>
            <a href="#" className="footer-link">Terms</a>
            <a href="#" className="footer-link">Docs</a>
            <a href="#" className="footer-link">Blog</a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;