import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../config/supabaseClient";
import { adminLogin } from "../api/api";
import "./Auth.css";

/**
 * Secure Admin Login portal.
 * Features a curated emerald-green color palette, subtle gradients, and real-time validation.
 */
function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Authenticate with custom admin API
      const response = await adminLogin(email, password);
      
      if (response.data && response.data.success) {
        const { session } = response.data.data;

        // 2. Hydrate frontend Supabase client with the admin's new tokens
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        if (sessionError) {
          throw new Error("Failed to initialize admin session: " + sessionError.message);
        }

        // 3. Success -> Navigate to administrative dashboard
        navigate("/admin/dashboard");
      } else {
        throw new Error(response.data?.error || "Login failed");
      }
    } catch (err) {
      console.error("Admin Login Error:", err);
      setError(err.response?.data?.error || err.message || "An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page admin-auth-theme" style={{
      "--auth-glow-color-1": "rgba(16, 185, 129, 0.15)", /* Emerald */
      "--auth-glow-color-2": "rgba(6, 182, 212, 0.15)"  /* Teal */
    }}>
      <div className="auth-background">
        <div className="auth-glow auth-glow--left" style={{ background: "var(--auth-glow-color-1)" }}></div>
        <div className="auth-glow auth-glow--right" style={{ background: "var(--auth-glow-color-2)" }}></div>
      </div>
      
      <div className="auth-card" style={{
        borderColor: "rgba(16, 185, 129, 0.18)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3), 0 0 40px rgba(16, 185, 129, 0.05)"
      }}>
        <div className="auth-card-header">
          <div className="auth-logo" style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", color: "#fff" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <h1 style={{ background: "linear-gradient(135deg, #fff, #a7f3d0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Admin Intelligence Console
          </h1>
          <p className="auth-subtitle">PranaPredict AI Administration Portal</p>
        </div>

        {error && (
          <div className="auth-error" role="alert" aria-live="assertive" style={{
            background: "rgba(239, 68, 68, 0.1)",
            borderColor: "rgba(239, 68, 68, 0.2)",
            color: "#fca5a5"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#10b981" }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
              Admin Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pranapredict.ai"
              autoComplete="email"
              required
              className="auth-input"
              style={{
                background: "rgba(11, 15, 25, 0.6)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                color: "#fff"
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#10b981" }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Password
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                minLength={6}
                className="auth-input password-input"
                style={{
                  background: "rgba(11, 15, 25, 0.6)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  color: "#fff"
                }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ color: "rgba(16, 185, 129, 0.6)" }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading} style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
            color: "#fff"
          }}>
            {loading ? (
              <>
                <span className="auth-btn-spinner" style={{ borderLeftColor: "#fff" }}></span>
                Accessing Console...
              </>
            ) : (
              <>
                Authenticate Admin
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
