import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-warning text-warning-foreground text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top">
      <WifiOff className="w-4 h-4" />
      You are currently offline. Data will sync when internet is available.
    </div>
  );
};
