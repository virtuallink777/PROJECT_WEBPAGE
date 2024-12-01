import mongoose from "mongoose";
import { MONGODB_URL } from "../constans/env";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("connected to database");
  } catch (error) {
    console.log("error connecting to database", error);
    process.exit(1);
  }
}; // connect to database

export default connectToDatabase;
