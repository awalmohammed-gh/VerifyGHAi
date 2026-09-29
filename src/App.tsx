import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoadingProvider } from './context/LoadingContext';
import { NotificationProvider } from './context/NotificationContext';
import { OfflineProvider } from './context/OfflineContext';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LoadingProvider>
          <AuthProvider>
            <NotificationProvider>
              <OfflineProvider>
                <BrowserRouter>
                  <OfflineIndicator />
                  <AppRoutes />
                </BrowserRouter>
              </OfflineProvider>
            </NotificationProvider>
          </AuthProvider>
        </LoadingProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
