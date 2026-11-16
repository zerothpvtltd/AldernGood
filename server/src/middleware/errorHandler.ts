import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    res.status(400).json({
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'Each image must be smaller than 3MB'
        : `Upload error: ${err.message}`,
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: 'Invalid resource identifier' });
    return;
  }

  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'An unexpected server error occurred' });
}