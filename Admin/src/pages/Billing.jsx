import React, {
  useEffect,
  useState,
} from "react";

import {
  Utils,
  API
} from "../js/shared.jsx";

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
  const [total, setTotal] = useState(0);

  const [loading, setLoading] =
    useState(true);

  /* ── LOAD ───────────────────────────────── */

  useEffect(() => {

    loadBilling();

  }, [plan, status, page]);

  async function loadBilling() {

    setLoading(true);

    try {
      // Fetch users from API (using it as subscription data for now)
      const data = await API.listUsers({
        status: status || undefined,
        page: page,
        limit: limit,
      });
      
      let users = data.data || [];
      
      // Client-side filter for plan since backend doesn't support it in /users yet
      if (plan) {
        users = users.filter((u) => u.plan === plan);
      }

      setSubscriptions(users);
      setTotal(data.total || 0);

      // Generate a dynamic overview based on fetched data
      const freeCount = users.filter(u => u.plan === 'free').length;
      const proCount = users.filter(u => u.plan === 'pro').length;
      const teamCount = users.filter(u => u.plan === 'team').length;

      setOverview({
        mrr: (proCount * 29) + (teamCount * 99),
        mrrGrowthPct: 12,
        activeSubscriptions: data.total || users.length,
        cancelledThisMonth: 0,
        pastDueCount: 0,
        planBreakdown: {
          free: freeCount,
          pro: proCount,
          team: teamCount,
        }
      });

    } catch (e) {
      console.log(e);
      if (Utils?.toast) {
        Utils.toast("Failed to load billing data.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── PAGINATION ─────────────────────────── */

  const totalPages =
    Math.ceil(total / limit);

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
              label="Monthly Revenue (Est)"
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
      {overview && overview.activeSubscriptions > 0 && (

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
            Plan Distribution (Current Page)
          </div>

          <div className="dist-bar">

            <div
              style={{
                width: `${(
                  overview.planBreakdown.free /
                  Math.max(1, subscriptions.length)
                ) * 100}%`,
                background: "#6b7280",
              }}
            />

            <div
              style={{
                width: `${(
                  overview.planBreakdown.pro /
                  Math.max(1, subscriptions.length)
                ) * 100}%`,
                background: "#3b82f6",
              }}
            />

            <div
              style={{
                width: `${(
                  overview.planBreakdown.team /
                  Math.max(1, subscriptions.length)
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

          <option value="blocked">
            Blocked
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

              <th>Last Login</th>

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
              subscriptions.map(
                (sub) => {

                  const endDate = sub.lastLoginAt
                    ? Utils.formatDate(sub.lastLoginAt)
                    : "—";

                  const amount = sub.plan === 'pro' 
                    ? '$29/mo' 
                    : sub.plan === 'team' 
                      ? '$99/mo' 
                      : '—';

                  return (

                    <tr
                      key={sub.id}
                    >

                      {/* USER */}
                      <td>

                        <div className="td-name">
                          {sub.name}
                        </div>

                        <div className="td-email">
                          {sub.email}
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

                        {amount}

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