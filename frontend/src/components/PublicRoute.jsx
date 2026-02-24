import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Redirects already-authenticated users to /dashboard
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default PublicRoute;
