import express from "express";
const router = express.Router();
import { isLoggedIn } from "../middlewares/authMiddleware.js";
import homeController from "../controller/user/homeController.js";
import shopController from "../controller/user/shopController.js";
import wishlistController from "../controller/user/wishlistController.js"
import cartController from "../controller/user/cartController.js";
import checkoutController from "../controller/user/checkoutController.js";

//Home

router.get("/home", isLoggedIn, homeController.getHome);
router.get('/',homeController.getLanding);

//About Page
router.get('/about',homeController.getAboutPage);

//shop page
router.get('/shop',shopController.getShopPage)
router.get('/productDetail/:id', shopController.getProductDetailPage)

//Cart
router.get('/cart', isLoggedIn, cartController.getCartPage);
router.post('/cart/add', isLoggedIn, cartController.addCartItem);
router.post('/cart/remove/:productId', isLoggedIn, cartController.removeCartItem);
router.post('/cart/qtyupdate', isLoggedIn, cartController.updateQuantity);

//checkOut
router.get('/checkout', isLoggedIn, checkoutController.getCheckoutPage);
router.post('/checkout/address/add', isLoggedIn, checkoutController.checkaddAddress);
router.post('/checkout/address/edit', isLoggedIn, checkoutController.checkeditAddress);
router.post('/checkout/address/delete/:addressId', isLoggedIn, checkoutController.checkdeleteAddress);
router.post('/checkout/address/default/:addressId', isLoggedIn, checkoutController.checksetDefaultAddress);

router.get('/order-success/:orderId', isLoggedIn, checkoutController.orderSuccess);
router.post('/checkout/place-order', isLoggedIn, checkoutController.placeOrder);



//Wishlist
router.get('/wishlist', isLoggedIn, wishlistController.getWishlist);
router.post("/wishlist/toggle/:id", isLoggedIn, wishlistController.addWishlist);
router.post("/wishlist/addtocart/:productId", isLoggedIn, wishlistController.addToCartFromWishlist);


export default router;



