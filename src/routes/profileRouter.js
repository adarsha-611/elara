import express from "express";
const router = express.Router();
import { isLoggedIn } from "../middlewares/authMiddleware.js";
import profileController from "../controller/user/profileController.js";
import addressController from "../controller/user/addressController.js";
import logoutController from "../controller/user/logoutController.js";
import orderController from "../controller/user/orderController.js";
import walletController from "../controller/user/walletController.js";
import getReferralPage from "../controller/user/referralController.js"
import upload from "../middlewares/multer.js";
import referralController from "../controller/user/referralController.js";

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
router.get('/profile/address/get/:addressId', isLoggedIn, addressController.getAddress);
router.post('/profile/address/edit', isLoggedIn, addressController.editAddress); 
router.get('/profile/address/delete/:addressId', isLoggedIn, addressController.deleteAddress); 
router.get('/profile/address/setdefault/:addressId', isLoggedIn, addressController.setDefaultAddress);

//profile orders
router.get('/profile/orders',isLoggedIn,orderController.getOrderlistPage)
router.get('/profile/orders/:id',orderController.getOrderdetailPage);
router.post('/profile/orders/:orderId/return/:itemId', orderController.returnOrder);
router.post("/profile/orders/:orderId/cancel/:itemId",orderController.cancelOrder);
router.get('/profile/orders/:id/invoice', orderController.downloadInvoice);
router.post('/review/add',orderController.addReviewController)

//Wallet
router.get("/profile/wallet",isLoggedIn,walletController.getWalletPage);
router.post("/profile/wallet/create-order",walletController.createWalletOrder);
router.post("/profile/wallet/verify",walletController.verifyWalletPayment);

router.get("/profile/referral", isLoggedIn, referralController.getReferralPage);


router.get('/logout',logoutController.logoutUser)

export default router;