const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getAllUsers, getCurrentUser, adminLogin } = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", adminLogin);
router.get("/users", getAllUsers);
router.get("/me", auth, getCurrentUser);

module.exports = router;