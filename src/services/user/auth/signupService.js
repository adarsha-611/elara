<<<<<<< HEAD
// signupService.js
import { findUserByemail, findUserByreferralCode, createUser } from "../userService.js";
=======
import { findUserByemail, findUserByreferralCode, createUser, generateReferralCode } from "../userService.js";
>>>>>>> feature/refferal
import { hashString } from "../../../utils/bcrypt.js";

export async function register(data) {
    const existingUser = await findUserByemail(data.email);
    if (existingUser) throw new Error("User already exists");

    const hashPassword = await hashString(data.password);
<<<<<<< HEAD

    // Validate referral code if provided
    // Use consistent field name: referralCodeUsed
    if (data.referralCodeUsed) {
        const referredUser = await findUserByreferralCode(data.referralCodeUsed);
        if (!referredUser) throw new Error("Invalid referral code");
=======
    const generatedReferralCode = await generateReferralCode(data.fullName);

    let referredByUser = null;

    if (data.referralCode) {
        console.log("=== REFERRAL DEBUG ===");
        console.log("Referral code from form:", data.referralCode);
        referredByUser = await findUserByreferralCode(data.referralCode);
        console.log("Found referrer:", referredByUser ? referredByUser.email : "NOT FOUND");
        if (!referredByUser) throw new Error("Invalid referral code");
>>>>>>> feature/refferal
    }

    const userData = {
        fullName: data.fullName,
        email: data.email,
        password: hashPassword,
        referralCodeUsed: data.referralCodeUsed || null, // pass through consistently
        isVerified: true,
        walletBalance: 0
    };

<<<<<<< HEAD
    const createdUser = await createUser(userData);
=======
    console.log("Calling createUser with referredByUser:", referredByUser ? referredByUser.email : "NULL");
    const createdUser = await createUser(userData, referredByUser);
>>>>>>> feature/refferal

    return {
        id: createdUser._id,
        email: createdUser.email,
        fullName: createdUser.fullName,
        referralCode: createdUser.referralCode
    };
}

<<<<<<< HEAD
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
=======
export default { register };
>>>>>>> feature/refferal
