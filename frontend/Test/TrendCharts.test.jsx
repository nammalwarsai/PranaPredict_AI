import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TrendCharts from "../src/components/TrendCharts";
import { useTheme } from "../src/context/ThemeContext";

// Mock ThemeContext
vi.mock("../src/context/ThemeContext", () => ({
  useTheme: vi.fn(),
}));

// Mock Chart.js components
vi.mock("react-chartjs-2", () => ({
  Line: ({ data, options }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      Line Chart
    </div>
  ),
  Doughnut: ({ data, options }) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)}>
      Doughnut Chart
    </div>
  ),
}));

describe("TrendCharts Component", () => {
  const mockReports = [
    {
      id: 1,
      risk_score: 45,
      risk_level: "Low",
      created_at: "2026-01-15T10:00:00Z",
    },
    {
      id: 2,
      risk_score: 62,
      risk_level: "Moderate",
      created_at: "2026-01-20T10:00:00Z",
    },
    {
      id: 3,
      risk_score: 78,
      risk_level: "High",
      created_at: "2026-01-25T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useTheme.mockReturnValue({ theme: "light" });
  });

  describe("Report Sorting", () => {
    it("sorts reports by created_at chronologically", () => {
      const unsortedReports = [
        { id: 3, risk_score: 78, risk_level: "High", created_at: "2026-01-25T10:00:00Z" },
        { id: 1, risk_score: 45, risk_level: "Low", created_at: "2026-01-15T10:00:00Z" },
        { id: 2, risk_score: 62, risk_level: "Moderate", created_at: "2026-01-20T10:00:00Z" },
      ];

      render(<TrendCharts reports={unsortedReports} />);

      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data"));

      // Should be sorted: 45, 62, 78
      expect(chartData.datasets[0].data).toEqual([45, 62, 78]);
    });
  });

  describe("Statistics Calculations", () => {
    it("calculates correct number of assessments", () => {
      render(<TrendCharts reports={mockReports} />);

      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("calculates average score correctly", () => {
      render(<TrendCharts reports={mockReports} />);

      // Average of 45, 62, 78 = 185 / 3 = 61.7
      expect(screen.getByText("61.7")).toBeInTheDocument();
    });

    it("displays latest score", () => {
      render(<TrendCharts reports={mockReports} />);

      // Latest score should be 78 (most recent date)
      expect(screen.getByText(/78/)).toBeInTheDocument();
    });

    it("handles empty reports array gracefully", () => {
      render(<TrendCharts reports={[]} />);

      expect(screen.getByText("0")).toBeInTheDocument(); // assessments
      expect(screen.getByText("—")).toBeInTheDocument(); // average score placeholder
    });

    it("handles single report correctly", () => {
      const singleReport = [mockReports[0]];

      render(<TrendCharts reports={singleReport} />);

      expect(screen.getByText("1")).toBeInTheDocument(); // 1 assessment
      expect(screen.getByText("45.0")).toBeInTheDocument(); // average = 45
      expect(screen.getByText(/45/)).toBeInTheDocument(); // latest = 45
    });
  });

  describe("Trend Calculation", () => {
    it("calculates upward trend correctly", () => {
      const trendingUp = [
        { id: 1, risk_score: 40, risk_level: "Low", created_at: "2026-01-15T10:00:00Z" },
        { id: 2, risk_score: 55, risk_level: "Moderate", created_at: "2026-01-20T10:00:00Z" },
      ];

      render(<TrendCharts reports={trendingUp} />);

      // Trend should show +15 increase
      expect(screen.getByText("↑")).toBeInTheDocument();
      expect(screen.getByText("+15")).toBeInTheDocument();
    });

    it("calculates downward trend correctly", () => {
      const trendingDown = [
        { id: 1, risk_score: 70, risk_level: "High", created_at: "2026-01-15T10:00:00Z" },
        { id: 2, risk_score: 50, risk_level: "Moderate", created_at: "2026-01-20T10:00:00Z" },
      ];

      render(<TrendCharts reports={trendingDown} />);

      // Trend should show -20 decrease
      expect(screen.getByText("↓")).toBeInTheDocument();
      expect(screen.getByText("-20")).toBeInTheDocument();
    });

    it("handles no change in trend", () => {
      const noChange = [
        { id: 1, risk_score: 50, risk_level: "Moderate", created_at: "2026-01-15T10:00:00Z" },
        { id: 2, risk_score: 50, risk_level: "Moderate", created_at: "2026-01-20T10:00:00Z" },
      ];

      render(<TrendCharts reports={noChange} />);

      expect(screen.getByText("→")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("does not show trend for single report", () => {
      const singleReport = [mockReports[0]];

      render(<TrendCharts reports={singleReport} />);

      expect(screen.queryByText("↑")).not.toBeInTheDocument();
      expect(screen.queryByText("↓")).not.toBeInTheDocument();
      expect(screen.queryByText("→")).not.toBeInTheDocument();
    });
  });

  describe("Risk Level Distribution", () => {
    it("counts risk levels correctly", () => {
      const mixedReports = [
        { id: 1, risk_score: 30, risk_level: "Low", created_at: "2026-01-10T10:00:00Z" },
        { id: 2, risk_score: 35, risk_level: "Low", created_at: "2026-01-15T10:00:00Z" },
        { id: 3, risk_score: 55, risk_level: "Moderate", created_at: "2026-01-20T10:00:00Z" },
        { id: 4, risk_score: 80, risk_level: "High", created_at: "2026-01-25T10:00:00Z" },
      ];

      render(<TrendCharts reports={mixedReports} />);

      const doughnutChart = screen.getByTestId("doughnut-chart");
      const chartData = JSON.parse(doughnutChart.getAttribute("data-chart-data"));

      // Low: 2, Moderate: 1, High: 1
      expect(chartData.datasets[0].data).toEqual([2, 1, 1]);
    });

    it("handles all Low risk reports", () => {
      const allLow = [
        { id: 1, risk_score: 30, risk_level: "Low", created_at: "2026-01-10T10:00:00Z" },
        { id: 2, risk_score: 35, risk_level: "Low", created_at: "2026-01-15T10:00:00Z" },
      ];

      render(<TrendCharts reports={allLow} />);

      const doughnutChart = screen.getByTestId("doughnut-chart");
      const chartData = JSON.parse(doughnutChart.getAttribute("data-chart-data"));

      expect(chartData.datasets[0].data).toEqual([2, 0, 0]);
    });
  });

  describe("Line Chart Data", () => {
    it("generates correct labels from dates", () => {
      render(<TrendCharts reports={mockReports} />);

      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data"));

      // Dates should be formatted as "15 Jan", "20 Jan", "25 Jan"
      expect(chartData.labels).toHaveLength(3);
      expect(chartData.labels[0]).toContain("Jan");
    });

    it("assigns correct point colors based on risk level", () => {
      render(<TrendCharts reports={mockReports} />);

      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data"));

      const pointColors = chartData.datasets[0].pointBackgroundColor;

      // Low = green, Moderate = amber, High = red
      expect(pointColors[0]).toBe("#22c55e"); // Low
      expect(pointColors[1]).toBe("#f59e0b"); // Moderate
      expect(pointColors[2]).toBe("#ef4444"); // High
    });
  });

  describe("Theme Support", () => {
    it("applies dark theme styles", () => {
      useTheme.mockReturnValue({ theme: "dark" });

      render(<TrendCharts reports={mockReports} />);

      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data"));

      // Check for dark theme background color
      expect(chartData.datasets[0].backgroundColor).toContain("rgba(59, 130, 246, 0.12)");
    });

    it("applies light theme styles", () => {
      useTheme.mockReturnValue({ theme: "light" });

      render(<TrendCharts reports={mockReports} />);

      const lineChart = screen.getByTestId("line-chart");
      const chartData = JSON.parse(lineChart.getAttribute("data-chart-data"));

      // Check for light theme background color
      expect(chartData.datasets[0].backgroundColor).toContain("rgba(37, 99, 235, 0.08)");
    });
  });

  describe("Rendering", () => {
    it("renders all required sections", () => {
      render(<TrendCharts reports={mockReports} />);

      expect(screen.getByText("Your Health Trends")).toBeInTheDocument();
      expect(screen.getByText("Assessments")).toBeInTheDocument();
      expect(screen.getByText("Average Score")).toBeInTheDocument();
      expect(screen.getByText("Latest Score")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      expect(screen.getByTestId("doughnut-chart")).toBeInTheDocument();
    });
  });
});
