import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react"; 

const STORAGE_KEY = "pwa-install-prompt-dismissed";
const DISMISS_DURATION_DAYS = 7; // Don't show again for 7 days after dismissal

export function AndroidInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already dismissed recently
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const dismissedDate = new Date(parseInt(dismissedAt));
      const daysSinceDismissal = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < DISMISS_DURATION_DAYS) {
        return; // Don't show prompt if dismissed recently
      }
    }

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Small delay before showing to not overwhelm the user
      setTimeout(() => {
        setIsVisible(true);
      }, 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-300"
        onClick={handleDismiss}
      />
      
      {/* Modal Alert */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm p-6 bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" dir="rtl">
        <button 
          onClick={handleDismiss} 
          className="absolute top-3 left-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          {/* App Icon */}
          <div className="h-16 w-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone size={32} className="text-white" />
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h3 className="font-bold text-xl text-gray-900">התקן את האפליקציה</h3>
            <p className="text-gray-500 text-sm">
              הוסף את BARBERSHOP למסך הבית שלך לגישה מהירה וחוויה טובה יותר
            </p>
          </div>

          {/* Install Button */}
          <button 
            onClick={handleInstallClick}
            className="w-full bg-black text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all"
          >
            <Download size={20} />
            התקן עכשיו
          </button>

          {/* Dismiss Link */}
          <button 
            onClick={handleDismiss}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            לא עכשיו
          </button>
        </div>
      </div>
    </>
  );
}