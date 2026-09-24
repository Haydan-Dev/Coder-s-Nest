import React, {
  useEffect,
  useState,
} from "react";

import {
  API,
  Utils,
  MOCK,
} from "../js/shared.jsx";



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

  /* ── OPTIONS MODAL STATE ── */
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [projectLanguages, setProjectLanguages] = useState([]);
  const [projectColors, setProjectColors] = useState([]);
  
  const [newLangName, setNewLangName] = useState("");
  const [newLangColor, setNewLangColor] = useState("#3b82f6");

  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#10b981");

  /* ── LOAD ─────────────────────────────────── */

  useEffect(() => {

    loadProjects();
    loadOptions();

  }, [search, status, page]);

  async function loadOptions() {
    try {
      const data = await API.getSettings();
      setProjectLanguages(data.project_languages || [
        { name: "TypeScript", hex: "#3178c6" },
        { name: "JavaScript", hex: "#f7df1e" },
        { name: "Python", hex: "#3776ab" },
      ]);
      setProjectColors(data.project_colors || [
        { name: "blue", hex: "#3b82f6" },
        { name: "purple", hex: "#a855f7" },
        { name: "green", hex: "#22c55e" },
      ]);
    } catch (e) {
      console.log("Failed to load options");
    }
  }

  async function saveOptions() {
    try {
      await API.updateSettings({
        project_languages: projectLanguages,
        project_colors: projectColors
      });
      Utils.toast("Options saved successfully.", "success");
      setIsOptionsModalOpen(false);
    } catch (e) {
      Utils.toast("Failed to save options.", "error");
    }
  }

  function addLanguage() {
    if(!newLangName) return;
    setProjectLanguages([...projectLanguages, { name: newLangName, hex: newLangColor }]);
    setNewLangName("");
  }
  function removeLanguage(index) {
    setProjectLanguages(projectLanguages.filter((_, i) => i !== index));
  }
  
  function addColor() {
    if(!newColorName) return;
    setProjectColors([...projectColors, { name: newColorName, hex: newColorHex }]);
    setNewColorName("");
  }
  function removeColor(index) {
    setProjectColors(projectColors.filter((_, i) => i !== index));
  }

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await API.listProjects({
        search: search || undefined,
        status: status || undefined,
        page: page,
        limit: limit,
      });
      setProjects(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.log(e);
      if (Utils?.toast) {
        Utils.toast("Failed to load projects.", "error");
      }
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
      const res = await API.toggleFreezeProject(p.id);
      Utils.toast(
        res.status === "frozen"
          ? `"${p.name}" frozen.`
          : `"${p.name}" is now active.`,
        "success"
      );
      loadProjects();
    } catch (e) {
      console.log(e);
      if (Utils?.toast) {
        Utils.toast("Action failed.", "error");
      }
    }
  }

  async function deleteProject(p) {
    const ok = window.confirm(`"${p.name}" will be permanently deleted.\n\nContinue?`);
    if (!ok) return;

    try {
      await API.deleteProject(p.id);
      Utils.toast("Project deleted.", "success");
      loadProjects();
    } catch (e) {
      console.log(e);
      if (Utils?.toast) {
        Utils.toast("Failed to delete.", "error");
      }
    }
  }

  /* ── UI ───────────────────────────────────── */

  return (

    <main className="page-content">

      {/* HEADER */}

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1>Projects</h1>
          <p>{total.toLocaleString()} projects</p>
        </div>
        <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
          <button 
            className="btn btn-primary"
            onClick={() => setIsOptionsModalOpen(true)}
          >
            ⚙️ Configure Options
          </button>
          <button 
            className="btn" 
            style={{ border: "1px solid var(--border)", background: "var(--card-bg)" }}
            onClick={() => {
            const exportData = projects.map(p => ({
              ID: p.id,
              Name: p.name,
              OwnerName: p.ownerName,
              OwnerEmail: p.ownerEmail,
              MemberCount: p.memberCount,
              Language: p.language || "None",
              Visibility: p.isPublic ? "Public" : "Private",
              Status: p.status,
              LastActivity: p.lastActivityAt
            }));
            Utils.exportToCSV(exportData, "projects_export.csv");
          }}
        >
          📥 Export CSV
        </button>
        </div>
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

      {/* OPTIONS MODAL */}
      {isOptionsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsOptionsModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 100 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "650px", background: "var(--bg)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 48px rgba(0,0,0,0.5)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            {/* Header */}
            <div className="modal-header" style={{ padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "var(--text-h)" }}>Configure Project Options</h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>Customize the languages and themes available for users.</p>
              </div>
              <button onClick={() => setIsOptionsModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "24px", cursor: "pointer", padding: "4px 8px", borderRadius: "8px", transition: "0.2s" }} onMouseEnter={(e)=>e.target.style.background="rgba(255,255,255,0.1)"} onMouseLeave={(e)=>e.target.style.background="transparent"}>&times;</button>
            </div>
            
            {/* Body */}
            <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto", padding: "32px", display: "flex", flexDirection: "column", gap: "40px" }}>
              
              {/* LANGUAGES */}
              <div>
                <h3 style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "16px", height: "2px", background: "var(--accent)", borderRadius: "2px" }}></span> Language Stacks
                </h3>
                
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", background: "rgba(0,0,0,0.15)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <input type="text" placeholder="Language Name (e.g. Ruby)" value={newLangName} onChange={(e) => setNewLangName(e.target.value)} style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "var(--text-h)", outline: "none", fontSize: "14px", transition: "border 0.2s" }} onFocus={(e)=>e.target.style.borderColor="var(--accent)"} onBlur={(e)=>e.target.style.borderColor="rgba(255,255,255,0.1)"} />
                  
                  <div style={{ position: "relative", width: "42px", height: "42px", borderRadius: "8px", border: "2px solid rgba(255,255,255,0.15)", cursor: "pointer", background: newLangColor, boxShadow: `0 4px 12px ${newLangColor}40`, transition: "0.2s" }} title="Pick brand color" onMouseEnter={(e)=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={(e)=>e.currentTarget.style.transform="none"}>
                    <input type="color" value={newLangColor} onChange={(e) => setNewLangColor(e.target.value)} style={{ opacity: 0, position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }} />
                  </div>
                  
                  <button style={{ padding: "0 24px", borderRadius: "8px", fontWeight: "600", background: "#3b82f6", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }} onClick={addLanguage} onMouseEnter={(e)=>e.target.style.background="#2563eb"} onMouseLeave={(e)=>e.target.style.background="#3b82f6"}>Add</button>
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {projectLanguages.map((l, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", background: `linear-gradient(135deg, ${l.hex}15, ${l.hex}25)`, padding: "6px 14px", borderRadius: "24px", border: `1px solid ${l.hex}40`, transition: "all 0.2s", userSelect: "none" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: l.hex, boxShadow: `0 0 8px ${l.hex}80` }}></div>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: l.hex, letterSpacing: "0.3px" }}>{l.name}</span>
                      <span style={{ cursor: "pointer", color: l.hex, opacity: 0.6, marginLeft: "4px", fontSize: "18px", lineHeight: "1", transition: "0.2s", padding: "0 4px" }} onClick={() => removeLanguage(i)} onMouseEnter={(e)=>e.target.style.opacity="1"} onMouseLeave={(e)=>e.target.style.opacity="0.6"}>&times;</span>
                    </div>
                  ))}
                  {projectLanguages.length === 0 && <span style={{color:"var(--text-muted)", fontSize:"14px", fontStyle:"italic", padding: "8px 0"}}>No languages configured.</span>}
                </div>
              </div>

              {/* COLORS */}
              <div>
                <h3 style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "16px", height: "2px", background: "var(--accent)", borderRadius: "2px" }}></span> Theme Colors
                </h3>
                
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", background: "rgba(0,0,0,0.15)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <input type="text" placeholder="Theme Name (e.g. neon-green)" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "var(--text-h)", outline: "none", fontSize: "14px", transition: "border 0.2s" }} onFocus={(e)=>e.target.style.borderColor="var(--accent)"} onBlur={(e)=>e.target.style.borderColor="rgba(255,255,255,0.1)"} />
                  
                  <div style={{ position: "relative", width: "42px", height: "42px", borderRadius: "8px", border: "2px solid rgba(255,255,255,0.15)", cursor: "pointer", background: newColorHex, boxShadow: `0 4px 12px ${newColorHex}40`, transition: "0.2s" }} title="Pick theme hex" onMouseEnter={(e)=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={(e)=>e.currentTarget.style.transform="none"}>
                    <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} style={{ opacity: 0, position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }} />
                  </div>
                  
                  <button style={{ padding: "0 24px", borderRadius: "8px", fontWeight: "600", background: "#10b981", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)" }} onClick={addColor} onMouseEnter={(e)=>e.target.style.background="#059669"} onMouseLeave={(e)=>e.target.style.background="#10b981"}>Add</button>
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {projectColors.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", background: `linear-gradient(135deg, ${c.hex}15, ${c.hex}25)`, padding: "6px 14px", borderRadius: "24px", border: `1px solid ${c.hex}40`, transition: "all 0.2s", userSelect: "none" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: c.hex, boxShadow: `0 0 8px ${c.hex}80` }}></div>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: c.hex, letterSpacing: "0.3px" }}>{c.name}</span>
                      <span style={{ cursor: "pointer", color: c.hex, opacity: 0.6, marginLeft: "4px", fontSize: "18px", lineHeight: "1", transition: "0.2s", padding: "0 4px" }} onClick={() => removeColor(i)} onMouseEnter={(e)=>e.target.style.opacity="1"} onMouseLeave={(e)=>e.target.style.opacity="0.6"}>&times;</span>
                    </div>
                  ))}
                  {projectColors.length === 0 && <span style={{color:"var(--text-muted)", fontSize:"14px", fontStyle:"italic", padding: "8px 0"}}>No theme colors configured.</span>}
                </div>
              </div>

            </div>
            
            {/* Footer */}
            <div className="modal-footer" style={{ padding: "20px 32px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end", gap: "12px", background: "rgba(0,0,0,0.1)" }}>
              <button style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: "600", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "var(--text-muted)", cursor: "pointer", transition: "0.2s" }} onClick={() => setIsOptionsModalOpen(false)} onMouseEnter={(e)=>{e.target.style.background="rgba(255,255,255,0.05)"; e.target.style.color="var(--text-h)"}} onMouseLeave={(e)=>{e.target.style.background="transparent"; e.target.style.color="var(--text-muted)"}}>Cancel</button>
              <button style={{ padding: "10px 24px", borderRadius: "8px", fontWeight: "600", background: "#3b82f6", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }} onClick={saveOptions} onMouseEnter={(e)=>{e.target.style.background="#2563eb"; e.target.style.transform="translateY(-2px)"}} onMouseLeave={(e)=>{e.target.style.background="#3b82f6"; e.target.style.transform="none"}}>Save Options</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}