import React, { createContext, useContext, useEffect, useState } from 'react';
import { swManager, ServiceWorkerStatus } from '../services/serviceWorkerRegistration';

interface OfflineContextType {
  isOnline: boolean;
  isCached: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  updateApp: () => void;
  cachedScansCount: number;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [swStatus, setSwStatus] = useState<ServiceWorkerStatus>(swManager.getStatus());
  const [cachedScansCount, setCachedScansCount] = useState<number>(0);

  useEffect(() => {
    // Register Workbox service worker on mount
    swManager.register();

    const unsubscribe = swManager.subscribe((status) => {
      setSwStatus(status);
    });

    // Compute cached scans count
    const updateScansCount = () => {
      try {
        const stored = localStorage.getItem('verifai_recent_scans');
        if (stored) {
          const parsed = JSON.parse(stored);
          setCachedScansCount(Array.isArray(parsed) ? parsed.length : 0);
        } else {
          setCachedScansCount(0);
        }
      } catch (e) {
        setCachedScansCount(0);
      }
    };

    updateScansCount();
    window.addEventListener('storage', updateScansCount);
    window.addEventListener('verifai-scans-updated', updateScansCount);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', updateScansCount);
      window.removeEventListener('verifai-scans-updated', updateScansCount);
    };
  }, []);

  const updateApp = () => {
    swManager.updateAndReload();
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline: swStatus.isOnline,
        isCached: swStatus.isCached,
        isRegistered: swStatus.isRegistered,
        isUpdateAvailable: swStatus.isUpdateAvailable,
        updateApp,
        cachedScansCount,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
