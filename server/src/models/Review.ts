import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  product: Types.ObjectId;
  buyer: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reviewSchema.index({ product: 1, buyer: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', reviewSchema);