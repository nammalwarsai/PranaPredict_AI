import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../src/components/ProtectedRoute";
import PublicRoute from "../src/components/PublicRoute";
import AdminRoute from "../src/components/AdminRoute";

// Mock useAuth hook
vi.mock("../src/hooks/useAuth", () => {
  const fn = vi.fn();
  return { default: fn, useAuth: fn };
});

import useAuth from "../src/hooks/useAuth";

describe("Route Protection Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ProtectedRoute", () => {
    it("shows loading screen when authentication is loading", () => {
      useAuth.mockReturnValue({ user: null, loading: true, profile: null });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("redirects to login when user is not authenticated", () => {
      useAuth.mockReturnValue({ user: null, loading: false, profile: null });

      render(
        <MemoryRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("renders children when user is authenticated", () => {
      useAuth.mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        loading: false,
        profile: { full_name: "Test User" },
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  describe("PublicRoute", () => {
    it("shows loading screen when authentication is loading", () => {
      useAuth.mockReturnValue({ user: null, loading: true, profile: null });

      render(
        <MemoryRouter>
          <PublicRoute>
            <div>Public Content</div>
          </PublicRoute>
        </MemoryRouter>
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Public Content")).not.toBeInTheDocument();
    });

    it("redirects to dashboard when user is already authenticated", () => {
      useAuth.mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        loading: false,
        profile: { full_name: "Test User" },
      });

      render(
        <MemoryRouter>
          <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <div>Public Content</div>
                </PublicRoute>
              }
            />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
      expect(screen.queryByText("Public Content")).not.toBeInTheDocument();
    });

    it("renders children when user is not authenticated", () => {
      useAuth.mockReturnValue({ user: null, loading: false, profile: null });

      render(
        <MemoryRouter>
          <PublicRoute>
            <div>Public Content</div>
          </PublicRoute>
        </MemoryRouter>
      );

      expect(screen.getByText("Public Content")).toBeInTheDocument();
    });
  });

  describe("AdminRoute", () => {
    it("shows loading screen when authentication is loading", () => {
      useAuth.mockReturnValue({ user: null, loading: true, profile: null });

      render(
        <MemoryRouter>
          <AdminRoute>
            <div>Admin Content</div>
          </AdminRoute>
        </MemoryRouter>
      );

      expect(screen.getByText("Loading administrative console...")).toBeInTheDocument();
      expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
    });

    it("redirects to admin login when user is not authenticated", () => {
      useAuth.mockReturnValue({ user: null, loading: false, profile: null });

      render(
        <MemoryRouter>
          <Routes>
            <Route
              path="/"
              element={
                <AdminRoute>
                  <div>Admin Content</div>
                </AdminRoute>
              }
            />
            <Route path="/admin/login" element={<div>Admin Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Admin Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
    });

    it("redirects to dashboard when user is authenticated but not admin", () => {
      useAuth.mockReturnValue({
        user: { id: "user-1", email: "user@example.com" },
        loading: false,
        profile: { full_name: "Regular User", is_admin: false },
      });

      render(
        <MemoryRouter>
          <Routes>
            <Route
              path="/"
              element={
                <AdminRoute>
                  <div>Admin Content</div>
                </AdminRoute>
              }
            />
            <Route path="/dashboard" element={<div>User Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("User Dashboard")).toBeInTheDocument();
      expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
    });

    it("redirects to dashboard when profile is missing", () => {
      useAuth.mockReturnValue({
        user: { id: "user-1", email: "user@example.com" },
        loading: false,
        profile: null,
      });

      render(
        <MemoryRouter>
          <Routes>
            <Route
              path="/"
              element={
                <AdminRoute>
                  <div>Admin Content</div>
                </AdminRoute>
              }
            />
            <Route path="/dashboard" element={<div>User Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("User Dashboard")).toBeInTheDocument();
      expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
    });

    it("renders children when user is authenticated admin", () => {
      useAuth.mockReturnValue({
        user: { id: "admin-1", email: "admin@example.com" },
        loading: false,
        profile: { full_name: "Admin User", is_admin: true },
      });

      render(
        <MemoryRouter>
          <AdminRoute>
            <div>Admin Content</div>
          </AdminRoute>
        </MemoryRouter>
      );

      expect(screen.getByText("Admin Content")).toBeInTheDocument();
    });
  });
});
