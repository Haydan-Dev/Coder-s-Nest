import React, {
  useEffect,
  useState,
  useRef,
} from "react";

import Chart from "chart.js/auto";

import {
  Utils,
  API
} from "../js/shared.jsx";

/* ── PAGE ─────────────────────────────────────── */

export default function Analytics() {

  const [system, setSystem] =
    useState(null);

  const [chartsData, setChartsData] = 
    useState(null);

  const [health, setHealth] = useState(null);

  const [aiPeriod, setAiPeriod] =
    useState("30d");

  const [codeExecPeriod, setCodeExecPeriod] = useState("30d");

  const aiRef = useRef(null);

  const codeExecRef = useRef(null);

  const aiChart = useRef(null);

  const codeExecChart = useRef(null);

  /* ── LOAD ─────────────────────────────────── */

  useEffect(() => {

    loadAnalytics();

  }, []);

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
        console.log("Connected to Admin Dashboard WebSocket (Health)");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.health) setHealth(data.health);
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

  async function loadAnalytics() {

    try {

      const data = await API.getAnalytics();
      setSystem(data.system);
      setChartsData(data.charts);

    } catch (e) {

      Utils.toast(
        "Failed to load analytics.",
        "error"
      );
    }
  }

  /* ── CHARTS ───────────────────────────────── */

  useEffect(() => {

    if (aiRef.current && chartsData) {

      makeChart(
        aiChart,
        aiRef.current,
        chartsData.ai[aiPeriod],
        "#3b82f6"
      );
    }

  }, [aiPeriod, chartsData]);

  useEffect(() => {

    if (codeExecRef.current && chartsData && chartsData.codeExecutions) {

      makeChart(
        codeExecChart,
        codeExecRef.current,
        chartsData.codeExecutions[codeExecPeriod],
        "#f59e0b"
      );
    }

  }, [codeExecPeriod, chartsData]);

  /* ── LOADING ──────────────────────────────── */

  if (!system || !chartsData) {

    return (

      <div className="page-content">

        <div className="card">
          Loading analytics...
        </div>

      </div>
    );
  }

  /* ── UI ───────────────────────────────────── */

  return (

    <main className="page-content">

      {/* HEADER */}
      <div className="page-header">

        <h1>
          Analytics
        </h1>

        <p>
          Platform usage trends
          and system
          performance
        </p>

      </div>

      {/* KPI */}
      <div
        className="grid-4"
        style={{
          marginBottom: "14px",
        }}
      >

        <SysKpi
          icon="⚙"
          color="#3b82f6"
          label="Avg CPU"
          value={`${system.avgCpuPct}%`}
          sub={`Peak: ${system.peakCpuPct}%`}
        />

        <SysKpi
          icon="⚙"
          color="#a855f7"
          label="Avg Memory"
          value={`${system.avgMemPct}%`}
          sub={`Peak: ${system.peakMemPct}%`}
        />

        <SysKpi
          icon="💾"
          color="#22c55e"
          label="Storage Used"
          value={`${system.usedStorageGb} GB`}
          sub={`of ${system.totalStorageGb} GB`}
        />

        <SysKpi
          icon="</>"
          color="#f59e0b"
          label="Code Executions"
          value={`${(
            system.totalCodeExecutions /
            1e6
          ).toFixed(1)}M`}
          sub="All time"
        />

      </div>

      {/* ROW 1 */}
      <div
        className="grid-2"
        style={{
          marginBottom: "14px",
        }}
      >

        {/* AI */}
        <div className="card">

          <div className="chart-card-header">

            <div className="card-title">
              AI Requests
            </div>

            <select
              className="period-select"
              value={aiPeriod}
              onChange={(e) =>
                setAiPeriod(
                  e.target.value
                )
              }
            >

              <option value="7d">
                7 days
              </option>

              <option value="30d">
                30 days
              </option>

              <option value="90d">
                90 days
              </option>

            </select>

          </div>

          <div className="chart-wrap">

            <canvas
              ref={aiRef}
            />

          </div>

        </div>

        {/* CODE EXECUTIONS */}
        <div className="card">

          <div className="chart-card-header">

            <div className="card-title">
              Code Executions
            </div>

            <select
              className="period-select"
              value={codeExecPeriod}
              onChange={(e) =>
                setCodeExecPeriod(e.target.value)
              }
            >

              <option value="7d">
                7 days
              </option>

              <option value="30d">
                30 days
              </option>

              <option value="90d">
                90 days
              </option>

            </select>

          </div>

          <div className="chart-wrap">

            <canvas
              ref={codeExecRef}
            />

          </div>

        </div>

      </div>

      {/* ROW 2 */}
      <div className="grid-2">



        {/* SYSTEM HEALTH */}
        {health ? (
          <HealthCard health={health} />
        ) : (
          <div className="card">
            <div className="skeleton sk-text" style={{ height: "100%" }}></div>
          </div>
        )}

      </div>

    </main>
  );
}

/* ── KPI CARD ─────────────────────────────────── */

function SysKpi({
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
            background:
              `${color}1a`,
            color,
          }}
        >

          {icon}

        </div>

      </div>

    </div>
  );
}



/* ── CHART ───────────────────────────────────── */

function makeChart(
  chartRef,
  canvas,
  data,
  color
) {

  if (chartRef.current) {

    chartRef.current.destroy();
  }

  const labels = data.map(
    (d) => {

      const dt =
        new Date(d.date);

      return dt.toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      );
    }
  );

  chartRef.current =
    new Chart(
      canvas.getContext("2d"),
      {

        type: "line",

        data: {

          labels,

          datasets: [
            {
              data:
                data.map(
                  (d) =>
                    d.value
                ),

              borderColor:
                color,

              borderWidth: 2,

              pointRadius: 0,

              pointHoverRadius:
                4,

              fill: true,

              backgroundColor:
                (ctx) => {

                  const g =
                    ctx.chart.ctx.createLinearGradient(
                      0,
                      0,
                      0,
                      220
                    );

                  g.addColorStop(
                    0,
                    color + "30"
                  );

                  g.addColorStop(
                    1,
                    color + "00"
                  );

                  return g;
                },

              tension: 0.35,
            },
          ],
        },

        options: {

          responsive: true,

          maintainAspectRatio:
            false,

          plugins: {

            legend: {
              display: false,
            },
          },

          scales: {

            x: {

              grid: {
                color:
                  "rgba(255,255,255,.05)",
              },

              ticks: {
                color:
                  "#888",
              },
            },

            y: {

              grid: {
                color:
                  "rgba(255,255,255,.05)",
              },

              ticks: {
                color:
                  "#888",
              },
            },
          },
        },
      }
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