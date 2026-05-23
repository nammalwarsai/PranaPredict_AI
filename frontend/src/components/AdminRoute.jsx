import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Route protection wrapper for administrative views.
 * Restricts access to users logged in and having `is_admin === true` in their profile.
 */
function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-dark, #0b0f19)", color: "#fff" }}>
        <div className="spinner" style={{ border: "4px solid rgba(255,255,255,0.1)", borderLeftColor: "var(--accent-teal, #10b981)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", marginBottom: "16px" }}></div>
        <p style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: "16px", letterSpacing: "0.5px" }}>Loading administrative console...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect if not logged in at all
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Redirect if logged in but not an administrator
  if (!profile || !profile.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Allow children if verified admin
  return children;
}

export default AdminRoute;
