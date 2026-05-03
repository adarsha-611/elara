import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String
  },
  variantColor: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  offerDiscount: {        
  type: Number,
  default: 0
},
  total: {
    type: Number,
    required: true,
  },
  isRefunded: {
    type: Boolean,
    default: false
  },
  itemStatus: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "shipped",
      "out for delivery",
      "delivered",
      "cancelled",
      "returned"
    ],
    default: "pending",
  },
  cancelRequest: {
    requested: { type: Boolean, default: false },
    reason: { type: String, trim: true },
    cancelledAt: Date
  },
  returnRequest: {
    requested: { type: Boolean, default: false },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ["none", "pending", "accepted", "rejected"],
      default: "none",
    },
    requestedAt: Date,
    processedAt: Date,
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  items: [orderItemSchema],

  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },

  couponApplied: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
    default: null
  },

  discount: {
    type: Number,
    default: 0
  },

  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  shippingAddress: {
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },

  paymentMethod: {
    type: String,
    enum: ["cod", "online", "wallet"],
    required: true,
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },

  orderStatus: {
    type: String,
    enum: [
      "pending",
      "shipped",
      "out for delivery",
      "delivered",
      "cancelled",
      "returned",
      "partially_cancelled" 
    ],
    default: "pending",
  },

  orderId: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },

  paymentId: {
    type: String,
    sparse: true,
  }

}, {
  timestamps: true,
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ orderId: 1 });

export default mongoose.model("Order", orderSchema);