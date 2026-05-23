import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";

/**
 * Reusable sidebar navigation for the admin panel views.
 */
function AdminSidebar() {
  const { signOut, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/admin/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const colors = {
    sidebarBg: isDark ? "linear-gradient(180deg, #090d16 0%, #111827 100%)" : "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)",
    sidebarBorder: isDark ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.2)",
    divider: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
    headerText: isDark ? "#fff" : "#0f172a",
    subText: isDark ? "#10b981" : "#059669",
    avatarBg: isDark ? "linear-gradient(135deg, #10b981, #06b6d4)" : "linear-gradient(135deg, #059669, #0891b2)",
    toggleBtnBg: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    toggleBtnBorder: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    toggleBtnText: isDark ? "#9ca3af" : "#475569",
  };

  return (
    <aside className="admin-sidebar" style={{
      width: "260px",
      background: colors.sidebarBg,
      borderRight: `1px solid ${colors.sidebarBorder}`,
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 64px)", // subtract navbar height
      position: "sticky",
      top: "64px",
      fontFamily: "'Outfit', 'Inter', sans-serif",
      transition: "background 0.3s ease, border-color 0.3s ease"
    }}>
      {/* Header Info */}
      <div style={{ padding: "24px 20px", borderBottom: `1px solid ${colors.divider}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: colors.avatarBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            color: "#fff",
            fontSize: "16px"
          }}>
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "A"}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "14px", color: colors.headerText, fontWeight: "600", transition: "color 0.3s ease" }}>
              {profile?.full_name || "Administrator"}
            </h4>
            <span style={{ fontSize: "12px", color: colors.subText, fontWeight: "500", letterSpacing: "0.5px", transition: "color 0.3s ease" }}>
              SYSTEM SECURE
            </span>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ padding: "20px 12px", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
          style={navLinkStyle}
        >
          <span style={{ fontSize: "18px" }}>📊</span>
          Overview
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
          style={navLinkStyle}
        >
          <span style={{ fontSize: "18px" }}>👥</span>
          User Directory
        </NavLink>

        <NavLink
          to="/admin/analytics"
          className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
          style={navLinkStyle}
        >
          <span style={{ fontSize: "18px" }}>📈</span>
          Deep Analytics
        </NavLink>

        <NavLink
          to="/admin/reports"
          className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
          style={navLinkStyle}
        >
          <span style={{ fontSize: "18px" }}>📄</span>
          Assessment Logs
        </NavLink>
      </nav>

      {/* Footer / Theme Toggle / Exit */}
      <div style={{ padding: "20px 16px", borderTop: `1px solid ${colors.divider}`, display: "flex", flexDirection: "column", gap: "12px" }}>
        
        {/* Sidebar Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "10px",
            background: colors.toggleBtnBg,
            border: `1px solid ${colors.toggleBtnBorder}`,
            color: colors.toggleBtnText,
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = colors.toggleBtnBg;
          }}
        >
          <span>{isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}</span>
        </button>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
            color: "#fca5a5",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.15)";
          }}
        >
          <span>🚪</span>
          Terminate Session
        </button>
      </div>

      <style>{`
        .admin-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          color: ${isDark ? "#9ca3af" : "#475569"};
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .admin-nav-link:hover {
          background: ${isDark ? "rgba(16, 185, 129, 0.06)" : "rgba(16, 185, 129, 0.05)"};
          color: #10b981;
        }
        .admin-nav-link.active {
          background: ${isDark ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.08)"};
          color: #10b981;
          font-weight: 600;
          box-shadow: inset 3px 0 0 #10b981;
        }
      `}</style>
    </aside>
  );
}

const navLinkStyle = {
  fontFamily: "'Outfit', 'Inter', sans-serif"
};

export default AdminSidebar;

