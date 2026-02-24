import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">PranaPredict AI</Link>
      </div>

      <div className="navbar-links">
        {!loading && user ? (
          <>
            <Link to="/dashboard" className={isActive("/dashboard") ? "active" : ""}>
              Dashboard
            </Link>
            <Link to="/history" className={isActive("/history") ? "active" : ""}>
              History
            </Link>
            <Link to="/profile" className={isActive("/profile") ? "active" : ""}>
              Profile
            </Link>
            <button className="nav-signout" onClick={handleSignOut}>
              Sign Out
            </button>
          </>
        ) : !loading ? (
          <>
            <Link to="/" className={isActive("/") ? "active" : ""}>
              Home
            </Link>
            <Link to="/login" className={isActive("/login") ? "active" : ""}>
              Sign In
            </Link>
            <Link to="/signup" className={isActive("/signup") ? "active" : ""}>
              Sign Up
            </Link>
          </>
        ) : null}
      </div>
    </nav>
  );
}

export default Navbar;
