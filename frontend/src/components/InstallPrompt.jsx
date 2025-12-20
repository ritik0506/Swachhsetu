import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { setupInstallPrompt, promptInstall, isInstalled } from '../utils/pwa';
import '../styles/InstallPrompt.css';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    setIsAppInstalled(isInstalled());

    // Setup install prompt
    setupInstallPrompt((canInstall) => {
      if (canInstall && !isAppInstalled) {
        // Show prompt after 30 seconds if not dismissed recently
        const dismissed = localStorage.getItem('installPromptDismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const dayInMs = 24 * 60 * 60 * 1000;

        if (Date.now() - dismissedTime > dayInMs) {
          setTimeout(() => setShowPrompt(true), 30000);
        }
      }
    });
  }, [isAppInstalled]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setShowPrompt(false);
      setIsAppInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  if (isAppInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt">
        <button className="install-prompt-close" onClick={handleDismiss} aria-label="Close">
          <X size={20} />
        </button>
        
        <div className="install-prompt-icon">
          <Smartphone size={48} />
        </div>

        <h3 className="install-prompt-title">Install SwachhSetu App</h3>
        <p className="install-prompt-description">
          Get the best experience with our mobile app. Install now for:
        </p>

        <ul className="install-prompt-features">
          <li>📵 Offline report submission</li>
          <li>🔔 Push notifications for updates</li>
          <li>⚡ Faster loading times</li>
          <li>📱 Home screen access</li>
        </ul>

        <div className="install-prompt-actions">
          <button className="install-button" onClick={handleInstall}>
            <Download size={20} />
            Install App
          </button>
          <button className="dismiss-button" onClick={handleDismiss}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
