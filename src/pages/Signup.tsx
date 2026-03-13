import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { InstallButton } from '@/components/InstallButton';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan');
  const selectedPrice = searchParams.get('price');
  const selectedDuration = searchParams.get('duration');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    const result = await signUp(form.email, form.password, {
      full_name: form.fullName,
      phone: form.phone,
      ...(selectedPlan ? { selected_plan: selectedPlan, plan_price: selectedPrice || '', plan_duration: selectedDuration || '' } : {}),
    });
    setSubmitting(false);
    if (result.success) {
      toast.success(result.message);
      navigate('/login');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg-auth p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <InstallButton />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-lg shadow-primary/25 animate-float">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Create <span className="text-gradient">Account</span>
          </h1>
          <p className="text-muted-foreground mt-2">Join Smart Expense Tracker</p>
        </div>

        <Card className="glass-card border-border/30 shadow-xl animate-fade-in">
          {selectedPlan && (
            <div className="gradient-primary px-6 py-3.5 flex items-center justify-between rounded-t-xl">
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Plan: <span className="capitalize">{selectedPlan}</span></p>
                <p className="text-xs text-primary-foreground/80">{selectedDuration}</p>
              </div>
              <Badge className="bg-white/20 text-primary-foreground border-0 text-sm font-bold">₹{selectedPrice}</Badge>
            </div>
          )}
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign Up ✨</CardTitle>
            <CardDescription>Fill in your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} required className="h-11 bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required className="h-11 bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+1 234 567 890" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} required className="h-11 bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={(e) => handleChange('password', e.target.value)} required className="h-11 bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} required className="h-11 bg-background/50" />
              </div>
              <Button type="submit" className="w-full gap-2 h-11 gradient-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create Account
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
