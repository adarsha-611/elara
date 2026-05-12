import { validateSignup } from "../../../utils/validators/joi_signup.js";
import { verifyOTP, sendOTP } from "../../../services/email/emailService.js";
import { findUserByemail, findUserByreferralCode } from "../../../services/user/userService.js";
import { register } from '../../../services/user/auth/signupService.js';

const getSignup = async (req, res) => {
    try {
        const error = req.flash('error');
        return res.render("user/auth/signup", { error });
    } catch (error) {
        res.status(500).send("server error: " + error.message);
    }
};

const postSignup = async (req, res) => {
    try {
        const { error, value } = validateSignup(req.body);

        if (error) {
            return res.render("user/auth/signup", {
                error: error.details.map(err => err.message).join('. '),
                oldData: req.body
            });
        }

        const existingUser = await findUserByemail(value.email);
        if (existingUser) {
            req.flash('error', 'An account with this email already exists.');
            return res.redirect('/signup');
        }

        if (value.referralCode) {
            const referredUser = await findUserByreferralCode(value.referralCode);
            if (!referredUser) {
                return res.render("user/auth/signup", {
                    error: "Invalid referral code. Please check and try again.",
                    oldData: req.body
                });
            }
        }

        req.session.tempUser = {
    fullName: value.fullName,
    email: value.email,
    password: value.password,
    referralCodeUsed: value.referralCode || null
};

req.session.userEmail = value.email;

await sendOTP(value.email);

req.session.save((err) => {

    if (err) {
        console.log("SESSION SAVE ERROR:", err);

        req.flash('error', 'Something went wrong.');

        return res.redirect('/signup');
    }

    return res.redirect('/verify-otp');
});

    } catch (error) {
        console.log("Signup Error:", error);
        req.flash('error', 'An error occurred. Please try again.');
        return res.redirect('/signup');
    }
};

const getOtpPage = async (req, res) => {
    try {
        const email = req.session.userEmail;

        if (!email) {
            req.flash('error', 'Session expired. Please signup again.');
            return res.redirect('/signup');
        }

        const error = req.flash('error');
        const success = req.flash('success');

        return res.render('user/auth/signupOtp', { email, error, success });

    } catch (error) {
        return res.redirect('/signup');
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const email = req.session.userEmail;
        const tempUser = req.session.tempUser;

        console.log("=== OTP VERIFICATION START ===");
        console.log("Email from session:", email);
        console.log("TempUser exists:", !!tempUser);
        console.log("Entered OTP:", otp);

        if (!email || !tempUser) {
            req.flash('error', 'Session expired. Please signup again.');
            return res.redirect('/signup');
        }

        if (!otp) {
            req.flash('error', 'Please enter OTP');
            return res.redirect('/verify-otp');
        }

        // Verify OTP
        await verifyOTP(email, otp);
        console.log("✅ OTP Verified Successfully");

        // Register User
        console.log("🔄 Starting User Registration...");
        await register(tempUser);
        console.log("✅ User Registered Successfully");

        // Clean session
        delete req.session.tempUser;
        delete req.session.userEmail;

        req.flash('success', 'Account created successfully. Please login.');
        return res.redirect('/login');

    } catch (error) {
        console.log("❌ VERIFY OTP ERROR:", error.message);
        console.log("Full Error:", error);

        let userMessage = 'Something went wrong. Please try again.';

if (error.message.includes("Invalid OTP")) {
    userMessage = "Invalid OTP. Please try again.";
} 
else if (error.message.includes("OTP expired")) {
    userMessage = "OTP expired. Please resend OTP.";
} 
else if (error.message.includes("OTP not found")) {
    userMessage = "OTP not found. Please resend OTP.";
} 
else if (error.message.includes("User already exists")) {
    userMessage = "An account with this email already exists.";
} 
else if (error.message.includes("Invalid referral code")) {
    userMessage = "Invalid referral code.";
} 
else if (error.message.includes("hashString")) {
    userMessage = "Error while securing your password.";
}

        req.flash('error', userMessage);
        return res.redirect('/verify-otp');
    }
};

const resendOtp = async (req, res) => {
    try {
        const email = req.session.userEmail;
        if (!email) return res.status(400).json({ success: false, message: 'Email not found in session' });
        await sendOTP(email);
        return res.status(200).json({ success: true, message: 'OTP resent successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to resend OTP' });
    }
};

export default { getSignup, postSignup, verifyOtp, resendOtp,getOtpPage };