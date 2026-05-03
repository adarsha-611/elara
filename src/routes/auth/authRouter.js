import express from "express";
const router = express.Router();

import loginController from "../../controller/user/auth/loginController.js";
import signupController from "../../controller/user/auth/signupController.js";
import forgotPasswordController from "../../controller/user/auth/forgotPasswordController.js";

import passport from "passport";
import { redirectIfAuthenticated } from "../../middlewares/authMiddleware.js";


//LOGIN 

router.get("/login", redirectIfAuthenticated, loginController.getLogin);

router.post("/login", loginController.postLogin);


//SIGNUP
router.get("/signup", redirectIfAuthenticated, (req, res) => {
    res.render("user/auth/signup");
});

router.post("/signup", signupController.postSignup);
router.post("/verify-otp", signupController.verifyOtp);
router.post("/resend-otp", signupController.resendOtp);


//FORGOT PASSWORD

router.get("/forgot-password", forgotPasswordController.getForgotPassword);
router.post("/forgot-password", forgotPasswordController.postForgotPassword);
router.post("/verify-forgot-otp", forgotPasswordController.verifyForgotOtp);

router.get("/reset-password", forgotPasswordController.getResetPassword);
router.post("/reset-password", forgotPasswordController.postResetPasword);


// GOOGLE AUTH

router.get("/auth/google", loginController.googleAuth);

router.get("/auth/google/callback",loginController.googleCallback);


export default router;