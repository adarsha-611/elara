import express from "express";
const router = express.Router();
import { isLoggedIn } from "../middlewares/authMiddleware.js";
import homeController from "../controller/user/homeController.js";




router.get('/home',homeController.getHome)
router.get('/',homeController.getLanding);



export default router;
