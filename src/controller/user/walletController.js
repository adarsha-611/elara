import { getWalletService ,addMoneyToWallet,deductWalletBalance,returnRefundToWallet,cancelRefundToWallet} from "../../services/user/walletService.js";
import razorpayInstance from "../../config/razorpay.js";
import crypto from "crypto";
import User from "../../model/userSchema.js";
const getWalletPage =async(req,res)=>{
    try {
        const userId = req.session.userId;
        const wallet = await getWalletService(userId);
        const user = await User.findById(userId);
        return res.render("user/wallet",{
            user,
            wallet
        })
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server error")
    }
}

const createWalletOrder = async(req,res)=>{
    try {
        const {amount} = req.body;

        if(!amount||amount<100){
            return res.json({
                success:false,
                message:"Minimun ₹100 required"
            });
        }

        const order = await razorpayInstance.orders.create({
            amount:amount*100,
            currency:"INR",
            receipt: `wallet_${Date.now()}`
        });

        res.json({success:true,order});
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Order creation failed"
        })
    }
}

const verifyWalletPayment = async (req, res) => {
    try {
        console.log("=== VERIFY API HIT ===");
        console.log("Full Body:", req.body);
        
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.log("Missing required fields from Razorpay");
            return res.json({ success: false, message: "Missing payment details" });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        console.log("Expected Signature:", expectedSignature);
        console.log("Received Signature:", razorpay_signature);

        if (expectedSignature !== razorpay_signature) {
            return res.json({
                success: false,
                message: "Invalid payment signature"
            });
        }
        const wallet = await addMoneyToWallet(req.session.userId, Number(amount));
        console.log("Wallet updated:", wallet.balance);

        res.json({ success: true, message: "Money added to wallet" });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Verification failed: " + error.message
        });
    }
};







export default{
    getWalletPage,
    createWalletOrder,
    verifyWalletPayment,
}