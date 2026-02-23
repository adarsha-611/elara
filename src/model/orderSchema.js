import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
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

  total: {
    type: Number,
    required: true,
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
      "return requested",
      "returned"
    ],
    default: "pending",
  },

  returnRequest: {
    requested: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
      trim: true,
    },
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
    enum: ["cod", "online"],
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
      "confirmed",
      "shipped",
      "out for delivery",
      "delivered",
      "cancelled"
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