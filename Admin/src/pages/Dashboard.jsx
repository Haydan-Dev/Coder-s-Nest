// ── Dashboard.jsx ──────────────────────────────────

import { useEffect, useState } from "react";
import { API, Utils } from "../js/shared.jsx";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {

  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [userTimeframe, setUserTimeframe] = useState('daily');
  const [projectTimeframe, setProjectTimeframe] = useState('daily');
  const [roleTimeframe, setRoleTimeframe] = useState('daily');
  const [statusTimeframe, setStatusTimeframe] = useState('daily');
  const [activity, setActivity] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ws;
    
    function connectWebSocket() {
      // Determine WebSocket URL
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Assuming backend runs on port 8000 locally
      const wsUrl = isLocal 
        ? `ws://localhost:8000/admin/ws/dashboard` 
        : `${wsProtocol}//${window.location.host}/api/admin/ws/dashboard`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Connected to Admin Dashboard WebSocket");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.stats) setStats(data.stats);
          if (data.charts) setCharts(data.charts);
          if (data.activity) setActivity(data.activity);
          if (data.health) setHealth(data.health);
          
          setLoading(false);
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 5s...");
        setTimeout(connectWebSocket, 5000);
      };
    }

    connectWebSocket();

    return () => {
      if (ws) {
        ws.onclose = null; // Prevent auto-reconnect on unmount
        ws.close();
      }
    };
  }, []);

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

        {/* CHARTS GRID */}
        {charts && (
          <div className="grid-2" style={{ marginBottom: "20px" }}>
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">User Growth</div>
                <select 
                  value={userTimeframe} 
                  onChange={(e) => setUserTimeframe(e.target.value)}
                  style={{ 
                    background: '#1f2937', 
                    color: '#f3f4f6', 
                    border: '1px solid #374151', 
                    borderRadius: '6px', 
                    padding: '4px 28px 4px 10px', 
                    outline: 'none', 
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    width: 'auto',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '14px'
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div style={{ height: "300px" }}>
                <Line 
                  options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', stepSize: 1 } } }, plugins: { legend: { display: false } } }} 
                  data={{
                    labels: charts.userGrowth[userTimeframe]?.labels || [],
                    datasets: [{
                      label: 'New Users',
                      data: charts.userGrowth[userTimeframe]?.data || [],
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                      fill: true,
                    }]
                  }} 
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">Project Growth</div>
                <select 
                  value={projectTimeframe} 
                  onChange={(e) => setProjectTimeframe(e.target.value)}
                  style={{ 
                    background: '#1f2937', 
                    color: '#f3f4f6', 
                    border: '1px solid #374151', 
                    borderRadius: '6px', 
                    padding: '4px 28px 4px 10px', 
                    outline: 'none', 
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    width: 'auto',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '14px'
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div style={{ height: "300px" }}>
                <Bar 
                  options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { color: '#9ca3af' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', stepSize: 1 } } }, plugins: { legend: { display: false } } }} 
                  data={{
                    labels: charts.projectGrowth[projectTimeframe]?.labels || [],
                    datasets: [{
                      label: 'New Projects',
                      data: charts.projectGrowth[projectTimeframe]?.data || [],
                      backgroundColor: '#a855f7',
                      borderRadius: 4,
                    }]
                  }} 
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">User Roles</div>
                <select 
                  value={roleTimeframe} 
                  onChange={(e) => setRoleTimeframe(e.target.value)}
                  style={{ 
                    background: '#1f2937', 
                    color: '#f3f4f6', 
                    border: '1px solid #374151', 
                    borderRadius: '6px', 
                    padding: '4px 28px 4px 10px', 
                    outline: 'none', 
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    width: 'auto',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '14px'
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div style={{ height: "300px" }}>
                <Doughnut 
                  options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels: { color: '#9ca3af', usePointStyle: true, padding: 20 } } } }} 
                  data={{
                    labels: charts.userRoles[roleTimeframe]?.labels || [],
                    datasets: [{
                      data: charts.userRoles[roleTimeframe]?.data || [],
                      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'],
                      borderWidth: 0,
                    }]
                  }} 
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">User Status</div>
                <select 
                  value={statusTimeframe} 
                  onChange={(e) => setStatusTimeframe(e.target.value)}
                  style={{ 
                    background: '#1f2937', 
                    color: '#f3f4f6', 
                    border: '1px solid #374151', 
                    borderRadius: '6px', 
                    padding: '4px 28px 4px 10px', 
                    outline: 'none', 
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    width: 'auto',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '14px'
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div style={{ height: "300px" }}>
                <Pie 
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#9ca3af', usePointStyle: true, padding: 20 } } } }} 
                  data={{
                    labels: charts.userStatus[statusTimeframe]?.labels || [],
                    datasets: [{
                      data: charts.userStatus[statusTimeframe]?.data || [],
                      backgroundColor: ['#22c55e', '#4b5563'],
                      borderWidth: 0,
                    }]
                  }} 
                />
              </div>
            </div>
          </div>
        )}

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