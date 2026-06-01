const jwt = require("jsonwebtoken");
const User = require("../models/user");

const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ msg: "No token provided" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user to check role
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    req.user = decoded;
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Invalid or expired token" });
  }
};

module.exports = adminMiddleware;
