import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, WifiOff } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallPromptProps {
  onOpenDownloadModal?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onOpenDownloadModal }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {/* Offline Toast */}
      {!isOnline && (
        <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xl animate-bounce">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode · Using cached family data</span>
        </div>
      )}

      {/* Install Button for Android/Desktop */}
      {!isInstalled && deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          title="Install FamilyKhata on your home screen"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      )}

      {/* iOS Safari Fallback Trigger */}
      {!isInstalled && isIOS && !deferredPrompt && (
        <>
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Install on iOS</span>
          </button>

          {showIOSGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold">Install FamilyKhata on iPhone</h3>
                  <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <p>1. Tap the <strong>Share</strong> button (box with upward arrow) at the bottom of Safari.</p>
                  <p>2. Scroll down and tap <strong>"Add to Home Screen"</strong>.</p>
                  <p>3. Tap <strong>"Add"</strong> in the top right to install FamilyKhata as a full-screen app.</p>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-4 w-full py-2 bg-blue-700 text-white font-semibold text-xs rounded-xl hover:bg-blue-800 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
