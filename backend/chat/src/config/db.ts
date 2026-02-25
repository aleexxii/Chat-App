import mongoose from "mongoose";

const connectDB = async () => {
  const url = process.env.MONGO_URI;

  if (!url) {
    throw new Error("MONGO_URI is not defined yet");
  }

  try {
    await mongoose.connect(url, {
      dbName: "ChatMicroServiceApp",
    });
    console.log("connected to mongodb");
  } catch (error) {
    console.log("Failed to connect MONGO_DB");
    process.exit(1);
  }
};

export default connectDB