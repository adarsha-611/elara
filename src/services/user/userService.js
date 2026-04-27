import User from "../../model/userSchema.js";
import mongoose from "mongoose";
import { addMoneyToWallet } from "./walletService.js";

export async function findUserByemail(email) {
    return await User.findOne({ email });
}

export async function findUserByreferralCode(referralCode) {
    return await User.findOne({ referralCode });
}

export async function findUserDataByEmail(email) {
    return await User.findOne({ email }).select('fullName email');
}

<<<<<<< HEAD
export async function createUser(userData) {
    try {
        const { fullName, referralCodeUsed } = userData;

        const referralCode = await generateReferralCode(fullName);

        let referredUser = null;
        if (referralCodeUsed) {
            referredUser = await findUserByreferralCode(referralCodeUsed);
        }

        const user = new User({
            ...userData,
            referralCode,
            referredBy: referredUser ? referredUser._id : null,
            walletBalance: referredUser ? 100 : 0
        });

        const savedUser = await user.save();

        if (referredUser) {
            referredUser.walletBalance += 200;
            await referredUser.save();
=======
export async function createUser(userData, referredByUser = null) {
    console.log("=== CREATE USER DEBUG ===");
    console.log("referredByUser received:", referredByUser ? referredByUser.email : "NULL");

    try {
        const user = new User({
            ...userData,
            walletBalance: 0
        });

        const savedUser = await user.save();
        console.log("User saved:", savedUser._id);

        if (referredByUser) {
            console.log("Crediting wallets...");
            await addMoneyToWallet(savedUser._id, 100, "Referral Bonus - Welcome Gift");
            console.log("New user ₹100 credited ✅");
            await addMoneyToWallet(referredByUser._id, 200, "Referral Bonus - Friend Joined");
            console.log("Referrer ₹200 credited ✅");
        } else {
            console.log("No referrer — skipping wallet credit");
>>>>>>> feature/refferal
        }

        return savedUser;

    } catch (error) {
<<<<<<< HEAD
=======
        console.log("createUser error:", error);
>>>>>>> feature/refferal
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            throw new Error(`${field} already exists`);
        }
        throw error;
    }
}

export async function getUserById(userId) {
    try {
        return await User.findById(new mongoose.Types.ObjectId(userId));
    } catch (error) {
        console.log(error);
    }
}

export const generateReferralCode = async (name) => {
    let code;
    let exists = true;
    while (exists) {
        const random = Math.floor(1000 + Math.random() * 9000);
        code = name.slice(0, 4).toUpperCase() + random;
        const user = await User.findOne({ referralCode: code });
        if (!user) exists = false;
    }
    return code;
}