import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, profile, updateProfile, syncProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      return;
    }

    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setPhone(user.user_metadata?.phone || "");
    }
  }, [profile, user]);

  useEffect(() => {
    if (!user || profile) return;
    syncProfile();
  }, [user, profile]);

  const memberSince = profile?.created_at || user?.created_at || null;
  const lastUpdated = profile?.updated_at || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    const { error } = await updateProfile({
      full_name: fullName,
      phone: phone,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage("Profile updated successfully");
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1>Your Profile</h1>

        <div className="profile-avatar">
          {(fullName || user?.email || "U").charAt(0).toUpperCase()}
        </div>

        {message && <div className="profile-success">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="profileEmail">Email</label>
            <input
              type="email"
              id="profileEmail"
              value={user?.email || ""}
              disabled
              className="input-disabled"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profilePhone">Phone Number</label>
            <input
              type="tel"
              id="profilePhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
            />
          </div>

          <div className="profile-info">
            <div><strong>Member since:</strong> {memberSince ? new Date(memberSince).toLocaleDateString() : "N/A"}</div>
            <div><strong>Last updated:</strong> {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : "N/A"}</div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Saving..." : "Update Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
