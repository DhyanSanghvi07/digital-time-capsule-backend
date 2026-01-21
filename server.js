const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const testRoutes = require("./routes/testRoutes");
app.use("/", testRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const protectedRoutes = require("./routes/protectedRoutes");
app.use("/api", protectedRoutes);

const capsuleRoutes = require("./routes/capsuleRoutes");
app.use("/api/capsules", capsuleRoutes);
