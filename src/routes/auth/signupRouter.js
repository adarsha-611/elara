
import express from "express";
const router = express.Router();
import signupController from '../../controller/user/auth/signupController.js'
import { redirectIfAuthenticated } from "../../middlewares/authMiddleware.js";



router.get("/signup", redirectIfAuthenticated, (req, res) => {
    res.render("signup");
});
router.post('/signup',signupController.postSignup)
router.post('/verify-otp',signupController.verifyOtp)
router.post('/resend-otp',signupController.resendOtp)




export default router;


