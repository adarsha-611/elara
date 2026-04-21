import User from "../../model/userSchema.js";
import { compareString } from "../../utils/bcrypt.js";

const getLogin = (req, res) => {
   
    if (req.session.adminId) {
        return res.redirect("/admin/dashboard");
    }
res.render("admin/login");};

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
      return  res.redirect("/admin/login");
    }
};

const logout = (req, res) => {
    req.session.adminId = null;
   return res.redirect("/admin/login");
};



export default {
    getLogin,
    postLogin,
    logout,
    
};
