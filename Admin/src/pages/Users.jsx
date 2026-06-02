// ── Users.jsx ─────────────────────────────────────

import { useEffect, useState } from "react";
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

  // ── Role Update ───────────────────────────────
  async function handleRoleChange(
    userId,
    role
  ) {

    try {

      await API.updateUserRole(
        userId,
        role
      );

      Utils.toast(
        "Role updated.",
        "success"
      );

    } catch (e) {

      Utils.toast(
        "Failed to update role.",
        "error"
      );
    }
  }

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

  return (

    <div className="main-wrap">

      <main className="page-content">

        {/* Header */}
        <div className="page-header">
          <h1>Users</h1>

          <p id="users-count">
            {total.toLocaleString()} total users
          </p>
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

                          <div className="td-avatar">
                            {u.name?.charAt(0)}
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
                      <td>

                        <select
                          className="inline-select"
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(
                              u.id,
                              e.target.value
                            )
                          }
                        >

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

                        <div className="td-actions">

                          {
                            u.status === "active" ? (

                              <button
                                className="btn btn-sm btn-link-danger"
                                onClick={() =>
                                  blockUser(u)
                                }
                              >
                                ⊘ Block
                              </button>

                            ) : (

                              <button
                                className="btn btn-sm btn-link-success"
                                onClick={() =>
                                  unblockUser(u)
                                }
                              >
                                ✓ Unblock
                              </button>

                            )
                          }

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

    </div>
  );
}