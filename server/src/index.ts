import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { connectDB } from './config/db';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { uploadDir } from './middleware/upload';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Ensure DB connection before handling requests in serverless cold starts
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/uploads', express.static(uploadDir));
app.use('/api', apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.use(errorHandler);

if (process.env.VERCEL !== '1') {
  connectDB()
    .then(() => {
      app.listen(env.PORT, () => {
        console.log(`Server running on http://localhost:${env.PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}

export default app;