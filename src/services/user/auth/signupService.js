// signupService.js
import { findUserByemail, findUserByreferralCode, createUser } from "../userService.js";
import { hashString } from "../../../utils/bcrypt.js";

export async function register(data) {
    const existingUser = await findUserByemail(data.email);
    if (existingUser) throw new Error("User already exists");

    const hashPassword = await hashString(data.password);

    // Validate referral code if provided
    // Use consistent field name: referralCodeUsed
    if (data.referralCodeUsed) {
        const referredUser = await findUserByreferralCode(data.referralCodeUsed);
        if (!referredUser) throw new Error("Invalid referral code");
    }

    const userData = {
        fullName: data.fullName,
        email: data.email,
        password: hashPassword,
        referralCodeUsed: data.referralCodeUsed || null, // pass through consistently
        isVerified: true,
        walletBalance: 0
    };

    const createdUser = await createUser(userData);

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