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
            const user = new User(userData);
            return await user.save();

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
