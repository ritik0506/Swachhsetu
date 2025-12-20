// PWA utility functions for SwachhSetu

/**
 * Register service worker
 */
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 New service worker installing...');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('⚡ New content available! Please refresh.');
                // Notify user about update
                if (window.confirm('New version available! Refresh to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed');
        window.location.reload();
      });
    });
  } else {
    console.warn('⚠️ Service Workers not supported');
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('⚠️ Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Show local notification
 */
export const showNotification = (title, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const defaultOptions = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    ...options
  };

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, defaultOptions);
    });
  } else {
    new Notification(title, defaultOptions);
  }
};

/**
 * Check if app is installed (standalone mode)
 */
export const isInstalled = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

/**
 * Prompt for app installation
 */
let deferredPrompt = null;

export const setupInstallPrompt = (onPromptReady) => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📲 Install prompt ready');
    if (onPromptReady) {
      onPromptReady(true);
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ App installed successfully');
    deferredPrompt = null;
    if (onPromptReady) {
      onPromptReady(false);
    }
  });
};

export const promptInstall = async () => {
  if (!deferredPrompt) {
    console.warn('⚠️ Install prompt not available');
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`Install prompt outcome: ${outcome}`);
  
  deferredPrompt = null;
  return outcome === 'accepted';
};

/**
 * Check if device is online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Setup online/offline event listeners
 */
export const setupNetworkListeners = (onOnline, onOffline) => {
  window.addEventListener('online', () => {
    console.log('🌐 Back online');
    if (onOnline) onOnline();
  });

  window.addEventListener('offline', () => {
    console.log('📵 Offline mode');
    if (onOffline) onOffline();
  });
};

/**
 * Save data for offline use
 */
export const saveOfflineData = async (key, data) => {
  try {
    localStorage.setItem(`offline_${key}`, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save offline data:', error);
    return false;
  }
};

/**
 * Get offline data
 */
export const getOfflineData = (key) => {
  try {
    const data = localStorage.getItem(`offline_${key}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get offline data:', error);
    return null;
  }
};

/**
 * Clear offline data
 */
export const clearOfflineData = (key) => {
  try {
    localStorage.removeItem(`offline_${key}`);
    return true;
  } catch (error) {
    console.error('Failed to clear offline data:', error);
    return false;
  }
};

/**
 * Background sync for offline reports
 */
export const queueOfflineReport = async (reportData) => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-reports');
      
      // Save report to IndexedDB or cache
      await saveOfflineData(`report_${Date.now()}`, reportData);
      
      console.log('📤 Report queued for background sync');
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }
  return false;
};

/**
 * Check if browser supports PWA features
 */
export const checkPWASupport = () => {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    notification: 'Notification' in window,
    pushManager: 'PushManager' in window,
    backgroundSync: 'serviceWorker' in navigator && 'SyncManager' in window,
    periodicSync: 'serviceWorker' in navigator && 'PeriodicSyncManager' in window,
    installPrompt: true // Will be set dynamically
  };
};

/**
 * Get app info
 */
export const getAppInfo = () => {
  return {
    isInstalled: isInstalled(),
    isOnline: isOnline(),
    support: checkPWASupport()
  };
};
