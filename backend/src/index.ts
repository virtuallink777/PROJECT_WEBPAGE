import express from "express";
import connectToDatabase from "./config/db";
import "dotenv/config";

const app = express();

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Healthy",
  });
});

app.listen(4004, async () => {
  console.log("Server is running on port 4004 in development mode");
  await connectToDatabase();
});
