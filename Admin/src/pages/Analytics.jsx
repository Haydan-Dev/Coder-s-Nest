import React, {
  useEffect,
  useState,
  useRef,
} from "react";

import Chart from "chart.js/auto";

import {
  Utils,
} from "../js/shared.jsx";

/* ── MOCK DATA ────────────────────────────────── */

const MOCK_SYSTEM = {
  avgCpuPct: 42,
  peakCpuPct: 88,

  avgMemPct: 63,
  peakMemPct: 91,

  usedStorageGb: 684,
  totalStorageGb: 1024,

  totalAiRequests: 2840000,
  totalCodeExecutions: 1290000,
};

function genSeries(days, min, max) {

  const arr = [];

  for (let i = days; i >= 0; i--) {

    arr.push({
      date:
        new Date(
          Date.now() -
            i *
              24 *
              60 *
              60 *
              1000
        ),

      value:
        Math.floor(
          Math.random() *
            (max - min) +
            min
        ),
    });
  }

  return arr;
}

const AI_USAGE = {
  "7d": genSeries(7, 800, 2000),
  "30d": genSeries(30, 1500, 5000),
  "90d": genSeries(90, 1000, 6000),
};

const ACTIVE_USERS = {
  "7d": genSeries(7, 300, 900),
  "30d": genSeries(30, 800, 2200),
  "90d": genSeries(90, 700, 2600),
};

const PROJECTS = {
  "7d": genSeries(7, 20, 90),
  "30d": genSeries(30, 40, 180),
  "90d": genSeries(90, 60, 220),
};

/* ── PAGE ─────────────────────────────────────── */

export default function Analytics() {

  const [system, setSystem] =
    useState(null);

  const [aiPeriod, setAiPeriod] =
    useState("30d");

  const [
    usersPeriod,
    setUsersPeriod,
  ] = useState("30d");

  const [
    projPeriod,
    setProjPeriod,
  ] = useState("30d");

  const aiRef = useRef(null);

  const usersRef = useRef(null);

  const projRef = useRef(null);

  const aiChart = useRef(null);

  const usersChart =
    useRef(null);

  const projChart =
    useRef(null);

  /* ── LOAD ─────────────────────────────────── */

  useEffect(() => {

    loadAnalytics();

  }, []);

  function loadAnalytics() {

    try {

      setSystem(MOCK_SYSTEM);

    } catch (e) {

      Utils.toast(
        "Failed to load analytics.",
        "error"
      );
    }
  }

  /* ── CHARTS ───────────────────────────────── */

  useEffect(() => {

    if (aiRef.current) {

      makeChart(
        aiChart,
        aiRef.current,
        AI_USAGE[aiPeriod],
        "#3b82f6"
      );
    }

  }, [aiPeriod]);

  useEffect(() => {

    if (usersRef.current) {

      makeChart(
        usersChart,
        usersRef.current,
        ACTIVE_USERS[
          usersPeriod
        ],
        "#22c55e"
      );
    }

  }, [usersPeriod]);

  useEffect(() => {

    if (projRef.current) {

      makeChart(
        projChart,
        projRef.current,
        PROJECTS[
          projPeriod
        ],
        "#a855f7"
      );
    }

  }, [projPeriod]);

  /* ── LOADING ──────────────────────────────── */

  if (!system) {

    return (

      <div className="page-content">

        <div className="card">
          Loading analytics...
        </div>

      </div>
    );
  }

  /* ── STORAGE ──────────────────────────────── */

  const storagePct = (
    (system.usedStorageGb /
      system.totalStorageGb) *
    100
  ).toFixed(1);

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

        {/* USERS */}
        <div className="card">

          <div className="chart-card-header">

            <div className="card-title">
              Active Users
            </div>

            <select
              className="period-select"
              value={
                usersPeriod
              }
              onChange={(e) =>
                setUsersPeriod(
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
              ref={usersRef}
            />

          </div>

        </div>

      </div>

      {/* ROW 2 */}
      <div className="grid-2">

        {/* PROJECTS */}
        <div className="card">

          <div className="chart-card-header">

            <div className="card-title">
              New Projects
            </div>

            <select
              className="period-select"
              value={
                projPeriod
              }
              onChange={(e) =>
                setProjPeriod(
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
              ref={projRef}
            />

          </div>

        </div>

        {/* STORAGE */}
        <div className="card">

          <div
            className="card-title"
            style={{
              marginBottom:
                "14px",
            }}
          >

            Storage
            Utilization

          </div>

          <div className="prog-wrap">

            <div className="prog-label">

              <span>
                Used storage
              </span>

              <span>
                {
                  system.usedStorageGb
                }{" "}
                /{" "}
                {
                  system.totalStorageGb
                }{" "}
                GB
              </span>

            </div>

            <div className="prog-bar">

              <div
                style={{
                  width: `${storagePct}%`,
                  height:
                    "100%",
                  borderRadius:
                    "99px",
                  background:
                    "#3b82f6",
                }}
              />

            </div>

          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "10px",
              marginTop: "14px",
            }}
          >

            <StorageBox
              label="AI Requests"
              value={`${(
                system.totalAiRequests /
                1e6
              ).toFixed(2)}M`}
            />

            <StorageBox
              label="Code Executions"
              value={`${(
                system.totalCodeExecutions /
                1e6
              ).toFixed(1)}M`}
            />

            <StorageBox
              label="Peak CPU"
              value={`${system.peakCpuPct}%`}
            />

            <StorageBox
              label="Peak Memory"
              value={`${system.peakMemPct}%`}
            />

          </div>

        </div>

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

/* ── STORAGE BOX ─────────────────────────────── */

function StorageBox({
  label,
  value,
}) {

  return (

    <div
      style={{
        background:
          "var(--muted)",
        borderRadius: "6px",
        padding: "12px",
      }}
    >

      <div className="health-stat-label">

        {label}

      </div>

      <div
        style={{
          fontSize: "18px",
          fontWeight: 700,
          marginTop: "2px",
        }}
      >

        {value}

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