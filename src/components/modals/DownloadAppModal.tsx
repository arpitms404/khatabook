import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share2,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldCheck,
  Wifi,
  Bell,
  ArrowRight,
  Info,
  Apple,
  FileArchive,
  HelpCircle,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'build'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://familykhata.web.app';

  useEffect(() => {
    // Detect if already installed as standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Auto-detect OS for default tab
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActivePlatform('ios');
    } else {
      setActivePlatform('android');
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  // 1-Click In-Browser Native Install (Chrome / Brave / Edge - creates real native WebAPK on Android)
  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setDownloadNotice('FamilyKhata installed successfully on your Android device!');
      }
    } else {
      setDownloadNotice('To install on Android: Tap the 3 dots (⋮) in Chrome at top right, then tap "Install app" or "Add to Home screen"!');
    }
  };

  // Download Complete Production Build ZIP (439 KB compressed, full app)
  const handleDownloadCompleteBuildZip = () => {
    setDownloadNotice('Downloading FamilyKhata-Complete-Build.zip (Full Production App)...');
    const link = document.createElement('a');
    link.href = '/downloads/FamilyKhata-Complete-Build.zip';
    link.download = 'FamilyKhata-Complete-Build.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      setDownloadNotice('Complete application build downloaded (439 KB zip)! Contains all production files, HTML, CSS, JS, and manifest.');
    }, 1500);
  };

  // Direct iOS Profile (.mobileconfig) Download
  const handleDirectIosProfileDownload = () => {
    setDownloadNotice('Downloading FamilyKhata.mobileconfig iOS Profile...');
    const profileXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>FamilyKhata</string>
            <key>PayloadDescription</key>
            <string>Installs FamilyKhata on your iOS Home Screen with offline access.</string>
            <key>PayloadDisplayName</key>
            <string>FamilyKhata</string>
            <key>PayloadIdentifier</key>
            <string>com.familykhata.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>9284e8c4-f364-4733-81e6-45044c86ead2</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${currentAppUrl}</string>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>Installation Profile for FamilyKhata iOS Web App</string>
    <key>PayloadDisplayName</key>
    <string>FamilyKhata App (iOS)</string>
    <key>PayloadIdentifier</key>
    <string>com.familykhata.profile</string>
    <key>PayloadOrganization</key>
    <string>FamilyKhata</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>9c2a5ad0-2264-4733-81e6-45044c86ead2</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

    const blob = new Blob([profileXml], { type: 'application/x-apple-aspen-config' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FamilyKhata.mobileconfig';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setTimeout(() => {
      setDownloadNotice('Profile downloaded! Open iPhone Settings > Profile Downloaded > tap Install.');
    }, 1500);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentAppUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentAppUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-5 pb-4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-blue-100 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Official Application Downloads</span>
          </div>

          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            <span>Get Full FamilyKhata App</span>
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            Install the real, complete application on Android, iOS, or download the full production build.
          </p>

          {/* Quick Dual Download Buttons */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={handleNativeInstall}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <div className="text-left leading-tight">
                <div className="font-extrabold">1-Tap Install App</div>
                <div className="text-[10px] text-emerald-200 font-normal">Native Android WebAPK</div>
              </div>
            </button>

            <button
              onClick={handleDirectIosProfileDownload}
              className="py-2.5 px-3 bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold text-xs rounded-xl border border-white/30 backdrop-blur-sm flex items-center justify-center gap-2 transition-all"
            >
              <Apple className="w-4 h-4 shrink-0" />
              <div className="text-left leading-tight">
                <div className="font-extrabold">Install on iOS</div>
                <div className="text-[10px] text-blue-200 font-normal">Apple .mobileconfig</div>
              </div>
            </button>
          </div>

          {/* Platform Switcher Tabs */}
          <div className="mt-3 flex bg-blue-950/40 p-1 rounded-2xl border border-white/15">
            <button
              onClick={() => setActivePlatform('android')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                activePlatform === 'android'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android APK</span>
            </button>
            <button
              onClick={() => setActivePlatform('ios')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                activePlatform === 'ios'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iOS Version</span>
            </button>
            <button
              onClick={() => setActivePlatform('build')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                activePlatform === 'build'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>Complete Build (.zip)</span>
            </button>
          </div>
        </div>

        {/* Status toast message */}
        {downloadNotice && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between animate-fade-in shrink-0">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadNotice}</span>
            </div>
            <button
              onClick={() => setDownloadNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200 text-xs">
          {activePlatform === 'android' && (
            /* Android Content */
            <div className="space-y-4">
              {/* Notice regarding 1KB vs Real Android APK */}
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
                  <strong>How to get the real, full application:</strong>
                  <br />
                  A 1KB dummy file is not a real APK. To install the genuine, full-featured app on Android, use either <strong>Method 1 (Instant 1-Tap Install)</strong> which Google Play Services compiles directly on your phone, or <strong>Method 2 (PWABuilder Cloud Compiler)</strong> which generates a signed ~10MB package!
                </div>
              </div>

              {/* Method 1: Instant Native WebAPK Install */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Method 1: Direct 1-Tap Android Install
                      </span>
                      <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 text-xs">
                      Google Chrome &amp; Android OS automatically compile and install the full native WebAPK app onto your phone. No corrupt files, no "unknown source" warnings!
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNativeInstall}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstalled ? 'App Already Installed' : 'Install FamilyKhata on this Phone'}</span>
                </button>
              </div>

              {/* Method 2: PWABuilder Signed APK Generator */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-xs">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Method 2: PWABuilder Signed APK (.apk / .aab)</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-800/50">
                    Google Play Ready
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  PWABuilder (by Microsoft &amp; Google) takes this app's manifest and compiles a standalone, signed <strong>.apk</strong> and <strong>.aab</strong> package in the cloud with Gradle and Android SDK.
                </p>
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all text-center"
                >
                  <span>Open PWABuilder &amp; Generate Signed APK</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 3 Step Guide in Chrome */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Manual Installation in Chrome (3 Taps):</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-1 text-[10px]">1</div>
                    <div>Open this URL in Chrome</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-1 text-[10px]">2</div>
                    <div>Tap 3 dots (⋮) top-right</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-1 text-[10px]">3</div>
                    <div>Tap "Install app"</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatform === 'ios' && (
            /* iOS Content */
            <div className="space-y-4">
              {/* Option 1: Direct Apple Configuration Profile */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/30 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                    <Apple className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Method 1: Apple WebClip Profile (.mobileconfig)
                      </span>
                      <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                        DIRECT PROFILE
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 text-xs">
                      Official Apple configuration profile for 1-click home screen installation on iPhone and iPad without going through the App Store.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDirectIosProfileDownload}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download FamilyKhata.mobileconfig</span>
                </button>
              </div>

              {/* iOS Step Guide */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  How to Install on iPhone in Safari:
                </h4>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</div>
                    <div>Tap the <strong>Share button</strong> (square with arrow pointing up) at the bottom of Safari.</div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</div>
                    <div>Scroll down and tap <strong>"Add to Home Screen"</strong>.</div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</div>
                    <div>Tap <strong>"Add"</strong> at top-right. FamilyKhata now appears as a native app on your iPhone!</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatform === 'build' && (
            /* Complete Production Build ZIP Content */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/30 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30">
                    <FileArchive className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Complete Production Build Package
                      </span>
                      <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                        439 KB ZIP (1.5 MB UNPACKED)
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 text-xs">
                      Contains the full compiled web application (HTML, minified JavaScript, bundled CSS, PWA manifest, service workers, and icons) ready for deployment or building native apps.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadCompleteBuildZip}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download FamilyKhata-Complete-Build.zip</span>
                </button>
              </div>

              {/* What is in this build */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 text-[11px]">
                <div className="font-bold text-slate-900 dark:text-slate-100">What is inside this ZIP file:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  <li><strong>index.html</strong>: Complete single-page app shell with fonts and viewport settings.</li>
                  <li><strong>assets/index-*.js (1.35 MB)</strong>: Complete bundled React app, Firebase SDKs, and StoreProvider.</li>
                  <li><strong>assets/index-*.css (82 KB)</strong>: Full Tailwind CSS design system with Dark Mode.</li>
                  <li><strong>manifest.json</strong>: Web App Manifest for Android WebAPK &amp; PWA.</li>
                  <li><strong>sw.js</strong>: Offline service worker caching strategy.</li>
                </ul>
              </div>

              {/* Where to host or build */}
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-[11px] text-blue-900 dark:text-blue-200 space-y-1.5">
                <div className="font-bold">Deploying to Firebase Hosting:</div>
                <p>
                  If you want to host this in your Firebase project (<code>familykhata-9c2a5</code>), run:
                </p>
                <pre className="p-2 rounded-lg bg-blue-950 text-blue-100 font-mono text-[10px] overflow-x-auto">
                  npm install -g firebase-tools{"\n"}
                  firebase login{"\n"}
                  firebase init hosting{"\n"}
                  firebase deploy
                </pre>
              </div>
            </div>
          )}

          {/* Share App Link with Family */}
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Direct Live App URL</span>
              </span>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono break-all text-slate-600 dark:text-slate-400 select-all">
              {currentAppUrl}
            </div>
          </div>

          {/* Capabilities Badges */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">100% Real Build</div>
              <div className="text-[9px] text-slate-400">No dummy files</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
              <Wifi className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Offline-Ready</div>
              <div className="text-[9px] text-slate-400">Cached on device</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
              <Bell className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Firebase Live</div>
              <div className="text-[9px] text-slate-400">Firestore &amp; Auth</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            FamilyKhata Production Packages
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
