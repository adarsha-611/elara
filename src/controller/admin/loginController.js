import User from "../../model/userSchema.js";
import { compareString } from "../../utils/bcrypt.js";

const getLogin = (req, res) => {

    if (req.session.adminId) {
        return res.redirect("/admin/dashboard");
    }

    res.render("admin/login", {
        error: req.flash("error")
    });
};

const postLogin = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user || user.role !== "admin") {
            req.flash("error", "Invalid admin credentials");
            return res.redirect("/admin/login");
        }

        const isMatch = await compareString(password, user.password);

        if (!isMatch) {
            req.flash("error", "Invalid admin credentials");
            return res.redirect("/admin/login");
        }

        req.session.adminId = user._id;

        return res.redirect("/admin/dashboard");

    } catch (error) {

        console.error(error);

        req.flash("error", "Server Error");

        return res.redirect("/admin/login");
    }
};

const logout = (req, res) => {
    try {
        req.session.adminId = null;
        delete req.session.isAdmin;

        req.session.save((err) => {
            if (err) console.log("Session save error:", err);
            
            res.clearCookie('elara.sid');
            return res.redirect("/admin/login");
        });
    } catch (error) {
        console.log(error);
        return res.redirect("/admin/login");
    }
};

export default {
    getLogin,
    postLogin,
    logout
};