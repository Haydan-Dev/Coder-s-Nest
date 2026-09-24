import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API, Utils } from "../js/shared.jsx";

export default function AuditLogs() {
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get("userId") || "";

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    action: "",
    userId: initialUserId,
    page: 1,
    limit: 15,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  async function loadLogs() {
    try {
      setLoading(true);
      const data = await API.getAuditLogs({
        search: filters.search || undefined,
        action: filters.action || undefined,
        user_id: filters.userId || undefined,
        page: filters.page,
        limit: filters.limit,
      });
      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.log(e);
      if (Utils?.toast) {
        Utils.toast("Failed to load audit logs.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="main-wrap">
      <main className="page-content">
        {/* Header */}
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1>Audit Logs</h1>
            <p id="users-count">
              {total.toLocaleString()} total activity events
            </p>
          </div>
          <button 
            className="btn" 
            style={{ marginBottom: "14px", border: "1px solid var(--border)", background: "var(--card-bg)" }}
            onClick={() => {
              const exportData = logs.map(l => ({
                ID: l.id,
                Action: l.action,
                EntityType: l.entityType,
                EntityID: l.entityId,
                IPAddress: l.ipAddress,
                Timestamp: l.timestamp,
                UserID: l.user.id,
                UserName: l.user.name,
                UserEmail: l.user.email
              }));
              Utils.exportToCSV(exportData, "audit_logs_export.csv");
            }}
          >
            📥 Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="search-wrap" style={{ flex: 1, minWidth: "220px" }}>
            <input
              type="search"
              placeholder="Search by user name…"
              value={filters.search}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  search: e.target.value,
                  page: 1,
                })
              }
            />
          </div>

          <select
            value={filters.action}
            onChange={(e) =>
              setFilters({
                ...filters,
                action: e.target.value,
                page: 1,
              })
            }
          >
            <option value="">All actions</option>
            <option value="login_success">Login Success</option>
            <option value="login_failed">Login Failed</option>
            <option value="project_created">Project Created</option>
            <option value="user_signup">User Signup</option>
          </select>

          {filters.userId && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(59, 130, 246, 0.2)", color: "#3b82f6", padding: "8px 12px", borderRadius: "100px", fontSize: "13px", fontWeight: "600", border: "1px solid rgba(59, 130, 246, 0.4)" }}>
              <span>Filtered by User ID: {filters.userId}</span>
              <button onClick={() => setFilters({ ...filters, userId: "", page: 1 })} style={{ background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", padding: 0, marginLeft: "4px" }} title="Clear filter">&times;</button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Target Entity</th>
                <th>IP Address</th>
                <th style={{ textAlign: "right" }}>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td>Loading...</td>
                    <td>Loading...</td>
                    <td>Loading...</td>
                    <td>Loading...</td>
                    <td style={{ textAlign: "right" }}>Loading...</td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "30px" }}>
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div className="td-user">
                        <div className="td-avatar">{l.user.name?.charAt(0)}</div>
                        <div>
                          <div className="td-name">{l.user.name}</div>
                          <div className="td-email">{l.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ textTransform: "capitalize", fontWeight: "500" }}>
                        {l.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="text-muted">
                      <div style={{ fontWeight: 500, color: "var(--text-color)" }}>
                        {l.entityType === 'USER' && l.targetUser ? (
                          <span>👤 {l.targetUser.name}</span>
                        ) : l.entityType === 'PROJECT' && l.projectName ? (
                          <span>📁 {l.projectName}</span>
                        ) : l.entityType === 'WORKSPACE' && l.workspaceName ? (
                          <span>🗂️ {l.workspaceName}</span>
                        ) : l.entityType ? (
                          `${l.entityType} (#${l.entityId})`
                        ) : "—"}
                      </div>
                      <div style={{ fontSize: "12px", marginTop: "4px" }}>
                        {l.entityType !== 'PROJECT' && l.projectName && (
                          <span style={{ marginRight: "8px", color: "var(--primary)" }}>📁 In {l.projectName}</span>
                        )}
                        {l.entityType !== 'WORKSPACE' && l.workspaceName && (
                          <span style={{ marginRight: "8px", color: "var(--primary)" }}>🗂️ In {l.workspaceName}</span>
                        )}
                        {l.metadata && Object.entries(l.metadata).map(([k, v]) => (
                            <span key={k} style={{ marginRight: "8px", opacity: 0.8, background: "var(--muted)", padding: "2px 6px", borderRadius: "4px" }}>
                                {k.replace(/_/g, ' ')}: {String(v)}
                            </span>
                        ))}
                      </div>
                    </td>
                    <td>{l.ipAddress || "—"}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }} className="text-muted">
                      {Utils.formatDate(l.timestamp)} <br/>
                      <small>{new Date(l.timestamp).toLocaleTimeString()}</small>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <span className="pagination-info">
              Page {filters.page} of {totalPages || 1} — {total} logs
            </span>
            <div className="pagination-btns">
              <button
                className="page-btn"
                disabled={filters.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                ‹
              </button>
              <button
                className="page-btn"
                disabled={filters.page >= totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
