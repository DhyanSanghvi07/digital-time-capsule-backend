const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
require("./config/env");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   SECURITY & GLOBAL MIDDLEWARE
========================= */

app.use(helmet());

app.use(
  cors({
    origin: "*", // tighten later for frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting (API only)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

/* =========================
   BODY PARSERS
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   ROUTES
========================= */

app.use("/", require("./routes/testRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/protectedRoutes"));
app.use("/api/capsules", require("./routes/capsuleRoutes"));

/* =========================
   MULTER ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        error: {
          message: "File too large. Max size allowed is 100MB.",
          code: "LIMIT_EXCEEDED",
        },
      });
    }
  }
  next(err);
});

/* =========================
   FINAL ERROR FALLBACK
========================= */

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
      code: "SERVER_ERROR",
    },
  });
});

/* =========================
   START SERVER (LAST)
========================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
