import express from "express";
const router = express.Router();
import loginController from '../../controller/user/auth/loginController.js'

router.get('/login',loginController.getLogin)
router.post('/login',loginController.postLogin)

export default router;