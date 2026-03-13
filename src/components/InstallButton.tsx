import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallButtonProps {
  className?: string;
  variant?: 'icon' | 'full';
}

export const InstallButton = ({ className, variant = 'icon' }: InstallButtonProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  // Hide only when offline
  if (!isOnline) return null;

  if (variant === 'full') {
    return (
      <Button size="sm" variant="outline" className={cn('gap-2', className)} onClick={handleInstall}>
        <Download className="w-4 h-4" />
        Install App
      </Button>
    );
  }

  return (
    <button
      onClick={handleInstall}
      className={cn(
        'p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors relative',
        className
      )}
      title="Install App"
    >
      <Download className="w-5 h-5" />
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
    </button>
  );
};
