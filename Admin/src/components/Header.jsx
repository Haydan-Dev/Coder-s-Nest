import { toggleTheme } from "../js/shared.jsx";

function Header() {
  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Dashboard</span>
        <div className="topbar-right">
          <button className="theme-toggle" title="Toggle theme" onClick={toggleTheme}>
            ☀
          </button>
        </div>
      </header>
    </>
  );
}
export default Header;
