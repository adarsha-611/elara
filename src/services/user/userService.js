import User from "../../model/userSchema.js";
import mongoose from "mongoose";

export async function findUserByemail(email) {
     const user = await User.findOne({email:email})
     return user
}

export async function findUserByreferralCode(referralCode) {
    const user = await User.findOne({referralCode:referralCode})
    return user

}

export async function findUserDataByEmail(email) {
    const user = await User.findOne({email:email}).select('fullName email');
    return user;
}

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

export async function getUserById(userId){

       try {
        const objectId = new mongoose.Types.ObjectId(userId);
            const user = await User.findOne({_id: objectId})

        return user



            
       } catch (error) {
          console.log(error)
       }
    }

export const generateReferralCode = async(name)=>{
    let code;
    let exists = true;

    while(exists){
        const random = Math.floor(1000 + Math.random() * 9000);
        code = name.slice(0,4).toUpperCase() + random;

        const user = await User.findOne({referralCode:code});
        if(!user) exists = false;
    }
    return code;
}