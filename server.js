const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Body parser
app.use(express.json());

// Routes
const testRoutes = require("./routes/testRoutes");
app.use("/", testRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const protectedRoutes = require("./routes/protectedRoutes");
app.use("/api", protectedRoutes);

const capsuleRoutes = require("./routes/capsuleRoutes");
app.use("/api/capsules", capsuleRoutes);

app.use((err, res) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "Video too large. Max size allowed is 100MB.",
      });
    }
  }

  // fallback error
  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

// Start server (ALWAYS last)
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
