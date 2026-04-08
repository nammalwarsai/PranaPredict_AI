import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { sendLogoutNotification } from "../api/api";

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const AUTH_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
  { to: "/health-tips", label: "Health Tips" },
  { to: "/profile", label: "Profile" },
];

const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/login", label: "Sign In" },
  { to: "/signup", label: "Sign Up" },
];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  // Close menu on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape" && menuOpen) closeMenu();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen, closeMenu]);

  const handleSignOut = async () => {
    closeMenu();
    // Send logout email before signing out (needs auth token)
    sendLogoutNotification().catch(() => {});
    await signOut();
    navigate("/login", { replace: true });
  };

  const links = !loading ? (user ? AUTH_LINKS : PUBLIC_LINKS) : [];

  const themeButton = (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">PranaPredict AI</Link>
      </div>

      <button
        className={`navbar-hamburger${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
      >
        <span />
        <span />
        <span />
      </button>

      {menuOpen && (
        <div className="navbar-overlay" onClick={closeMenu} aria-hidden="true" />
      )}

      <div
        id="primary-navigation"
        className={`navbar-links${menuOpen ? " navbar-links--open" : ""}`}
        role="navigation"
        aria-label="Primary"
      >
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={isActive(to) ? "active" : ""}
            aria-current={isActive(to) ? "page" : undefined}
            onClick={closeMenu}
          >
            {label}
          </Link>
        ))}

        {!loading && (
          <>
            {themeButton}
            {user && (
              <button type="button" className="nav-signout" onClick={handleSignOut}>
                Sign Out
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
