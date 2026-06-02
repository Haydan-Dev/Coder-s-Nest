// ── Dashboard.jsx ──────────────────────────────────

import { useEffect, useState } from "react";
import { API, Utils } from "../js/shared.jsx";

export default function Dashboard() {

  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {

    try {

      const results = await Promise.all([
        API.getDashboardStats(),
        API.getDashboardActivity(),
        API.getSystemHealth(),
      ]);

      setStats(results[0]);
      setActivity(results[1]);
      setHealth(results[2]);

    } catch (e) {

      console.log(e);

      if (Utils?.toast) {
        Utils.toast(
          "Failed to load dashboard data.",
          "error"
        );
      }

    } finally {
      setLoading(false);
    }
  }

  // ── Loading State ───────────────────────────────
  if (loading) {
    return (
      <div className="main-wrap">
        <main className="page-content">

          <div className="page-header">
            <h1>Dashboard</h1>
            <p>Platform overview and system health</p>
          </div>

          {/* KPI Skeleton */}
          <div className="kpi-grid">

            <div className="card">
              <div className="skeleton sk-card"></div>
            </div>

            <div className="card">
              <div className="skeleton sk-card"></div>
            </div>

            <div className="card">
              <div className="skeleton sk-card"></div>
            </div>

            <div className="card">
              <div className="skeleton sk-card"></div>
            </div>

          </div>

          {/* Activity + Health */}
          <div className="grid-2-1">

            <div className="card">

              <div className="card-header">
                <div className="card-title">
                  📈 Recent Activity
                </div>
              </div>

              <div
                className="skeleton sk-text"
                style={{ marginBottom: "18px" }}
              ></div>

              <div
                className="skeleton sk-text"
                style={{ marginBottom: "18px" }}
              ></div>

              <div
                className="skeleton sk-text"
                style={{ marginBottom: "18px" }}
              ></div>

            </div>

            <div className="card">

              <div className="card-header">
                <div className="card-title">
                  ⚙ System Health
                </div>
              </div>

              <div
                className="skeleton sk-text"
                style={{
                  height: "60px",
                  marginBottom: "14px",
                }}
              ></div>

              <div className="skeleton sk-text"></div>

            </div>

          </div>

        </main>
      </div>
    );
  }

  // ── Main Dashboard ─────────────────────────────
  return (

    <div className="main-wrap">

      <main className="page-content">

        {/* Header */}
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Platform overview and system health</p>
        </div>

        {/* KPI GRID */}
        <div
          id="kpi-grid"
          className="kpi-grid"
        >

          <KPICard
            icon="👤"
            color="#3b82f6"
            label="Total Users"
            value={
              stats?.totalUsers?.toLocaleString() || "0"
            }
            sub={`+${
              stats?.newUsersToday || 0
            } today`}
          />

          <KPICard
            icon="📊"
            color="#22c55e"
            label="Active Users"
            value={
              stats?.activeUsers?.toLocaleString() || "0"
            }
            sub={`${
              stats?.totalUsers
                ? (
                    (stats.activeUsers /
                      stats.totalUsers) *
                    100
                  ).toFixed(1)
                : 0
            }% of total`}
          />

          <KPICard
            icon="📁"
            color="#a855f7"
            label="Total Projects"
            value={
              stats?.totalProjects?.toLocaleString() || "0"
            }
            sub={`+${
              stats?.newProjectsThisWeek || 0
            } this week`}
          />

          <KPICard
            icon="⚡"
            color="#f59e0b"
            label="AI Requests Today"
            value={
              stats?.aiRequestsToday?.toLocaleString() ||
              "0"
            }
            sub={`${
              Utils?.num
                ? Utils.num(
                    stats?.aiRequestsThisMonth || 0
                  )
                : stats?.aiRequestsThisMonth || 0
            } this month`}
          />

        </div>

        {/* Activity + Health */}
        <div className="grid-2-1">

          {/* Activity */}
          <div
            id="activity-card"
            className="card"
          >

            <div className="card-header">
              <div className="card-title">
                📈 Recent Activity
              </div>
            </div>

            {
              activity.length === 0 ? (
                <div className="empty-state">
                  No activity found.
                </div>
              ) : (
                activity.map((e, index) => (
                  <ActivityItem
                    key={e.id || index}
                    event={e}
                  />
                ))
              )
            }

          </div>

          {/* Health */}
          {
            health && (
              <HealthCard health={health} />
            )
          }

        </div>

      </main>

    </div>
  );
}

/* ── KPI CARD ─────────────────────────────────── */

function KPICard({
  icon,
  color,
  label,
  value,
  sub,
}) {

  return (
    <div className="card">

      <div className="stat-row">

        <div>

          <div className="stat-label">
            {label}
          </div>

          <div className="stat-value">
            {value}
          </div>

          <div className="stat-sub">
            {sub}
          </div>

        </div>

        <div
          className="stat-icon"
          style={{
            background: `${color}1a`,
            color,
          }}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

/* ── Activity Item ────────────────────────────── */

const ACTIVITY_COLORS = {
  user_signup: "#22c55e1a",
  plan_upgraded: "#3b82f61a",
  project_created: "#3b82f61a",
  login_failed: "#f59e0b1a",
  user_blocked: "#ef44441a",
  project_deleted: "#ef44441a",
  plan_cancelled: "#f975161a",
  settings_changed: "#a855f71a",
};

function ActivityItem({ event }) {

  return (

    <div className="activity-item">

      <div
        className="activity-dot"
        style={{
          background:
            ACTIVITY_COLORS[event.type] ||
            "rgba(156,163,175,.1)",
        }}
      >
        ●
      </div>

      <div className="activity-meta">

        <div className="activity-desc">
          {event.description}
        </div>

        <div className="activity-actor">
          {event.actorName}
        </div>

      </div>

      <div className="activity-time">
        {
          Utils?.timeAgo
            ? Utils.timeAgo(event.timestamp)
            : event.timestamp
        }
      </div>

    </div>
  );
}

/* ── Health Card ──────────────────────────────── */

function HealthCard({ health }) {

  const upColor =
    health.uptimePct >= 99.9
      ? "#22c55e"
      : health.uptimePct >= 99
      ? "#f59e0b"
      : "#ef4444";

  return (

    <div
      id="health-card"
      className="card"
    >

      <div className="card-header">
        <div className="card-title">
          ⚙ System Health
        </div>
      </div>

      <div className="health-grid">

        <HealthStat
          label="Uptime"
          value={
            <span style={{ color: upColor }}>
              {health.uptimePct}%
            </span>
          }
        />

        <HealthStat
          label="API Latency"
          value={`${health.apiLatencyMs}ms`}
        />

        <HealthStat
          label="Error Rate"
          value={
            <span style={{ color: "#f59e0b" }}>
              {health.errorRatePct}%
            </span>
          }
        />

        <HealthStat
          label="DB Connections"
          value={health.dbConnections}
        />

      </div>

      <ProgressBar
        label="CPU Usage"
        pct={health.cpuUsagePct}
        color="#3b82f6"
      />

      <ProgressBar
        label="Memory Usage"
        pct={health.memUsagePct}
        color="#a855f7"
      />

    </div>
  );
}

/* ── Health Stat ─────────────────────────────── */

function HealthStat({
  label,
  value,
}) {

  return (
    <div>

      <div className="health-stat-label">
        {label}
      </div>

      <div className="health-stat-val">
        {value}
      </div>

    </div>
  );
}

/* ── Progress Bar ────────────────────────────── */

function ProgressBar({
  label,
  pct,
  color,
}) {

  return (

    <div className="prog-wrap">

      <div className="prog-label">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>

      <div className="prog-bar">

        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: "99px",
            background: color,
          }}
        />

      </div>

    </div>
  );
}