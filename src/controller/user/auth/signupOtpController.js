import { verifyOtp } from "../../../services/user/auth/signOtpService.js";



const getVerifyOtp = async (req,res)=>{
    try {
        if(!req.session.userEmail){
            return res.redirect('/signup');
        }

        return res.render('user/auth/signupOtp',{
            email:req.session.userEmail
        })
    } catch (error) {
        console.log("Error rendering verify OTP page:", error);
        res.status(500).send("server error :" + error.message);
    }
}




const postVerifyOtp = async(req,res)=>{
    try {
        const {otp} = req.body;
        const email = req.session.userEmail;

        if(!email || !otp){
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are Requires'
            })
        }

        await verifyOtp(email,otp);

        
        const tempUser = req.session.tempUser
        if(!tempUser){
            return res.status(400).json({
                success: false,
                message: "Session expired. Please signup again"
            })
        }

        const registerUser  = await register(tempUser);

        req.session.userId = registerUser.user.id;
        req.session.userEmail = registerUser.user.email,
        req.session.userName = registerUser.user.fullName,

        delete req.session.tempUser;


        return res.status(200).json({
            success:true,
            message:"Account created successfuuly",
            redirectTo :"/home"
        })

    } catch (error) {
        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
}


export default {postVerifyOtp,getVerifyOtp}