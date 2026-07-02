import { BrowserRouter as Router, Routes, Route, Outlet, Suspense, lazy } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AdminRoute from "./components/AdminRoute";
import LoadingFallback from "./components/LoadingFallback";
import "./App.css";
import "./styles/design-system.css";

// Lazy load all pages for better performance
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const History = lazy(() => import("./pages/History"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Profile = lazy(() => import("./pages/Profile"));
const Report = lazy(() => import("./pages/Report"));
const HealthTips = lazy(() => import("./pages/HealthTips"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminReports = lazy(() => import("./pages/AdminReports"));

// Client layout component - memoized
const ClientLayout = () => (
  <div className="app">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <Navbar />
    <main id="main-content" className="main-content" tabIndex={-1}>
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </main>
  </div>
);

// Admin layout wrapper - memoized
const AdminLayoutWrapper = () => (
  <div className="app">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <Navbar />
    <Suspense fallback={<LoadingFallback />}>
      <Outlet />
    </Suspense>
  </div>
);

// Error boundary component for better error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <h2>Something went wrong</h2>
          <p>We're sorry, but an unexpected error occurred.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <Routes>
              <Route element={<ClientLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
                <Route path="/health-tips" element={<ProtectedRoute><HealthTips /></ProtectedRoute>} />
              </Route>

              <Route element={<AdminLayoutWrapper />}>
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
              </Route>
            </Routes>
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
