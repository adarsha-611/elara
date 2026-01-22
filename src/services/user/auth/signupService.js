import { findUserByemail, findUserByreferralCode } from "../../../repositories/user/userRepo.js";
import {hashString} from "../../../utils/bcrypt.js";

export async function register(data) {
    const existingUser = await findUserByemail(data.email)
    console.log(existingUser)
    if(existingUser){
        throw new Error("User already exist");
        
    }
    const hashPassword = hashString(data.password)
    const generatedReferralCode = await generateReferralCode(data.fullName)

    if(data.referralCode){
        const referredUser = await findUserByreferralCode(data.referralCode)
        console.log(referredUser)
        if(!referredUser){
            throw new Error("Invalid refferal code");
            
        }
    }
    
    const userData = {
        fullName:data.fullName,
        Email:data.email,
        password:hashPassword,
        referalCode:generatedReferralCode,
        
    }
  
    try {
        const savedUser = await createUser(userData)
    } catch (error) {
        
    }

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