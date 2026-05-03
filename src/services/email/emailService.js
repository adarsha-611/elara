

import nodemailer from "nodemailer";
import otpSchema from "../../model/otpSchema.js";


const OTP = otpSchema;
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); 
};



export const sendOTP = async (email) => {
  const otp = generateOTP();
 console.log(otp)
  
  await OTP.findOneAndUpdate(
    { email },
    {
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), 
    },
    { upsert: true }
  );

  
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

  
  await transporter.sendMail(mailOptions);
  console.log("Email sent successfully")
  return true;
};



export const verifyOTP = async (email, enteredOTP) => {
  const record = await OTP.findOne({ email });

  if (!record) throw new Error("OTP not found");

  const cleanEntered = String(enteredOTP).trim();
  const cleanStored = String(record.otp).trim();

  if (record.expiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  if (cleanStored !== cleanEntered) {
    throw new Error("Invalid OTP");
  }

  await OTP.deleteOne({ email });
  return true;
};


