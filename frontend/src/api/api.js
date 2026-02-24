import axios from "axios";
import supabase from "../config/supabaseClient";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
  timeout: 12000,
});

const SESSION_TIMEOUT_MS = 8000;

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Session lookup timed out")), timeoutMs);
    }),
  ]);
}

function getAccessTokenFromStorage() {
  if (typeof window === "undefined" || !window.localStorage) return null;

  for (const key of Object.keys(window.localStorage)) {
    if (!key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);

      const directToken = parsed?.access_token;
      const sessionToken = parsed?.currentSession?.access_token;
      const arrayToken = Array.isArray(parsed) ? parsed[0]?.access_token : null;

      const token = directToken || sessionToken || arrayToken;
      if (token) return token;
    } catch {
      // Ignore malformed localStorage values
    }
  }

  return null;
}

// Attach Supabase auth token to every request
API.interceptors.request.use(async (config) => {
  let accessToken = null;

  try {
    const { data: { session } } = await withTimeout(
      supabase.auth.getSession(),
      SESSION_TIMEOUT_MS
    );
    accessToken = session?.access_token || null;
  } catch {
    // Fallback to storage token if session lookup fails
  }

  if (!accessToken) {
    accessToken = getAccessTokenFromStorage();
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
