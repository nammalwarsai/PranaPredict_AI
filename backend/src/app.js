const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("./middlewares/authMiddleware");
const predictionRoutes = require("./routes/predictionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Security headers
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please try again later." },
});
app.use("/api/", apiLimiter);

// CORS — support comma-separated allowlist via FRONTEND_URL env
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // allow requests with no origin (curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Body parsing with size limit
app.use(express.json({ limit: "100kb" }));

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
