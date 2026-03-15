const nodemailer = require("nodemailer");

const sendEmail = async (email, otp) => {

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Digital Time Capsule" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Email Verification OTP",
    text: `Your OTP for Digital Time Capsule verification is: ${otp}`,
    html: `
      <div style="font-family:Arial;padding:20px">
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in ${process.env.OTP_EXPIRY || 5} minutes.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;