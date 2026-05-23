import { useState, useEffect } from "react";
import { getAdminUsers, getAdminUserById, toggleUserSuspended, deleteUserAdmin } from "../api/api";
import AdminSidebar from "../components/AdminSidebar";

/**
 * Premium administrative user directory panel.
 * Supports real-time search, filters, details overlays, suspensions, and deletes.
 */
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Overlay modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetailErr, setUserDetailErr] = useState(null);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminUsers({ search, filter });
      if (res.data && res.data.success) {
        setUsers(res.data.data);
      } else {
        throw new Error(res.data?.error || "Failed to load directory.");
      }
    } catch (err) {
      console.error("Users list fetch error:", err);
      setError(err.response?.data?.error || err.message || "Failed to compile user lists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]); // refetch on filter updates

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Inspect detailed user timeline in overlay modal
  const handleInspectUser = async (id) => {
    try {
      setUserDetailLoading(true);
      setUserDetailErr(null);
      setSelectedUser(null);
      
      const res = await getAdminUserById(id);
      if (res.data && res.data.success) {
        setSelectedUser(res.data.data);
      } else {
        throw new Error(res.data?.error || "Failed to fetch profile details.");
      }
    } catch (err) {
      console.error("User inspection error:", err);
      setUserDetailErr(err.response?.data?.error || err.message || "Failed to load user logs.");
    } finally {
      setUserDetailLoading(false);
    }
  };

  // Toggle user suspension
  const handleToggleSuspend = async (user) => {
    const isSuspended = !user.is_suspended;
    const confirmMsg = `Are you sure you want to ${isSuspended ? "SUSPEND" : "UNSUSPEND"} user: ${user.full_name || user.email}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await toggleUserSuspended(user.id, isSuspended);
      if (res.data && res.data.success) {
        alert(res.data.message);
        // Refresh local items
        fetchUsers();
        if (selectedUser && selectedUser.profile.id === user.id) {
          setSelectedUser({
            ...selectedUser,
            profile: { ...selectedUser.profile, is_suspended: isSuspended }
          });
        }
      } else {
        throw new Error(res.data?.error || "Suspension update failed.");
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to update user suspension status.");
    }
  };

  // Delete user
  const handleDeleteUser = async (user) => {
    const confirmMsg = `⚠️ CRITICAL CAUTION ⚠️\n\nAre you sure you want to DESTRUCTIVELY DELETE user:\n${user.full_name || user.email}?\n\nThis will delete their profile and ALL of their associated health reports! This action CANNOT be undone!`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await deleteUserAdmin(user.id);
      if (res.data && res.data.success) {
        alert(res.data.message);
        setSelectedUser(null);
        fetchUsers();
      } else {
        throw new Error(res.data?.error || "Deletion request failed.");
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to delete user profile.");
    }
  };

  return (
    <div className="admin-layout" style={adminLayoutStyle}>
      <AdminSidebar />
      <main className="admin-main-content" style={adminMainContentStyle}>
        
        {/* Header Block */}
        <header style={dashboardHeaderStyle}>
          <div>
            <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
              Secure Database
            </span>
            <h1 style={{ margin: "4px 0 0 0", fontSize: "28px", color: "#fff", fontWeight: "700", fontFamily: "'Outfit', sans-serif" }}>
              User Directory
            </h1>
          </div>
        </header>

        {/* Filter Operations */}
        <section style={filterBarWrapStyle}>
          <form onSubmit={handleSearchSubmit} style={searchFormStyle}>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInputStyle}
            />
            <button type="submit" style={searchButtonStyle}>Search</button>
          </form>

          <div style={filterButtonsWrapStyle}>
            <button
              onClick={() => setFilter("")}
              style={{ ...filterBtnStyle, background: filter === "" ? "rgba(16, 185, 129, 0.15)" : "transparent", color: filter === "" ? "#10b981" : "#9ca3af" }}
            >
              All Users
            </button>
            <button
              onClick={() => setFilter("high-risk")}
              style={{ ...filterBtnStyle, background: filter === "high-risk" ? "rgba(239, 68, 68, 0.15)" : "transparent", color: filter === "high-risk" ? "#ef4444" : "#9ca3af" }}
            >
              ⚠️ High Risk
            </button>
            <button
              onClick={() => setFilter("suspended")}
              style={{ ...filterBtnStyle, background: filter === "suspended" ? "rgba(245, 158, 11, 0.15)" : "transparent", color: filter === "suspended" ? "#f59e0b" : "#9ca3af" }}
            >
              🔒 Suspended
            </button>
            <button
              onClick={() => setFilter("active")}
              style={{ ...filterBtnStyle, background: filter === "active" ? "rgba(16, 185, 129, 0.15)" : "transparent", color: filter === "active" ? "#10b981" : "#9ca3af" }}
            >
              ✓ Active
            </button>
          </div>
        </section>

        {/* Users Table */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div className="spinner" style={spinnerStyle}></div>
          </div>
        ) : error ? (
          <div style={errorCardStyle}>{error}</div>
        ) : users.length === 0 ? (
          <div style={emptyCardStyle}>No user profiles found matching filters.</div>
        ) : (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Latest Assessment</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const initials = u.full_name ? u.full_name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2) : u.email.substring(0, 2).toUpperCase();
                  const isHigh = u.latestAssessment && (u.latestAssessment.riskScore > 70 || u.latestAssessment.riskLevel === "High" || u.latestAssessment.riskLevel === "Critical");

                  return (
                    <tr key={u.id} style={trStyle}>
                      {/* User details */}
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: u.is_admin ? "linear-gradient(135deg, #10b981, #06b6d4)" : "rgba(255,255,255,0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#fff"
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: "600", color: "#fff" }}>{u.full_name || "Profile Incomplete"}</div>
                            <div style={{ fontSize: "12px", color: "#9ca3af" }}>{u.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={tdStyle}>
                        <div style={{ color: "#e2e8f0" }}>{u.email}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>{u.phone || "—"}</div>
                      </td>

                      {/* Assessment */}
                      <td style={tdStyle}>
                        {u.latestAssessment ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{
                              fontWeight: "bold",
                              fontSize: "15px",
                              color: isHigh ? "#ef4444" : u.latestAssessment.riskLevel === "Moderate" ? "#f59e0b" : "#10b981"
                            }}>
                              {u.latestAssessment.riskScore}%
                            </span>
                            <span style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "20px",
                              fontWeight: "600",
                              background: isHigh ? "rgba(239, 68, 68, 0.12)" : u.latestAssessment.riskLevel === "Moderate" ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                              color: isHigh ? "#ef4444" : u.latestAssessment.riskLevel === "Moderate" ? "#f59e0b" : "#10b981"
                            }}>
                              {u.latestAssessment.riskLevel}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "#6b7280", fontSize: "13px" }}>No assessments</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={tdStyle}>
                        {u.is_suspended ? (
                          <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: "600" }}>🔒 Suspended</span>
                        ) : (
                          <span style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Active</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleInspectUser(u.id)}
                            style={{ ...actionBtnStyle, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
                          >
                            Timeline
                          </button>
                          <button
                            onClick={() => handleToggleSuspend(u)}
                            style={{
                              ...actionBtnStyle,
                              background: u.is_suspended ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                              border: u.is_suspended ? "1px solid rgba(16, 185, 129, 0.15)" : "1px solid rgba(245, 158, 11, 0.15)",
                              color: u.is_suspended ? "#10b981" : "#f59e0b"
                            }}
                          >
                            {u.is_suspended ? "Unsuspend" : "Suspend"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            style={{ ...actionBtnStyle, background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)", color: "#fca5a5" }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Detailed user slide-out timeline overlay modal */}
        {userDetailLoading && (
          <div style={overlayStyle}>
            <div style={spinnerStyle}></div>
          </div>
        )}

        {userDetailErr && (
          <div style={overlayStyle} onClick={() => setUserDetailErr(null)}>
            <div style={errorBoxStyle} onClick={(e) => e.stopPropagation()}>
              <h3>Timeline Error</h3>
              <p>{userDetailErr}</p>
              <button onClick={() => setUserDetailErr(null)} style={retryButtonStyle}>Close</button>
            </div>
          </div>
        )}

        {selectedUser && (
          <div style={overlayStyle} onClick={() => setSelectedUser(null)}>
            <div style={slideoutContainerStyle} onClick={(e) => e.stopPropagation()}>
              
              {/* Close Button */}
              <button onClick={() => setSelectedUser(null)} style={closeSlideoutBtnStyle}>×</button>

              {/* Overlay Profile Header */}
              <div style={slideoutHeaderStyle}>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={slideoutAvatarStyle}>
                    {selectedUser.profile.full_name ? selectedUser.profile.full_name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h2 style={{ color: "#fff", margin: 0, fontSize: "20px", fontWeight: "700" }}>{selectedUser.profile.full_name || "Anonymous Patient"}</h2>
                    <span style={{ fontSize: "13px", color: "#9ca3af" }}>{selectedUser.profile.email}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button
                    onClick={() => handleToggleSuspend(selectedUser.profile)}
                    style={{
                      ...actionBtnStyle,
                      flex: 1,
                      background: selectedUser.profile.is_suspended ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                      border: selectedUser.profile.is_suspended ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(245, 158, 11, 0.2)",
                      color: selectedUser.profile.is_suspended ? "#10b981" : "#f59e0b"
                    }}
                  >
                    {selectedUser.profile.is_suspended ? "🔑 Activate Account" : "🔒 Suspend Account"}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(selectedUser.profile)}
                    style={{ ...actionBtnStyle, flex: 1, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#fca5a5" }}
                  >
                    🗑️ Delete Profile
                  </button>
                </div>
              </div>

              {/* Timeline list of assessments */}
              <div style={slideoutContentStyle}>
                <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 16px 0", fontWeight: "600" }}>
                  Assessment Timeline ({selectedUser.reports.length})
                </h3>

                {selectedUser.reports.length === 0 ? (
                  <p style={{ color: "#6b7280", fontSize: "14px" }}>This user hasn't completed any health risk assessments yet.</p>
                ) : (
                  <div style={timelineStackStyle}>
                    {selectedUser.reports.map((report, idx) => {
                      const date = new Date(report.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      });

                      const score = report.risk_score;
                      const level = report.risk_level;
                      const isHigh = score > 70 || level === "High" || level === "Critical";

                      return (
                        <div key={report.id} style={timelineCardStyle}>
                          <div style={timelineDotStyle(isHigh)}></div>
                          <div style={timelineHeaderStyle}>
                            <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "600" }}>{date}</span>
                            <span style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "20px",
                              fontWeight: "700",
                              background: isHigh ? "rgba(239, 68, 68, 0.12)" : level === "Moderate" ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                              color: isHigh ? "#ef4444" : level === "Moderate" ? "#f59e0b" : "#10b981"
                            }}>
                              {score}% Risk — {level}
                            </span>
                          </div>

                          {/* Parameters log */}
                          <div style={timelineGridStyle}>
                            <div style={paramItemStyle}><strong>Age:</strong> {report.age}</div>
                            <div style={paramItemStyle}><strong>BMI:</strong> {report.bmi}</div>
                            <div style={paramItemStyle}><strong>BP:</strong> {report.blood_pressure}</div>
                            <div style={paramItemStyle}><strong>Cholesterol:</strong> {report.cholesterol}</div>
                            <div style={paramItemStyle}><strong>Smoking:</strong> {report.smoking ? "Yes" : "No"}</div>
                            <div style={paramItemStyle}><strong>Diet:</strong> {report.diet_type || "vegetarian"}</div>
                            <div style={paramItemStyle}><strong>Sleep:</strong> {report.sleep_duration || 7}h</div>
                            <div style={paramItemStyle}><strong>Work:</strong> {report.work_type || "active"}</div>
                          </div>

                          {/* Advice snippet */}
                          {report.llm_advice && (
                            <div style={adviceSnippetStyle}>
                              <strong>Advice Summary:</strong>
                              <p style={{ margin: "4px 0 0 0", fontSize: "13px", lineHeight: "1.6", color: "#cbd5e1" }}>
                                {report.llm_advice.substring(0, 180)}...
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ── Styling Tokens ────────────────────────────────────────────────────
const adminLayoutStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "var(--bg-dark, #0b0f19)",
};

const adminMainContentStyle = {
  flex: 1,
  padding: "36px",
  maxHeight: "calc(100vh - 64px)",
  overflowY: "auto",
  fontFamily: "Inter, sans-serif",
};

const dashboardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "32px",
};

const filterBarWrapStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const searchFormStyle = {
  display: "flex",
  gap: "10px",
  flex: 1,
  maxWidth: "480px",
};

const searchInputStyle = {
  flex: 1,
  padding: "10px 16px",
  borderRadius: "10px",
  background: "rgba(17, 24, 39, 0.65)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
};

const searchButtonStyle = {
  padding: "10px 20px",
  borderRadius: "10px",
  background: "#10b981",
  border: "none",
  color: "#fff",
  fontWeight: "600",
  fontSize: "14px",
  cursor: "pointer",
};

const filterButtonsWrapStyle = {
  display: "flex",
  gap: "8px",
};

const filterBtnStyle = {
  padding: "8px 16px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.06)",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const spinnerStyle = {
  border: "4px solid rgba(255,255,255,0.06)",
  borderLeftColor: "#10b981",
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  animation: "spin 1s linear infinite",
};

const errorCardStyle = {
  background: "rgba(239, 68, 68, 0.08)",
  border: "1px solid rgba(239, 68, 68, 0.15)",
  color: "#fca5a5",
  padding: "20px",
  borderRadius: "12px",
  textAlign: "center",
};

const emptyCardStyle = {
  background: "rgba(17, 24, 39, 0.3)",
  border: "1px solid rgba(255,255,255,0.04)",
  color: "#9ca3af",
  padding: "40px",
  borderRadius: "12px",
  textAlign: "center",
};

const tableContainerStyle = {
  background: "rgba(17, 24, 39, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
};

const tableHeaderRowStyle = {
  background: "rgba(255,255,255,0.02)",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const thStyle = {
  padding: "16px 24px",
  fontSize: "12px",
  color: "#9ca3af",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const trStyle = {
  borderBottom: "1px solid rgba(255,255,255,0.03)",
  transition: "background 0.2s ease",
};

const tdStyle = {
  padding: "18px 24px",
  fontSize: "14px",
  color: "#e2e8f0",
  verticalAlign: "middle",
};

const actionBtnStyle = {
  padding: "6px 14px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(3, 7, 18, 0.7)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const slideoutContainerStyle = {
  background: "#0f172a",
  borderLeft: "1px solid rgba(16, 185, 129, 0.15)",
  width: "550px",
  maxWidth: "100%",
  height: "100vh",
  position: "absolute",
  right: 0,
  top: 0,
  display: "flex",
  flexDirection: "column",
  boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",
  animation: "slideIn 0.3s ease-out forwards",
};

const closeSlideoutBtnStyle = {
  position: "absolute",
  top: "16px",
  right: "20px",
  background: "none",
  border: "none",
  color: "#9ca3af",
  fontSize: "28px",
  cursor: "pointer",
};

const slideoutHeaderStyle = {
  padding: "32px",
  background: "rgba(17, 24, 39, 0.5)",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const slideoutAvatarStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #10b981, #06b6d4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  fontWeight: "bold",
  color: "#fff",
};

const slideoutContentStyle = {
  flex: 1,
  padding: "32px",
  overflowY: "auto",
};

const timelineStackStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  borderLeft: "2px solid rgba(255,255,255,0.05)",
  paddingLeft: "20px",
  marginLeft: "8px",
};

const timelineCardStyle = {
  background: "rgba(17, 24, 39, 0.4)",
  border: "1px solid rgba(255,255,255,0.03)",
  borderRadius: "12px",
  padding: "20px",
  position: "relative",
};

const timelineDotStyle = (isHigh) => ({
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  background: isHigh ? "#ef4444" : "#10b981",
  position: "absolute",
  left: "-27px",
  top: "24px",
  border: "2px solid #0f172a",
  boxShadow: isHigh ? "0 0 10px rgba(239, 68, 68, 0.4)" : "0 0 10px rgba(16, 185, 129, 0.4)",
});

const timelineHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const timelineGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "10px",
  background: "rgba(255,255,255,0.02)",
  borderRadius: "8px",
  padding: "10px",
  fontSize: "12px",
  color: "#94a3b8",
};

const paramItemStyle = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const adviceSnippetStyle = {
  marginTop: "12px",
  padding: "12px",
  background: "rgba(16, 185, 129, 0.05)",
  borderRadius: "8px",
  borderLeft: "2px solid #10b981",
  fontSize: "13px",
  color: "#fff",
};

const errorBoxStyle = {
  background: "rgba(239, 68, 68, 0.08)",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  padding: "32px",
  borderRadius: "16px",
  maxWidth: "500px",
  width: "100%",
  textAlign: "center",
  fontFamily: "Inter, sans-serif",
  color: "#fff",
};

const retryButtonStyle = {
  marginTop: "16px",
  padding: "10px 24px",
  borderRadius: "10px",
  background: "#ef4444",
  border: "none",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
};

export default AdminUsers;
