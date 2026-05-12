import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
});

    console.log("DB connected");
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;