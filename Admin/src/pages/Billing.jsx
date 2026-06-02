import React, {
  useEffect,
  useState,
} from "react";

import {
  Utils,
} from "../js/shared.jsx";

/* ── MOCK DATA ───────────────────────────────── */

const MOCK_OVERVIEW = {
  mrr: 48230,
  mrrGrowthPct: 18,
  activeSubscriptions: 942,
  cancelledThisMonth: 27,
  pastDueCount: 13,

  planBreakdown: {
    free: 530,
    pro: 301,
    team: 111,
  },
};

const MOCK_SUBSCRIPTIONS = [
  {
    id: "sub_1",
    userName: "Haydan Khan",
    userEmail: "haydan@gmail.com",
    plan: "pro",
    status: "active",
    amount: 29,
    currentPeriodEnd: "2026-06-22",
  },

  {
    id: "sub_2",
    userName: "Ayaan Patel",
    userEmail: "ayaan@gmail.com",
    plan: "team",
    status: "active",
    amount: 99,
    currentPeriodEnd: "2026-06-28",
  },

  {
    id: "sub_3",
    userName: "Sarah Wilson",
    userEmail: "sarah@gmail.com",
    plan: "free",
    status: "active",
    amount: 0,
    currentPeriodEnd: "2026-06-10",
  },

  {
    id: "sub_4",
    userName: "Ahmed Ali",
    userEmail: "ahmed@gmail.com",
    plan: "pro",
    status: "past_due",
    amount: 29,
    currentPeriodEnd: "2026-05-18",
  },

  {
    id: "sub_5",
    userName: "John Carter",
    userEmail: "john@gmail.com",
    plan: "team",
    status: "cancelled",
    amount: 99,
    cancelledAt: "2026-05-10",
  },

  {
    id: "sub_6",
    userName: "Priya Sharma",
    userEmail: "priya@gmail.com",
    plan: "pro",
    status: "active",
    amount: 29,
    currentPeriodEnd: "2026-06-14",
  },

  {
    id: "sub_7",
    userName: "David Kim",
    userEmail: "david@gmail.com",
    plan: "free",
    status: "active",
    amount: 0,
    currentPeriodEnd: "2026-06-01",
  },

  {
    id: "sub_8",
    userName: "Noah Williams",
    userEmail: "noah@gmail.com",
    plan: "team",
    status: "active",
    amount: 99,
    currentPeriodEnd: "2026-07-02",
  },

  {
    id: "sub_9",
    userName: "Fatima Noor",
    userEmail: "fatima@gmail.com",
    plan: "pro",
    status: "cancelled",
    amount: 29,
    cancelledAt: "2026-05-02",
  },

  {
    id: "sub_10",
    userName: "Ethan Brown",
    userEmail: "ethan@gmail.com",
    plan: "free",
    status: "active",
    amount: 0,
    currentPeriodEnd: "2026-06-05",
  },

  {
    id: "sub_11",
    userName: "Riya Verma",
    userEmail: "riya@gmail.com",
    plan: "pro",
    status: "active",
    amount: 29,
    currentPeriodEnd: "2026-06-20",
  },

  {
    id: "sub_12",
    userName: "Lucas Miller",
    userEmail: "lucas@gmail.com",
    plan: "team",
    status: "past_due",
    amount: 99,
    currentPeriodEnd: "2026-05-12",
  },
];

/* ── PAGE ───────────────────────────────────── */

export default function Billing() {

  const [overview, setOverview] =
    useState(null);

  const [subscriptions, setSubscriptions] =
    useState([]);

  const [plan, setPlan] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [page, setPage] =
    useState(1);

  const limit = 15;

  const [loading, setLoading] =
    useState(true);

  /* ── LOAD ───────────────────────────────── */

  useEffect(() => {

    loadBilling();

  }, [plan, status, page]);

  function loadBilling() {

    setLoading(true);

    setTimeout(() => {

      let filtered =
        [...MOCK_SUBSCRIPTIONS];

      if (plan) {

        filtered =
          filtered.filter(
            (s) =>
              s.plan === plan
          );
      }

      if (status) {

        filtered =
          filtered.filter(
            (s) =>
              s.status === status
          );
      }

      setOverview(
        MOCK_OVERVIEW
      );

      setSubscriptions(
        filtered
      );

      setLoading(false);

    }, 500);
  }

  /* ── PAGINATION ─────────────────────────── */

  const total =
    subscriptions.length;

  const totalPages =
    Math.ceil(total / limit);

  const paginated =
    subscriptions.slice(
      (page - 1) * limit,
      page * limit
    );

  /* ── UPDATE PLAN ────────────────────────── */

  function changePlan(id, value) {

    const updated =
      subscriptions.map((s) => {

        if (s.id === id) {

          return {
            ...s,
            plan: value,
          };
        }

        return s;
      });

    setSubscriptions(updated);

    Utils.toast(
      "Plan updated.",
      "success"
    );
  }

  /* ── UI ─────────────────────────────────── */

  return (

    <main className="page-content">

      {/* HEADER */}
      <div className="page-header">

        <h1>
          Billing
        </h1>

        <p>
          Subscription management and revenue overview
        </p>

      </div>

      {/* KPI */}
      <div
        className="grid-4"
        style={{
          marginBottom: "14px",
        }}
      >

        {overview && (

          <>
            <BillingKPI
              icon="$"
              color="#22c55e"
              label="Monthly Revenue"
              value={`$${overview.mrr.toLocaleString()}`}
              sub={`+${overview.mrrGrowthPct}% growth`}
            />

            <BillingKPI
              icon="↑"
              color="#3b82f6"
              label="Active Subscriptions"
              value={overview.activeSubscriptions}
              sub={`Pro: ${overview.planBreakdown.pro} · Team: ${overview.planBreakdown.team}`}
            />

            <BillingKPI
              icon="✕"
              color="#ef4444"
              label="Cancelled This Month"
              value={overview.cancelledThisMonth}
            />

            <BillingKPI
              icon="⚠"
              color="#f59e0b"
              label="Past Due"
              value={overview.pastDueCount}
              sub="Needs attention"
            />
          </>
        )}

      </div>

      {/* PLAN DIST */}
      {overview && (

        <div
          className="card"
          style={{
            marginBottom: "16px",
          }}
        >

          <div
            className="card-title"
            style={{
              marginBottom: "12px",
            }}
          >
            Plan Distribution
          </div>

          <div className="dist-bar">

            <div
              style={{
                width: `${(
                  overview.planBreakdown.free /
                  overview.activeSubscriptions
                ) * 100}%`,
                background: "#6b7280",
              }}
            />

            <div
              style={{
                width: `${(
                  overview.planBreakdown.pro /
                  overview.activeSubscriptions
                ) * 100}%`,
                background: "#3b82f6",
              }}
            />

            <div
              style={{
                width: `${(
                  overview.planBreakdown.team /
                  overview.activeSubscriptions
                ) * 100}%`,
                background: "#22c55e",
              }}
            />

          </div>

          <div className="dist-legend">

            <span>
              <span
                className="dist-dot"
                style={{
                  background:
                    "#6b7280",
                }}
              />

              Free:
              {" "}
              {overview.planBreakdown.free}
            </span>

            <span>
              <span
                className="dist-dot"
                style={{
                  background:
                    "#3b82f6",
                }}
              />

              Pro:
              {" "}
              {overview.planBreakdown.pro}
            </span>

            <span>
              <span
                className="dist-dot"
                style={{
                  background:
                    "#22c55e",
                }}
              />

              Team:
              {" "}
              {overview.planBreakdown.team}
            </span>

          </div>

        </div>
      )}

      {/* FILTERS */}
      <div className="filter-bar">

        <select
          value={plan}
          onChange={(e) => {

            setPage(1);

            setPlan(
              e.target.value
            );
          }}
        >

          <option value="">
            All plans
          </option>

          <option value="free">
            Free
          </option>

          <option value="pro">
            Pro
          </option>

          <option value="team">
            Team
          </option>

        </select>

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

          <option value="cancelled">
            Cancelled
          </option>

          <option value="past_due">
            Past Due
          </option>

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

              <th>Renews / Ends</th>

              <th
                style={{
                  textAlign:
                    "right",
                }}
              >
                Change Plan
              </th>

            </tr>

          </thead>

          <tbody>

            {/* LOADING */}
            {loading && (

              [...Array(8)].map(
                (_, i) => (

                  <tr key={i}>

                    {[...Array(6)].map(
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
              paginated.map(
                (sub) => {

                  const endDate =
                    sub.status ===
                      "cancelled" &&
                    sub.cancelledAt
                      ? `Cancelled ${Utils.formatDate(
                          sub.cancelledAt
                        )}`
                      : Utils.formatDate(
                          sub.currentPeriodEnd
                        );

                  return (

                    <tr
                      key={sub.id}
                    >

                      {/* USER */}
                      <td>

                        <div className="td-name">
                          {sub.userName}
                        </div>

                        <div className="td-email">
                          {sub.userEmail}
                        </div>

                      </td>

                      {/* PLAN */}
                      <td>

                        {Utils.badge(
                          sub.plan
                        )}

                      </td>

                      {/* STATUS */}
                      <td>

                        {Utils.badge(
                          sub.status
                        )}

                      </td>

                      {/* AMOUNT */}
                      <td
                        style={{
                          fontWeight:
                            600,
                        }}
                      >

                        {sub.amount ===
                        0
                          ? "—"
                          : `$${sub.amount}/mo`}

                      </td>

                      {/* DATE */}
                      <td
                        className="text-muted"
                        style={{
                          fontSize:
                            "12px",
                        }}
                      >

                        {endDate}

                      </td>

                      {/* PLAN CHANGE */}
                      <td
                        style={{
                          textAlign:
                            "right",
                        }}
                      >

                        <select
                          className="inline-select"
                          value={
                            sub.plan
                          }
                          onChange={(
                            e
                          ) =>
                            changePlan(
                              sub.id,
                              e.target
                                .value
                            )
                          }
                        >

                          <option value="free">
                            free
                          </option>

                          <option value="pro">
                            pro
                          </option>

                          <option value="team">
                            team
                          </option>

                        </select>

                      </td>

                    </tr>
                  );
                }
              )}

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
              disabled={
                page <= 1
              }
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
                page >=
                totalPages
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

/* ── KPI ─────────────────────────────────────── */

function BillingKPI({
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

          {sub && (

            <div className="stat-sub">
              {sub}
            </div>
          )}

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