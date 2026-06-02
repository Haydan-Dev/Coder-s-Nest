import React, {
  useEffect,
  useState,
} from "react";

import {
  API,
  Utils,
  MOCK,
} from "../js/shared.jsx";

/* ── MOCK DATA ───────────────────────────────── */

if (!MOCK.projects) {

  MOCK.projects = [

    {
      id: 1,
      name: "Coder's Nest",
      ownerName: "Haydan",
      ownerEmail: "haydan@gmail.com",
      memberCount: 12,
      language: "TypeScript",
      isPublic: false,
      status: "active",
      lastActivityAt: "2026-05-26T10:00:00",
    },

    {
      id: 2,
      name: "Realtime Chat",
      ownerName: "Ahmed",
      ownerEmail: "ahmed@gmail.com",
      memberCount: 8,
      language: "Go",
      isPublic: true,
      status: "active",
      lastActivityAt: "2026-05-24T15:20:00",
    },

    {
      id: 3,
      name: "AI Workspace",
      ownerName: "Ali",
      ownerEmail: "ali@gmail.com",
      memberCount: 5,
      language: "Python",
      isPublic: false,
      status: "frozen",
      lastActivityAt: "2026-05-21T11:00:00",
    },

    {
      id: 4,
      name: "Rust Engine",
      ownerName: "Usman",
      ownerEmail: "usman@gmail.com",
      memberCount: 14,
      language: "Rust",
      isPublic: true,
      status: "active",
      lastActivityAt: "2026-05-18T08:40:00",
    },

    {
      id: 5,
      name: "Mobile API",
      ownerName: "Bilal",
      ownerEmail: "bilal@gmail.com",
      memberCount: 3,
      language: "Java",
      isPublic: false,
      status: "active",
      lastActivityAt: "2026-05-17T09:15:00",
    },

    {
      id: 6,
      name: "Analytics Core",
      ownerName: "Hamza",
      ownerEmail: "hamza@gmail.com",
      memberCount: 11,
      language: "TypeScript",
      isPublic: true,
      status: "frozen",
      lastActivityAt: "2026-05-14T13:10:00",
    },

    {
      id: 7,
      name: "iOS Builder",
      ownerName: "Taha",
      ownerEmail: "taha@gmail.com",
      memberCount: 7,
      language: "Swift",
      isPublic: false,
      status: "active",
      lastActivityAt: "2026-05-11T17:00:00",
    },

    {
      id: 8,
      name: "Ruby CMS",
      ownerName: "Farhan",
      ownerEmail: "farhan@gmail.com",
      memberCount: 9,
      language: "Ruby",
      isPublic: true,
      status: "active",
      lastActivityAt: "2026-05-10T21:30:00",
    },

  ];
}

/* ── COLORS ───────────────────────────────────── */

const LANG_COLORS = {
  TypeScript: "#3b82f6",
  Python: "#f59e0b",
  Rust: "#f97316",
  Go: "#06b6d4",
  Java: "#ef4444",
  Ruby: "#dc2626",
  "C++": "#a855f7",
  Kotlin: "#8b5cf6",
  Swift: "#f97316",
};

/* ── PAGE ─────────────────────────────────────── */

export default function Projects() {

  const [projects, setProjects] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [limit] =
    useState(15);

  const [total, setTotal] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  /* ── LOAD ─────────────────────────────────── */

  useEffect(() => {

    loadProjects();

  }, [search, status, page]);

  async function loadProjects() {

    setLoading(true);

    try {

      let list = [...MOCK.projects];

      /* SEARCH */

      if (search) {

        const s =
          search.toLowerCase();

        list = list.filter(
          (p) =>
            p.name
              .toLowerCase()
              .includes(s) ||

            p.ownerName
              .toLowerCase()
              .includes(s)
        );
      }

      /* FILTER */

      if (status) {

        list = list.filter(
          (p) =>
            p.status === status
        );
      }

      /* PAGINATION */

      const start =
        (page - 1) * limit;

      const end =
        start + limit;

      const paginated =
        list.slice(start, end);

      setProjects(paginated);

      setTotal(list.length);

    } catch (e) {

      Utils.toast(
        "Failed to load projects.",
        "error"
      );

    } finally {

      setLoading(false);
    }
  }

  /* ── PAGINATION ───────────────────────────── */

  const totalPages = Math.ceil(
    total / limit
  );

  /* ── ACTIONS ──────────────────────────────── */

  async function toggleFreeze(p) {

    try {

      const index =
        MOCK.projects.findIndex(
          (x) => x.id === p.id
        );

      if (index !== -1) {

        MOCK.projects[index].status =
          p.status === "frozen"
            ? "active"
            : "frozen";
      }

      Utils.toast(
        p.status === "frozen"
          ? `"${p.name}" is now active.`
          : `"${p.name}" frozen.`,
        "success"
      );

      loadProjects();

    } catch (e) {

      Utils.toast(
        "Action failed.",
        "error"
      );
    }
  }

  async function deleteProject(p) {

    const ok = window.confirm(
      `"${p.name}" will be permanently deleted.\n\nContinue?`
    );

    if (!ok) {
      return;
    }

    try {

      MOCK.projects =
        MOCK.projects.filter(
          (x) => x.id !== p.id
        );

      Utils.toast(
        "Project deleted.",
        "success"
      );

      loadProjects();

    } catch (e) {

      Utils.toast(
        "Failed to delete.",
        "error"
      );
    }
  }

  /* ── UI ───────────────────────────────────── */

  return (

    <main className="page-content">

      {/* HEADER */}

      <div className="page-header">

        <h1>
          Projects
        </h1>

        <p>
          {total.toLocaleString()} projects
        </p>

      </div>

      {/* FILTERS */}

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
            placeholder="Search projects…"
            value={search}
            onChange={(e) => {

              setPage(1);

              setSearch(
                e.target.value
              );
            }}
          />

        </div>

        <select
          value={status}
          onChange={(e) => {

            setPage(1);

            setStatus(
              e.target.value
            );
          }}
        >

          <option value="">
            All statuses
          </option>

          <option value="active">
            Active
          </option>

          <option value="frozen">
            Frozen
          </option>

        </select>

      </div>

      {/* TABLE */}

      <div className="table-wrap">

        <table>

          <thead>

            <tr>

              <th>Project</th>

              <th>Owner</th>

              <th>Members</th>

              <th>Language</th>

              <th>Visibility</th>

              <th>Status</th>

              <th>Last Activity</th>

              <th
                style={{
                  textAlign:
                    "right",
                }}
              >
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {/* LOADING */}

            {loading && (

              [...Array(8)].map(
                (_, i) => (

                  <tr key={i}>

                    {[...Array(8)].map(
                      (_, j) => (

                        <td key={j}>

                          <div
                            className="skeleton sk-text"
                            style={{
                              width:
                                "70%",
                            }}
                          />

                        </td>
                      )
                    )}

                  </tr>
                )
              )
            )}

            {/* DATA */}

            {!loading &&
              projects.map((p) => {

                const lc =
                  LANG_COLORS[
                    p.language
                  ] || "#888";

                const frozen =
                  p.status ===
                  "frozen";

                return (

                  <tr key={p.id}>

                    <td>

                      <span
                        className="mono"
                        style={{
                          fontWeight: 500,
                        }}
                      >

                        {p.name}

                      </span>

                    </td>

                    <td>

                      <div
                        className="td-name"
                      >
                        {p.ownerName}
                      </div>

                      <div
                        className="td-email"
                      >
                        {p.ownerEmail}
                      </div>

                    </td>

                    <td>
                      {p.memberCount}
                    </td>

                    <td>

                      {p.language ? (

                        <span
                          className="lang-badge"
                          style={{
                            background:
                              `${lc}1a`,
                            color: lc,
                          }}
                        >

                          {p.language}

                        </span>

                      ) : (

                        <span
                          className="text-muted"
                        >
                          —
                        </span>
                      )}

                    </td>

                    <td
                      className="text-muted"
                      style={{
                        fontSize:
                          "12px",
                      }}
                    >

                      {p.isPublic
                        ? "🌐 Public"
                        : "🔒 Private"}

                    </td>

                    <td>

                      <span
                        className={`badge badge-${p.status}`}
                      >

                        {p.status}

                      </span>

                    </td>

                    <td
                      className="text-muted"
                    >

                      {p.lastActivityAt
                        ? Utils.timeAgo(
                            p.lastActivityAt
                          )
                        : "No activity"}

                    </td>

                    <td>

                      <div
                        className="td-actions"
                      >

                        <button
                          className="btn btn-sm btn-link-muted"
                          onClick={() =>
                            toggleFreeze(
                              p
                            )
                          }
                        >

                          {frozen
                            ? "▶ Unfreeze"
                            : "❄ Freeze"}

                        </button>

                        <button
                          className="btn btn-sm btn-link-danger"
                          onClick={() =>
                            deleteProject(
                              p
                            )
                          }
                        >

                          ✕ Delete

                        </button>

                      </div>

                    </td>

                  </tr>
                );
              })}

          </tbody>

        </table>

        {/* PAGINATION */}

        <div className="pagination">

          <span className="pagination-info">

            Page {page} of{" "}
            {totalPages || 1}

          </span>

          <div className="pagination-btns">

            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() =>
                setPage(
                  page - 1
                )
              }
            >

              ‹

            </button>

            <button
              className="page-btn"
              disabled={
                page >= totalPages
              }
              onClick={() =>
                setPage(
                  page + 1
                )
              }
            >

              ›

            </button>

          </div>

        </div>

      </div>

    </main>
  );
}