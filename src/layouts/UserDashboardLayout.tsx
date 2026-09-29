import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const UserDashboardLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
        <LoadingSpinner size="lg" label="Loading your verification dashboard..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden w-full bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 print:bg-white print:h-auto transition-colors duration-200">
      {/* Desktop Fixed Left Sidebar (>=1024px) */}
      <div className="hidden lg:block w-64 h-screen flex-shrink-0 no-print z-40">
        <Sidebar />
      </div>

      {/* Mobile & Tablet Drawer Overlay (<1024px) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs lg:hidden no-print"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 shadow-2xl h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Scrollable Main Content Column containing Sticky Topbar */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto print:h-auto print:overflow-visible min-w-0 w-full">
        <Topbar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 w-full flex flex-col justify-start items-start text-left min-w-0 print:p-0 print:m-0 print:block">
          <div className="w-full flex-1 p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 flex flex-col justify-start items-start text-left min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export const DashboardLayout = UserDashboardLayout;
