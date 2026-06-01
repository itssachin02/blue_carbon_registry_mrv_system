const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("Loaded environment:", {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
});

connectDB();

const app = express();

// Explicit CORS configuration for development
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://10.239.13.26:3000", "http://10.239.13.26:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "API Running on port " + (process.env.PORT || 5000) });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/mrv", require("./routes/mrvRoutes"));
app.use("/api/trading", require("./routes/tradingRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

