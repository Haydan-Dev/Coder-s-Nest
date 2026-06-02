import React, {
  useEffect,
  useState,
} from "react";

export default function Login() {

  const AUTH_KEY =
    "cn_admin_authed";

  const EMAIL =
    "admin@codersnest.io";

  const PASSWORD =
    "Admin1234!";

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPw, setShowPw] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [theme, setTheme] =
    useState(
      localStorage.getItem(
        "cn_theme"
      ) || "dark"
    );

  /* ── INIT THEME ───────────────────── */
  useEffect(() => {

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem(
      "cn_theme",
      theme
    );

    // HIDE SIDEBAR
    const sidebar =
      document.querySelector(".sidebar");

    if (sidebar) {
      sidebar.style.display =
        "none";
    }

    // HIDE HEADER
    const header =
      document.querySelector(
        ".topbar"
      );

    if (header) {
      header.style.display =
        "none";
    }

    // REMOVE MAIN LAYOUT PADDING
    const wrap =
      document.querySelector(
        ".main-wrap"
      );

    if (wrap) {
      wrap.style.padding = "0";
      wrap.style.margin = "0";
      wrap.style.width = "100%";
    }

    // CLEANUP
    return () => {

      if (sidebar) {
        sidebar.style.display =
          "";
      }

      if (header) {
        header.style.display =
          "";
      }

      if (wrap) {
        wrap.style.padding =
          "";
        wrap.style.margin =
          "";
        wrap.style.width =
          "";
      }
    };

  }, [theme]);

  /* ── ALREADY LOGIN ────────────────── */
  useEffect(() => {

    if (
      sessionStorage.getItem(
        AUTH_KEY
      ) === "1"
    ) {

      window.location.href =
        "/dashboard";
    }

  }, []);

  /* ── TOGGLE THEME ─────────────────── */
  function toggleTheme() {

    setTheme((prev) =>
      prev === "dark"
        ? "light"
        : "dark"
    );
  }

  /* ── LOGIN ────────────────────────── */
  function handleSubmit(e) {

    e.preventDefault();

    setError("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (
      !cleanEmail ||
      !password
    ) {

      setError(
        "Please enter your email and password."
      );

      return;
    }

    setLoading(true);

    setTimeout(() => {

      if (
        cleanEmail === EMAIL &&
        password === PASSWORD
      ) {

        sessionStorage.setItem(
          AUTH_KEY,
          "1"
        );

        window.location.href =
          "/dashboard";

      } else {

        setError(
          "Invalid credentials. Access restricted to administrators."
        );

        setLoading(false);
      }

    }, 500);
  }

  return (

    <div className="login-page">

      <div className="login-body">

        <div className="login-card">

          <div className="login-shield">
            🛡
          </div>

          <h1>
            Admin Access
          </h1>

          <p className="login-sub">
            Restricted to authorised
            administrators only.
          </p>

          <form
            className="login-form"
            autoComplete="off"
            onSubmit={handleSubmit}
          >

            <div className="form-group">

              <label>
                Email address
              </label>

              <input
                type="email"
                placeholder="admin@codersnest.io"
                autoComplete="username"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="form-group">

              <label>
                Password
              </label>

              <div className="input-wrap">

                <input
                  type={
                    showPw
                      ? "text"
                      : "password"
                  }
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() =>
                    setShowPw(
                      !showPw
                    )
                  }
                >

                  {showPw
                    ? "🙈"
                    : "👁"}

                </button>

              </div>

            </div>

            {error && (

              <div className="alert alert-error">

                {error}

              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >

              {loading
                ? "Verifying…"
                : "Sign in to Admin Console"}

            </button>

          </form>

          <p className="login-footer">

            This console is monitored.
            Unauthorised access attempts
            are logged.

          </p>

        </div>

      </div>

    </div>
  );
}