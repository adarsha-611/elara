import { findUserByemail, findUserByreferralCode, createUser } from "../userService.js";
import {hashString} from "../../../utils/bcrypt.js";
import { sendOTP } from "../../email/emailService.js";


export async function register(data) {
    
    const existingUser = await findUserByemail(data.email)
    console.log(existingUser)

    if(existingUser){
        throw new Error("User already exist");
        
    }
    sendOTP(data.email)
    const hashPassword = await hashString(data.password)
    const generatedReferralCode = await generateReferralCode(data.fullName)

    if(data.referralCode){
        const referredUser = await findUserByreferralCode(data.referralCode)
        console.log(referredUser)
        if(!referredUser){
            throw new Error("Invalid referral code");
            
        }
    }
    
    const userData = {
        fullName:data.fullName,
        email:data.email,
        password:hashPassword,
        referralCode:generatedReferralCode,
        referredBy: data.referralCode || null,
        isVerified: true
    }
    
    
    const createdUser = await createUser(userData);
    
    
    return { 
        id: createdUser._id,
        email: createdUser.email,
        fullName: createdUser.fullName
    };
}

 export async function generateReferralCode(name) {
        let code;
        let codeExits = true;
        while (codeExits) {
            const random = Math.floor(Math.random() * 9000) + 1000;
            code = `${name.slice(0, 4).toUpperCase()}${random}`

            codeExits = await findUserByreferralCode(code)
        }
        return code;
    }





export default {
    register,
}