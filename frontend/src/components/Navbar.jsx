import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { sendLogoutNotification } from "../api/api";

// Memoized icons to prevent unnecessary re-renders
const SunIcon = memo(() => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
  >
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
));

const MoonIcon = memo(() => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
));

const MenuIcon = memo(() => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
));

// Static navigation links to prevent recreation on every render
const AUTH_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
  { to: "/analytics", label: "Analytics" },
  { to: "/health-tips", label: "Health Tips" },
  { to: "/profile", label: "Profile" },
];

const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/login", label: "Sign In" },
  { to: "/signup", label: "Sign Up" },
];

// Memoized NavLink component to optimize rendering
const NavLink = memo(({ to, label, isActive, isAdminLink, onClick }) => (
  <Link
    to={to}
    className={`${isActive ? "active" : ""} ${isAdminLink ? "nav-admin-link" : ""}`}
    style={isAdminLink ? { color: "#10b981", fontWeight: "600" } : undefined}
    aria-current={isActive ? "page" : undefined}
    onClick={onClick}
  >
    {label}
  </Link>
));

NavLink.displayName = 'NavLink';

// Memoized ThemeToggle component
const ThemeToggle = memo(({ theme, toggleTheme }) => (
  <button
    type="button"
    className="theme-toggle"
    onClick={toggleTheme}
    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    aria-label="Toggle theme"
    aria-pressed={theme === "dark"}
  >
    {theme === "dark" ? <SunIcon /> : <MoonIcon />}
  </button>
));

ThemeToggle.displayName = 'ThemeToggle';

// Memoized SignOutButton component
const SignOutButton = memo(({ onClick }) => (
  <button 
    type="button" 
    className="nav-signout"
    onClick={onClick}
    aria-label="Sign out"
  >
    Sign Out
  </button>
));

SignOutButton.displayName = 'SignOutButton';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  // Use useCallback to memoize functions
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  // Close menu on Escape key - optimized with passive event
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && menuOpen) closeMenu();
    };
    
    document.addEventListener("keydown", handleEscape, { passive: true });
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen, closeMenu]);

  // Close menu when clicking outside - optimized
  useEffect(() => {
    if (!menuOpen) return;
    
    const handleClickOutside = (e) => {
      if (e.target.closest && !e.target.closest('.navbar-links, .navbar-hamburger')) {
        closeMenu();
      }
    };
    
    document.addEventListener("click", handleClickOutside, { passive: true, capture: true });
    return () => document.removeEventListener("click", handleClickOutside, { capture: true });
  }, [menuOpen, closeMenu]);

  // Handle window resize - close menu on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && menuOpen) {
        closeMenu();
      }
    };
    
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen, closeMenu]);

  const handleSignOut = useCallback(async () => {
    closeMenu();
    // Send logout email before signing out (needs auth token)
    sendLogoutNotification().catch((err) => {
      console.error(err);
    });
    await signOut();
    navigate("/login", { replace: true });
  }, [closeMenu, signOut, navigate]);

  // Memoize links to prevent unnecessary recalculations
  const links = useMemo(() => {
    if (loading) return [];
    
    if (user) {
      const userLinks = [...AUTH_LINKS];
      if (profile?.is_admin) {
        userLinks.push({ to: "/admin/dashboard", label: "Admin Portal", isAdminLink: true });
      }
      return userLinks;
    }
    
    return PUBLIC_LINKS;
  }, [loading, user, profile]);

  // Memoize the mobile menu state
  const mobileMenuProps = useMemo(() => ({
    menuOpen,
    closeMenu,
    links,
    isActive,
    theme,
    toggleTheme,
    user,
    handleSignOut
  }), [menuOpen, closeMenu, links, isActive, theme, toggleTheme, user, handleSignOut]);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-brand">
        <Link to="/" aria-label="PranaPredict AI Home">
          <span className="sr-only">PranaPredict AI</span>
          <strong>PranaPredict AI</strong>
        </Link>
      </div>

      <button
        className={`navbar-hamburger${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      {menuOpen && (
        <div 
          className="navbar-overlay" 
          onClick={closeMenu} 
          aria-hidden="true"
          role="presentation"
        />
      )}

      <div
        id="primary-navigation"
        className={`navbar-links${menuOpen ? " navbar-links--open" : ""}`}
        role="menubar"
      >
        {links.map(({ to, label, isAdminLink }) => (
          <NavLink
            key={to}
            to={to}
            label={label}
            isActive={isActive(to)}
            isAdminLink={isAdminLink}
            onClick={closeMenu}
          />
        ))}

        {!loading && (
          <>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            {user && (
              <SignOutButton onClick={handleSignOut} />
            )}
          </>
        )}
      </div>
    </nav>
  );
}

export default memo(Navbar);
