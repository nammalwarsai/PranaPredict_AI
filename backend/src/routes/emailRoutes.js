const express = require("express");
const router = express.Router();
const { sendLoginNotification, sendLogoutNotification } = require("../controllers/emailController");

// POST /api/email/login
router.post("/login", sendLoginNotification);

// POST /api/email/logout
router.post("/logout", sendLogoutNotification);

module.exports = router;
