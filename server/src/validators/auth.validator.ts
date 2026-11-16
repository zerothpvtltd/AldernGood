import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100),
    role: z.enum(['buyer', 'seller'], {
      errorMap: () => ({ message: 'Role must be either buyer or seller' }),
    }),
    storeName: z.string().trim().max(80).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'seller' && (!data.storeName || data.storeName.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['storeName'],
        message: 'Store name is required for seller accounts (min 2 characters)',
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});