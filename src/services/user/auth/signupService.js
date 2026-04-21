import { findUserByemail, findUserByreferralCode, createUser } from "../userService.js";
import { hashString } from "../../../utils/bcrypt.js";

export async function register(data) {
    
    const existingUser = await findUserByemail(data.email);
    if (existingUser) {
        throw new Error("User already exists");
    }

    const hashPassword = await hashString(data.password);

    const generatedReferralCode = await generateReferralCode(data.fullName);

    let referredByUser = null;

    if (data.referralCode) {
        referredByUser = await findUserByreferralCode(data.referralCode);
        
        if (!referredByUser) {
            throw new Error("Invalid referral code");
        }

       
    }

    const userData = {
        fullName: data.fullName,
        email: data.email,
        password: hashPassword,
        referralCode: generatedReferralCode,
        referredBy: referredByUser ? referredByUser._id : null,
        isVerified: true,
        walletBalance: 0   // Start with 0
    };

    const createdUser = await createUser(userData, referredByUser);

    return { 
        id: createdUser._id,
        email: createdUser.email,
        fullName: createdUser.fullName,
        referralCode: createdUser.referralCode
    };
}

export async function generateReferralCode(name) {
    let code;
    let codeExists = true;

    while (codeExists) {
        const random = Math.floor(Math.random() * 9000) + 1000;
        code = `${name.slice(0, 4).toUpperCase()}${random}`;

        codeExists = await findUserByreferralCode(code);
    }
    return code;
}

export default {
    register,
};