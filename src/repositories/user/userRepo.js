import User from "../../model/userSchema.js";

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

            // Duplicate key error (MongoDB error code 11000)
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`${field} already exists`);
            }

            // Re-throw other errors
            throw error;
        }
    }




    
 

