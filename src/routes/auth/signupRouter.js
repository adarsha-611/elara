
import express from "express";
const router = express.Router();
import signupController from '../../controller/user/auth/signupController.js'



router.get('/signup',signupController.getSignup)
router.post('/signup',signupController.postSignup)
router.post('/verify-otp',signupController.verifyOtp)




export default router;


