import express from "express";
const router = express.Router();
import { isLoggedIn } from "../middlewares/authMiddleware.js";
import homeController from "../controller/user/homeController.js";
import shopController from "../controller/user/shopController.js";
import wishlistController from "../controller/user/wishlistController.js"
import cartController from "../controller/user/cartController.js";
import checkoutController from "../controller/user/checkoutController.js";

//Home

router.get("/home", isLoggedIn, (req, res) => {
    res.render("user/homePage");
});
router.get('/',homeController.getLanding);

//shop page
router.get('/shop',shopController.getShopPage)
router.get('/productDetail/:id', shopController.getProductDetailPage)

//Cart
router.get('/cart',cartController.getCartPage);
router.post('/cart/add',cartController.addCartItem);
router.post('/cart/remove/:productId', cartController.removeCartItem)

//checkOut
router.get('/checkout',checkoutController.getCheckoutPage);
router.post('/checkout/address/add',checkoutController.checkaddAddress);
router.post('/checkout/address/edit',checkoutController.checkeditAddress);
router.post(
  '/checkout/address/delete/:addressId',
  checkoutController.checkdeleteAddress
);
router.post('/checkout/address/default/:addressId', checkoutController.checksetDefaultAddress);
router.get('/order-success/:orderId', checkoutController.orderSuccess);
router.post('/checkout/place-order', checkoutController.placeOrder);




router.get('/wishlist',wishlistController.getWishlist);


export default router;



