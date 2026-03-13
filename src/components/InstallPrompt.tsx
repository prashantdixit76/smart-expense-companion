import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('pwa-install-dismissed') === 'true');

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!dismissed) setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[90] md:left-auto md:right-6 md:bottom-6 md:w-96 animate-in slide-in-from-bottom duration-500">
      {/* Glowing border effect */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary via-accent-foreground to-primary opacity-75 blur-sm animate-pulse" />
      
      <div className="relative bg-card border border-border shadow-2xl rounded-2xl p-5 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/30 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <button 
          onClick={handleDismiss} 
          className="absolute top-3 right-3 p-1 rounded-full bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative flex items-start gap-4">
          {/* Animated icon */}
          <div className="relative flex-shrink-0">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent-foreground shadow-lg">
              <Smartphone className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 rounded-full bg-card shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-foreground text-base">Install App</p>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                Free
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get the full native experience — faster loading, offline access & home screen shortcut!
            </p>
            
            {/* Feature highlights */}
            <div className="flex items-center gap-3 mt-3 mb-4">
              {['⚡ Fast', '📱 Native', '🔒 Secure'].map((feature) => (
                <span key={feature} className="text-[11px] text-muted-foreground font-medium">
                  {feature}
                </span>
              ))}
            </div>

            <Button 
              size="sm" 
              className="w-full gap-2 font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300" 
              onClick={handleInstall}
            >
              <Download className="w-4 h-4" />
              Install Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
