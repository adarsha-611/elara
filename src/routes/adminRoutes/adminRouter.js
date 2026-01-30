import express from "express";
import loginController from "../../controller/admin/loginController.js";
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


router.get("/users", isAdmin, loginController.getUsers);
router.get("/users/block/:userId", isAdmin, loginController.blockUser);

export default router;
