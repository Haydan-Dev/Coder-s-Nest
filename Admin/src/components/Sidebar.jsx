import React from "react";
import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="brand">
          <div className="brand-icon">C</div>
          <span>Coder's Nest</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Platform</div>

        <Link className="nav-link" to="/">
          <span className="nav-icon">⊞</span> Dashboard
        </Link>

        <Link className="nav-link" to="/users">
          <span className="nav-icon">👤</span> Users
        </Link>

        <Link className="nav-link" to="/projects">
          <span className="nav-icon">📁</span> Projects
        </Link>

        <Link className="nav-link" to="/billing">
          <span className="nav-icon">💳</span> Billing
        </Link>

        <Link className="nav-link" to="/security">
          <span className="nav-icon">🔒</span> Security
        </Link>

        <Link className="nav-link" to="/analytics">
          <span className="nav-icon">📈</span> Analytics
        </Link>

        <Link className="nav-link" to="/settings">
          <span className="nav-icon">⚙</span> Settings
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">A</div>

          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Admin User</div>
            <div className="sidebar-user-email">
              admin@codersnest.io
            </div>
          </div>
        </div>

        <button id="logout-btn" className="btn-logout">
          <span>⇦</span> Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;