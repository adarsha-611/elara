import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    discountType: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true
    },

    discountValue: {
        type: Number,
        required: true
    },

    maxDiscount: {
        type: Number,
        default: 0
    },

    minOrder: {
        type: Number,
        default: 0
    },

    usageLimit: {
        type: Number,
        required: true
    },

    usedCount: {
        type: Number,
        default: 0
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

export default mongoose.model("Coupon", couponSchema);