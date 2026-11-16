import mongoose, { Schema, Document, Types } from 'mongoose';

export type OrderItemStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface IOrderItem {
  product: Types.ObjectId;
  seller: Types.ObjectId;
  titleSnapshot: string;
  priceSnapshot: number; // cents
  quantity: number;
  status: OrderItemStatus;
}

export interface IShippingAddress {
  fullName: string;
  line1: string;
  city: string;
  postalCode: string;
  phone: string;
}

export interface IOrder extends Document {
  buyer: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  totalAmount: number; // cents
  payment: {
    method: 'test_card';
    status: 'paid' | 'failed';
    reference: string;
    last4?: string;
  };
  createdAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        titleSnapshot: { type: String, required: true },
        priceSnapshot: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        status: {
          type: String,
          enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
          default: 'placed',
        },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      phone: { type: String, required: true },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    payment: {
      method: { type: String, enum: ['test_card'], default: 'test_card' },
      status: { type: String, enum: ['paid', 'failed'], required: true },
      reference: { type: String, required: true },
      last4: { type: String },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);