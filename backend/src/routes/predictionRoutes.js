const express = require("express");
const router = express.Router();
const { predict } = require("../controllers/predictionController");

// POST /api/predict
router.post("/", predict);

module.exports = router;
