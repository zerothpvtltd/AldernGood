import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { ApiError } from '../utils/apiError';

// Use /tmp/uploads on Vercel/serverless (read-only /var/task), local ./uploads in dev
export const uploadDir =
  process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
    ? path.join(os.tmpdir(), 'uploads')
    : path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

export const uploadProductImages = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB per file
    files: 4,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMime.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only JPEG, PNG, WebP, or SVG images are allowed'));
    }
  },
});