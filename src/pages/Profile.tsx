import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, User, Mail, Phone, Shield } from 'lucide-react';

const Profile = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-foreground tracking-tight animate-fade-in">Profile</h1>

      <Card className="glass-card rounded-2xl overflow-hidden animate-fade-in">
        {/* Profile Header with Gradient */}
        <div className="gradient-primary p-6 pb-12 relative">
          <div className="absolute inset-0 bg-black/5" />
        </div>
        <CardContent className="pt-0 -mt-8 relative z-10">
          <div className="flex items-end gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center">
              <User className="w-9 h-9 text-primary" />
            </div>
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

      <Button variant="destructive" className="w-full gap-2 h-11 rounded-xl shadow-md" onClick={handleLogout}>
        <LogOut className="w-4 h-4" />
        Logout
      </Button>
    </div>
  );
};

export default Profile;
