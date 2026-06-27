import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoto extends Document {
  event: mongoose.Types.ObjectId;
  url: string;
  publicId: string;
  faceDescriptors: number[][];
  facesCount: number;
  filename: string;
  createdAt: Date;
}

const PhotoSchema = new Schema<IPhoto>({
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  faceDescriptors: { type: [[Number]], default: [] },
  facesCount: { type: Number, default: 0 },
  filename: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Photo || mongoose.model<IPhoto>('Photo', PhotoSchema);
