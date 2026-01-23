

import nodemailer from "nodemailer";
import otpSchema from "../../model/otpSchema.js";

/* =========================
   1. Nodemailer Transporter
   ========================= */
const OTP = otpSchema;
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* =========================
   2. OTP Schema & Model
   ========================= */




/* =========================
   3. OTP Generator
   ========================= */

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
};

/* =========================
   4. Send OTP
   ========================= */

export const sendOTP = async (email) => {
  const otp = generateOTP();

  // Save / Update OTP in DB
  await OTP.findOneAndUpdate(
    { email },
    {
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
    { upsert: true }
  );

  // Mail content
  const mailOptions = {
    from: `"Elara" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "OTP Verification",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>OTP Verification</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing: 3px;">${otp}</h1>
        <p>This OTP is valid for <b>5 minutes</b>.</p>
      </div>
    `,
  };

  // Send mail
  await transporter.sendMail(mailOptions);
  console.log("Email sent successfully")
  return true;
};

/* =========================
   5. Verify OTP
   ========================= */

export const verifyOTP = async (email, enteredOTP) => {
  const record = await OTP.findOne({ email });

  if (!record) {
    throw new Error("OTP not found");
  }

  if (record.expiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  if (record.otp !== enteredOTP) {
    throw new Error("Invalid OTP");
  }

  // Cleanup after successful verification
  await OTP.deleteOne({ email });

  return true;
};

/* =========================
   6. Example Express Controllers
   ========================= */

// Send OTP Controller
