import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Landing() {
  const { user, loading } = useAuth();

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">AI-Powered Health Intelligence</div>
          <h1 className="hero-title">
            Predict Your Health Risks<br />
            <span className="hero-accent">Before They Predict You</span>
          </h1>
          <p className="hero-subtitle">
            PranaPredict AI combines Ayurvedic wisdom with modern preventive medicine
            to analyze your health data and deliver personalized, actionable insights.
          </p>
          <div className="hero-actions">
            {!loading && user ? (
              <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-primary">Go to Dashboard</Link>
                <Link to="/signup" className="btn-outline">Create Account</Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card-demo">
            <div className="demo-score-ring" style={{ "--score-color": "#22c55e" }}>
              <span className="demo-score-num">28</span>
              <span className="demo-score-sub">/ 100</span>
            </div>
            <div className="demo-risk-label" style={{ color: "#22c55e" }}>Low Risk</div>
            <div className="demo-metrics">
              <span>BMI 22.4</span>
              <span>BP 118/76</span>
              <span>Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2 className="section-title">Everything you need to stay ahead</h2>
        <p className="section-subtitle">
          Four pillars that make PranaPredict AI your personal health companion
        </p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon feature-icon--blue">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
              </svg>
            </div>
            <h3>AI Risk Analysis</h3>
            <p>Advanced machine learning evaluates BMI, blood pressure, cholesterol, and lifestyle factors to produce an accurate risk score from 0–100.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon feature-icon--green">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 3z" />
              </svg>
            </div>
            <h3>Ayurvedic Insights</h3>
            <p>Health advice inspired by centuries of Ayurvedic wisdom, blended with evidence-based modern medicine — holistic care for the whole you.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon feature-icon--purple">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </div>
            <h3>Track History</h3>
            <p>Every assessment is saved to your personal health log. Watch your progress over time and celebrate every improvement on your wellness journey.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon feature-icon--orange">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3>Secure &amp; Private</h3>
            <p>Your health data is protected with enterprise-grade security. Encrypted storage, row-level access control, and zero data sharing with third parties.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How it works</h2>
        <p className="section-subtitle">Three simple steps to your personalized health picture</p>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create your account</h3>
            <p>Sign up with your email and phone number. No credit card, no hidden fees — completely free.</p>
          </div>
          <div className="step-arrow">&#8594;</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Enter your health data</h3>
            <p>Input your age, weight, height, blood pressure, cholesterol level, and lifestyle habits.</p>
          </div>
          <div className="step-arrow">&#8594;</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get AI-powered insights</h3>
            <p>Receive your personalised risk score, a detailed health breakdown, and actionable advice from our AI model.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-box">
          <h2>Ready to take control of your health?</h2>
          <p>Join users who are proactively managing their wellness with PranaPredict AI.</p>
          {!loading && user ? (
            <Link to="/dashboard" className="btn-primary btn-large">Go to Dashboard</Link>
          ) : (
            <Link to="/login" className="btn-primary btn-large">Login to Continue</Link>
          )}
        </div>
      </section>
    </div>
  );
}

export default Landing;
