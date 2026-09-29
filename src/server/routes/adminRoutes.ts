import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { authController } from '../controllers/auth.controller.js';

// Admin Controllers
import { adminDashboardController } from '../controllers/admin/admin-dashboard.controller.js';
import { adminUserController } from '../controllers/admin/admin-user.controller.js';
import { adminVerificationController } from '../controllers/admin/admin-verification.controller.js';
import { adminReviewController } from '../controllers/admin/admin-review.controller.js';
import { adminSourceController } from '../controllers/admin/admin-source.controller.js';
import { adminFactCheckController } from '../controllers/admin/admin-fact-check.controller.js';
import { adminFlagController } from '../controllers/admin/admin-flag.controller.js';
import { adminAlertController } from '../controllers/admin/admin-alert.controller.js';
import { adminAnalyticsController } from '../controllers/admin/admin-analytics.controller.js';
import { adminAuditController } from '../controllers/admin/admin-audit.controller.js';

export const adminRouter = Router();

/* ==========================================================================
   0. PUBLIC ADMINISTRATIVE AUTH & REGISTRATION
   ========================================================================== */
adminRouter.post('/register', (req, res, next) =>
  authController.registerAdmin(req, res, next)
);

adminRouter.post('/login', (req, res, next) =>
  authController.adminLogin(req, res, next)
);

// Apply administrative security guard to all protected endpoints in this router
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

/* ==========================================================================
   1. DASHBOARD & OVERVIEW / METRICS
   ========================================================================== */
adminRouter.get('/overview', (req, res, next) =>
  adminDashboardController.getDashboardOverview(req, res, next)
);
adminRouter.get('/dashboard', (req, res, next) =>
  adminDashboardController.getDashboardOverview(req, res, next)
);
adminRouter.get('/metrics', (req, res, next) =>
  adminDashboardController.getDashboardOverview(req, res, next)
);
adminRouter.get('/stats', (req, res, next) =>
  adminDashboardController.getDashboardOverview(req, res, next)
);

/* ==========================================================================
   2. USER MANAGEMENT
   ========================================================================== */
adminRouter.get('/users', (req, res, next) =>
  adminUserController.listUsers(req, res, next)
);
adminRouter.get('/users/:id', (req, res, next) =>
  adminUserController.getUserDetails(req, res, next)
);
adminRouter.patch('/users/:id/status', (req, res, next) =>
  adminUserController.updateUserStatus(req, res, next)
);
adminRouter.put('/users/:id/status', (req, res, next) =>
  adminUserController.updateUserStatus(req, res, next)
);
adminRouter.patch('/users/:id/role', (req, res, next) =>
  adminUserController.updateUserRole(req, res, next)
);
adminRouter.put('/users/:id/role', (req, res, next) =>
  adminUserController.updateUserRole(req, res, next)
);
adminRouter.delete('/users/:id', (req, res, next) =>
  adminUserController.deleteUser(req, res, next)
);

/* ==========================================================================
   3. VERIFICATION DOSSIERS & MODERATION
   ========================================================================== */
adminRouter.get('/verifications', (req, res, next) =>
  adminVerificationController.listVerifications(req, res, next)
);
adminRouter.get('/verifications/:id', (req, res, next) =>
  adminVerificationController.getVerificationDetails(req, res, next)
);
adminRouter.post('/verifications/:verificationId/override', (req, res, next) =>
  adminReviewController.submitReview(req, res, next)
);
adminRouter.post('/verifications/:verificationId/review', (req, res, next) =>
  adminReviewController.submitReview(req, res, next)
);
adminRouter.delete('/verifications/:id', (req, res, next) =>
  adminVerificationController.deleteVerification(req, res, next)
);

/* ==========================================================================
   4. HUMAN-IN-THE-LOOP REVIEW QUEUE
   ========================================================================== */
adminRouter.get('/reviews', (req, res, next) =>
  adminReviewController.getReviewQueue(req, res, next)
);
adminRouter.get('/reviews/:id', (req, res, next) =>
  adminReviewController.getReviewById(req, res, next)
);
adminRouter.post('/reviews/:verificationId', (req, res, next) =>
  adminReviewController.submitReview(req, res, next)
);
adminRouter.patch('/reviews/:id', (req, res, next) =>
  adminReviewController.updateReview(req, res, next)
);
adminRouter.put('/reviews/:id', (req, res, next) =>
  adminReviewController.updateReview(req, res, next)
);

/* ==========================================================================
   5. SOURCE REGISTRY MANAGEMENT
   ========================================================================== */
adminRouter.get('/sources', (req, res, next) =>
  adminSourceController.listSources(req, res, next)
);
adminRouter.get('/sources/:id', (req, res, next) =>
  adminSourceController.getSourceById(req, res, next)
);
adminRouter.post('/sources', (req, res, next) =>
  adminSourceController.createSource(req, res, next)
);
adminRouter.put('/sources/:id', (req, res, next) =>
  adminSourceController.updateSource(req, res, next)
);
adminRouter.patch('/sources/:id', (req, res, next) =>
  adminSourceController.updateSource(req, res, next)
);
adminRouter.delete('/sources/:id', (req, res, next) =>
  adminSourceController.deleteSource(req, res, next)
);

/* ==========================================================================
   6. VERIFIED FACT-CHECKS MANAGEMENT
   ========================================================================== */
adminRouter.get('/fact-checks', (req, res, next) =>
  adminFactCheckController.listFactChecks(req, res, next)
);
adminRouter.get('/fact-checks/:id', (req, res, next) =>
  adminFactCheckController.getFactCheckById(req, res, next)
);
adminRouter.post('/fact-checks', (req, res, next) =>
  adminFactCheckController.createFactCheck(req, res, next)
);
adminRouter.put('/fact-checks/:id', (req, res, next) =>
  adminFactCheckController.updateFactCheck(req, res, next)
);
adminRouter.patch('/fact-checks/:id', (req, res, next) =>
  adminFactCheckController.updateFactCheck(req, res, next)
);
adminRouter.delete('/fact-checks/:id', (req, res, next) =>
  adminFactCheckController.deleteFactCheck(req, res, next)
);

/* ==========================================================================
   7. USER CONTENT FLAGS
   ========================================================================== */
adminRouter.get('/flags', (req, res, next) =>
  adminFlagController.listFlags(req, res, next)
);
adminRouter.get('/flags/:id', (req, res, next) =>
  adminFlagController.getFlagById(req, res, next)
);
adminRouter.patch('/flags/:id', (req, res, next) =>
  adminFlagController.updateFlagStatus(req, res, next)
);
adminRouter.put('/flags/:id', (req, res, next) =>
  adminFlagController.updateFlagStatus(req, res, next)
);

/* ==========================================================================
   8. SYSTEM & AUTOMATION ALERTS
   ========================================================================== */
adminRouter.get('/alerts', (req, res, next) =>
  adminAlertController.listAlerts(req, res, next)
);
adminRouter.get('/alerts/:id', (req, res, next) =>
  adminAlertController.getAlertById(req, res, next)
);
adminRouter.patch('/alerts/:id', (req, res, next) =>
  adminAlertController.updateAlertStatus(req, res, next)
);
adminRouter.put('/alerts/:id', (req, res, next) =>
  adminAlertController.updateAlertStatus(req, res, next)
);

/* ==========================================================================
   9. ANALYTICS & AI PERFORMANCE METRICS
   ========================================================================== */
adminRouter.get('/analytics/stream', (req, res) =>
  adminAnalyticsController.streamPlatformAnalytics(req, res)
);
adminRouter.get('/analytics', (req, res, next) =>
  adminAnalyticsController.getPlatformAnalytics(req, res, next)
);
adminRouter.get('/statistics', (req, res, next) =>
  adminAnalyticsController.getPlatformAnalytics(req, res, next)
);
adminRouter.get('/analytics/ai', (req, res, next) =>
  adminAnalyticsController.getAIPerformanceAnalytics(req, res, next)
);

/* ==========================================================================
   10. IMMUTABLE AUDIT LOGS
   ========================================================================== */
adminRouter.get('/audit', (req, res, next) =>
  adminAuditController.listAuditLogs(req, res, next)
);
adminRouter.get('/audit-logs', (req, res, next) =>
  adminAuditController.listAuditLogs(req, res, next)
);
adminRouter.get('/logs', (req, res, next) =>
  adminAuditController.listAuditLogs(req, res, next)
);
adminRouter.get('/audit/:id', (req, res, next) =>
  adminAuditController.getAuditLogById(req, res, next)
);
adminRouter.get('/audit-logs/:id', (req, res, next) =>
  adminAuditController.getAuditLogById(req, res, next)
);
adminRouter.get('/logs/:id', (req, res, next) =>
  adminAuditController.getAuditLogById(req, res, next)
);
