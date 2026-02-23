import express from "express";
import loginController from "../../controller/admin/loginController.js";
import categoryController from "../../controller/admin/categoryController.js"
import productController from "../../controller/admin/productController.js";
import { upload } from "../../middlewares/upload.js";
import orderPageController from "../../controller/admin/orderPageController.js";

const router = express.Router();


const isAdmin = (req, res, next) => {
    if (req.session.adminId) {
        next();
    } else {
        return res.redirect("/admin/login");
    }
};


router.get("/", (req, res) => res.redirect("/admin/login"));
router.get("/login", loginController.getLogin);
router.post("/login", loginController.postLogin);
router.get("/logout",loginController.logout);

//UserManagement
router.get("/users", isAdmin, loginController.getUsers);
router.get("/users/block/:userId", isAdmin, loginController.blockUser);
router.get('/category',categoryController.getCategoryPage);

//CategoryManagemnt
router.get('/category',categoryController.getCategoryPage);
router.get('/add-category',categoryController.getAddCategory);
router.post('/add-category',categoryController.postAddCategory);
router.post('/edit-category',categoryController.postEditCategory);
router.post("/delete-category/:id", categoryController.postCategoryStatus);
router.get('/categories/active', categoryController.getActiveCategories);


//ProductManagemnet
router.get('/products',productController.getProductPage);
router.get('/add-product',productController.getAddProductPage);
router.post(
  '/add-product',
  upload.any(),  
  productController.postAddProduct
);
router.get("/edit-product/:id",productController.getEditProductPage);
router.post("/edit-product/:id",
    upload.any(),
    productController.postEditProduct
)
router.patch("/toggle-product-status/:id", productController.productStatus)

//OrderManagement
router.get('/orders',orderPageController.getOrderPage);
router.patch('/orders/:id/status',orderPageController.updateOrderStatus)
router.get('/orders/:id',orderPageController.getOrderdetailPage);
router.post('/return/accept/:orderId/:itemId',orderPageController.acceptReturn);
router.post('/return/reject/:orderId/:itemId',orderPageController.rejectReturn);
router.get('/return/details/:orderId/:itemId', orderPageController.getReturnDetails);

export default router;
