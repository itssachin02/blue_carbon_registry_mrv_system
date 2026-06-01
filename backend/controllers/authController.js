const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateWalletAddress } = require("../utils/walletGenerator");

// Register
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ msg: "User exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const walletAddress = generateWalletAddress(); // Generate unique wallet for each user

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      walletAddress, // Store unique wallet address
      isApproved: true,
      isBlocked: false,
    });

    console.log("✅ New user registered:", { id: user._id, name: user.name, email: user.email });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "developer",
      walletAddress: user.walletAddress,
      isApproved: user.isApproved,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    if (user.isBlocked) {
      return res.status(403).json({ msg: "Account is blocked. Contact admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret123");

    res.json({ 
      token, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "developer",
        walletAddress: user.walletAddress,
        isApproved: user.isApproved,
        isBlocked: user.isBlocked,
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get All Users (for admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Current User Profile
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ msg: "Invalid token - no user ID" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "developer",
      walletAddress: user.walletAddress,
    });
  } catch (error) {
    console.error("getCurrentUser error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Admin Login
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Admin not found" });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can access this panel" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret123");

    res.json({
      success: true,
      token,
      admin: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: error.message });
  }
};