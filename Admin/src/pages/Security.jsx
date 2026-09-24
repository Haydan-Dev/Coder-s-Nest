import React, {
  useEffect,
  useState,
} from "react";

import {
  Utils,
  API,
} from "../js/shared.jsx";

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

  async function loadSecurity() {

    setLoading(true);

    try {
      const data = await API.getSecurityLogs();

      setSuspicious(data.suspicious || []);
      setIps(data.ips || []);

      let filtered = data.attempts || [];

      if (success !== "") {
        filtered =
          filtered.filter(
            (a) =>
              String(a.success) ===
              success
          );
      }

      setAttempts(filtered);
    } catch (e) {
      console.error(e);
      Utils.toast("Failed to load security logs", "error");
    } finally {
      setLoading(false);
    }
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

        {!loading && suspicious.length === 0 && (
          <div className="text-muted" style={{ padding: "20px 0" }}>No suspicious activity detected.</div>
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

                    {(e.type || "").replace(
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

            🚩 Top IPs

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

            {!loading && ips.length === 0 && (
              <div className="text-muted" style={{ padding: "20px" }}>No IP data available.</div>
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

                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                      No login attempts found.
                    </td>
                  </tr>
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

            {/* PAGINATION (Attempts) */}
            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: "10px" }}>
                <span className="pagination-info">
                  Page {page} of {totalPages}
                </span>
                <div className="pagination-btns">
                  <button
                    className="page-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    ‹
                  </button>
                  <button
                    className="page-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </main>
  );
}