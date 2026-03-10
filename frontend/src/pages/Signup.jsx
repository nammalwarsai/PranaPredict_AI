import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Signup() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);

  // password match check
  if (password !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  // phone validation (10 digits)
  const cleanedPhone = phone.replace(/\D/g, "");
  if (cleanedPhone.length !== 10) {
    setError("Phone number must contain exactly 10 digits");
    return;
  }

  setLoading(true);
  const { data, error } = await signUp(email, password, cleanedPhone);
  setLoading(false);

  if (error) {
    setError(error.message);
  } else if (data?.user?.identities?.length === 0) {
    setError("An account with this email already exists");
  } else {
    setSuccess(true);
  }
};
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>PranaPredict AI</h1>
          <div className="auth-success">
            <h2>Account Created!</h2>
            <p>Check your email for a confirmation link to activate your account.</p>
            <Link to="/login" className="auth-btn auth-btn--link">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>PranaPredict AI</h1>
        <p className="auth-subtitle">Create your account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
  type="tel"
  id="phone"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  placeholder="9876543210"
  pattern="[0-9]{10}"
  maxLength={10}
  required
/>
          </div>
<div className="form-group">
  <label htmlFor="password">Password</label>
  <div className="password-wrapper">
    <input
      type={showPassword ? "text" : "password"}
      id="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Min 6 characters"
      required
      minLength={6}
      className="password-input"
    />
    <button
      type="button"
      className="password-toggle"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? "🙈" : "👁"}
    </button>
  </div>
</div>
<div className="form-group">
  <label htmlFor="confirmPassword">Confirm Password</label>
  <div className="password-wrapper">
    <input
      type={showConfirmPassword ? "text" : "password"}
      id="confirmPassword"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      placeholder="Re-enter password"
      required
      minLength={6}
      className="password-input"
    />
    <button
      type="button"
      className="password-toggle"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
    >
      {showConfirmPassword ? "🙈" : "👁"}
    </button>
  </div>
</div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
