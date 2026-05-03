import { findUserByemail } from "../../../services/user/userService.js";
import { compareString } from "../../../utils/bcrypt.js";
import passport from "passport";

const getLogin = async (req, res) => {
  try {
    return res.render("user/auth/login", {
      error: res.locals.error,
      success: res.locals.success
    });
  } catch (error) {
    console.log("error rendering login page:", error);
    res.status(500).send("server error: " + error.message);
  }
}

const postLogin = async(req,res)=>{
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.render("user/auth/login", {
                error: "Email and password are required"
            });
        }
        
        const user = await findUserByemail(email);
        if(!user){
            return res.render("user/auth/login", {
                error: "Invalid email or password"
            });
        }

        if(!user.password && user.googleId){
            return res.render("user/auth/login", {
                error: "This account is linked with Google. Please login with Google."
            });
        }

        const isPasswordMatch = await compareString(password, user.password);
        if(!isPasswordMatch){
            return res.render("user/auth/login", {
                error: "Invalid email or password"
            });
        }

        if(!user.isVerified){
             req.session.userEmail = user.email;
             
             return res.render("user/auth/login", {
                error: "Account not verified. Please signup again or verify your account."
            });
        }

        if(user.isBlocked){
            return res.render("user/auth/login", {
               error: "Your account is not accessible.Please contact support.",
               success:[]
           });
       }
       
        req.session.userId = user._id;
        req.session.userEmail = user.email;
        req.session.userName = user.fullName;

        return res.redirect("/home");
        
    } catch (error) {
        console.log("Error during login:", error);
        res.status(500).render("user/auth/login", {
            error: "An error occurred during login"
        });
    }
}

const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

const googleCallback = (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      req.flash("error", info?.message || "Google login failed.");
      return res.redirect("/login");
    }

    req.logIn(user, (err) => {
      if (err) return next(err);
      req.session.userId = user._id;
      req.session.userEmail = user.email;
      req.session.userName = user.fullName;
      return res.redirect("/home");
    });
  })(req, res, next);
};


export default {
    getLogin,
    postLogin,
    googleAuth,
    googleCallback,
}