import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

// Inner form component — receives initial values via props.
// Using a `key` on this component forces React to remount it
// (and re-run useState initialisers) when the source data changes,
// which avoids the forbidden "setState inside useEffect" pattern.
function ProfileForm({ user, initialFullName, initialPhone, updateProfile }) {
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    const { error: updateError } = await updateProfile({
      full_name: fullName,
      phone: phone,
    });

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Profile updated successfully");
    }
  };

  return (
    <>
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

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Saving..." : "Update Profile"}
        </button>
      </form>
    </>
  );
}

function Profile() {
  const { user, profile, updateProfile, syncProfile } = useAuth();

  useEffect(() => {
    if (!user || profile) return;
    syncProfile();
  }, [user, profile, syncProfile]);

  const sourceFullName = profile?.full_name || user?.user_metadata?.full_name || "";
  const sourcePhone = profile?.phone || user?.user_metadata?.phone || "";
  const memberSince = profile?.created_at || user?.created_at || null;
  const lastUpdated = profile?.updated_at || null;

  // Stable key: remount only when profile first loads (null → data) or
  // when the user changes.  Subsequent saves update profile but keep
  // the same key so ProfileForm stays mounted and can show its
  // success/error feedback without being destroyed mid-save.
  const formKey = `${user?.id}-${profile ? "1" : "0"}`;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1>Your Profile</h1>

        <ProfileForm
          key={formKey}
          user={user}
          initialFullName={sourceFullName}
          initialPhone={sourcePhone}
          updateProfile={updateProfile}
        />

        <div className="profile-info">
          <div><strong>Member since:</strong> {memberSince ? new Date(memberSince).toLocaleDateString() : "N/A"}</div>
          <div><strong>Last updated:</strong> {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : "N/A"}</div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
