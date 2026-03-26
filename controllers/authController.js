const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");
const verifyMX = require("../utils/verifyMX");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const mxValid = await verifyMX(email);

    if (!mxValid) {
      return res.status(400).json({ message: "Invalid email domain" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpires: Date.now() + process.env.OTP_EXPIRY * 60 * 1000,
      otpLastSent: Date.now(),
    });

    await sendEmail({
  to: email,
  subject: "Email Verification OTP",
  html: `
    <div style="font-family:Arial;padding:20px">
      <h2>Email Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP will expire in ${process.env.OTP_EXPIRY || 5} minutes.</p>
    </div>
  `,
});

    res.status(201).json({
      message: "OTP sent to email. Please verify.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    res.json({
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = Date.now();

    if (
      user.otpLastSent &&
      now - user.otpLastSent < process.env.OTP_RESEND_INTERVAL * 1000
    ) {
      return res.status(429).json({
        message: "Please wait before requesting another OTP",
      });
    }

    const otp = generateOTP();

    user.otp = otp;
    user.otpExpires = now + process.env.OTP_EXPIRY * 60 * 1000;
    user.otpLastSent = now;

    await user.save();

    await sendEmail({
  to: email,
  subject: "Resend OTP - Digital Time Capsule",
  html: `
    <div style="font-family:Arial;padding:20px">
      <h2>OTP Resent</h2>
      <p>Your new OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP will expire in ${process.env.OTP_EXPIRY || 5} minutes.</p>
    </div>
  `,
});

    res.json({
      message: "OTP resent successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id),
      userName: user.name,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, verifyOTP, resendOTP };
