import express from "express";
import loginController from "../../controller/admin/loginController.js";
import categoryController from "../../controller/admin/categoryController.js";
import productController from "../../controller/admin/productController.js";
import upload from "../../config/multer.js";
import orderPageController from "../../controller/admin/orderPageController.js";
import userManagementController from "../../controller/admin/userManagementController.js";
import adminAuth from "../../middlewares/adminAuthMiddleware.js";
import { isAdminGuest } from "../../middlewares/adminAuthMiddleware.js";
import offerController from "../../controller/admin/offerController.js";
import couponController from "../../controller/admin/couponController.js";
import dashboardController from "../../controller/admin/dashboardController.js";
import salesReportController from "../../controller/admin/salesReportController.js";
const router = express.Router();

router.get("/", (req, res) => res.redirect("/admin/login"));
router.get("/login", isAdminGuest, loginController.getLogin);
router.post("/login", isAdminGuest, loginController.postLogin);;
router.get("/logout",adminAuth,loginController.logout);

//UserManagement
router.get("/users",adminAuth,userManagementController.getUsers);
router.post("/users/block/:userId",adminAuth, userManagementController.blockUser);

//CategoryManagemnt
router.get('/category',adminAuth,categoryController.getCategoryPage);
router.get('/add-category',adminAuth,categoryController.getAddCategory);
router.post('/add-category',adminAuth,categoryController.postAddCategory);
router.post('/edit-category',adminAuth,categoryController.postEditCategory);
router.post("/delete-category/:id",adminAuth, categoryController.postCategoryStatus);
router.get('/categories/active',adminAuth, categoryController.getActiveCategories);


// Product Management
router.get('/products', adminAuth, productController.getProductPage);

router.get('/add-product', adminAuth, productController.getAddProductPage);

router.post(
  '/add-product',
  adminAuth,
  upload.any(),   
  productController.postAddProduct
);

router.get("/edit-product/:id", adminAuth, productController.getEditProductPage);

router.post(
  "/edit-product/:id",
  adminAuth,
  upload.any(),  
  productController.postEditProduct
);

router.patch(
  "/toggle-product-status/:id",
  adminAuth,
  productController.productStatus
);


//OrderManagement
router.get('/orders',adminAuth,orderPageController.getOrderPage);
router.patch('/orders/update-item-status/:orderId/:itemId', adminAuth, orderPageController.updateItemStatus);
router.get('/orders/:id',adminAuth,orderPageController.getOrderdetailPage);
router.post('/return/accept/:orderId/:itemId',adminAuth,orderPageController.acceptReturn);
router.post('/return/reject/:orderId/:itemId',adminAuth,orderPageController.rejectReturn);
router.get('/return/details/:orderId/:itemId',adminAuth,orderPageController.getReturnDetails);

//OfferManagement
router.get('/offers',adminAuth,offerController.getOfferPage);
router.post('/offers/create',adminAuth,offerController.addOffer);
router.post('/offers/update/:id',offerController.updateOffer);
router.post('/offer/update-status/:id',offerController.toggleStatus);

//CouponManagement
router.get("/coupons",adminAuth,couponController.getCouponPage);
router.post("/coupons/create",adminAuth,couponController.addCoupon);
router.post("/coupons/update/:id", adminAuth, couponController.updateCoupon);
router.put("/coupons/toggle/:id",adminAuth, couponController.toggleCouponStatus);
router.delete("/coupons/delete/:id", adminAuth, couponController.deleteCoupon);


//dashboard
router.get("/dashboard",adminAuth,dashboardController.getDashboardPage)

//salesReport
router.get("/sales-report",adminAuth,salesReportController.getSalesReport)
router.get("/sales-report/pdf",salesReportController.downloadSalesReportPDF);
router.get("/sales-report/excel",salesReportController.downloadSalesReportExcel);
export default router;
