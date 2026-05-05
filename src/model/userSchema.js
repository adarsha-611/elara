import mongoose  from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    authType: {
    type: String,
    enum: ["local", "google"],
    default: "local"
    },
     password: {
      type: String,
    },

    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer"
    },

    isVerified: {
      type: Boolean,
      default: false
    },

referralCode: {
    type: String,
    unique: true,
    sparse: true,
    default: () => Math.random().toString(36).substring(2, 8).toUpperCase()
},
referredBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
},
walletBalance: {
  type: Number,
  default: 0
},

 profileImage: {
      type: String,
      default: null
    },

    isBlocked: {
      type: Boolean,
      default: false
    },

   addresses: {
  type: [{
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    addressType: { type: String, enum: ['Home', 'Work'], required: true },
    isDefault: { type: Boolean, default: false }
  }],
  default: []  
}

  },
  {
    timestamps: true   
  }
);

export default mongoose.model("User", userSchema);
