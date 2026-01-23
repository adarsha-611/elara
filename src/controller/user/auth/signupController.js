
import { validateSignup } from "../../../utils/validators/joi_signup.js";
import {register} from "../../../services/user/auth/signupService.js";
import { verifyOTP } from "../../../services/email/emailService.js";

const getSignup = async(req,res)=>{
    try {
        // Check if there are any error messages from previous request
        const errors = req.flash('errors') || [];
        return res.render("user/auth/signup", { errors }) 
    } catch (error) {
        console.log("Error rendering signup page:", error);
        res.status(500).send("server error: " + error.message);
    }
}



const postSignup = async(req,res)=>{
    try {
        const{error,value} = validateSignup(req.body);
        
        if (error) {
            req.flash('errors', error.details.map(err => err.message));
            return res.render('/signup');
        }
        
        // console.log(value);
        // const user = await register(value);

        // // Set session for the newly registered user
        // req.session.userId = user.id;
        // req.session.userEmail = value.email;
        // req.session.userName = value.fullName;
        
        return res.render('user/auth/signupOtp');
    }
    catch(error){
        console.log("Signup Error:", error);
        
        // Handle specific error cases
        if (error.message.includes('User already exist')) {
            req.flash('errors', ['An account with this email already exists. Please login instead.']);
        } else if (error.message.includes('Invalid referral code')) {
            req.flash('errors', ['The referral code you entered is invalid. Please check and try again.']);
        } else {
            req.flash('errors', ['An error occurred during registration. Please try again later.']);
        }
        
        return res.redirect('/signup');
    }
}

 const verifyOtp = async(req,res)=>{
    try {
       const {email,otp} = req.body;
      const checkOtp = await verifyOTP(email,otp)

      if(checkOtp){
        return res.render('user/auth/login')
      }
      
    } catch (error) {
        return res.render('/signupOtp')
    }
 }

 




 export default {getSignup,
             postSignup, 
 }

