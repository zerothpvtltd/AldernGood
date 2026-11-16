export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  isSuspended: boolean;
  storeName: string | null;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Product {
  _id: string;
  seller: {
    _id: string;
    name: string;
    storeName?: string;
    email?: string;
  };
  title: string;
  description: string;
  price: number; // cents
  stock: number;
  category: Category;
  images: string[];
  isHidden: boolean;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
}

export interface CartItem {
  product: {
    _id: string;
    title: string;
    price: number;
    stock: number;
    images: string[];
    isHidden: boolean;
    seller?: {
      _id: string;
      storeName?: string;
      name: string;
    };
  };
  quantity: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
}

export type OrderItemStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  product: string | { _id: string; images?: string[]; title?: string };
  seller: string | { _id: string; storeName?: string; name?: string };
  titleSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  status: OrderItemStatus;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  city: string;
  postalCode: string;
  phone: string;
}

export interface Order {
  _id: string;
  buyer: string | { _id: string; name: string; email: string };
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalAmount: number;
  payment: {
    method: 'test_card';
    status: 'paid' | 'failed';
    reference: string;
    last4?: string;
  };
  createdAt: string;
}

export interface Review {
  _id: string;
  product: string;
  buyer: {
    _id: string;
    name: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}