import { useState, useEffect } from 'react';
import { Download, MonitorSmartphone, PlusSquare, Share } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showGuide, setShowGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    setIsIos(ios);

    const syncStandaloneState = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
      setIsStandalone(standalone);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      toast.success('App installed successfully');
    };

    syncStandaloneState();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!isOnline) {
      toast.error('You are offline. Connect to internet to install app.');
      return;
    }

    if (isStandalone) {
      toast.message('App is already installed on this device.');
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'dismissed') setShowGuide(true);
      setDeferredPrompt(null);
      return;
    }

    setShowGuide(true);
  };

  if (!isOnline) return null;

  const buttonContent = (
    <>
      <Download className={variant === 'full' ? 'w-4 h-4' : 'w-5 h-5'} />
      {variant === 'full' ? 'Install App' : null}
    </>
  );

  return (
    <>
      {variant === 'full' ? (
        <Button size="sm" variant="outline" className={cn('gap-2', className)} onClick={handleInstall}>
          {buttonContent}
        </Button>
      ) : (
        <button
          onClick={handleInstall}
          className={cn(
            'p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors relative',
            className
          )}
          title="Install App"
          aria-label="Install App"
        >
          {buttonContent}
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
        </button>
      )}

      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <MonitorSmartphone className="w-5 h-5 text-primary" />
              Install Smart Expense Tracker
            </DialogTitle>
            <DialogDescription>
              {isIos
                ? 'iPhone/iPad par install ke liye in steps ko follow karein:'
                : 'Browser menu se app install karne ke steps:'}
            </DialogDescription>
          </DialogHeader>

          {isIos ? (
            <ol className="space-y-3 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <Share className="w-4 h-4 text-primary" /> Safari me niche <strong>Share</strong> button dabayein
              </li>
              <li className="flex items-center gap-2">
                <PlusSquare className="w-4 h-4 text-primary" /> <strong>Add to Home Screen</strong> select karein
              </li>
              <li>Confirm karke <strong>Add</strong> karein</li>
            </ol>
          ) : (
            <ol className="space-y-2 text-sm text-foreground list-decimal pl-5">
              <li>Browser ke top-right menu (⋮ / ⋯) par click karein</li>
              <li><strong>Install App</strong> ya <strong>Add to Home screen</strong> option choose karein</li>
              <li>Confirm karke install complete karein</li>
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
