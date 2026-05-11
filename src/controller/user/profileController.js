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
   return res.render("user/profile", { 
  user,
  success: req.flash("success"),
  error: req.flash("error")
});
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

        if (!fullName || fullName.trim() === '') {
            req.flash('error', 'Full name is required');
            return res.redirect('/profile/edit');
        }

        if (fullName.trim().length < 2) {
            req.flash('error', 'Full name must be at least 2 characters');
            return res.redirect('/profile/edit');
        }

        if (fullName.trim().length > 15) {
            req.flash('error', 'Full name cannot exceed 15 characters');
            return res.redirect('/profile/edit');
        }

        if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) {
            req.flash('error', 'Full name can only contain letters and spaces');
            return res.redirect('/profile/edit');
        }

        const updateData = { fullName: fullName.trim() };

        if (req.file) {
            updateData.profileImage = req.file.filename;
        }

        await User.findByIdAndUpdate(userId, updateData);
        req.flash('success', 'Profile updated successfully');
        return res.redirect('/profile');

    } catch (error) {
        console.log(error);
        req.flash('error', 'Error updating profile');
        return res.redirect('/profile/edit');
    }
};

const getChangePassword = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);

        const formData = req.session.formData || {};
        const formError = req.session.formError || null;  

        delete req.session.formData;
        delete req.session.formError;

        return res.render("user/changePassword", { user, formData, formError });
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};

const postChangePassword = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const user = await User.findById(userId);

        const redirectWithError = (message) => {
        req.session.formError = message;  
        req.session.formData = { currentPassword, newPassword, confirmPassword };
    return res.redirect("/profile/change-password");
};

        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/login");
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
            return redirectWithError("All fields are required");
        }

        if (newPassword.length < 8) {
            return redirectWithError("New password must be at least 8 characters");
        }

        if (!/[A-Z]/.test(newPassword)) {
            return redirectWithError("Password must contain at least one uppercase letter");
        }

        if (!/[0-9]/.test(newPassword)) {
            return redirectWithError("Password must contain at least one number");
        }

        if (newPassword !== confirmPassword) {
            return redirectWithError("New passwords do not match");
        }

        if (currentPassword === newPassword) {
            return redirectWithError("New password must be different from current password");
        }

        const isMatch = await compareString(currentPassword, user.password);
        
        if (!isMatch) {
            return redirectWithError("Current password is incorrect");
        }

        const hashedPassword = await hashString(newPassword);
        user.password = hashedPassword;
        await user.save();

        delete req.session.formData;
        req.flash("success", "Password changed successfully");
        return res.redirect("/profile");

    } catch (error) {
        console.log(error);
        req.flash("error", "Error changing password");
        return res.redirect("/profile/change-password");
    }
};

const requestEmailUpdate = async (req, res) => {
    try {
        const { newEmail } = req.body;
        const userId = req.session.userId;
        const user = await User.findById(userId);

        if(user.authType !=="local"){
            req.flash("error","Email cannot be changed for accounts created using Google login.");
            return res.redirect("/profile/edit");
        }
        console.log("User AuthType:", user.authType);
        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser) {
            req.flash("error", "Email already in use");
            return res.redirect("/profile/edit");
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

     return res.render("user/verify-email-otp", {
    user,
    newEmail,
    success: null,
    error: null
});


    } catch (error) {
        console.log(error);
        req.flash("error", "Error sending OTP");
        return res.redirect("/profile/edit");
    }
};


const verifyEmailUpdate = async (req, res) => {
    try {
        const { otp } = req.body;
        const newEmail = req.session.newEmail;
        const userId = req.session.userId;

        
        const user = await User.findById(userId);

         if (user.authType !== "local") {
            req.flash("error", "Email cannot be changed for accounts created using Google login.");
            return res.redirect("/profile");
        }


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
