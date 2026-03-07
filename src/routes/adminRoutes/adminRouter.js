import express from "express";
import loginController from "../../controller/admin/loginController.js";
import categoryController from "../../controller/admin/categoryController.js"
import productController from "../../controller/admin/productController.js";
import { upload } from "../../middlewares/upload.js";
import orderPageController from "../../controller/admin/orderPageController.js";
import userManagementController from "../../controller/admin/userManagementController.js";
import adminAuth from "../../middlewares/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", (req, res) => res.redirect("/admin/login"));
router.get("/login", loginController.getLogin);
router.post("/login", loginController.postLogin);
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


//ProductManagemnet
router.get('/products',adminAuth,productController.getProductPage);
router.get('/add-product',adminAuth,productController.getAddProductPage);
router.post(
  '/add-product',adminAuth,
  upload.any(),  
  productController.postAddProduct
);
router.get("/edit-product/:id",adminAuth,productController.getEditProductPage);
router.post("/edit-product/:id",adminAuth,
    upload.any(),
    productController.postEditProduct
)
router.patch("/toggle-product-status/:id",adminAuth, productController.productStatus)

//OrderManagement
router.get('/orders',adminAuth,orderPageController.getOrderPage);
router.patch('/orders/:id/status',adminAuth,orderPageController.updateOrderStatus)
router.get('/orders/:id',adminAuth,orderPageController.getOrderdetailPage);
router.post('/return/accept/:orderId/:itemId',adminAuth,orderPageController.acceptReturn);
router.post('/return/reject/:orderId/:itemId',adminAuth,orderPageController.rejectReturn);
router.get('/return/details/:orderId/:itemId',adminAuth,orderPageController.getReturnDetails);

export default router;
