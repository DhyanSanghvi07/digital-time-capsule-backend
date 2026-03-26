const nodemailer = require("nodemailer");

// ✅ Create transporter once (optimized)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Generic reusable email sender
const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"Digital Time Capsule" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Email error:", error);
    throw error;
  }
};

module.exports = sendEmail;