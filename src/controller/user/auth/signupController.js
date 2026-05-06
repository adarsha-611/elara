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

        return res.redirect('/verify-otp');

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

        if (!email || !tempUser) {
            req.flash('error', 'Session expired. Please signup again.');
            return res.redirect('/signup');
        }

        try {
            await verifyOTP(email, otp);
        } catch (otpErr) {
            let message = 'Invalid OTP. Please try again.';
            if (otpErr.message === 'OTP expired') {
                message = 'Your OTP has expired. Please request a new one.';
            } else if (otpErr.message === 'OTP not found') {
                message = 'OTP not found. Please request a new one.';
            }

            req.flash('error', message);
            return res.redirect('/verify-otp');
        }

        await register(tempUser);
        delete req.session.tempUser;
        delete req.session.userEmail;

        req.flash('success', 'Account created successfully. Please login.');
        return res.redirect('/login');

    } catch (error) {
        console.log("Unexpected error:", error);
        req.flash('error', 'Something went wrong. Please try again.');
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