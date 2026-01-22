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

    password: {
      type: String,
      required: true
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
      sparse: true   
    },

    referredBy: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true   
  }
);

export default mongoose.model("User", userSchema);
