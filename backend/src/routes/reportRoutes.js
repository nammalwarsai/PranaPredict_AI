const express = require("express");
const router = express.Router();
const { getReports, getReportById } = require("../controllers/reportController");

// GET /api/reports
router.get("/", getReports);

// GET /api/reports/:id
router.get("/:id", getReportById);

module.exports = router;
