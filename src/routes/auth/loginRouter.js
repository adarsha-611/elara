import express from "express";
const router = express.Router();
import loginController from '../../controller/user/auth/loginController.js';
import forgotPasswordController from "../../controller/user/auth/forgotPasswordController.js";
import passport from "passport";
import { redirectIfAuthenticated } from "../../middlewares/authMiddleware.js";


router.get('/login',redirectIfAuthenticated, loginController.getLogin)
router.post('/login',loginController.postLogin)

router.get('/forgot-password',forgotPasswordController.getForgotPassword);
router.post('/forgot-password',forgotPasswordController.postForgotPassword);
router.post('/verify-forgot-otp',forgotPasswordController.verifyForgotOtp);
router.get('/reset-password',forgotPasswordController.getResetPassword);
router.post('/reset-password', forgotPasswordController.postResetPasword)


router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
   
    req.session.userId = req.user._id;
    req.session.userEmail = req.user.email;
    req.session.userName = req.user.fullName;
    res.redirect('/home');
  }
);


export default router;