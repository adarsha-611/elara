
import mongoose from "mongoose";


const offerSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    offerType:{
        type:String,
        enum:["product","category"],
        required:true
    },
    productId:{
        type: mongoose.Types.ObjectId,
        ref:"Product",
        default:null
    },
    categoryId:{
        type:mongoose.Types.ObjectId,
        ref:"Category",
        default:null
    },
    discountType:{
        type:String,
        enum:["percentage","fixed"],
        required:true
    },
    discountValue:{
        type:Number,
        required:true
    },
    startDate:Date,
    endDate:Date,
    isActive:{
        type:Boolean,
        default:true
    }
},{timestamps:true});

export default mongoose.model("Offer",offerSchema);