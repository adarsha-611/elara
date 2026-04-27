import  Wallet from "../../model/walletSchema.js";

export const getWalletService = async(userId)=>{
    const wallet = await Wallet.findOne({userId});

    if(!wallet){
        return{
            balance:0,
            transactions:[]
        }
    }
    return wallet;
}


// walletService.js — update addMoneyToWallet to accept a reason
export const addMoneyToWallet = async (userId, amount, reason = "Wallet Top-up") => {
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
        wallet = await Wallet.create({
            userId,
            balance: 0,
            transactions: []
        });
    }

    wallet.balance += Number(amount);

    wallet.transactions.push({
        type: "credit",
        amount,
        reason   // ✅ now dynamic
    });

    await wallet.save();
    return wallet;
};


export const deductWalletBalance = async(userId,amount)=>{
    const wallet = await Wallet.findOne({userId});

    if(!wallet||wallet.balance<amount){
        throw new Error("Insufficient wallet balance");
    }

    wallet.balance -=amount;

    wallet.transactions.push({
        type:"debit",
        amount,
        reason:"Order Payment"
    });

    await wallet.save();
    return wallet;
}


export const returnRefundToWallet = async(userId,amount,orderId = null)=>{

    if(!amount || amount<=0){
        throw new Error("Refund amount must be greater than 0")
    }

    const wallet = await Wallet.findOneAndUpdate(
        {userId},
        {
            $inc:{balance:Number(amount)},
            $push:{
                transactions:{
                    type:"refund",
                    amount:Number(amount),
                    reason:"Return Refund",
                    orderId:orderId
                }
            }
        },
        {
            upsert:true,
            new:true
        }
    );
    return wallet;
    
};


export const cancelRefundToWallet = async(userId,amount,orderId = null)=>{
    let wallet = await Wallet.findOne({userId});

    if(!wallet){
        wallet = await Wallet.create({userId,balance:0,transactions:[]});
    }
    wallet.balance+=Number(amount);

    wallet.transactions.push({
        type:"refund",
        amount:Number(amount),
        reason:"Cancelled refund",
        orderId:orderId
    })
    await wallet.save();
    return wallet;
}
