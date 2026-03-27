import express from "express";
const router = express.Router();
import { isLoggedIn } from "../middlewares/authMiddleware.js";
import profileController from "../controller/user/profileController.js";
import addressController from "../controller/user/addressController.js";
import logoutController from "../controller/user/logoutController.js";
import orderController from "../controller/user/orderController.js";
import upload from "../middlewares/multer.js";

//Profile
router.get('/profile', isLoggedIn, profileController.getProfile);
router.get('/profile/edit', isLoggedIn, profileController.getEditProfile);
router.post('/profile/edit', isLoggedIn, upload.single('profileImage'), profileController.updateProfile);
router.get('/profile/change-password', isLoggedIn, profileController.getChangePassword);
router.post('/profile/change-password', isLoggedIn, profileController.postChangePassword);


router.post('/profile/email/update', isLoggedIn, profileController.requestEmailUpdate);
router.post('/profile/email/verify', isLoggedIn, profileController.verifyEmailUpdate);

//Profile Address
router.get('/profile/address', isLoggedIn, addressController.getAddresses);
router.post('/profile/address/add', isLoggedIn, addressController.addAddress);
router.post('/profile/address/edit', isLoggedIn, addressController.editAddress); 
router.get('/profile/address/delete/:addressId', isLoggedIn, addressController.deleteAddress); 
router.get('/profile/address/setdefault/:addressId', isLoggedIn, addressController.setDefaultAddress);

//profile orders
router.get('/profile/orders',isLoggedIn,orderController.getOrderlistPage)
router.get('/profile/orders/:id',orderController.getOrderdetailPage);
router.post('/profile/orders/:orderId/return/:itemId', orderController.returnOrder);
router.post("/profile/orders/:orderId/cancel/:itemId",orderController.cancelOrder);
router.get('/profile/orders/:id/invoice', orderController.downloadInvoice);

router.get('/logout',logoutController.logoutUser)

export default router;