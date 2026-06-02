import React from "react";
function Header() {
  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Dashboard</span>
        <div className="topbar-right">
          <button className="icon-btn" title="Notifications">
            🔔<span className="notif-dot"></span>
          </button>
          <button className="theme-toggle" title="Toggle theme">
            ☀
          </button>
        </div>
      </header>
    </>
  );
}
export default Header;
