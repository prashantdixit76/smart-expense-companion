import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, LogIn, Check, Crown, Loader2, Sparkles, LifeBuoy, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { InstallButton } from '@/components/InstallButton';

const plans = [
  { id: 'monthly', name: 'Monthly', price: 50, duration: '1 Month', perMonth: 50 },
  { id: 'quarterly', name: 'Quarterly', price: 100, duration: '3 Months', perMonth: 33, popular: true },
  { id: 'half-yearly', name: 'Half Yearly', price: 250, duration: '6 Months', perMonth: 42 },
  { id: 'yearly', name: 'Yearly', price: 450, duration: '12 Months', perMonth: 38, best: true },
];

const features = [
  'Unlimited Expense Tracking',
  'Income Management',
  'Accounts / Split Bills',
  'Reports & Analytics',
  'Multi-device Access',
];

function LoginTicketDialog() {
  const [open, setOpen] = useState(false);
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tSubject, setTSubject] = useState('');
  const [tMessage, setTMessage] = useState('');
  const [tSubmitting, setTSubmitting] = useState(false);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim() || !tEmail.trim() || !tSubject.trim() || !tMessage.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    setTSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        name: tName.trim(),
        email: tEmail.trim(),
        phone: tPhone.trim() || null,
        subject: tSubject.trim(),
        message: tMessage.trim(),
        source: 'login_page',
      } as any);
      if (error) throw error;
      toast.success('Ticket submitted! Admin will contact you soon.');
      setTName(''); setTEmail(''); setTPhone(''); setTSubject(''); setTMessage('');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit ticket');
    } finally {
      setTSubmitting(false);
    }
  };

  return (
    <div className="mt-8 text-center">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
            <LifeBuoy className="w-4 h-4" /> Need Help? Raise a Support Ticket
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <LifeBuoy className="w-4 h-4 text-primary" /> Raise a Support Ticket
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTicketSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
                <Input value={tName} onChange={e => setTName(e.target.value)} placeholder="Your name" maxLength={100} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
                <Input type="email" value={tEmail} onChange={e => setTEmail(e.target.value)} placeholder="Your email" maxLength={255} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
              <Input value={tPhone} onChange={e => setTPhone(e.target.value)} placeholder="Phone (optional)" maxLength={20} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject *</label>
              <Input value={tSubject} onChange={e => setTSubject(e.target.value)} placeholder="Brief subject" maxLength={200} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Describe your issue *</label>
              <Textarea value={tMessage} onChange={e => setTMessage(e.target.value)} placeholder="Explain your problem..." rows={3} maxLength={2000} />
            </div>
            <Button type="submit" disabled={tSubmitting} className="w-full gap-2">
              <Send className="w-4 h-4" />
              {tSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.success) {
      toast.success(result.message);
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  const handlePlanClick = (plan: typeof plans[0]) => {
    navigate(`/signup?plan=${plan.id}&price=${plan.price}&duration=${encodeURIComponent(plan.duration)}`);
  };

  return (
    <div className="min-h-screen gradient-bg-auth p-4 pb-12 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <InstallButton />
        <ThemeToggle />
      </div>

      <div className="max-w-md mx-auto pt-8 relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-lg shadow-primary/25 animate-float">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Smart Expense <span className="text-gradient">Tracker</span>
          </h1>
          <p className="text-muted-foreground mt-2">Track, split, and manage your money smartly</p>
        </div>

        <Card className="glass-card border-border/30 shadow-xl animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Welcome back ✨</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 bg-background/50" />
              </div>
              <Button type="submit" className="w-full gap-2 h-11 gradient-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                Sign In
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
            </p>
          </CardContent>
        </Card>

        {/* Pricing Section */}
        <div className="mt-12 animate-fade-in">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Our Plans
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Choose a plan that suits you</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {plans.map((plan, idx) => (
              <button
                key={plan.id}
                onClick={() => handlePlanClick(plan)}
                className={`relative rounded-2xl border p-4 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] group ${
                  plan.popular
                    ? 'border-primary/50 bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-border/40 bg-card/80 backdrop-blur-sm hover:border-primary/30'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {plan.popular && <Badge className="absolute -top-2.5 right-2 gradient-primary text-primary-foreground text-[10px] px-2.5 shadow-sm">Popular</Badge>}
                {plan.best && <Badge className="absolute -top-2.5 right-2 bg-warning text-warning-foreground text-[10px] px-2.5 shadow-sm">Best Value</Badge>}
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{plan.name}</p>
                <p className="text-2xl font-extrabold text-gradient mt-1">₹{plan.price}</p>
                <p className="text-xs text-muted-foreground">{plan.duration}</p>
                <p className="text-[10px] text-muted-foreground mt-1">~₹{plan.perMonth}/mo</p>
              </button>
            ))}
          </div>
          <div className="mt-5 glass-card rounded-2xl p-5">
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" /> All plans include:
            </p>
            <ul className="space-y-2.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <LoginTicketDialog />
      </div>
    </div>
  );
};

export default Login;
