const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/user");

const verifySetup = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bluecarbon";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Check if admin exists
    const admin = await User.findOne({ email: "admin@bluecarbon.com" });
    
    if (!admin) {
      console.log("❌ Admin account NOT found!");
      console.log("Creating admin account...\n");
      
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const newAdmin = await User.create({
        name: "Admin",
        email: "admin@bluecarbon.com",
        password: hashedPassword,
        role: "admin",
        isApproved: true,
        isBlocked: false,
        walletAddress: "0x" + Math.random().toString(16).substr(2, 40).toUpperCase(),
      });
      
      console.log("✅ Admin account created successfully!");
      console.log("📧 Email: admin@bluecarbon.com");
      console.log("🔑 Password: admin123");
      console.log("👤 Role: admin");
      console.log("✔️ Is Approved: true");
      console.log("🚫 Is Blocked: false\n");
    } else {
      console.log("✅ Admin account exists!");
      console.log("📊 Admin Details:");
      console.log("  - Email:", admin.email);
      console.log("  - Name:", admin.name);
      console.log("  - Role:", admin.role);
      console.log("  - Is Approved:", admin.isApproved);
      console.log("  - Is Blocked:", admin.isBlocked);
      console.log();
    }

    // Count total users
    const totalUsers = await User.countDocuments();
    const developers = await User.countDocuments({ role: "developer" });
    const admins = await User.countDocuments({ role: "admin" });
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    console.log("📊 Database Statistics:");
    console.log("  - Total Users:", totalUsers);
    console.log("  - Developers:", developers);
    console.log("  - Admins:", admins);
    console.log("  - Blocked Users:", blockedUsers);
    console.log();

    // List all users
    const allUsers = await User.find().select("-password");
    console.log("👥 All Users in Database:");
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email})`);
      console.log(`     Role: ${user.role}, Approved: ${user.isApproved}, Blocked: ${user.isBlocked}`);
    });

    console.log("\n✅ Setup verification complete!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during verification:", error.message);
    process.exit(1);
  }
};

verifySetup();
