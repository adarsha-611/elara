import mongoose from "mongoose";
const cartItemSchema = new mongoose.Schema({
  productId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Product",
    required:true
  },

  variantId:{
    type:mongoose.Schema.Types.ObjectId,
    required:true
  },
  quantity:{
    type:Number,
    default:1,
  },
   offerPrice:{          
    type: Number,
    default: null
  }
});

const cartSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    unique:true
  },
  items:[cartItemSchema]
})

export default mongoose.model("Cart",cartSchema);