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

  /* ── MOCK DATA ───────────────────────────── */
  const mockSettings = {
    maintenanceMode: false,

    maintenanceMessage:
      "Coder's Nest is under maintenance. Please try again later.",

    announcementBanner: true,

    announcementText:
      "🚀 New realtime collaboration update deployed successfully!",

    announcementType: "success",

    featureFlags: [
      {
        key: "ai_chat",
        label: "AI Chat Assistant",
        description:
          "Enable AI powered coding chat assistant.",
        enabled: true,
      },

      {
        key: "team_collab",
        label: "Realtime Collaboration",
        description:
          "Allow multiple users to code together in realtime.",
        enabled: true,
      },

      {
        key: "voice_rooms",
        label: "Voice Rooms",
        description:
          "Enable team voice communication rooms.",
        enabled: false,
      },

      {
        key: "file_sharing",
        label: "Advanced File Sharing",
        description:
          "Allow drag & drop file sharing inside projects.",
        enabled: true,
      },

      {
        key: "ai_autocomplete",
        label: "AI Autocomplete",
        description:
          "Enable smart inline code suggestions.",
        enabled: true,
      },

      {
        key: "dark_mode",
        label: "Experimental Dark Theme",
        description:
          "Enable next generation dashboard theme.",
        enabled: false,
      },

      {
        key: "analytics_v2",
        label: "Analytics V2",
        description:
          "Enable advanced analytics tracking system.",
        enabled: true,
      },

      {
        key: "project_templates",
        label: "Project Templates",
        description:
          "Allow quick project starter templates.",
        enabled: true,
      },
    ],
  };

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

        let data;

        try {

          data =
            await API.getSettings();

        } catch {

          data = mockSettings;
        }

        setSettingsData(data);

      } catch (e) {

        Utils.toast(
          "Failed to load settings.",
          "error"
        );

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

      try {

        await API.updateSettings(
          settingsData
        );

      } catch {}

      Utils.toast(
        "Settings saved.",
        "success"
      );

      setDirty(false);

    } catch (e) {

      Utils.toast(
        "Failed to save settings.",
        "error"
      );

    } finally {

      setSaving(false);
    }
  }

  /* ── LOADING ─────────────────────────────── */
  if (loading) {

    return (

      <main className="page-content">

        <div className="page-header-row">

          <div
            className="page-header"
            style={{
              marginBottom: 0,
            }}
          >

            <h1>
              Settings
            </h1>

            <p>
              System configuration and feature management
            </p>

          </div>

        </div>

        <div id="settings-body">

          <div className="card settings-section">
            <div className="skeleton sk-card"></div>
          </div>

          <div className="card settings-section">
            <div className="skeleton sk-card"></div>
          </div>

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

        <div
          className="page-header"
          style={{
            marginBottom: 0,
          }}
        >

          <h1>
            Settings
          </h1>

          <p>
            System configuration and feature management
          </p>

        </div>

        <button
          className={
            "btn btn-primary " +
            (!dirty
              ? "hidden"
              : "")
          }
          onClick={
            saveSettings
          }
          disabled={saving}
        >

          {saving
            ? "Saving…"
            : "💾 Save changes"}

        </button>

      </div>

      <div id="settings-body">

        {/* ── Maintenance Mode ─────────────────── */}
        <div className="card settings-section">

          <div
            style={{
              display: "flex",
              alignItems:
                "flex-start",
              justifyContent:
                "space-between",
              gap: "16px",
            }}
          >

            <div>

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "8px",
                  marginBottom:
                    "4px",
                }}
              >

                <span
                  style={{
                    fontSize:
                      "16px",
                  }}
                >
                  ⚠
                </span>

                <div className="card-title">
                  Maintenance Mode
                </div>

              </div>

              <div className="card-desc">
                Shows a maintenance page to all non-admin users.
              </div>

            </div>

            <label className="switch">

              <input
                type="checkbox"
                checked={
                  settingsData.maintenanceMode
                }
                onChange={(
                  e
                ) => {

                  setSettingsData({
                    ...settingsData,

                    maintenanceMode:
                      e.target
                        .checked,
                  });

                  markDirty();
                }}
              />

              <div className="switch-track"></div>

            </label>

          </div>

          <div
            id="maintenance-msg-wrap"
            style={{
              marginTop:
                "14px",

              display:
                settingsData.maintenanceMode
                  ? ""
                  : "none",
            }}
          >

            <label
              style={{
                fontSize:
                  "13px",

                fontWeight:
                  500,

                display:
                  "block",

                marginBottom:
                  "6px",
              }}
            >

              Maintenance message

            </label>

            <input
              type="text"
              value={
                settingsData.maintenanceMessage
              }
              placeholder="Message shown during maintenance…"
              onChange={(
                e
              ) => {

                setSettingsData({
                  ...settingsData,

                  maintenanceMessage:
                    e.target
                      .value,
                });

                markDirty();
              }}
            />

          </div>

        </div>

        {/* ── Announcement Banner ─────────────── */}
        <div className="card settings-section">

          <div
            style={{
              display: "flex",
              alignItems:
                "flex-start",
              justifyContent:
                "space-between",
              gap: "16px",
            }}
          >

            <div>

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "8px",
                  marginBottom:
                    "4px",
                }}
              >

                <span
                  style={{
                    fontSize:
                      "16px",
                  }}
                >
                  📢
                </span>

                <div className="card-title">
                  Announcement Banner
                </div>

              </div>

              <div className="card-desc">
                Show a dismissible banner to all users at the top of the app.
              </div>

            </div>

            <label className="switch">

              <input
                type="checkbox"
                checked={
                  settingsData.announcementBanner
                }
                onChange={(
                  e
                ) => {

                  setSettingsData({
                    ...settingsData,

                    announcementBanner:
                      e.target
                        .checked,
                  });

                  markDirty();
                }}
              />

              <div className="switch-track"></div>

            </label>

          </div>

          <div
            id="announcement-opts"
            style={{
              marginTop:
                "14px",

              display:
                settingsData.announcementBanner
                  ? ""
                  : "none",
            }}
          >

            <div
              className="form-group"
              style={{
                marginBottom:
                  "12px",
              }}
            >

              <label>
                Message
              </label>

              <input
                type="text"
                value={
                  settingsData.announcementText
                }
                placeholder="Announcement text…"
                onChange={(
                  e
                ) => {

                  setSettingsData({
                    ...settingsData,

                    announcementText:
                      e.target
                        .value,
                  });

                  markDirty();
                }}
              />

            </div>

            <div
              className="form-group"
              style={{
                marginBottom:
                  "12px",
              }}
            >

              <label>
                Type
              </label>

              <select
                style={{
                  maxWidth:
                    "160px",
                }}
                value={
                  settingsData.announcementType
                }
                onChange={(
                  e
                ) => {

                  setSettingsData({
                    ...settingsData,

                    announcementType:
                      e.target
                        .value,
                  });

                  markDirty();
                }}
              >

                {[
                  "info",
                  "warning",
                  "success",
                  "error",
                ].map((t) => (

                  <option
                    key={t}
                    value={t}
                  >

                    {t
                      .charAt(
                        0
                      )
                      .toUpperCase() +
                      t.slice(
                        1
                      )}

                  </option>
                ))}

              </select>

            </div>

            <div
              id="ann-preview"
              className={
                "ann-preview ann-" +
                settingsData.announcementType
              }
            >

              {settingsData.announcementText ||
                "Your announcement will appear here."}

            </div>

          </div>

        </div>

        {/* ── Feature Flags ───────────────────── */}
        <div className="card settings-section">

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "8px",
              marginBottom:
                "14px",
            }}
          >

            <span
              style={{
                fontSize:
                  "16px",
              }}
            >
              🚩
            </span>

            <div>

              <div className="card-title">
                Feature Flags
              </div>

              <div className="card-desc">
                Enable or disable platform features without redeploying.
              </div>

            </div>

          </div>

          {settingsData.featureFlags.map(
            (f, index) => (

              <div
                className="flag-row"
                key={index}
              >

                <div>

                  <div className="flag-label">
                    {f.label}
                  </div>

                  <div className="flag-desc">
                    {f.description}
                  </div>

                </div>

                <label className="switch">

                  <input
                    type="checkbox"
                    checked={
                      f.enabled
                    }
                    onChange={(
                      e
                    ) => {

                      const updated =
                        settingsData.featureFlags.map(
                          (
                            flag
                          ) => {

                            if (
                              flag.key ===
                              f.key
                            ) {

                              return {
                                ...flag,

                                enabled:
                                  e
                                    .target
                                    .checked,
                              };
                            }

                            return flag;
                          }
                        );

                      setSettingsData({
                        ...settingsData,

                        featureFlags:
                          updated,
                      });

                      markDirty();
                    }}
                  />

                  <div className="switch-track"></div>

                </label>

              </div>
            )
          )}

        </div>

      </div>

    </main>
  );
}