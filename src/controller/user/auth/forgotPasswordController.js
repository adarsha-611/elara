import { findUserByemail,findUserDataByEmail } from "../../../services/user/userService.js";
import  {sendOTP,verifyOTP} from "../../../services/email/emailService.js";
import User from "../../../model/userSchema.js";
import { hashString } from "../../../utils/bcrypt.js";


const getForgotPassword = async(req,res)=>{
    try {
        const error = req.flash('error');
        res.render('user/auth/forgotPassword',{error});
    } catch (error) {
        
console.log("error rendering forgot password page",error);
res.status(500).send('Server Error')   
 }
};

const postForgotPassword = async(req,res)=>{
    try {
        const {email} = req.body;
        const user = await findUserByemail(email);
        if(!user){
            req.flash('error','User with this email does not exist');
            return res.redirect('/forgot-password');
        }

        req.session.forgotEmail = email;
        await sendOTP(email);
        res.render('user/auth/loginOtp',{email});
    } catch (error) {
            console.log('Error in postForgotPassword:', error);
            res.status(500).send("server Error")
    }
}

 const verifyForgotOtp = async(req,res)=>{
    try {
        const {otp} = req.body;
        const email = req.session.forgotEmail;

        if(!email){
            return res.status(400).json({success:false,message:'Session expired'});
        }

        await verifyOTP(email,otp);
        res.status(200).json({success:true,message:'OTP verified successFully'});
    } catch (error) {
        console.log("Error in verifyFotgotOtp:",error);
        res.status(400).json({success:false,message:error.message});
    }
 };


 const getResetPassword = async(req,res)=>{
    try {
        if(!req.session.forgotEmail){
            return res.redirect('/forgot-password');
        }
        const error = req.flash('error');
        res.render('user/auth/loginNewps',{error});
    } catch (error) {
        console.log("Error rendering reset password page",error)
        res.status(500).send("Server Error")
    }
 }


 const postResetPasword = async(req,res)=>{
    try{
        const {password, confirmPassword} = req.body;
        const email = req.session.forgotEmail;

        if(!email){
            req.flash('error', 'Session expired.Please try again');
            return res.redirect('/forgot-password');
        }
        if(password !== confirmPassword){
            req.flash('error','Passwords do not match');
            return res.redirect('/reset-password');
        }
        const hashedPassword = await hashString(password);
        await User.findOneAndUpdate({email},{password:hashedPassword});

        delete req.session.forgotEmail;
        req.flash('success','Password reset successfully.Please login.');
        res.redirect('/login');

    } catch (error){
        console.log("Error in postResetPassword:",error);
        res.status(500).send("Server Error");
    }
 };

 export default{
    getForgotPassword,
    postForgotPassword,
    verifyForgotOtp,
    getResetPassword,
    postResetPasword
 }