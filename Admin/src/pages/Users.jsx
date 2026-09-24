// ── Users.jsx ─────────────────────────────────────

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API, Utils } from "../js/shared.jsx";

export default function Users() {

  const [users, setUsers] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    page: 1,
    limit: 15,
  });

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ── Load Users ────────────────────────────────
  useEffect(() => {

    const timer = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timer);

  }, [filters]);

  async function loadUsers() {

    try {

      setLoading(true);

      const data = await API.listUsers({
        search: filters.search || undefined,
        role: filters.role || undefined,
        status: filters.status || undefined,
        page: filters.page,
        limit: filters.limit,
      });

      setUsers(data.data || []);
      setTotal(data.total || 0);

    } catch (e) {

      console.log(e);

      if (Utils?.toast) {
        Utils.toast(
          "Failed to load users.",
          "error"
        );
      }

    } finally {
      setLoading(false);
    }
  }

  // ── Pagination ────────────────────────────────
  const totalPages = Math.ceil(
    total / filters.limit
  );



  // ── Block User ────────────────────────────────
  async function blockUser(user) {

    try {

      await API.blockUser(user.id);

      Utils.toast(
        "User blocked.",
        "success"
      );

      loadUsers();

    } catch (e) {

      Utils.toast(
        "Failed to block user.",
        "error"
      );
    }
  }

  // ── Unblock User ──────────────────────────────
  async function unblockUser(user) {

    try {

      await API.unblockUser(user.id);

      Utils.toast(
        "User unblocked.",
        "success"
      );

      loadUsers();

    } catch (e) {

      Utils.toast(
        "Failed to unblock user.",
        "error"
      );
    }
  }

  // ── Force Logout User ──────────────────────────────
  async function forceLogoutUser(user) {
    try {
      await API.forceLogoutUser(user.id);
      Utils.toast(`${user.name} has been forcefully logged out.`, "success");
    } catch (e) {
      Utils.toast("Failed to force logout user.", "error");
    }
  }

  // ── Delete User ──────────────────────────────
  function confirmDeleteUser(user) {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  }

  async function executeDeleteUser() {
    if (!userToDelete) return;
    try {
      await API.deleteUser(userToDelete.id);
      Utils.toast(`${userToDelete.name} has been deleted.`, "success");
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (e) {
      Utils.toast("Failed to delete user.", "error");
    }
  }

  return (

    <div className="main-wrap">

      <main className="page-content">

        {/* Header */}
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1>Users</h1>
            <p id="users-count">
              {total.toLocaleString()} total users
            </p>
          </div>
          <button 
            className="btn" 
            style={{ marginBottom: "14px", border: "1px solid var(--border)", background: "var(--card-bg)" }}
            onClick={() => {
              const exportData = users.map(u => ({
                ID: u.id,
                Name: u.name,
                Email: u.email,
                Role: u.role,
                Plan: u.plan,
                Status: u.status,
                Projects: u.projectCount,
                LastLogin: u.lastLoginAt
              }));
              Utils.exportToCSV(exportData, "users_export.csv");
            }}
          >
            📥 Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="filter-bar">

          <div
            className="search-wrap"
            style={{
              flex: 1,
              minWidth: "220px",
            }}
          >

            <input
              type="search"
              placeholder="Search by name or email…"
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

          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) =>
              setFilters({
                ...filters,
                role: e.target.value,
                page: 1,
              })
            }
          >

            <option value="">
              All roles
            </option>

            <option value="user">
              User
            </option>

            <option value="leader">
              Leader
            </option>

            <option value="admin">
              Admin
            </option>

            <option value="super_admin">
              Super Admin
            </option>

          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value,
                page: 1,
              })
            }
          >

            <option value="">
              All statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="blocked">
              Blocked
            </option>

          </select>

        </div>

        {/* Table */}
        <div className="table-wrap">

          <table>

            <thead>

              <tr>
                <th>User</th>
                <th className="role-col">
                  Role
                </th>
                <th>Plan</th>
                <th>Status</th>
                <th>Projects</th>
                <th>Last Login</th>
                <th
                  style={{
                    textAlign: "right",
                  }}
                >
                  Actions
                </th>
              </tr>

            </thead>

            <tbody>

              {
                loading ? (

                  [...Array(8)].map((_, i) => (
                    <tr key={i}>

                      <td>
                        Loading...
                      </td>

                      <td>
                        Loading...
                      </td>

                      <td>
                        Loading...
                      </td>

                      <td>
                        Loading...
                      </td>

                      <td>
                        Loading...
                      </td>

                      <td>
                        Loading...
                      </td>

                      <td>
                        Loading...
                      </td>

                    </tr>
                  ))

                ) : users.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      style={{
                        textAlign: "center",
                        padding: "30px",
                      }}
                    >
                      No users found.
                    </td>

                  </tr>

                ) : (

                  users.map((u) => (

                    <tr key={u.id}>

                      {/* User */}
                      <td>

                        <div className="td-user">

                          <div className="td-avatar" style={{ position: "relative" }}>
                            {u.name?.charAt(0)}
                            {u.isOnline && (
                              <span
                                title="Online now"
                                style={{
                                  position: "absolute",
                                  bottom: "-2px",
                                  right: "-2px",
                                  width: "12px",
                                  height: "12px",
                                  borderRadius: "50%",
                                  background: "#22c55e",
                                  border: "2px solid var(--bg)",
                                }}
                              />
                            )}
                          </div>

                          <div>

                            <div className="td-name">
                              {u.name}
                            </div>

                            <div className="td-email">
                              {u.email}
                            </div>

                          </div>

                        </div>

                      </td>

                      {/* Role */}
                      <td style={{ textTransform: "capitalize" }}>
                        {
                          Utils?.badge
                            ? Utils.badge(u.role)
                            : u.role
                        }
                      </td>

                      {/* Plan */}
                      <td>
                        {
                          Utils?.badge
                            ? Utils.badge(u.plan)
                            : u.plan
                        }
                      </td>

                      {/* Status */}
                      <td>
                        {
                          Utils?.badge
                            ? Utils.badge(u.status)
                            : u.status
                        }
                      </td>

                      {/* Projects */}
                      <td>
                        {u.projectCount}
                      </td>

                      {/* Last Login */}
                      <td
                        className="text-muted"
                      >

                        {
                          u.lastLoginAt
                            ? Utils?.timeAgo
                              ? Utils.timeAgo(
                                  u.lastLoginAt
                                )
                              : u.lastLoginAt
                            : "Never"
                        }

                      </td>

                      {/* Actions */}
                      <td>

                        <div className="td-actions" style={{ position: "relative" }}>
                          
                          <button
                            className="btn-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === u.id ? null : u.id);
                            }}
                            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "20px", padding: "4px 8px", borderRadius: "8px" }}
                            onMouseEnter={(e)=>e.target.style.background="var(--bg-hover)"}
                            onMouseLeave={(e)=>e.target.style.background="transparent"}
                          >
                            &#8942;
                          </button>

                          {activeDropdown === u.id && (
                            <div
                              className="dropdown-menu"
                              style={{
                                position: "absolute", right: "0", top: "100%", marginTop: "4px",
                                background: "var(--card-bg)", border: "1px solid var(--border)",
                                borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                                minWidth: "160px", zIndex: 10, display: "flex", flexDirection: "column", padding: "4px"
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                style={{ textAlign: "left", padding: "8px 12px", background: "transparent", border: "none", color: "var(--text-color)", cursor: "pointer", borderRadius: "4px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
                                onMouseEnter={(e)=>e.target.style.background="var(--bg-hover)"}
                                onMouseLeave={(e)=>e.target.style.background="transparent"}
                                onClick={() => { setActiveDropdown(null); navigate(`/admin/audit-logs?userId=${u.id}`); }}
                              >
                                📊 View Activity
                              </button>
                              
                              <button
                                style={{ textAlign: "left", padding: "8px 12px", background: "transparent", border: "none", color: "var(--text-color)", cursor: "pointer", borderRadius: "4px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
                                onMouseEnter={(e)=>e.target.style.background="var(--bg-hover)"}
                                onMouseLeave={(e)=>e.target.style.background="transparent"}
                                onClick={() => { setActiveDropdown(null); forceLogoutUser(u); }}
                              >
                                🚪 Force Logout
                              </button>

                              {u.status === "active" ? (
                                <button
                                  style={{ textAlign: "left", padding: "8px 12px", background: "transparent", border: "none", color: "var(--text-color)", cursor: "pointer", borderRadius: "4px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
                                  onMouseEnter={(e)=>e.target.style.background="var(--bg-hover)"}
                                  onMouseLeave={(e)=>e.target.style.background="transparent"}
                                  onClick={() => { setActiveDropdown(null); blockUser(u); }}
                                >
                                  ⊘ Block User
                                </button>
                              ) : (
                                <button
                                  style={{ textAlign: "left", padding: "8px 12px", background: "transparent", border: "none", color: "var(--text-color)", cursor: "pointer", borderRadius: "4px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
                                  onMouseEnter={(e)=>e.target.style.background="var(--bg-hover)"}
                                  onMouseLeave={(e)=>e.target.style.background="transparent"}
                                  onClick={() => { setActiveDropdown(null); unblockUser(u); }}
                                >
                                  ✓ Unblock User
                                </button>
                              )}
                              
                              <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }}></div>
                              
                              <button
                                style={{ textAlign: "left", padding: "8px 12px", background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", borderRadius: "4px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
                                onMouseEnter={(e)=>{e.target.style.background="rgba(239, 68, 68, 0.1)"}}
                                onMouseLeave={(e)=>{e.target.style.background="transparent"}}
                                onClick={() => { setActiveDropdown(null); confirmDeleteUser(u); }}
                              >
                                🗑️ Delete User
                              </button>
                            </div>
                          )}

                        </div>

                      </td>

                    </tr>
                  ))
                )
              }

            </tbody>

          </table>

          {/* Pagination */}
          <div className="pagination">

            <span
              className="pagination-info"
            >

              Page {filters.page} of{" "}
              {totalPages || 1}
              {" — "}
              {total} users

            </span>

            <div className="pagination-btns">

              <button
                className="page-btn"
                disabled={filters.page <= 1}
                onClick={() =>
                  setFilters({
                    ...filters,
                    page:
                      filters.page - 1,
                  })
                }
              >
                ‹
              </button>

              <button
                className="page-btn"
                disabled={
                  filters.page >=
                  totalPages
                }
                onClick={() =>
                  setFilters({
                    ...filters,
                    page:
                      filters.page + 1,
                  })
                }
              >
                ›
              </button>

            </div>

          </div>

        </div>

      </main>

      {/* Delete User Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 100 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "450px", background: "var(--bg)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 48px rgba(0,0,0,0.5)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            <div className="modal-body" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "16px", textAlign: "center", alignItems: "center" }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', marginBottom: '8px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </div>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "600", color: "var(--text-h)" }}>Delete User?</h2>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong>{userToDelete?.name}</strong>? This action will disable their account and they will no longer be able to log in.
              </p>
            </div>
            
            <div className="modal-footer" style={{ padding: "20px 32px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "12px", background: "rgba(0,0,0,0.1)" }}>
              <button style={{ flex: 1, padding: "10px", borderRadius: "8px", fontWeight: "600", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "var(--text-muted)", cursor: "pointer", transition: "0.2s" }} onClick={() => setIsDeleteModalOpen(false)} onMouseEnter={(e)=>{e.target.style.background="rgba(255,255,255,0.05)"; e.target.style.color="var(--text-h)"}} onMouseLeave={(e)=>{e.target.style.background="transparent"; e.target.style.color="var(--text-muted)"}}>Cancel</button>
              <button style={{ flex: 1, padding: "10px", borderRadius: "8px", fontWeight: "600", background: "var(--danger)", color: "#fff", border: "none", cursor: "pointer", transition: "0.2s" }} onClick={executeDeleteUser} onMouseEnter={(e)=>e.target.style.filter="brightness(1.1)"} onMouseLeave={(e)=>e.target.style.filter="none"}>Delete User</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}