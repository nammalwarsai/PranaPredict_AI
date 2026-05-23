import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Report from "./pages/Report";
import HealthTips from "./pages/HealthTips";
import Analytics from "./pages/Analytics";

// Admin Panel Imports
import AdminRoute from "./components/AdminRoute";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminReports from "./pages/AdminReports";

import "./App.css";
import "./styles/design-system.css";

// Layout for standard client-facing pages
function ClientLayout() {
  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Navbar />
      <main id="main-content" className="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}

// Layout for full-width admin portal pages
function AdminLayoutWrapper() {
  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Navbar />
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* Standard Client Pages */}
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

            {/* Admin Portal Pages */}
            <Route element={<AdminLayoutWrapper />}>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

