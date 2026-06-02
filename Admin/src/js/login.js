// ── login.js ──────────────────────────────────────
(function () {
  var AUTH_KEY = 'cn_admin_authed';
  var EMAIL    = 'admin@codersnest.io';
  var PASSWORD = 'Admin1234!';

  function initTheme() {
    var t   = localStorage.getItem('cn_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
    var btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = t === 'dark' ? '☀' : '☾';
  }

  function toggleTheme() {
    var cur  = document.documentElement.getAttribute('data-theme') || 'dark';
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cn_theme', next);
    var btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = next === 'dark' ? '☀' : '☾';
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();

    // Already logged in → go to dashboard
    if (sessionStorage.getItem(AUTH_KEY) === '1') {
      location.href = 'dashboard.html';
      return;
    }

    var themeBtn = document.getElementById('theme-btn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Toggle password visibility
    var togglePw = document.getElementById('toggle-pw');
    if (togglePw) {
      togglePw.addEventListener('click', function () {
        var inp  = document.getElementById('password');
        inp.type = inp.type === 'password' ? 'text' : 'password';
        this.textContent = inp.type === 'password' ? '👁' : '🙈';
      });
    }

    // Form submit
    document.getElementById('login-form').addEventListener('submit', function (e) {
      e.preventDefault();

      var email = document.getElementById('email').value.trim().toLowerCase();
      var pw    = document.getElementById('password').value;
      var err   = document.getElementById('login-error');
      var btn   = document.getElementById('login-btn');

      err.classList.add('hidden');

      if (!email || !pw) {
        err.textContent = 'Please enter your email and password.';
        err.classList.remove('hidden');
        return;
      }

      btn.disabled    = true;
      btn.textContent = 'Verifying…';

      setTimeout(function () {
        if (email === EMAIL && pw === PASSWORD) {
          sessionStorage.setItem(AUTH_KEY, '1');
          location.href = 'dashboard.html';
        } else {
          err.textContent = 'Invalid credentials. Access restricted to administrators.';
          err.classList.remove('hidden');
          btn.disabled    = false;
          btn.textContent = 'Sign in to Admin Console';
        }
      }, 500);
    });
  });
})();
