import { findUserByemail, findUserByreferralCode, createUser, generateReferralCode } from "../userService.js";
import { hashString } from "../../../utils/bcrypt.js";

export async function register(data) {
    const existingUser = await findUserByemail(data.email);
    if (existingUser) throw new Error("User already exists");

    const hashPassword = await hashString(data.password);
    const generatedReferralCode = await generateReferralCode(data.fullName);

    let referredByUser = null;

    if (data.referralCode) {
        console.log("=== REFERRAL DEBUG ===");
        console.log("Referral code from form:", data.referralCode);
        referredByUser = await findUserByreferralCode(data.referralCode);
        console.log("Found referrer:", referredByUser ? referredByUser.email : "NOT FOUND");
        if (!referredByUser) throw new Error("Invalid referral code");
    }

    const userData = {
        fullName: data.fullName,
        email: data.email,
        password: hashPassword,
        referralCode: generatedReferralCode,
        referredBy: referredByUser ? referredByUser._id : null,
        isVerified: true,
        walletBalance: 0
    };

    console.log("Calling createUser with referredByUser:", referredByUser ? referredByUser.email : "NULL");
    const createdUser = await createUser(userData, referredByUser);

    return {
        id: createdUser._id,
        email: createdUser.email,
        fullName: createdUser.fullName,
        referralCode: createdUser.referralCode
    };
}

export default { register };