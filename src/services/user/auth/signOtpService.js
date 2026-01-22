import {createUser} from "../../../repositories/user/userRepo.js";
import {isOtpExpired} from "../../../utils/otp.js";

export async function verifyOtp(email,otp) {
    
    const otpData = await findOtpByEmail(email);

    if(!otpData){
        throw new Error("OTP expired or not found");
        
    }

    if(isOtpExpired(otpData.expiry)){
        await deleteOtpByEmail(email)
        throw new Error("OTP expired");
        
    }
    
    if(otpData.otp!==otp){
        throw new Error("Invalid OTP");
        
    }


    await createUser(otpData.userData);
    await verifyUser(email);
    await deleteOtpByEmail(email)
    
}