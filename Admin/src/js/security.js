// ── security.js ───────────────────────────────────
var secState = { success: '', page: 1, limit: 20, total: 0 };

document.addEventListener('DOMContentLoaded', function () {
  loadSuspicious();
  loadIPs();
  loadAttempts();

  document.getElementById('filter-success').addEventListener('change', function (e) {
    secState.success = e.target.value; secState.page = 1; loadAttempts();
  });
  document.getElementById('btn-prev').addEventListener('click', function () {
    if (secState.page > 1) { secState.page--; loadAttempts(); }
  });
  document.getElementById('btn-next').addEventListener('click', function () {
    if (secState.page < Math.ceil(secState.total / secState.limit)) {
      secState.page++; loadAttempts();
    }
  });
});

async function loadSuspicious() {
  try {
    var data = await API.listSuspiciousActivity();
    var el   = document.getElementById('suspicious-list');
    if (!el) return;

    var SC = { critical: 'sc-critical', high: 'sc-high', medium: 'sc-medium', low: 'sc-low' };

    if (!data.length) {
      el.innerHTML = '<p className="text-muted" style="font-size:13px;padding:4px 0">No suspicious activity detected.</p>';
      return;
    }
    el.innerHTML = data.map(function (e) {
      return '<div className="suspicious-card ' + (SC[e.severity] || '') + '">' +
        '<div style="font-size:18px">🛡</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px">' +
            '<span style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">' + e.severity + '</span>' +
            '<span className="text-muted" style="font-size:11px">·</span>' +
            '<span className="mono" style="font-size:12px">' + Utils.esc(e.type.replace(/_/g, ' ')) + '</span>' +
          '</div>' +
          '<div style="font-size:13px">' + Utils.esc(e.description) + '</div>' +
          '<div className="text-muted" style="font-size:11px;margin-top:2px">IP: <span className="mono">' + e.ip + '</span>' +
            (e.email ? ' · ' + Utils.esc(e.email) : '') + '</div>' +
        '</div>' +
        '<div className="activity-time">' + Utils.timeAgo(e.timestamp) + '</div>' +
      '</div>';
    }).join('');
  } catch (e) {
    Utils.toast('Failed to load suspicious activity.', 'error');
  }
}

async function loadIPs() {
  try {
    var data = await API.getIpSummary();
    var el   = document.getElementById('ip-list');
    if (!el) return;
    el.innerHTML = data.map(function (ip) {
      var failColor = ip.failedAttempts > 5 ? 'var(--destructive)' : 'var(--muted-fg)';
      return '<div className="ip-row">' +
        '<div>' +
          '<div className="ip-addr">' + ip.ip + (ip.isFlagged ? ' 🚩' : '') + '</div>' +
          '<div className="ip-meta">' + (ip.country || 'Unknown') + ' · ' + ip.totalAttempts + ' requests</div>' +
        '</div>' +
        '<div className="ip-fails" style="color:' + failColor + '">' + ip.failedAttempts + ' failed</div>' +
      '</div>';
    }).join('');
  } catch (e) {
    Utils.toast('Failed to load IP data.', 'error');
  }
}

async function loadAttempts() {
  var s     = secState;
  var tbody = document.getElementById('attempts-tbody');
  if (!tbody) return;
  tbody.innerHTML = Utils.skeleton(10, 5);

  try {
    var params = { page: s.page, limit: s.limit };
    if (s.success !== '') params.success = s.success;

    var data = await API.listLoginAttempts(params);
    s.total  = data.total;
    var totalPages = Math.ceil(data.total / s.limit);
    document.getElementById('page-info').textContent = data.total + ' total attempts';
    document.getElementById('btn-prev').disabled     = s.page <= 1;
    document.getElementById('btn-next').disabled     = s.page >= totalPages;

    tbody.innerHTML = data.data.map(function (a) {
      return '<tr>' +
        '<td>' + (a.success ? '<span style="color:#22c55e;font-weight:600">✓</span>' : '<span style="color:#ef4444;font-weight:600">✕</span>') + '</td>' +
        '<td style="font-size:12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + Utils.esc(a.email) + '</td>' +
        '<td className="mono" style="font-size:12px">' + a.ip + '</td>' +
        '<td className="text-muted" style="font-size:12px">' + (a.country || '—') + '</td>' +
        '<td className="text-muted" style="font-size:12px;white-space:nowrap">' + Utils.timeAgo(a.timestamp) + '</td>' +
      '</tr>';
    }).join('');
  } catch (e) {
    Utils.toast('Failed to load login attempts.', 'error');
  }
}
