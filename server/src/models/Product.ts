import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  seller: Types.ObjectId;
  title: string;
  description: string;
  price: number; // stored in cents
  stock: number;
  category: Types.ObjectId;
  images: string[];
  isHidden: boolean;
  ratingAverage: number;
  ratingCount: number;
  createdAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 1 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    images: {
      type: [String],
      default: [],
      validate: [(val: string[]) => val.length <= 4, 'Maximum of 4 images allowed'],
    },
    isHidden: { type: Boolean, default: false, index: true },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

productSchema.index({ title: 'text', description: 'text' });

export const Product = mongoose.model<IProduct>('Product', productSchema);  