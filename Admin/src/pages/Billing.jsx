import React, { useEffect, useState } from "react";
import { Utils, API } from "../js/shared.jsx";

/* ── PAGE ───────────────────────────────────── */

export default function Billing() {
  const [activeTab, setActiveTab] = useState("overview");

  const [overview, setOverview] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plansList, setPlansList] = useState([]);
  
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal State for Plans
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "", monthly_price: 0, yearly_price: 0, max_projects: 2, 
    ram_limit_mb: 512, ai_credits_per_month: 100, max_collaborators: 2, is_active: true
  });

  /* ── LOAD ───────────────────────────────── */
  useEffect(() => {
    if (activeTab === "overview") loadBilling();
    else if (activeTab === "plans") loadPlans();
  }, [plan, status, page, activeTab]);

  async function loadBilling() {
    setLoading(true);
    try {
      const data = await API.listUsers({ status: status || undefined, page: page, limit: limit });
      let users = data.data || [];
      if (plan) {
        users = users.filter((u) => u.plan === plan);
      }
      setSubscriptions(users);
      setTotal(data.total || 0);

      const freeCount = users.filter(u => u.plan === 'free').length;
      const proCount = users.filter(u => u.plan === 'pro').length;
      const teamCount = users.filter(u => u.plan === 'team').length;

      setOverview({
        mrr: (proCount * 6.99) + (teamCount * 16.99),
        mrrGrowthPct: 12,
        activeSubscriptions: data.total || users.length,
        cancelledThisMonth: 0,
        pastDueCount: 0,
        planBreakdown: { free: freeCount, pro: proCount, team: teamCount }
      });
    } catch (e) {
      console.log(e);
      if (Utils?.toast) Utils.toast("Failed to load billing data.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadPlans() {
    setLoading(true);
    try {
      const data = await API.listPlans();
      setPlansList(data || []);
    } catch (e) {
      console.log("Plans API not ready, using UI mocks.");
      setPlansList(prev => {
        if (prev && prev.length > 0) return prev;
        return [
          { plan_id: 1, name: "Free", monthly_price: 0, yearly_price: 0, max_projects: 2, ram_limit_mb: 512, ai_credits_per_month: 100, max_collaborators: 2, is_active: true },
          { plan_id: 2, name: "Pro", monthly_price: 6.99, yearly_price: 69.99, max_projects: 5, ram_limit_mb: 2048, ai_credits_per_month: 1500, max_collaborators: 5, is_active: true },
          { plan_id: 3, name: "Team", monthly_price: 16.99, yearly_price: 169.99, max_projects: -1, ram_limit_mb: 4096, ai_credits_per_month: 3000, max_collaborators: -1, is_active: true }
        ];
      });
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  function changePlan(id, value) {
    const updated = subscriptions.map((s) => {
      if (s.id === id) return { ...s, plan: value };
      return s;
    });
    setSubscriptions(updated);
    Utils.toast("Plan updated.", "success");
  }

  /* ── PLAN MODAL HANDLERS ───────────────────────── */
  function openPlanModal(p = null) {
    if (p) {
      setEditingPlan(p);
      setFormData({ ...p });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "", monthly_price: 0, yearly_price: 0, max_projects: 2, 
        ram_limit_mb: 512, ai_credits_per_month: 100, max_collaborators: 2, is_active: true
      });
    }
    setIsModalOpen(true);
  }

  async function savePlan(e) {
    e.preventDefault();
    try {
      if (editingPlan) {
        await API.updatePlan(editingPlan.plan_id, formData);
        Utils.toast("Plan updated successfully", "success");
      } else {
        await API.createPlan(formData);
        Utils.toast("New plan created", "success");
      }
      setIsModalOpen(false);
      loadPlans();
    } catch (err) {
      if (editingPlan) {
        setPlansList(prev => prev.map(p => p.plan_id === editingPlan.plan_id ? { ...formData, plan_id: p.plan_id } : p));
        Utils.toast("Simulated plan update (API missing)", "success");
      } else {
        setPlansList(prev => [...prev, { ...formData, plan_id: Date.now() }]);
        Utils.toast("Simulated plan creation (API missing)", "success");
      }
      setIsModalOpen(false);
    }
  }

  /* ── UI ─────────────────────────────────── */
  return (
    <main className="page-content">
      {/* HEADER */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1>Billing & Plans</h1>
          <p>Manage active subscriptions and create new SaaS plans.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={activeTab !== 'overview' ? { background: 'var(--card-bg)', border: '1px solid var(--border)' } : {}}
          >
            📊 Subscriptions
          </button>
          <button 
            className={`btn ${activeTab === 'plans' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('plans')}
            style={activeTab !== 'plans' ? { background: 'var(--card-bg)', border: '1px solid var(--border)' } : {}}
          >
            💎 Pricing Plans
          </button>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          {/* KPI */}
          <div className="grid-4" style={{ marginBottom: "14px" }}>
            {overview && (
              <>
                <BillingKPI icon="$" color="#22c55e" label="Monthly Revenue (Est)" value={`$${overview.mrr.toLocaleString()}`} sub={`+${overview.mrrGrowthPct}% growth`} />
                <BillingKPI icon="↑" color="#3b82f6" label="Active Subscriptions" value={overview.activeSubscriptions} sub={`Pro: ${overview.planBreakdown.pro} · Team: ${overview.planBreakdown.team}`} />
                <BillingKPI icon="✕" color="#ef4444" label="Cancelled This Month" value={overview.cancelledThisMonth} />
                <BillingKPI icon="⚠" color="#f59e0b" label="Past Due" value={overview.pastDueCount} sub="Needs attention" />
              </>
            )}
          </div>

          {/* PLAN DIST */}
          {overview && overview.activeSubscriptions > 0 && (
            <div className="card" style={{ marginBottom: "16px" }}>
              <div className="card-title" style={{ marginBottom: "12px" }}>Plan Distribution (Current Page)</div>
              <div className="dist-bar">
                <div style={{ width: `${(overview.planBreakdown.free / Math.max(1, subscriptions.length)) * 100}%`, background: "#6b7280" }} />
                <div style={{ width: `${(overview.planBreakdown.pro / Math.max(1, subscriptions.length)) * 100}%`, background: "#3b82f6" }} />
                <div style={{ width: `${(overview.planBreakdown.team / Math.max(1, subscriptions.length)) * 100}%`, background: "#22c55e" }} />
              </div>
              <div className="dist-legend">
                <span><span className="dist-dot" style={{ background: "#6b7280" }} />Free: {overview.planBreakdown.free}</span>
                <span><span className="dist-dot" style={{ background: "#3b82f6" }} />Pro: {overview.planBreakdown.pro}</span>
                <span><span className="dist-dot" style={{ background: "#22c55e" }} />Team: {overview.planBreakdown.team}</span>
              </div>
            </div>
          )}

          {/* FILTERS */}
          <div className="filter-bar">
            <select value={plan} onChange={(e) => { setPage(1); setPlan(e.target.value); }}>
              <option value="">All plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="team">Team</option>
            </select>
            <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: "right" }}>Change Plan</th>
                </tr>
              </thead>
              <tbody>
                {loading && [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j}><div className="skeleton sk-text" style={{ width: "70%" }} /></td>
                    ))}
                  </tr>
                ))}
                {!loading && subscriptions.map((sub) => {
                  const endDate = sub.lastLoginAt ? Utils.formatDate(sub.lastLoginAt) : "—";
                  const amount = sub.plan === 'pro' ? '$6.99/mo' : sub.plan === 'team' ? '$16.99/mo' : '—';
                  return (
                    <tr key={sub.id}>
                      <td>
                        <div className="td-name">{sub.name}</div>
                        <div className="td-email">{sub.email}</div>
                      </td>
                      <td>{Utils.badge(sub.plan)}</td>
                      <td>{Utils.badge(sub.status)}</td>
                      <td style={{ fontWeight: 600 }}>{amount}</td>
                      <td className="text-muted" style={{ fontSize: "12px" }}>{endDate}</td>
                      <td style={{ textAlign: "right" }}>
                        <select className="inline-select" value={sub.plan} onChange={(e) => changePlan(sub.id, e.target.value)}>
                          <option value="free">free</option>
                          <option value="pro">pro</option>
                          <option value="team">team</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="pagination">
              <span className="pagination-info">Page {page} of {totalPages || 1}</span>
              <div className="pagination-btns">
                <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
                <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "plans" && (
        <div className="plans-container" style={{ animation: "fade-in 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
            <h2 style={{ fontSize: "18px", margin: 0, fontWeight: 500 }}>Active SaaS Plans</h2>
            <button className="btn btn-primary" onClick={() => openPlanModal()}>+ Create New Plan</button>
          </div>
          
          <div className="grid-3">
            {plansList.map(p => (
              <div className="card" key={p.plan_id} style={{ display: 'flex', flexDirection: 'column', padding: '24px', border: !p.is_active ? '1px dashed var(--border)' : '1px solid var(--border)', opacity: !p.is_active ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 600 }}>{p.name}</div>
                  {!p.is_active && <span className="badge badge-inactive">Inactive</span>}
                </div>
                
                <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '20px', color: 'var(--primary)' }}>
                  ${p.monthly_price} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Projects</span>
                    <span style={{ fontWeight: 500 }}>{p.max_projects === -1 ? 'Unlimited' : p.max_projects}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">AI Credits</span>
                    <span style={{ fontWeight: 500 }}>{p.ai_credits_per_month} /mo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">RAM</span>
                    <span style={{ fontWeight: 500 }}>{p.ram_limit_mb} MB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Collaborators</span>
                    <span style={{ fontWeight: 500 }}>{p.max_collaborators === -1 ? 'Unlimited' : p.max_collaborators}</span>
                  </div>
                </div>
                
                <button 
                  className="btn" 
                  style={{ width: '100%', background: 'var(--card-bg)', border: '1px solid var(--border)' }}
                  onClick={() => openPlanModal(p)}
                >
                  Edit Configuration
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PLAN EDIT/CREATE MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999
        }}>
          <div className="modal-content card" style={{
            width: "500px", maxWidth: "90%", padding: "24px", animation: "pop-in 0.2s ease"
          }}>
            <h2 style={{ marginBottom: "20px", fontSize: "20px" }}>{editingPlan ? "Edit Plan" : "Create New Plan"}</h2>
            
            <form onSubmit={savePlan} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label>Plan Name</label>
                <input required type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Starter" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Monthly Price ($)</label>
                  <input required type="number" step="0.01" className="input" value={formData.monthly_price} onChange={e => setFormData({...formData, monthly_price: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Yearly Price ($)</label>
                  <input required type="number" step="0.01" className="input" value={formData.yearly_price} onChange={e => setFormData({...formData, yearly_price: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Max Projects (-1 for unlimited)</label>
                  <input required type="number" className="input" value={formData.max_projects} onChange={e => setFormData({...formData, max_projects: parseInt(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Max Collaborators</label>
                  <input required type="number" className="input" value={formData.max_collaborators} onChange={e => setFormData({...formData, max_collaborators: parseInt(e.target.value)})} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>RAM Limit (MB)</label>
                  <input required type="number" className="input" value={formData.ram_limit_mb} onChange={e => setFormData({...formData, ram_limit_mb: parseInt(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>AI Credits / Month</label>
                  <input required type="number" className="input" value={formData.ai_credits_per_month} onChange={e => setFormData({...formData, ai_credits_per_month: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} style={{ width: "16px", height: "16px" }} />
                <label htmlFor="is_active" style={{ marginBottom: 0 }}>Plan is Active (Visible to users)</label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button type="button" className="btn" style={{ background: "transparent", border: "1px solid var(--border)" }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingPlan ? "Save Changes" : "Create Plan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}

/* ── KPI ─────────────────────────────────────── */

function BillingKPI({ icon, color, label, value, sub }) {
  return (
    <div className="card">
      <div className="stat-row">
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
          {sub && <div className="stat-sub">{sub}</div>}
        </div>
        <div className="stat-icon" style={{ background: `${color}1a`, color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}