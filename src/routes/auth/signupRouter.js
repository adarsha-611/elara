
import express from "express";
const router = express.Router();
import signupController from '../../controller/user/auth/signupController.js'
import signupOtpController from '../../controller/user/auth/signupOtpController.js'



router.get('/signup',signupController.getSignup)
router.post('/signup',signupController.postSignup)
router.get('/verifyOtp',signupOtpController.getVerifyOtp)





export default router;


