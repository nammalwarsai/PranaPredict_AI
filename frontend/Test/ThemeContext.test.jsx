import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useContext } from "react";
import { ThemeProvider, ThemeContext, useTheme } from "../src/context/ThemeContext";

describe("ThemeContext", () => {
  let originalLocalStorage;
  let originalMatchMedia;

  beforeEach(() => {
    // Mock localStorage
    originalLocalStorage = global.localStorage;
    const store = {};
    global.localStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
    };

    // Mock matchMedia
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Mock document.documentElement.setAttribute
    document.documentElement.setAttribute = vi.fn();
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  function TestConsumer() {
    const { theme, toggleTheme } = useTheme();
    return (
      <div>
        <span data-testid="current-theme">{theme}</span>
        <button onClick={toggleTheme}>Toggle Theme</button>
      </div>
    );
  }

  describe("getInitialTheme", () => {
    it("returns stored theme from localStorage when available", () => {
      localStorage.setItem("prana-theme", "dark");

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("current-theme").textContent).toBe("dark");
    });

    it("returns light theme from localStorage", () => {
      localStorage.setItem("prana-theme", "light");

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("current-theme").textContent).toBe("light");
    });

    it("falls back to system preference when localStorage is empty", () => {
      window.matchMedia = vi.fn((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("current-theme").textContent).toBe("dark");
    });

    it("defaults to light when no localStorage and system prefers light", () => {
      window.matchMedia = vi.fn((query) => ({
        matches: false,
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("current-theme").textContent).toBe("light");
    });
  });

  describe("ThemeProvider", () => {
    it("sets data-theme attribute on document root on mount", () => {
      localStorage.setItem("prana-theme", "dark");

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "dark"
      );
    });

    it("persists theme to localStorage on mount", () => {
      localStorage.setItem("prana-theme", "light");

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(localStorage.setItem).toHaveBeenCalledWith("prana-theme", "light");
    });
  });

  describe("toggleTheme", () => {
    it("toggles from light to dark", () => {
      localStorage.setItem("prana-theme", "light");

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      const toggleButton = screen.getByText("Toggle Theme");

      act(() => {
        toggleButton.click();
      });

      expect(screen.getByTestId("current-theme").textContent).toBe("dark");
      expect(localStorage.setItem).toHaveBeenCalledWith("prana-theme", "dark");
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "dark"
      );
    });

    it("toggles from dark to light", () => {
      localStorage.setItem("prana-theme", "dark");

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      const toggleButton = screen.getByText("Toggle Theme");

      act(() => {
        toggleButton.click();
      });

      expect(screen.getByTestId("current-theme").textContent).toBe("light");
      expect(localStorage.setItem).toHaveBeenCalledWith("prana-theme", "light");
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "light"
      );
    });

    it("toggles multiple times correctly", () => {
      localStorage.setItem("prana-theme", "light");

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      const toggleButton = screen.getByText("Toggle Theme");

      // Light -> Dark
      act(() => {
        toggleButton.click();
      });
      expect(screen.getByTestId("current-theme").textContent).toBe("dark");

      // Dark -> Light
      act(() => {
        toggleButton.click();
      });
      expect(screen.getByTestId("current-theme").textContent).toBe("light");

      // Light -> Dark
      act(() => {
        toggleButton.click();
      });
      expect(screen.getByTestId("current-theme").textContent).toBe("dark");
    });
  });

  describe("useTheme hook", () => {
    it("provides theme and toggleTheme to consumers", () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("current-theme")).toBeInTheDocument();
      expect(screen.getByText("Toggle Theme")).toBeInTheDocument();
    });

    it("throws error when used outside ThemeProvider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<TestConsumer />);
      }).toThrow();

      console.error = originalError;
    });
  });
});
