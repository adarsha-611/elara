import nodemailer from "nodemailer";
import otpSchema from "../../model/otpSchema.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });   

const OTP = otpSchema;

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false   
    }
});

transporter.verify((error) => {
    if (error) {
        console.log("❌ SMTP Connection Error:", error.message);
    } else {
        console.log("✅ SMTP Server is Ready to Send Emails");
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (email) => {
    try {
        const otp = generateOTP();
        console.log(`Generated OTP for ${email} : ${otp}`);

        await OTP.findOneAndUpdate(
            { email },
            {
                otp,
                expiresAt: new Date(Date.now() + 1 * 60 * 1000),
            },
            { upsert: true }
        );

        const mailOptions = {
            from: `"Elara" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "OTP Verification - Elara",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>OTP Verification</h2>
                    <p>Your One-Time Password is:</p>
                    <h1 style="letter-spacing: 6px; color: #3D2B24;">${otp}</h1>
                    <p>This OTP is valid for <b>5 minutes</b>.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ OTP Email Sent Successfully to:", email);
        return true;

    } catch (error) {
        console.log("❌ Failed to send OTP Email:", error.message);
        throw error;   // Let controller handle it
    }
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