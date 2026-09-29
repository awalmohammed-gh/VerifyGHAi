import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { AdminTopbar } from '../components/layout/AdminTopbar';
import { AdminSearchModal } from '../components/admin/AdminSearchModal';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const ALLOWED_ADMIN_EMAIL = 'dion12@gmail.com';

export const AdminLayout: React.FC = () => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  const isAllowedAdmin =
    isAuthenticated &&
    currentUser?.role === 'ADMIN' &&
    currentUser?.email?.toLowerCase().trim() === ALLOWED_ADMIN_EMAIL.toLowerCase();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 dark:bg-[#090D16] text-white">
        <LoadingSpinner size="lg" label="Initializing administrative security session..." />
      </div>
    );
  }

  if (!isAuthenticated || !isAllowedAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden w-full bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Fixed Admin Sidebar */}
      <div
        className={`hidden lg:block ${
          isCollapsed ? 'w-20' : 'w-64'
        } h-screen flex-shrink-0 transition-all duration-300 z-40`}
      >
        <AdminSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      </div>

      {/* Mobile Admin Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              onOpenSearch={() => {
                setSidebarOpen(false);
                setIsSearchOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Scrollable Content Column containing Sticky AdminTopbar */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0 w-full transition-all duration-300">
        <AdminTopbar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 w-full flex flex-col justify-start items-start text-left min-w-0">
          <div className="w-full flex-1 p-4 sm:p-6 lg:p-8 flex flex-col justify-start items-start text-left min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Admin Search Modal */}
      <AdminSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
