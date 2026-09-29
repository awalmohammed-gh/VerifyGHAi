import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { UserDashboardLayout } from '../layouts/UserDashboardLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Route Guards
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';

// Public Pages (With Global Navbar & Footer)
import { LandingPage } from '../pages/public/LandingPage';
import { AboutPage } from '../pages/public/AboutPage';
import { HowItWorksPage } from '../pages/public/HowItWorksPage';
import { NotFoundPage } from '../pages/public/NotFoundPage';

// Isolated Authentication Pages (Full-Page, NO Global Navbar or Footer)
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { AdminLoginPage } from '../pages/auth/AdminLoginPage';
import { AdminSetupPage } from '../pages/auth/AdminSetupPage';

// User Application Pages (Standard User Dashboard)
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { VerifyContentPage } from '../pages/dashboard/VerifyContentPage';
import { VerificationResultPage } from '../pages/dashboard/VerificationResultPage';
import { HistoryPage } from '../pages/dashboard/HistoryPage';
import { HistoryDetailPage } from '../pages/dashboard/HistoryDetailPage';
import { ReportsPage } from '../pages/dashboard/ReportsPage';
import { ReportDetailPage } from '../pages/dashboard/ReportDetailPage';
import { StatisticsPage } from '../pages/dashboard/StatisticsPage';
import { NotificationsPage } from '../pages/dashboard/NotificationsPage';
import { ProfilePage } from '../pages/dashboard/ProfilePage';
import { SettingsPage } from '../pages/dashboard/SettingsPage';
import { HelpFaqPage } from '../pages/dashboard/HelpFaqPage';

// Admin Application Pages (Dedicated Admin Portal)
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminUserDetailPage } from '../pages/admin/AdminUserDetailPage';
import { AdminSubmissionsPage } from '../pages/admin/AdminSubmissionsPage';
import { AdminSubmissionDetailPage } from '../pages/admin/AdminSubmissionDetailPage';
import { AdminFlaggedPage } from '../pages/admin/AdminFlaggedPage';
import { AdminReviewsPage } from '../pages/admin/AdminReviewsPage';
import { AdminSourcesPage } from '../pages/admin/AdminSourcesPage';
import { AdminSourceDetailPage } from '../pages/admin/AdminSourceDetailPage';
import { AdminFactChecksPage } from '../pages/admin/AdminFactChecksPage';
import { AdminFactCheckDetailPage } from '../pages/admin/AdminFactCheckDetailPage';
import { AdminAlertsPage } from '../pages/admin/AdminAlertsPage';
import { AdminAlertDetailPage } from '../pages/admin/AdminAlertDetailPage';
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage';
import { AdminAIPerformancePage } from '../pages/admin/AdminAIPerformancePage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';
import { AdminReviewDetailPage } from '../pages/admin/AdminReviewDetailPage';
import { AdminFlaggedDetailPage } from '../pages/admin/AdminFlaggedDetailPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Content Routes (Rendered with PublicNavbar & PublicFooter) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
      </Route>

      {/* 2. Isolated Full-Page Authentication Routes (NO Global Navbar / Footer) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/setup" element={<AdminSetupPage />} />
      </Route>

      {/* 3. Protected User Dashboard Routes */}
      <Route
        element={
          <ProtectedRoute>
            <UserDashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/verify" element={<VerifyContentPage />} />
        <Route path="/verify/result" element={<VerificationResultPage />} />
        <Route path="/verify/result/:id" element={<VerificationResultPage />} />
        <Route path="/dashboard/verify" element={<VerifyContentPage />} />
        <Route path="/dashboard/verify/result" element={<VerificationResultPage />} />
        <Route path="/dashboard/verify/result/:id" element={<VerificationResultPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:id" element={<HistoryDetailPage />} />
        <Route path="/dashboard/history" element={<HistoryPage />} />
        <Route path="/dashboard/history/:id" element={<HistoryDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
        <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
        <Route path="/profile" element={<Navigate to="/dashboard/settings?tab=profile" replace />} />
        <Route path="/notifications" element={<Navigate to="/dashboard/settings?tab=notifications" replace />} />
        <Route path="/help" element={<Navigate to="/dashboard/settings?tab=help" replace />} />
      </Route>

      {/* 4. Strictly Protected Admin Routes (Dedicated Admin Route Structure) */}
      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
        <Route path="/admin/verifications" element={<AdminSubmissionsPage />} />
        <Route path="/admin/verifications/:id" element={<AdminSubmissionDetailPage />} />
        <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
        <Route path="/admin/submissions/:id" element={<AdminSubmissionDetailPage />} />
        <Route path="/admin/flags" element={<AdminFlaggedPage />} />
        <Route path="/admin/flags/:id" element={<AdminFlaggedDetailPage />} />
        <Route path="/admin/flagged" element={<AdminFlaggedPage />} />
        <Route path="/admin/flagged/:id" element={<AdminFlaggedDetailPage />} />
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        <Route path="/admin/reviews/:id" element={<AdminReviewDetailPage />} />
        <Route path="/admin/sources" element={<AdminSourcesPage />} />
        <Route path="/admin/sources/:id" element={<AdminSourceDetailPage />} />
        <Route path="/admin/fact-checks" element={<AdminFactChecksPage />} />
        <Route path="/admin/fact-checks/:id" element={<AdminFactCheckDetailPage />} />
        <Route path="/admin/alerts" element={<AdminAlertsPage />} />
        <Route path="/admin/alerts/:id" element={<AdminAlertDetailPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/ai-performance" element={<AdminAIPerformancePage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* 5. 404 Fallback Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
