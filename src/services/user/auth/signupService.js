import {
    findUserByemail,
    findUserByreferralCode,
    createUser,
    generateReferralCode
} from "../userService.js";
import { hashString } from "../../../utils/bcrypt.js";

export async function register(data) {
    const existingUser = await findUserByemail(data.email);
    if (existingUser) throw new Error("User already exists");

    const hashPassword = await hashString(data.password);
    const generatedReferralCode = await generateReferralCode(data.fullName);

    let referredByUser = null;

    const referralCodeUsed = data.referralCodeUsed || data.referralCode || null;

    console.log("=== REGISTER DEBUG ===");
    console.log("data.referralCode:", data.referralCode);
    console.log("data.referralCodeUsed:", data.referralCodeUsed);
    console.log("referralCodeUsed resolved:", referralCodeUsed);

    if (referralCodeUsed) {
        referredByUser = await findUserByreferralCode(referralCodeUsed);
        console.log("referredByUser found:", referredByUser ? referredByUser.email : "NOT FOUND");
        
        if (!referredByUser) {
            throw new Error("Invalid referral code");
        }
    }

    const userData = {
        fullName: data.fullName,
        email: data.email,
        password: hashPassword,
        referralCode: generatedReferralCode, 
        referralCodeUsed: referralCodeUsed,
        isVerified: true,
        walletBalance: 0
    };

    const createdUser = await createUser(userData, referredByUser);

    return {
        id: createdUser._id,
        email: createdUser.email,
        fullName: createdUser.fullName,
        referralCode: createdUser.referralCode
    };
}

export default { register };