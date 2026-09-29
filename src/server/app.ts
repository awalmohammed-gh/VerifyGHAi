import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/environment.js';
import { ensureUploadDirExists } from './config/upload.js';
import { isDatabaseConnected } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { ApiResponse } from './utils/response.js';

// Route imports
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { verificationRoutes } from './routes/verification.routes.js';
import { reportRoutes } from './routes/report.routes.js';
import { notificationRoutes } from './routes/notification.routes.js';
import { statisticsRoutes } from './routes/statistics.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { newsRoutes } from './routes/news.routes.js';
import { adminRouter } from './routes/adminRoutes.js';

export function createApp(): Express {
  const app = express();

  // 1. Trust reverse proxies for rate limiting & secure cookie passing
  app.set('trust proxy', 1);

  // 2. CORS configuration
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    })
  );

  // 3. Request body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Cookie parser for HttpOnly session tokens
  app.use(cookieParser());

  // 5. Static uploads directory (ensuring directory exists)
  ensureUploadDirExists();
  app.use('/uploads', express.static(env.UPLOAD_DIR));

  // 6. System Health Check Endpoint
  app.get('/api/health', (_req, res) => {
    return ApiResponse.success(res, 'VerifAI GH API is running', {
      service: 'VerifAI GH User Backend API',
      version: '1.0.0',
      tagline: 'Check Before You Share.',
      database: isDatabaseConnected() ? 'MongoDB Connected' : 'High-Availability Store Active',
      timestamp: new Date().toISOString(),
      architecture: {
        claimExtraction: 'AI-assisted discrete atomic segmentation',
        searchService: 'Contextual search & verification registry',
        evidenceEngine: 'Cross-examination & credibility ranking',
        decisionSupport: 'Automated explainable reasoning framework',
      },
    });
  });

  // 7. REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/user', statisticsRoutes);
  app.use('/api/statistics', statisticsRoutes);
  app.use('/api/stats', statisticsRoutes);
  app.use('/api/verifications', verificationRoutes);
  app.use('/api/verification', verificationRoutes);
  app.use('/api/verify', verificationRoutes);
  app.use('/api/analyze', verificationRoutes);
  app.use('/api/scan', verificationRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/news', newsRoutes);

  // Admin routes compatibility foundation (Phase 2 readiness)
  app.use('/api/admin', adminRouter);

  // 8. 404 handler for unmatched /api routes
  app.use('/api/*', notFoundHandler);

  // 9. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
