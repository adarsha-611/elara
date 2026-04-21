import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["credit", "debit", "refund"],
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    reason: {
        type: String,
        default: ""
    },

    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    balance: {
        type: Number,
        default: 0
    },

    transactions: [walletTransactionSchema]

}, { timestamps: true });

export default mongoose.model("Wallet", walletSchema);