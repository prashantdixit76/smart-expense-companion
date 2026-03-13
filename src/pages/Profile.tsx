import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Mail, Phone, Shield, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const AVATAR_EMOJIS = [
  // Boys / Men
  '👦', '👨', '🧑', '👨‍💼', '👨‍💻', '🧔', '👨‍🎓', '🤴', '🦸‍♂️', '🧑‍🚀',
  '👨‍🍳', '👨‍🔧', '🧑‍💻', '👨‍🎤', '🕺', '🧑‍🎨',
  // Girls / Women
  '👧', '👩', '🧑‍🦰', '👩‍💼', '👩‍💻', '👩‍🎓', '👸', '🦸‍♀️', '🧕',
  '👩‍🍳', '👩‍🔧', '💃', '👩‍🎤', '🧑‍🦱', '👩‍🎨', '🧑‍⚕️',
  // Neutral / Fun
  '😎', '🤓', '🥷', '🧙', '🧛', '🦊', '🐱', '🐶', '🦁', '🐼',
  '🦄', '🐸', '🐵', '🦋', '🌸', '⭐',
];

const Profile = () => {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showFirstConfirm, setShowFirstConfirm] = useState(false);
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [avatar, setAvatar] = useState(() => localStorage.getItem('profile_avatar') || '😎');

  const handleSelectAvatar = (emoji: string) => {
    setAvatar(emoji);
    localStorage.setItem('profile_avatar', emoji);
    setShowEmojiPicker(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleResetMonth = () => {
    setShowFirstConfirm(true);
  };

  const handleFirstConfirm = () => {
    setShowFirstConfirm(false);
    setShowSecondConfirm(true);
  };

  const handleFinalReset = async () => {
    if (!user) return;
    setResetting(true);
    setShowSecondConfirm(false);

    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    const [expRes, incRes] = await Promise.all([
      supabase.from('expenses').delete().eq('user_id', user.id).gte('date', monthStart).lte('date', monthEnd),
      supabase.from('incomes').delete().eq('user_id', user.id).gte('date', monthStart).lte('date', monthEnd),
    ]);

    setResetting(false);

    if (expRes.error || incRes.error) {
      toast({ title: 'Error', description: 'Failed to reset current month data.', variant: 'destructive' });
    } else {
      toast({ title: 'Reset Complete', description: 'All expenses and incomes for the current month have been deleted.' });
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-foreground tracking-tight animate-fade-in">Profile</h1>

      <Card className="glass-card rounded-2xl overflow-hidden animate-fade-in">
        <div className="gradient-primary p-6 pb-12 relative">
          <div className="absolute inset-0 bg-black/5" />
        </div>
        <CardContent className="pt-0 -mt-8 relative z-10">
          <div className="flex items-end gap-4 mb-6">
            <button
              onClick={() => setShowEmojiPicker(true)}
              className="w-20 h-20 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center text-4xl hover:scale-105 transition-transform duration-200 cursor-pointer relative group"
            >
              {avatar}
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">✏️</span>
            </button>
            <div className="pb-1">
              <p className="font-extrabold text-foreground text-xl">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                <Shield className="w-3 h-3" /> {profile?.status}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{profile?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full gap-2 h-11 rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10"
        onClick={handleResetMonth}
        disabled={resetting}
      >
        <RotateCcw className="w-4 h-4" />
        {resetting ? 'Resetting...' : 'Reset Current Month'}
      </Button>

      <Button variant="destructive" className="w-full gap-2 h-11 rounded-xl shadow-md" onClick={handleLogout}>
        <LogOut className="w-4 h-4" />
        Logout
      </Button>

      {/* Emoji Avatar Picker */}
      <Dialog open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <DialogContent className="glass-card rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Choose Your Avatar</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-8 gap-2 py-3 max-h-[300px] overflow-y-auto">
            {AVATAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelectAvatar(emoji)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl hover:scale-110 transition-all duration-200 ${
                  avatar === emoji
                    ? 'bg-primary/20 ring-2 ring-primary scale-110'
                    : 'hover:bg-muted/80'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* First Confirmation */}
      <AlertDialog open={showFirstConfirm} onOpenChange={setShowFirstConfirm}>
        <AlertDialogContent className="glass-card rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your expenses and incomes for the current month. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              Yes, Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Second Confirmation */}
      <AlertDialog open={showSecondConfirm} onOpenChange={setShowSecondConfirm}>
        <AlertDialogContent className="glass-card rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you really sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will not be recoverable. All your expense and income records for this month will be permanently erased. There is no way to undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              Yes, Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
