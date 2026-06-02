// ── analytics.js ──────────────────────────────────
var charts = {};

document.addEventListener('DOMContentLoaded', async function () {
  try {
    var results = await Promise.all([
      API.getSystemUsage(),
      API.getAiUsage('30d'),
      API.getActiveUsers('30d'),
      API.getProjectTrends('30d'),
    ]);
    renderSysKPIs(results[0]);
    makeChart('chart-ai',    results[1], '#3b82f6');
    makeChart('chart-users', results[2], '#22c55e');
    makeChart('chart-proj',  results[3], '#a855f7');
    renderStorage(results[0]);
  } catch (e) {
    Utils.toast('Failed to load analytics.', 'error');
  }

  document.getElementById('ai-period').addEventListener('change', async function (e) {
    var d = await API.getAiUsage(e.target.value); makeChart('chart-ai', d, '#3b82f6');
  });
  document.getElementById('users-period').addEventListener('change', async function (e) {
    var d = await API.getActiveUsers(e.target.value); makeChart('chart-users', d, '#22c55e');
  });
  document.getElementById('proj-period').addEventListener('change', async function (e) {
    var d = await API.getProjectTrends(e.target.value); makeChart('chart-proj', d, '#a855f7');
  });
});

function makeChart(id, data, color) {
  var ctx = document.getElementById(id);
  if (!ctx) return;
  if (charts[id]) charts[id].destroy();

  var isDark   = document.documentElement.getAttribute('data-theme') !== 'light';
  var gridColor = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)';
  var tickColor = isDark ? '#555' : '#aaa';
  var tooltipBg = isDark ? '#1a1a1a' : '#fff';
  var tooltipFg = isDark ? '#fafafa' : '#111';
  var tooltipBorder = isDark ? '#333' : '#e5e7eb';

  var labels = data.map(function (d) {
    var dt = new Date(d.date);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  charts[id] = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: data.map(function (d) { return d.value; }),
        borderColor: color,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        backgroundColor: function (ctx2) {
          var g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, 200);
          g.addColorStop(0, color + '30');
          g.addColorStop(1, color + '00');
          return g;
        },
        tension: 0.35,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg, titleColor: tooltipFg,
          bodyColor: tickColor, borderColor: tooltipBorder, borderWidth: 1,
        },
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 }, maxRotation: 0 } },
        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } },
      },
    },
  });
}

function renderSysKPIs(s) {
  var el = document.getElementById('sys-kpi');
  if (!el) return;
  el.innerHTML =
    sysKpi('⚙', '#3b82f6', 'Avg CPU',       s.avgCpuPct + '%',                     'Peak: ' + s.peakCpuPct + '%') +
    sysKpi('⚙', '#a855f7', 'Avg Memory',    s.avgMemPct + '%',                     'Peak: ' + s.peakMemPct + '%') +
    sysKpi('💾', '#22c55e', 'Storage Used',  s.usedStorageGb.toFixed(0) + ' GB',    'of ' + s.totalStorageGb + ' GB') +
    sysKpi('</>', '#f59e0b', 'Code Executions', (s.totalCodeExecutions / 1e6).toFixed(1) + 'M', 'All time');
}

function sysKpi(icon, color, label, value, sub) {
  return '<div className="card"><div className="stat-row">' +
    '<div>' +
      '<div className="stat-label">' + label + '</div>' +
      '<div className="stat-value">' + value + '</div>' +
      '<div className="stat-sub">' + sub + '</div>' +
    '</div>' +
    '<div className="stat-icon" style="background:' + color + '1a;color:' + color + '">' + icon + '</div>' +
  '</div></div>';
}

function renderStorage(s) {
  var el = document.getElementById('storage-card');
  if (!el) return;
  var pct = (s.usedStorageGb / s.totalStorageGb * 100).toFixed(1);
  el.innerHTML =
    '<div className="card-title" style="margin-bottom:14px">Storage Utilization</div>' +
    '<div className="prog-wrap">' +
      '<div className="prog-label"><span>Used storage</span><span>' + s.usedStorageGb.toFixed(1) + ' / ' + s.totalStorageGb + ' GB</span></div>' +
      '<div className="prog-bar"><div style="width:' + pct + '%;height:100%;border-radius:99px;background:#3b82f6"></div></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">' +
      storageBox('AI Requests',     (s.totalAiRequests / 1e6).toFixed(2) + 'M') +
      storageBox('Code Executions', (s.totalCodeExecutions / 1e6).toFixed(1) + 'M') +
      storageBox('Peak CPU',        s.peakCpuPct + '%') +
      storageBox('Peak Memory',     s.peakMemPct + '%') +
    '</div>';
}

function storageBox(label, val) {
  return '<div style="background:var(--muted);border-radius:6px;padding:12px">' +
    '<div className="health-stat-label">' + label + '</div>' +
    '<div style="font-size:18px;font-weight:700;margin-top:2px">' + val + '</div>' +
  '</div>';
}
