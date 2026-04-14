import axios from "axios";
import supabase from "../config/supabaseClient";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
  timeout: 15000,
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

// ── Prediction with request cancellation ────────────────────────────
// Cancels any in-flight prediction request before sending a new one,
// preventing duplicate submissions and wasted server work.
let _predictionController = null;

// Health check
export const checkHealth = () => API.get("/api/health");

// Prediction
export const submitPrediction = (healthData) => {
  if (_predictionController) {
    _predictionController.abort();
    _predictionController = null;
  }
  _predictionController = new AbortController();
  return API.post("/api/predict", healthData, {
    signal: _predictionController.signal,
    // LLM calls can be slow; give this endpoint its own generous timeout
    timeout: 30000,
  });
};

// Reports
export const getReports = (page = 1) => API.get("/api/reports", { params: { page } });
export const getReportById = (id) => API.get(`/api/reports/${id}`);
export const getAllReports = async () => {
  const all = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await getReports(page);
    const pageData = response.data?.data || [];
    const pageMeta = response.data?.pagination || {};
    totalPages = pageMeta.totalPages || 1;
    all.push(...pageData);
    page += 1;
  }

  return all;
};

// Email notifications
export const sendLoginNotification = () => API.post("/api/email/login");
export const sendLogoutNotification = () => API.post("/api/email/logout");

export default API;
