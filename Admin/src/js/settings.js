// ── settings.js ───────────────────────────────────
var settingsData = null;

document.addEventListener('DOMContentLoaded', async function () {
  try {
    settingsData = await API.getSettings();
    renderSettings();
  } catch (e) {
    Utils.toast('Failed to load settings.', 'error');
  }
});

function markDirty() {
  var btn = document.getElementById('save-btn');
  if (btn) btn.classList.remove('hidden');
}

function renderSettings() {
  var s  = settingsData;
  var el = document.getElementById('settings-body');
  if (!el) return;

  el.innerHTML =

  /* ── Maintenance Mode ─────────────────── */
  '<div className="card settings-section">' +
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">' +
      '<div>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
          '<span style="font-size:16px">⚠</span>' +
          '<div className="card-title">Maintenance Mode</div>' +
        '</div>' +
        '<div className="card-desc">Shows a maintenance page to all non-admin users.</div>' +
      '</div>' +
      '<label className="switch"><input type="checkbox" id="sw-maintenance"' + (s.maintenanceMode ? ' checked' : '') + '><div className="switch-track"></div></label>' +
    '</div>' +
    '<div id="maintenance-msg-wrap" style="margin-top:14px;' + (s.maintenanceMode ? '' : 'display:none') + '">' +
      '<label style="font-size:13px;font-weight:500;display:block;margin-bottom:6px">Maintenance message</label>' +
      '<input type="text" id="maintenance-msg" value="' + Utils.esc(s.maintenanceMessage) + '" placeholder="Message shown during maintenance…" />' +
    '</div>' +
  '</div>' +

  /* ── Announcement Banner ──────────────── */
  '<div className="card settings-section">' +
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">' +
      '<div>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
          '<span style="font-size:16px">📢</span>' +
          '<div className="card-title">Announcement Banner</div>' +
        '</div>' +
        '<div className="card-desc">Show a dismissible banner to all users at the top of the app.</div>' +
      '</div>' +
      '<label className="switch"><input type="checkbox" id="sw-announcement"' + (s.announcementBanner ? ' checked' : '') + '><div class="switch-track"></div></label>' +
    '</div>' +
    '<div id="announcement-opts" style="margin-top:14px;' + (s.announcementBanner ? '' : 'display:none') + '">' +
      '<div className="form-group" style="margin-bottom:12px">' +
        '<label>Message</label>' +
        '<input type="text" id="ann-text" value="' + Utils.esc(s.announcementText) + '" placeholder="Announcement text…" />' +
      '</div>' +
      '<div className="form-group" style="margin-bottom:12px">' +
        '<label>Type</label>' +
        '<select id="ann-type" style="max-width:160px">' +
          ['info','warning','success','error'].map(function (t) {
            return '<option value="' + t + '"' + (t === s.announcementType ? ' selected' : '') + '>' + t.charAt(0).toUpperCase() + t.slice(1) + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
      '<div id="ann-preview" className="ann-preview ann-' + s.announcementType + '">' + (Utils.esc(s.announcementText) || 'Your announcement will appear here.') + '</div>' +
    '</div>' +
  '</div>' +

  /* ── Feature Flags ────────────────────── */
  '<div className="card settings-section">' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
      '<span style="font-size:16px">🚩</span>' +
      '<div><div className="card-title">Feature Flags</div>' +
      '<div className="card-desc">Enable or disable platform features without redeploying.</div></div>' +
    '</div>' +
    s.featureFlags.map(function (f) {
      return '<div className="flag-row">' +
        '<div><div className="flag-label">' + Utils.esc(f.label) + '</div>' +
        '<div className="flag-desc">' + Utils.esc(f.description) + '</div></div>' +
        '<label className="switch"><input type="checkbox" className="flag-sw" data-key="' + f.key + '"' + (f.enabled ? ' checked' : '') + '><div className="switch-track"></div></label>' +
      '</div>';
    }).join('') +
  '</div>';

  /* ── Bind Events ────────────────────── */
  document.getElementById('sw-maintenance').addEventListener('change', function (e) {
    settingsData.maintenanceMode = e.target.checked;
    document.getElementById('maintenance-msg-wrap').style.display = e.target.checked ? '' : 'none';
    markDirty();
  });

  document.getElementById('maintenance-msg').addEventListener('input', function (e) {
    settingsData.maintenanceMessage = e.target.value; markDirty();
  });

  document.getElementById('sw-announcement').addEventListener('change', function (e) {
    settingsData.announcementBanner = e.target.checked;
    document.getElementById('announcement-opts').style.display = e.target.checked ? '' : 'none';
    markDirty();
  });

  document.getElementById('ann-text').addEventListener('input', function (e) {
    settingsData.announcementText = e.target.value;
    var preview = document.getElementById('ann-preview');
    if (preview) preview.textContent = e.target.value || 'Your announcement will appear here.';
    markDirty();
  });

  document.getElementById('ann-type').addEventListener('change', function (e) {
    settingsData.announcementType = e.target.value;
    var preview = document.getElementById('ann-preview');
    if (preview) preview.className = 'ann-preview ann-' + e.target.value;
    markDirty();
  });

  document.querySelectorAll('.flag-sw').forEach(function (sw) {
    sw.addEventListener('change', function (e) {
      var flag = settingsData.featureFlags.find(function (f) { return f.key === e.target.dataset.key; });
      if (flag) flag.enabled = e.target.checked;
      markDirty();
    });
  });

  document.getElementById('save-btn').addEventListener('click', saveSettings);
}

async function saveSettings() {
  var btn = document.getElementById('save-btn');
  btn.disabled    = true;
  btn.textContent = 'Saving…';
  try {
    await API.updateSettings(settingsData);
    Utils.toast('Settings saved.', 'success');
    btn.classList.add('hidden');
  } catch (e) {
    Utils.toast('Failed to save settings.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = '💾 Save changes';
  }
}
