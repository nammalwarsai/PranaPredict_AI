const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminMiddleware = require("../middlewares/adminMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

// Public Admin Auth route - no auth/admin middleware (authenticates internally)
router.post("/auth/login", adminController.login);

// Protected Admin Routes - require active authentication AND admin status
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id/suspend", adminController.toggleUserSuspension);
router.delete("/users/:id", adminController.deleteUser);
router.get("/reports", adminController.getAllReports);

module.exports = router;