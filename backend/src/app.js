const express = require("express");
const cors = require("cors");
const authMiddleware = require("./middlewares/authMiddleware");
const predictionRoutes = require("./routes/predictionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// Health check route (public)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "PranaPredict AI backend is running" });
});

// Protected routes
app.use("/api/predict", authMiddleware, predictionRoutes);
app.use("/api/reports", authMiddleware, reportRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;
