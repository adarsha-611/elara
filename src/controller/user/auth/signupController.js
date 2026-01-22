
import { validateSignup } from "../../../utils/validators/joi_signup.js";
import {register} from "../../../services/user/auth/signupService.js";

const getSignup = async(req,res)=>{
    try {
       return res.render("user/auth/signup") 
    } catch (error) {
        console.log("Error rendering signup page:", error);
        res.status(500).send("server error: " + error.message);
    }
}



const postSignup = async(req,res)=>{
    try {
        const{error,value} = validateSignup(req.body);
        
        if (error) {
        return res.status(400).json({
            errors: error.details.map(err => err.message)
        });
        }
        console.log(value)
      const user = await register(req.body.email)

      req.session.userEmail = value.email;
        return res.redirect('/signup')
    }
    catch(error){
        console.log("Error",error);
    }
}





 export default {getSignup,
             postSignup, 
 }

