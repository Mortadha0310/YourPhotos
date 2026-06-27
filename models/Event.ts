import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  name: string;
  description?: string;
  date: Date;
  location?: string;
  photographer: mongoose.Types.ObjectId;
  numericCode: string;
  qrData: string;
  coverImage?: string;
  isActive: boolean;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>({
  name: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String },
  photographer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  numericCode: { type: String, required: true, unique: true },
  qrData: { type: String, required: true },
  coverImage: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
