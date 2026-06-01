const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/user");

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bluecarbon";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const adminExists = await User.findOne({ email: "admin@bluecarbon.com", role: "admin" });
    if (adminExists) {
      console.log("✅ Admin user already exists!");
      process.exit(0);
    }

    // Create hashed password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create admin user
    const admin = await User.create({
      name: "Admin",
      email: "admin@bluecarbon.com",
      password: hashedPassword,
      role: "admin",
      isApproved: true,
      isBlocked: false,
      walletAddress: "0x" + Math.random().toString(16).substr(2, 40).toUpperCase(),
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@bluecarbon.com");
    console.log("🔑 Password: admin123");
    console.log("⚠️  Please change this password in production!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
