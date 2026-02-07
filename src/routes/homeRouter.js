import express from "express";
const router = express.Router();
import { isLoggedIn } from "../middlewares/authMiddleware.js";
import homeController from "../controller/user/homeController.js";
import shopController from "../controller/user/shopController.js"




router.get('/home',homeController.getHome)
router.get('/',homeController.getLanding);

router.get('/shop',shopController.getShopPage)
router.get('/productDetail/:id', shopController.getProductDetailPage)


export default router;
