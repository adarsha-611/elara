import { findUserByemail } from "../../../services/user/userService.js";
import { compareString } from "../../../utils/bcrypt.js";
import passport from "passport";
const getLogin = async(req,res)=>{
    try {
       const error = req.flash('error');
       const success = req.flash('success');
       return res.render("user/auth/login", { error, success }) 
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
               error: "Your account has been blocked."
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

const googleCallback = [
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    req.session.userId = req.user._id;
    req.session.userEmail = req.user.email;
    req.session.userName = req.user.fullName;

    res.redirect("/home");
  },
];
export default {
    getLogin,
    postLogin,
    googleAuth,
    googleCallback,
}