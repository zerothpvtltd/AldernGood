import { z } from 'zod';

export const checkoutSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().trim().min(2, 'Full name is required'),
    line1: z.string().trim().min(4, 'Street address is required'),
    city: z.string().trim().min(2, 'City is required'),
    postalCode: z.string().trim().min(3, 'Postal code is required'),
    phone: z.string().trim().min(6, 'Phone number is required'),
  }),
  cardDetails: z.object({
    cardholderName: z.string().trim().min(2, 'Cardholder name is required'),
    cardNumber: z
      .string()
      .transform((v) => v.replace(/\s+/g, ''))
      .refine((v) => /^\d{16}$/.test(v), 'Enter a valid 16-digit card number'),
    expiry: z
      .string()
      .trim()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format'),
    cvc: z
      .string()
      .trim()
      .regex(/^\d{3,4}$/, 'Enter a 3 or 4 digit CVC'),
  }),
});

export const updateItemStatusSchema = z.object({
  status: z.enum(['placed', 'processing', 'shipped', 'delivered', 'cancelled']),
});