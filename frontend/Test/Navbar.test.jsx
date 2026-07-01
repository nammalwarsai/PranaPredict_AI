import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";

// Mock modules with inline factory functions (to avoid hoisting issues)
vi.mock("../src/hooks/useAuth", () => {
  const fn = vi.fn();
  return { default: fn, useAuth: fn };
});

vi.mock("../src/context/ThemeContext", () => ({
  useTheme: vi.fn(),
}));

vi.mock("../src/api/api", () => ({
  sendLogoutNotification: vi.fn(),
}));

// Import after mocks
import Navbar from "../src/components/Navbar";
import { sendLogoutNotification } from "../src/api/api";
import { useTheme } from "../src/context/ThemeContext";
import useAuth from "../src/hooks/useAuth";

describe("Navbar Component", () => {
  const mockSignOut = vi.fn();
  const mockToggleTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useAuth return value
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signOut: mockSignOut,
    });
    
    // Mock useTheme return value
    vi.mocked(useTheme).mockReturnValue({
      theme: "light",
      toggleTheme: mockToggleTheme,
    });
  });

  describe("Authentication State", () => {
    it("shows login and signup links when user is not authenticated", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByText("Sign In")).toBeInTheDocument();
      expect(screen.getByText("Sign Up")).toBeInTheDocument();
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });

    it("shows navigation links when user is authenticated", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        profile: { full_name: "Test User", is_admin: false },
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("History")).toBeInTheDocument();
      expect(screen.getByText("Analytics")).toBeInTheDocument();
      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    });

    it("shows admin panel link when user is admin", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "admin-1", email: "admin@example.com" },
        profile: { full_name: "Admin User", is_admin: true },
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByText("Admin Portal")).toBeInTheDocument();
    });

    it("does not show admin panel link for regular users", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        profile: { full_name: "Test User", is_admin: false },
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.queryByText("Admin Portal")).not.toBeInTheDocument();
    });
  });

  describe("Mobile Menu", () => {
    it("toggles mobile menu when burger button is clicked", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        profile: { full_name: "Test User", is_admin: false },
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      // Find burger button (usually has specific class or aria-label)
      const burgerButton = screen.getByRole("button", { name: /Open menu/i });

      // Menu should be initially closed
      const navLinks = screen.getByRole("navigation", { name: "Primary" });
      expect(navLinks.className).not.toContain("--open");

      // Open menu
      fireEvent.click(burgerButton);
      expect(navLinks.className).toContain("--open");

      // Close menu
      fireEvent.click(burgerButton);
      expect(navLinks.className).not.toContain("--open");
    });

    it("closes mobile menu when Escape key is pressed", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        profile: { full_name: "Test User", is_admin: false },
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const burgerButton = screen.getByRole("button", { name: /Open menu/i });

      // Open menu
      fireEvent.click(burgerButton);
      const navLinks = screen.getByRole("navigation", { name: "Primary" });
      expect(navLinks.className).toContain("--open");

      // Press Escape
      fireEvent.keyDown(document, { key: "Escape" });
      expect(navLinks.className).not.toContain("--open");
    });

    it("does not close menu on other key presses", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        profile: { full_name: "Test User", is_admin: false },
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const burgerButton = screen.getByRole("button", { name: /Open menu/i });
      fireEvent.click(burgerButton);

      const navLinks = screen.getByRole("navigation", { name: "Primary" });
      expect(navLinks.className).toContain("--open");

      // Press other keys
      fireEvent.keyDown(document, { key: "Enter" });
      expect(navLinks.className).toContain("--open");

      fireEvent.keyDown(document, { key: "Tab" });
      expect(navLinks.className).toContain("--open");
    });
  });

  describe("Theme Toggle", () => {
    it("calls toggleTheme when theme button is clicked", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        profile: { full_name: "Test User", is_admin: false },
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const themeButton = screen.getByRole("button", { name: /Toggle theme/i });
      fireEvent.click(themeButton);

      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it("shows moon icon for light theme", () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: "light",
        toggleTheme: mockToggleTheme,
      });

      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        profile: { full_name: "Test User", is_admin: false },
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      // Light theme should show moon SVG icon (switch to dark)
      const themeButton = screen.getByRole("button", { name: /Toggle theme/i });
      expect(themeButton.querySelector("svg")).toBeInTheDocument();
    });

    it("shows sun icon for dark theme", () => {
      vi.mocked(useTheme).mockReturnValue({
        theme: "dark",
        toggleTheme: mockToggleTheme,
      });

      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        profile: { full_name: "Test User", is_admin: false },
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      // Dark theme should show sun SVG icon (switch to light)
      const themeButton = screen.getByRole("button", { name: /Toggle theme/i });
      expect(themeButton.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Sign Out Functionality", () => {
    it("calls signOut and sendLogoutNotification when sign out is clicked", async () => {
      vi.mocked(sendLogoutNotification).mockResolvedValueOnce({ data: { success: true } });
      mockSignOut.mockResolvedValueOnce({});

      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        profile: { full_name: "Test User", is_admin: false },
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const signOutButton = screen.getByText(/sign out/i);
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(sendLogoutNotification).toHaveBeenCalledTimes(1);
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    it("handles logout notification errors gracefully", async () => {
      vi.mocked(sendLogoutNotification).mockRejectedValueOnce(new Error("Network error"));
      mockSignOut.mockResolvedValueOnce({});

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        profile: { full_name: "Test User", is_admin: false },
        loading: false,
        signOut: mockSignOut,
      });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const signOutButton = screen.getByText(/sign out/i);
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(sendLogoutNotification).toHaveBeenCalledTimes(1);
        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Cleanup", () => {
    it("removes event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", email: "test@example.com" },
        profile: { full_name: "Test User", is_admin: false },
        loading: false,
        signOut: mockSignOut,
      });

      const { unmount } = render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });
});
