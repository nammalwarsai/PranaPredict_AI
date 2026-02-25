import axios from "axios";
import supabase from "../config/supabaseClient";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
  timeout: 30000,
});

// ── Session tracking ────────────────────────────────────────────────
// Keep a module-level reference so the axios interceptor can read the
// token synchronously instead of racing with getSession().

let _currentSession = null;

// 1. Hydrate from storage on module load
supabase.auth.getSession().then(({ data: { session } }) => {
  _currentSession = session;
});

// 2. Stay in sync with every auth change (login, logout, token refresh)
supabase.auth.onAuthStateChange((_event, session) => {
  _currentSession = session;
});

// ── Request interceptor ─────────────────────────────────────────────
// Prefer the synchronous cached session.  Fall back to an async
// getSession() call only if the cache hasn't been populated yet (e.g.
// the very first request fires before the auth listener has run).
API.interceptors.request.use(async (config) => {
  let accessToken = _currentSession?.access_token || null;

  if (!accessToken) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      _currentSession = session;
      accessToken = session?.access_token || null;
    } catch {
      // Proceed without token
    }
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Health check
export const checkHealth = () => API.get("/api/health");

// Prediction
export const submitPrediction = (healthData) => API.post("/api/predict", healthData);

// Reports
export const getReports = () => API.get("/api/reports");
export const getReportById = (id) => API.get(`/api/reports/${id}`);

export default API;
