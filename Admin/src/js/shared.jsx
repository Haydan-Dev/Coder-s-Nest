// ── shared.js (React Friendly Version) ─────────────────

import React from "react";

/* ── Utils ───────────────────────────────────────────── */
export const Utils = {

  timeAgo(d) {

    const s = Math.floor(
      (Date.now() - new Date(d)) / 1000
    );

    if (s < 60) {
      return s + "s ago";
    }

    if (s < 3600) {
      return Math.floor(s / 60) + "m ago";
    }

    if (s < 86400) {
      return Math.floor(s / 3600) + "h ago";
    }

    if (s < 2592000) {
      return Math.floor(s / 86400) + "d ago";
    }

    return new Date(d).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  },

  formatDate(d) {

    if (!d) {
      return "—";
    }

    return new Date(d).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  },

  num(n) {

    if (n >= 1e6) {
      return (n / 1e6).toFixed(1) + "M";
    }

    if (n >= 1000) {
      return (n / 1000).toFixed(0) + "K";
    }

    return String(n);
  },

  toast(msg, type = "info") {

    console.log(
      `[${type.toUpperCase()}]`,
      msg
    );

    // temporary
    // later replace with proper toast
  },

  badge(status) {

    const k = (status || "")
      .toLowerCase()
      .replace(/\s+/g, "_");

    return (
      <span
        className={`badge badge-${k}`}
      >
        {(status || "").replace(
          /_/g,
          " "
        )}
      </span>
    );
  },
};

/* ── Auth ────────────────────────────────────────────── */
export const Auth = {

  KEY: "cn_admin_authed",

  isAuthenticated() {

    return (
      sessionStorage.getItem(
        this.KEY
      ) === "1"
    );
  },

  logout() {

    sessionStorage.removeItem(
      this.KEY
    );

    window.location.href = "/";
  },
};

/* ── Mock Data ──────────────────────────────────────── */
export const MOCK = {

  dashboardStats: {

    totalUsers: 2847,
    activeUsers: 1923,
    newUsersToday: 38,
    newUsersThisWeek: 184,
    totalProjects: 9312,
    aiRequestsToday: 14280,
    aiRequestsThisMonth: 421600,
  },

  dashboardActivity: [

    {
      id: 1,
      type: "user_signup",
      description:
        "New user registered",
      actorName: "Haydan",
      timestamp:
        "2026-05-26T10:00:00",
    },

    {
      id: 2,
      type: "project_created",
      description:
        "Created a new project",
      actorName: "Ahmed",
      timestamp:
        "2026-05-26T09:30:00",
    },

    {
      id: 3,
      type: "plan_upgraded",
      description:
        "Upgraded to Pro plan",
      actorName: "Ali",
      timestamp:
        "2026-05-26T08:00:00",
    },
  ],

  systemHealth: {

    uptimePct: 99.97,
    apiLatencyMs: 84,
    errorRatePct: 0.12,
    dbConnections: 42,
    cpuUsagePct: 42,
    memUsagePct: 67,
  },

  users: [

    {
      id: 1,
      name: "Haydan",
      email: "haydan@gmail.com",
      role: "super_admin",
      plan: "pro",
      status: "active",
      projectCount: 14,
      lastLoginAt:
        "2026-05-26T08:00:00",
    },

    {
      id: 2,
      name: "Ahmed",
      email: "ahmed@gmail.com",
      role: "admin",
      plan: "free",
      status: "blocked",
      projectCount: 4,
      lastLoginAt:
        "2026-05-25T10:00:00",
    },

    {
      id: 3,
      name: "Ali",
      email: "ali@gmail.com",
      role: "user",
      plan: "pro",
      status: "active",
      projectCount: 9,
      lastLoginAt:
        "2026-05-24T12:30:00",
    },
  ],
};

/* ── Pagination ─────────────────────────────────────── */
export function paginate(
  arr,
  page,
  limit
) {

  const p = Math.max(
    1,
    parseInt(page) || 1
  );

  const l = Math.min(
    100,
    Math.max(
      1,
      parseInt(limit) || 15
    )
  );

  return {

    data: arr.slice(
      (p - 1) * l,
      p * l
    ),

    total: arr.length,

    page: p,

    limit: l,
  };
}

/* ── API ───────────────────────────────────────────── */
export const API = {

  BASE: (() => {

    const h =
      window.location.hostname;

    const isLocal =
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "0.0.0.0";

    return isLocal
      ? "http://localhost:8080/api/admin"
      : "/api/admin";
  })(),

  async _req(
    path,
    opts = {}
  ) {

    const res = await fetch(
      this.BASE + path,
      {
        headers: {
          "Content-Type":
            "application/json",
        },

        ...opts,
      }
    );

    if (!res.ok) {
      throw new Error(
        "HTTP " + res.status
      );
    }

    return res.json();
  },

  _qs(p = {}) {

    const o = {};

    Object.entries(p).forEach(
      ([k, v]) => {

        if (
          v != null &&
          v !== ""
        ) {
          o[k] = v;
        }
      }
    );

    return new URLSearchParams(
      o
    ).toString();
  },

  /* ── Dashboard ─────────────────────────────── */

  async getDashboardStats() {

    try {

      return await this._req(
        "/dashboard/stats"
      );

    } catch (e) {

      return MOCK.dashboardStats;
    }
  },

  async getDashboardActivity() {

    try {

      const r =
        await this._req(
          "/dashboard/activity"
        );

      return r.events || r;

    } catch (e) {

      return MOCK.dashboardActivity;
    }
  },

  async getSystemHealth() {

    try {

      return await this._req(
        "/dashboard/system-health"
      );

    } catch (e) {

      return MOCK.systemHealth;
    }
  },

  /* ── Users ─────────────────────────────────── */

  async listUsers(p) {

    try {

      return await this._req(
        "/users?" + this._qs(p)
      );

    } catch (e) {

      let list = [...MOCK.users];

      // search
      if (p?.search) {

        const s =
          p.search.toLowerCase();

        list = list.filter(
          (u) =>
            u.name
              .toLowerCase()
              .includes(s) ||
            u.email
              .toLowerCase()
              .includes(s)
        );
      }

      // role
      if (
        p?.role &&
        p.role !== "all"
      ) {

        list = list.filter(
          (u) =>
            u.role === p.role
        );
      }

      // status
      if (
        p?.status &&
        p.status !== "all"
      ) {

        list = list.filter(
          (u) =>
            u.status === p.status
        );
      }

      return paginate(
        list,
        p?.page,
        p?.limit
      );
    }
  },

  async updateUserRole(
    id,
    role
  ) {

    try {

      return await this._req(
        "/users/" + id + "/role",
        {
          method: "PATCH",

          body: JSON.stringify({
            role,
          }),
        }
      );

    } catch (e) {

      const u =
        MOCK.users.find(
          (x) => x.id === id
        );

      if (u) {
        u.role = role;
      }

      return { ok: true };
    }
  },

  async blockUser(id) {

    try {

      return await this._req(
        "/users/" + id + "/block",
        {
          method: "POST",
        }
      );

    } catch (e) {

      const u =
        MOCK.users.find(
          (x) => x.id === id
        );

      if (u) {
        u.status = "blocked";
      }

      return { ok: true };
    }
  },

  async unblockUser(id) {

    try {

      return await this._req(
        "/users/" + id + "/unblock",
        {
          method: "POST",
        }
      );

    } catch (e) {

      const u =
        MOCK.users.find(
          (x) => x.id === id
        );

      if (u) {
        u.status = "active";
      }

      return { ok: true };
    }
  },
};

/* ── Theme ─────────────────────────────────────────── */

export function initTheme() {

  const theme =
    localStorage.getItem(
      "cn_theme"
    ) || "dark";

  document.documentElement.setAttribute(
    "data-theme",
    theme
  );

  updateThemeBtns(theme);
}

export function updateThemeBtns(
  theme
) {

  document
    .querySelectorAll(
      ".theme-toggle"
    )
    .forEach((btn) => {

      btn.textContent =
        theme === "dark"
          ? "☀"
          : "☾";

      btn.title =
        "Switch to " +
        (theme === "dark"
          ? "light"
          : "dark") +
        " mode";
    });
}

export function toggleTheme() {

  const cur =
    document.documentElement.getAttribute(
      "data-theme"
    ) || "dark";

  const next =
    cur === "dark"
      ? "light"
      : "dark";

  document.documentElement.setAttribute(
    "data-theme",
    next
  );

  localStorage.setItem(
    "cn_theme",
    next
  );

  updateThemeBtns(next);
}