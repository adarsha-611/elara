import { getUserById } from "../../services/user/userService.js";

const getReferralPage = async(req,res)=>{
    try {
        const userId = req.session.userId;
        const user = await getUserById(userId);

        if(!user){
            return res.redirect("/login");
        }
        return res.render("user/auth/referralCode",{
            user
        })
    } catch (error) {
        console.log("Referral page error:",error);
        return res.redirect("/profile")
    }
}

export default{
    getReferralPage
}