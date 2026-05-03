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
return await User.findOne({ email }).select("fullName email");
}

export async function createUser(userData, referredByUser = null) {
try {
const user = new User({
...userData,
referredBy: referredByUser ? referredByUser._id : null,
walletBalance: 0
});


    const savedUser = await user.save();

    if (referredByUser) {
        await addMoneyToWallet(
            savedUser._id,
            100,
            "Referral Bonus - Welcome Gift"
        );

        await addMoneyToWallet(
            referredByUser._id,
            200,
            "Referral Bonus - Friend Joined"
        );
    }

    return savedUser;

} catch (error) {
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


};
