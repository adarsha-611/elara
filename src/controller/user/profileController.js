import User from "../../model/userSchema.js";
import Otp from "../../model/otpSchema.js";
import { hashString, compareString } from "../../utils/bcrypt.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    return res.render("user/profile", { user, success: req.flash('success'), error: req.flash('error') });
  } catch (error) {
    console.log(error);
   return  res.status(500).send("Server Error");
  }
};

const getEditProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    return res.render("user/profileEdit", { user });
  } catch (error) {
    console.log(error);
   return res.status(500).send("Server Error");
  }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { fullName } = req.body;
        const updateData = { fullName };

        if (req.file) {
            updateData.profileImage = req.file.filename;
        }

        await User.findByIdAndUpdate(userId, updateData);
        req.flash("success", "Profile updated successfully");
       return res.redirect("/profile");
    } catch (error) {
        console.log(error);
        req.flash("error", "Error updating profile");
        return res.redirect("/profile/edit");
    }
};

const getChangePassword = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        res.render("user/changePassword", { user, success: req.flash('success'), error: req.flash('error') });
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};

const postChangePassword = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            req.flash("error", "New passwords do not match");
            return res.redirect("/profile/change-Password");
        }

        const user = await User.findById(userId);
        const isMatch = await compareString(currentPassword, user.password);

        if (!isMatch) {
            req.flash("error", "Current password is incorrect");
            return res.redirect("/profile/change-Password");
        }

        const hashedPassword = await hashString(newPassword);
        user.password = hashedPassword;
        await user.save();

        req.flash("success", "Password changed successfully");
        res.redirect("/profile");
    } catch (error) {
        console.log(error);
        req.flash("error", "Error changing password");
        res.redirect("/profile/change-Password");
    }
};

const requestEmailUpdate = async (req, res) => {
    try {
        const { newEmail } = req.body;
        const userId = req.session.userId;

        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser) {
            req.flash("error", "Email already in use");
            return res.redirect("/profileEdit");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.findOneAndUpdate(
            { email: newEmail },
            { otp, expiresAt },
            { upsert: true, new: true }
        );

        await transporter.sendMail({
            to: newEmail,
            subject: "Verify your new email",
            text: `Your OTP is ${otp}`,
        });

        req.session.newEmail = newEmail;

       const user = await User.findById(userId);

     return res.render("user/verify-email-otp", {
    user,
    newEmail,
    success: null,
    error: "Invalid or expired OTP"
});


    } catch (error) {
        console.log(error);
        req.flash("error", "Error sending OTP");
        return res.redirect("/profileEdit");
    }
};


const verifyEmailUpdate = async (req, res) => {
    try {
        const { otp } = req.body;
        const newEmail = req.session.newEmail;
        const userId = req.session.userId;

        
        const user = await User.findById(userId);

        if (!newEmail) {
            return res.render("user/verify-email-otp", {
                user,
                newEmail: null,
                success: null,
                error: "Session expired. Please try again."
            });
        }

        const otpRecord = await Otp.findOne({ email: newEmail });

        if (!otpRecord) {
            return res.render("user/verify-email-otp", {
                user,
                newEmail,
                success: null,
                error: "OTP not found. Please request again."
            });
        }

        if (otpRecord.otp !== otp) {
            return res.render("user/verify-email-otp", {
                user,
                newEmail,
                success: null,
                error: "Invalid OTP"
            });
        }

        if (otpRecord.expiresAt < Date.now()) {
            return res.render("user/verify-email-otp", {
                user,
                newEmail,
                success: null,
                error: "OTP expired"
            });
        }

    
        await User.findByIdAndUpdate(userId, { email: newEmail });
        await Otp.deleteOne({ _id: otpRecord._id });

        req.session.newEmail = null;

        req.flash("success", "Email updated successfully");
        return res.redirect("/profile");

    } catch (error) {
        console.log(error);
        return res.redirect("/profile");
    }
};


export default { 
    getProfile, 
    getEditProfile, 
    updateProfile, 
    getChangePassword, 
    postChangePassword,
    requestEmailUpdate,
    verifyEmailUpdate
};
