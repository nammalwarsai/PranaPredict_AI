import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import supabase from "../src/config/supabaseClient";
import {
  submitPrediction,
  getReports,
  getReportById,
  getAllReports,
  sendLoginNotification,
  sendLogoutNotification,
  adminLogin,
  getAdminStats,
  checkHealth,
} from "../src/api/api";

// Mock axios
vi.mock("axios");

// Mock Supabase
vi.mock("../src/config/supabaseClient", () => {
  const mockSubscription = { unsubscribe: vi.fn() };
  return {
    default: {
      auth: {
        getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: mockSubscription } })),
      },
    },
  };
});

describe("API Module", () => {
  let mockAxiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn((successHandler) => {
            mockAxiosInstance._requestInterceptor = successHandler;
            return 0;
          }),
        },
      },
    };

    axios.create.mockReturnValue(mockAxiosInstance);
  });

  describe("Session Management", () => {
    it("hydrates session from Supabase on module load", async () => {
      const mockSession = {
        access_token: "test-token-123",
        user: { id: "user-1", email: "test@example.com" },
      };

      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });

      // Wait for promise resolution
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    it("updates session via onAuthStateChange listener", () => {
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe("Request Interceptor", () => {
    it("adds Authorization header when session exists", async () => {
      const mockConfig = { headers: {} };
      const mockSession = {
        access_token: "bearer-token-xyz",
      };

      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
      });

      // Simulate interceptor
      const interceptor = mockAxiosInstance._requestInterceptor;
      const result = await interceptor(mockConfig);

      expect(result.headers.Authorization).toBe("Bearer bearer-token-xyz");
    });

    it("proceeds without token when session is null", async () => {
      const mockConfig = { headers: {} };

      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });

      const interceptor = mockAxiosInstance._requestInterceptor;
      const result = await interceptor(mockConfig);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it("handles getSession errors gracefully", async () => {
      const mockConfig = { headers: {} };

      supabase.auth.getSession.mockRejectedValueOnce(new Error("Network error"));

      const interceptor = mockAxiosInstance._requestInterceptor;
      const result = await interceptor(mockConfig);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe("submitPrediction", () => {
    it("sends POST request with health data", async () => {
      const healthData = {
        age: 30,
        bmi: 24.5,
        diabetes: false,
      };

      const mockResponse = {
        data: { data: { risk_score: 45, risk_level: "Low" } },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await submitPrediction(healthData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/predict",
        healthData,
        expect.objectContaining({
          timeout: 30000,
        })
      );
      expect(result.data.data.risk_score).toBe(45);
    });

    it("cancels previous prediction request when new one is submitted", async () => {
      const abortMock = vi.fn();
      global.AbortController = vi.fn(() => ({
        abort: abortMock,
        signal: {},
      }));

      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      // First request
      submitPrediction({ age: 30 });

      // Second request should cancel first
      submitPrediction({ age: 35 });

      expect(abortMock).toHaveBeenCalled();
    });

    it("handles prediction request errors", async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(
        new Error("Backend service unavailable")
      );

      await expect(submitPrediction({ age: 30 })).rejects.toThrow(
        "Backend service unavailable"
      );
    });
  });

  describe("getReports", () => {
    it("fetches reports with pagination", async () => {
      const mockResponse = {
        data: {
          data: [
            { id: 1, risk_score: 45 },
            { id: 2, risk_score: 67 },
          ],
          pagination: { page: 1, totalPages: 3 },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await getReports(1);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/reports", {
        params: { page: 1 },
      });
      expect(result.data.data).toHaveLength(2);
      expect(result.data.pagination.totalPages).toBe(3);
    });

    it("defaults to page 1 when no page is provided", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { data: [] } });

      await getReports();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/reports", {
        params: { page: 1 },
      });
    });
  });

  describe("getReportById", () => {
    it("fetches a specific report by ID", async () => {
      const mockResponse = {
        data: { id: 123, risk_score: 78, risk_level: "High" },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await getReportById(123);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/reports/123");
      expect(result.data.risk_score).toBe(78);
    });
  });

  describe("getAllReports", () => {
    it("fetches all reports across multiple pages", async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            data: [{ id: 1 }, { id: 2 }],
            pagination: { page: 1, totalPages: 3 },
          },
        })
        .mockResolvedValueOnce({
          data: {
            data: [{ id: 3 }, { id: 4 }],
            pagination: { page: 2, totalPages: 3 },
          },
        })
        .mockResolvedValueOnce({
          data: {
            data: [{ id: 5 }],
            pagination: { page: 3, totalPages: 3 },
          },
        });

      const result = await getAllReports();

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(5);
      expect(result[0].id).toBe(1);
      expect(result[4].id).toBe(5);
    });

    it("handles single page response", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: [{ id: 1 }],
          pagination: { page: 1, totalPages: 1 },
        },
      });

      const result = await getAllReports();

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    it("handles empty response gracefully", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: [],
          pagination: { page: 1, totalPages: 1 },
        },
      });

      const result = await getAllReports();

      expect(result).toHaveLength(0);
    });
  });

  describe("Email Notifications", () => {
    it("sends login notification", async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { success: true } });

      await sendLoginNotification();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/api/email/login");
    });

    it("sends logout notification", async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { success: true } });

      await sendLogoutNotification();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/api/email/logout");
    });
  });

  describe("Admin APIs", () => {
    it("adminLogin sends credentials", async () => {
      const mockResponse = { data: { token: "admin-token", user: { is_admin: true } } };
      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await adminLogin("admin@example.com", "securepass");

      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/api/admin/auth/login", {
        email: "admin@example.com",
        password: "securepass",
      });
      expect(result.data.user.is_admin).toBe(true);
    });

    it("getAdminStats fetches statistics", async () => {
      const mockStats = {
        data: {
          totalUsers: 150,
          totalReports: 320,
          avgRiskScore: 52.3,
        },
      };
      mockAxiosInstance.get.mockResolvedValueOnce(mockStats);

      const result = await getAdminStats();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/admin/stats");
      expect(result.data.totalUsers).toBe(150);
    });
  });

  describe("Health Check", () => {
    it("checks backend health", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { status: "ok" } });

      const result = await checkHealth();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/health");
      expect(result.data.status).toBe("ok");
    });
  });
});
