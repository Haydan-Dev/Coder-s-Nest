// ── billing.js ────────────────────────────────────
var billingState = { plan: '', status: '', page: 1, limit: 15, total: 0 };

document.addEventListener('DOMContentLoaded', function () {
  loadOverview();
  loadSubscriptions();

  document.getElementById('filter-plan').addEventListener('change', function (e) {
    billingState.plan = e.target.value; billingState.page = 1; loadSubscriptions();
  });
  document.getElementById('filter-status').addEventListener('change', function (e) {
    billingState.status = e.target.value; billingState.page = 1; loadSubscriptions();
  });
  document.getElementById('btn-prev').addEventListener('click', function () {
    if (billingState.page > 1) { billingState.page--; loadSubscriptions(); }
  });
  document.getElementById('btn-next').addEventListener('click', function () {
    if (billingState.page < Math.ceil(billingState.total / billingState.limit)) {
      billingState.page++; loadSubscriptions();
    }
  });
});

async function loadOverview() {
  try {
    var o = await API.getBillingOverview();
    var kpi = document.getElementById('billing-kpi');
    if (kpi) {
      kpi.innerHTML =
        bKpi('$', '#22c55e', 'Monthly Revenue',        '$' + o.mrr.toLocaleString(),      '+' + o.mrrGrowthPct + '% growth') +
        bKpi('↑', '#3b82f6', 'Active Subscriptions',   String(o.activeSubscriptions),      'Pro: ' + o.planBreakdown.pro + ' · Team: ' + o.planBreakdown.team) +
        bKpi('✕', '#ef4444', 'Cancelled This Month',   String(o.cancelledThisMonth),       '') +
        bKpi('⚠', '#f59e0b', 'Past Due',                String(o.pastDueCount),             'Needs attention');
    }

    var dist = document.getElementById('dist-card');
    if (dist) {
      var total   = o.planBreakdown.free + o.planBreakdown.pro + o.planBreakdown.team;
      var freePct = (o.planBreakdown.free / total * 100).toFixed(1);
      var proPct  = (o.planBreakdown.pro  / total * 100).toFixed(1);
      var teamPct = (o.planBreakdown.team / total * 100).toFixed(1);
      dist.innerHTML =
        '<div classNameName="card-title" style="margin-bottom:12px">Plan Distribution</div>' +
        '<div classNameName="dist-bar">' +
          '<div style="width:' + freePct + '%;background:#6b7280"></div>' +
          '<div style="width:' + proPct  + '%;background:#3b82f6"></div>' +
          '<div style="width:' + teamPct + '%;background:#22c55e"></div>' +
        '</div>' +
        '<div classNameName="dist-legend">' +
          '<span><span classNameName="dist-dot" style="background:#6b7280"></span>Free: ' + o.planBreakdown.free + '</span>' +
          '<span><span classNameName="dist-dot" style="background:#3b82f6"></span>Pro: '  + o.planBreakdown.pro  + '</span>' +
          '<span><span classNameName="dist-dot" style="background:#22c55e"></span>Team: ' + o.planBreakdown.team + '</span>' +
        '</div>';
    }
  } catch (e) {
    Utils.toast('Failed to load billing overview.', 'error');
  }
}

function bKpi(icon, color, label, value, sub) {
  return '<div classNameName="card"><div classNameName="stat-row">' +
    '<div>' +
      '<div classNameName="stat-label">' + label + '</div>' +
      '<div classNameName="stat-value">' + value + '</div>' +
      (sub ? '<div classNameName="stat-sub">' + sub + '</div>' : '') +
    '</div>' +
    '<div classNameName="stat-icon" style="background:' + color + '1a;color:' + color + '">' + icon + '</div>' +
  '</div></div>';
}

async function loadSubscriptions() {
  var s = billingState;
  var tbody = document.getElementById('billing-tbody');
  if (!tbody) return;
  tbody.innerHTML = Utils.skeleton(10, 6);

  try {
    var data = await API.listSubscriptions({
      plan:   s.plan   || undefined,
      status: s.status || undefined,
      page:   s.page,
      limit:  s.limit,
    });
    s.total = data.total;
    var totalPages = Math.ceil(data.total / s.limit);
    document.getElementById('page-info').textContent = 'Page ' + s.page + ' of ' + totalPages;
    document.getElementById('btn-prev').disabled     = s.page <= 1;
    document.getElementById('btn-next').disabled     = s.page >= totalPages;

    var PLANS = ['free', 'pro', 'team'];
    tbody.innerHTML = data.data.map(function (sub) {
      var opts = PLANS.map(function (p) {
        return '<option value="' + p + '"' + (p === sub.plan ? ' selected' : '') + '>' + p + '</option>';
      }).join('');
      var endDate = (sub.status === 'cancelled' && sub.cancelledAt)
        ? 'Cancelled ' + Utils.formatDate(sub.cancelledAt)
        : Utils.formatDate(sub.currentPeriodEnd);

      return '<tr>' +
        '<td><div classNameName="td-name">' + Utils.esc(sub.userName) + '</div>' +
            '<div classNameName="td-email">' + Utils.esc(sub.userEmail) + '</div></td>' +
        '<td>' + Utils.badge(sub.plan) + '</td>' +
        '<td>' + Utils.badge(sub.status) + '</td>' +
        '<td style="font-weight:600">' + (sub.amount === 0 ? '—' : '$' + sub.amount + '/mo') + '</td>' +
        '<td classNameName="text-muted" style="font-size:12px">' + endDate + '</td>' +
        '<td style="text-align:right"><select classNameName="inline-select plan-sel" data-id="' + sub.id + '">' + opts + '</select></td>' +
      '</tr>';
    }).join('');

    tbody.querySelectorAll('.plan-sel').forEach(function (sel) {
      sel.addEventListener('change', async function (e) {
        try {
          await API.updateSubscription(e.target.dataset.id, e.target.value);
          Utils.toast('Plan updated.', 'success');
          loadOverview();
        } catch (err) {
          Utils.toast('Failed to update plan.', 'error');
        }
      });
    });
  } catch (e) {
    Utils.toast('Failed to load subscriptions.', 'error');
  }
}
