import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const ALLOWED_ADMIN_EMAIL = 'dion12@gmail.com';

export const AdminRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const isAllowedAdmin =
    isAuthenticated &&
    currentUser?.role === 'ADMIN' &&
    currentUser?.email?.toLowerCase().trim() === ALLOWED_ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAllowedAdmin) {
      toast.error(
        'Administrative Access Denied',
        'Administrative dashboard access is strictly restricted to authorized personnel (dion12@gmail.com).'
      );
    }
  }, [isLoading, isAuthenticated, isAllowedAdmin, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <LoadingSpinner size="lg" label="Validating administrative clearance..." />
      </div>
    );
  }

  // 1. Unauthenticated or non-whitelisted admin -> Redirect immediately to /admin/login
  if (!isAuthenticated || !isAllowedAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // 2. Authenticated authorized ADMIN -> Grant full access to admin route tree
  return children ? <>{children}</> : <Outlet />;
};

