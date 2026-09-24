import React, {
  useEffect,
  useState,
} from "react";

import {
  API,
  Utils,
} from "../js/shared.jsx";

/* ── PAGE ─────────────────────────────────────── */
export default function Settings() {

  /* ── STATE ───────────────────────────────── */
  const [settingsData, setSettingsData] =
    useState(null);

  const [dirty, setDirty] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  /* ── LOAD ────────────────────────────────── */
  useEffect(() => {

    async function loadSettings() {
      try {
        const data = await API.getSettings();
        
        // Ensure arrays are properly parsed if they somehow come back as strings
        if (typeof data.feature_flags === "string") {
          try { data.feature_flags = JSON.parse(data.feature_flags); } catch (e) { data.feature_flags = []; }
        }
        if (!Array.isArray(data.feature_flags)) {
          data.feature_flags = [];
        }
        
        setSettingsData(data);
      } catch (e) {
        Utils.toast("Failed to load settings.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();

  }, []);

  /* ── DIRTY ───────────────────────────────── */
  function markDirty() {
    setDirty(true);
  }

  /* ── SAVE ────────────────────────────────── */
  async function saveSettings() {

    setSaving(true);

    try {
      await API.updateSettings(settingsData);
      Utils.toast("Settings saved.", "success");
      setDirty(false);
    } catch (e) {
      Utils.toast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  /* ── LOADING ─────────────────────────────── */
  if (loading) {

    return (

      <main className="page-content">

        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1>Settings</h1>
            <p>System configuration and feature management</p>
          </div>
        </div>

        <div id="settings-body">
          <div className="card settings-section">
            <div className="skeleton sk-card"></div>
          </div>
        </div>

      </main>
    );
  }

  /* ── UI ──────────────────────────────────── */
  return (

    <main className="page-content">

      {/* HEADER */}
      <div className="page-header-row">

        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Settings</h1>
          <p>System configuration and feature management</p>
        </div>

        <button
          className={"btn btn-primary " + (!dirty ? "hidden" : "")}
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? "Saving…" : "💾 Save changes"}
        </button>

      </div>

      <div id="settings-body">

        {/* ── Maintenance Mode ─────────────────── */}
        <div className="card settings-section">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "16px" }}>⚠</span>
                <div className="card-title">Maintenance Mode</div>
              </div>
              <div className="card-desc">Shows a maintenance page to all non-admin users.</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settingsData.maintenance_mode || false}
                onChange={(e) => {
                  setSettingsData({ ...settingsData, maintenance_mode: e.target.checked });
                  markDirty();
                }}
              />
              <div className="switch-track"></div>
            </label>
          </div>

          <div
            id="maintenance-msg-wrap"
            style={{ marginTop: "14px", display: settingsData.maintenance_mode ? "" : "none" }}
          >
            <label style={{ fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "6px" }}>
              Maintenance message
            </label>
            <input
              type="text"
              value={settingsData.maintenance_message || ""}
              placeholder="Message shown during maintenance…"
              onChange={(e) => {
                setSettingsData({ ...settingsData, maintenance_message: e.target.value });
                markDirty();
              }}
            />
          </div>
        </div>

        {/* ── Announcement Banner ─────────────── */}
        <div className="card settings-section">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "16px" }}>📢</span>
                <div className="card-title">Announcement Banner</div>
              </div>
              <div className="card-desc">Show a dismissible banner to all users at the top of the app.</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settingsData.announcement_banner || false}
                onChange={(e) => {
                  setSettingsData({ ...settingsData, announcement_banner: e.target.checked });
                  markDirty();
                }}
              />
              <div className="switch-track"></div>
            </label>
          </div>

          <div id="announcement-opts" style={{ marginTop: "14px", display: settingsData.announcement_banner ? "" : "none" }}>
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label>Message</label>
              <input
                type="text"
                value={settingsData.announcement_text || ""}
                placeholder="Announcement text…"
                onChange={(e) => {
                  setSettingsData({ ...settingsData, announcement_text: e.target.value });
                  markDirty();
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label>Type</label>
              <select
                style={{ maxWidth: "160px" }}
                value={settingsData.announcement_type || "info"}
                onChange={(e) => {
                  setSettingsData({ ...settingsData, announcement_type: e.target.value });
                  markDirty();
                }}
              >
                {["info", "warning", "success", "error"].map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div id="ann-preview" className={"ann-preview ann-" + (settingsData.announcement_type || "info")}>
              {settingsData.announcement_text || "Your announcement will appear here."}
            </div>
          </div>
        </div>
        
        {/* ── Access & Limits ───────────────────── */}
        <div className="card settings-section">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontSize: "16px" }}>🔒</span>
            <div>
              <div className="card-title">Access & Limits</div>
              <div className="card-desc">Control user registration, quotas, and platform limits.</div>
            </div>
          </div>
          
          <div className="flag-row">
            <div>
              <div className="flag-label">Allow New Registrations</div>
              <div className="flag-desc">Enable or disable open signups for new users.</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settingsData.allow_registrations !== false} // defaults true
                onChange={(e) => {
                  setSettingsData({ ...settingsData, allow_registrations: e.target.checked });
                  markDirty();
                }}
              />
              <div className="switch-track"></div>
            </label>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
            <div className="form-group">
              <label>AI Daily Limit (per user)</label>
              <input
                type="number"
                value={settingsData.ai_daily_limit || 0}
                onChange={(e) => {
                  setSettingsData({ ...settingsData, ai_daily_limit: parseInt(e.target.value) || 0 });
                  markDirty();
                }}
              />
            </div>
            <div className="form-group">
              <label>Max Upload Size (MB)</label>
              <input
                type="number"
                value={settingsData.max_upload_size_mb || 0}
                onChange={(e) => {
                  setSettingsData({ ...settingsData, max_upload_size_mb: parseInt(e.target.value) || 0 });
                  markDirty();
                }}
              />
            </div>
          </div>
        </div>
        
        {/* ── Integrations & Security ───────────── */}
        <div className="card settings-section">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontSize: "16px" }}>🔑</span>
            <div>
              <div className="card-title">Integrations & Security</div>
              <div className="card-desc">Manage API keys and security blacklists.</div>
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label>OpenAI / AI Service API Key</label>
            <input
              type="password"
              placeholder="sk-..."
              value={settingsData.openai_api_key || ""}
              onChange={(e) => {
                setSettingsData({ ...settingsData, openai_api_key: e.target.value });
                markDirty();
              }}
            />
          </div>
          
          <div className="form-group">
            <label>Blacklisted Domains (comma separated)</label>
            <input
              type="text"
              placeholder="tempmail.com, 10minutemail.com"
              value={settingsData.blacklisted_domains || ""}
              onChange={(e) => {
                setSettingsData({ ...settingsData, blacklisted_domains: e.target.value });
                markDirty();
              }}
            />
          </div>
        </div>

        {/* ── Feature Flags ───────────────────── */}
        <div className="card settings-section">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontSize: "16px" }}>🚩</span>
            <div>
              <div className="card-title">Feature Flags</div>
              <div className="card-desc">Enable or disable platform features without redeploying.</div>
            </div>
          </div>

          {(settingsData.feature_flags || []).map((f, index) => (
            <div className="flag-row" key={index}>
              <div>
                <div className="flag-label">{f.label}</div>
                <div className="flag-desc">{f.description}</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={f.enabled}
                  onChange={(e) => {
                    const updated = [...settingsData.feature_flags];
                    updated[index].enabled = e.target.checked;
                    setSettingsData({ ...settingsData, feature_flags: updated });
                    markDirty();
                  }}
                />
                <div className="switch-track"></div>
              </label>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}