import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5),
  comment: z
    .string()
    .trim()
    .min(3, 'Please write a short comment (min 3 characters)')
    .max(500, 'Comment cannot exceed 500 characters'),
});