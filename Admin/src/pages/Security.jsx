import React, {
  useEffect,
  useState,
} from "react";

import {
  Utils,
} from "../js/shared.jsx";

/* ── MOCK DATA ───────────────────────────────── */

const MOCK_SUSPICIOUS = [
  {
    id: 1,
    severity: "critical",
    type: "multiple_failed_logins",
    description:
      "42 failed login attempts detected within 5 minutes.",
    ip: "185.92.12.44",
    email: "admin@codersnest.com",
    timestamp: "2026-05-26T09:12:00",
  },

  {
    id: 2,
    severity: "high",
    type: "suspicious_country_access",
    description:
      "Login attempt from unusual country detected.",
    ip: "102.44.18.20",
    email: "haydan@gmail.com",
    timestamp: "2026-05-26T07:42:00",
  },

  {
    id: 3,
    severity: "medium",
    type: "token_abuse",
    description:
      "API token used excessively from single IP.",
    ip: "91.22.11.90",
    email: "dev@codersnest.com",
    timestamp: "2026-05-26T06:18:00",
  },

  {
    id: 4,
    severity: "low",
    type: "password_reset_spam",
    description:
      "Multiple password reset requests detected.",
    ip: "172.44.11.8",
    email: "john@gmail.com",
    timestamp: "2026-05-25T18:30:00",
  },
];

const MOCK_IPS = [
  {
    ip: "185.92.12.44",
    country: "Russia",
    totalAttempts: 132,
    failedAttempts: 44,
    isFlagged: true,
  },

  {
    ip: "102.44.18.20",
    country: "Nigeria",
    totalAttempts: 52,
    failedAttempts: 19,
    isFlagged: true,
  },

  {
    ip: "172.16.1.20",
    country: "India",
    totalAttempts: 40,
    failedAttempts: 4,
    isFlagged: false,
  },

  {
    ip: "91.22.11.90",
    country: "Germany",
    totalAttempts: 76,
    failedAttempts: 12,
    isFlagged: true,
  },

  {
    ip: "192.168.1.5",
    country: "USA",
    totalAttempts: 21,
    failedAttempts: 1,
    isFlagged: false,
  },
];

const MOCK_ATTEMPTS = [
  {
    id: 1,
    success: true,
    email: "haydan@gmail.com",
    ip: "192.168.1.10",
    country: "India",
    timestamp: "2026-05-26T08:12:00",
  },

  {
    id: 2,
    success: false,
    email: "admin@codersnest.com",
    ip: "185.92.12.44",
    country: "Russia",
    timestamp: "2026-05-26T08:01:00",
  },

  {
    id: 3,
    success: false,
    email: "john@gmail.com",
    ip: "102.44.18.20",
    country: "Nigeria",
    timestamp: "2026-05-26T07:44:00",
  },

  {
    id: 4,
    success: true,
    email: "priya@gmail.com",
    ip: "172.16.1.20",
    country: "India",
    timestamp: "2026-05-26T07:11:00",
  },

  {
    id: 5,
    success: false,
    email: "lucas@gmail.com",
    ip: "91.22.11.90",
    country: "Germany",
    timestamp: "2026-05-26T06:48:00",
  },

  {
    id: 6,
    success: true,
    email: "sarah@gmail.com",
    ip: "192.168.1.5",
    country: "USA",
    timestamp: "2026-05-26T05:10:00",
  },

  {
    id: 7,
    success: false,
    email: "dev@codersnest.com",
    ip: "185.92.12.44",
    country: "Russia",
    timestamp: "2026-05-26T04:55:00",
  },

  {
    id: 8,
    success: true,
    email: "ayaan@gmail.com",
    ip: "172.16.1.20",
    country: "India",
    timestamp: "2026-05-25T23:15:00",
  },

  {
    id: 9,
    success: false,
    email: "fatima@gmail.com",
    ip: "102.44.18.20",
    country: "Nigeria",
    timestamp: "2026-05-25T22:41:00",
  },

  {
    id: 10,
    success: true,
    email: "ethan@gmail.com",
    ip: "192.168.1.9",
    country: "Canada",
    timestamp: "2026-05-25T21:08:00",
  },
];

/* ── PAGE ───────────────────────────────────── */

export default function Security() {

  const [suspicious, setSuspicious] =
    useState([]);

  const [ips, setIps] =
    useState([]);

  const [attempts, setAttempts] =
    useState([]);

  const [success, setSuccess] =
    useState("");

  const [page, setPage] =
    useState(1);

  const limit = 20;

  const [loading, setLoading] =
    useState(true);

  /* ── LOAD ───────────────────────────────── */

  useEffect(() => {

    loadSecurity();

  }, [success, page]);

  function loadSecurity() {

    setLoading(true);

    setTimeout(() => {

      setSuspicious(
        MOCK_SUSPICIOUS
      );

      setIps(
        MOCK_IPS
      );

      let filtered =
        [...MOCK_ATTEMPTS];

      if (success !== "") {

        filtered =
          filtered.filter(
            (a) =>
              String(a.success) ===
              success
          );
      }

      setAttempts(
        filtered
      );

      setLoading(false);

    }, 500);
  }

  /* ── PAGINATION ─────────────────────────── */

  const total =
    attempts.length;

  const totalPages =
    Math.ceil(total / limit);

  const paginated =
    attempts.slice(
      (page - 1) * limit,
      page * limit
    );

  /* ── COLORS ─────────────────────────────── */

  const SC = {
    critical:
      "sc-critical",

    high:
      "sc-high",

    medium:
      "sc-medium",

    low:
      "sc-low",
  };

  /* ── UI ─────────────────────────────────── */

  return (

    <main className="page-content">

      {/* HEADER */}
      <div className="page-header">

        <h1>
          Security
        </h1>

        <p>
          Login activity, threat detection, and IP monitoring
        </p>

      </div>

      {/* SUSPICIOUS */}
      <div className="section-label">
        ⚠ Suspicious Activity
      </div>

      <div
        style={{
          marginBottom: "20px",
        }}
      >

        {loading && (

          <>
            <div
              className="skeleton sk-card"
              style={{
                marginBottom:
                  "8px",
              }}
            />

            <div className="skeleton sk-card" />
          </>
        )}

        {!loading &&
          suspicious.map((e) => (

            <div
              key={e.id}
              className={`suspicious-card ${
                SC[e.severity] || ""
              }`}
            >

              <div
                style={{
                  fontSize:
                    "18px",
                }}
              >
                🛡
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "8px",
                    flexWrap:
                      "wrap",
                    marginBottom:
                      "3px",
                  }}
                >

                  <span
                    style={{
                      fontSize:
                        "10px",
                      fontWeight:
                        700,
                      letterSpacing:
                        ".06em",
                      textTransform:
                        "uppercase",
                    }}
                  >

                    {e.severity}

                  </span>

                  <span
                    className="text-muted"
                    style={{
                      fontSize:
                        "11px",
                    }}
                  >
                    ·
                  </span>

                  <span
                    className="mono"
                    style={{
                      fontSize:
                        "12px",
                    }}
                  >

                    {e.type.replace(
                      /_/g,
                      " "
                    )}

                  </span>

                </div>

                <div
                  style={{
                    fontSize:
                      "13px",
                  }}
                >

                  {e.description}

                </div>

                <div
                  className="text-muted"
                  style={{
                    fontSize:
                      "11px",
                    marginTop:
                      "2px",
                  }}
                >

                  IP:
                  {" "}

                  <span className="mono">
                    {e.ip}
                  </span>

                  {e.email &&
                    ` · ${e.email}`}

                </div>

              </div>

              <div className="activity-time">

                {Utils.timeAgo(
                  e.timestamp
                )}

              </div>

            </div>
          ))}

      </div>

      {/* GRID */}
      <div className="grid-1-2">

        {/* IPS */}
        <div>

          <div
            className="section-label"
            style={{
              marginBottom:
                "10px",
            }}
          >

            🚩 Top Failed IPs

          </div>

          <div className="table-wrap">

            {loading && (

              <>
                <div className="ip-row">
                  <div
                    className="skeleton sk-text"
                    style={{
                      height:
                        "38px",
                      width:
                        "100%",
                    }}
                  />
                </div>

                <div className="ip-row">
                  <div
                    className="skeleton sk-text"
                    style={{
                      height:
                        "38px",
                      width:
                        "100%",
                    }}
                  />
                </div>
              </>
            )}

            {!loading &&
              ips.map((ip, i) => {

                const failColor =
                  ip.failedAttempts >
                  5
                    ? "var(--destructive)"
                    : "var(--muted-fg)";

                return (

                  <div
                    key={i}
                    className="ip-row"
                  >

                    <div>

                      <div className="ip-addr">

                        {ip.ip}

                        {ip.isFlagged &&
                          " 🚩"}

                      </div>

                      <div className="ip-meta">

                        {ip.country}
                        {" · "}
                        {
                          ip.totalAttempts
                        }
                        {" requests"}

                      </div>

                    </div>

                    <div
                      className="ip-fails"
                      style={{
                        color:
                          failColor,
                      }}
                    >

                      {
                        ip.failedAttempts
                      }
                      {" failed"}

                    </div>

                  </div>
                );
              })}

          </div>

        </div>

        {/* ATTEMPTS */}
        <div>

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              marginBottom:
                "10px",
            }}
          >

            <div
              className="section-label"
              style={{
                marginBottom: 0,
              }}
            >

              Login Attempts

            </div>

            <select
              className="inline-select"
              style={{
                fontSize:
                  "12px",
              }}
              value={success}
              onChange={(e) => {

                setPage(1);

                setSuccess(
                  e.target.value
                );
              }}
            >

              <option value="">
                All attempts
              </option>

              <option value="true">
                Successful
              </option>

              <option value="false">
                Failed
              </option>

            </select>

          </div>

          <div className="table-wrap">

            <table>

              <thead>

                <tr>

                  <th>
                    Result
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    IP
                  </th>

                  <th>
                    Country
                  </th>

                  <th>
                    When
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading && (

                  [...Array(8)].map(
                    (_, i) => (

                      <tr key={i}>

                        {[...Array(5)].map(
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

                {!loading &&
                  paginated.map(
                    (a) => (

                      <tr
                        key={a.id}
                      >

                        <td>

                          {a.success ? (

                            <span
                              style={{
                                color:
                                  "#22c55e",
                                fontWeight:
                                  600,
                              }}
                            >
                              ✓
                            </span>

                          ) : (

                            <span
                              style={{
                                color:
                                  "#ef4444",
                                fontWeight:
                                  600,
                              }}
                            >
                              ✕
                            </span>
                          )}

                        </td>

                        <td
                          style={{
                            fontSize:
                              "12px",
                            maxWidth:
                              "180px",
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >

                          {a.email}

                        </td>

                        <td
                          className="mono"
                          style={{
                            fontSize:
                              "12px",
                          }}
                        >

                          {a.ip}

                        </td>

                        <td
                          className="text-muted"
                          style={{
                            fontSize:
                              "12px",
                          }}
                        >

                          {a.country ||
                            "—"}

                        </td>

                        <td
                          className="text-muted"
                          style={{
                            fontSize:
                              "12px",
                            whiteSpace:
                              "nowrap",
                          }}
                        >

                          {Utils.timeAgo(
                            a.timestamp
                          )}

                        </td>

                      </tr>
                    )
                  )}

              </tbody>

            </table>

            {/* PAGINATION */}
            <div className="pagination">

              <span className="pagination-info">

                {total}
                {" total attempts"}

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

        </div>

      </div>

    </main>
  );
}