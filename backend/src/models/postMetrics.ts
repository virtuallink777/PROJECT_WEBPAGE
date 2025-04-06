import mongoose, { Schema, Document } from "mongoose";

interface IPostMetrics extends Document {
  postId: string;
  userId?: string; // Opcional si quieres identificar usuarios
  clicks: number;
  whatsappClicks: number;
  liveChatClicks: number;
  date: Date;
}

const PostMetricsSchema = new Schema<IPostMetrics>(
  {
    postId: { type: String, required: true },
    userId: { type: String },
    clicks: { type: Number, default: 0 },
    whatsappClicks: { type: Number, default: 0 },
    liveChatClicks: { type: Number, default: 0 },
    date: { type: Date, default: () => new Date().setHours(0, 0, 0, 0) }, // Se guarda con la hora en 00:00:00
  },
  { timestamps: true }
);

export default mongoose.model<IPostMetrics>("PostMetrics", PostMetricsSchema);
