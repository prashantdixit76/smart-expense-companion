import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, LogIn, Phone, MessageCircle, Check, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';

const plans = [
  { id: 'monthly', name: 'Monthly', price: 50, duration: '1 Month', perMonth: 50 },
  { id: 'quarterly', name: 'Quarterly', price: 100, duration: '3 Months', perMonth: 33, popular: true },
  { id: 'half-yearly', name: 'Half Yearly', price: 250, duration: '6 Months', perMonth: 42 },
  { id: 'yearly', name: 'Yearly', price: 450, duration: '12 Months', perMonth: 38, best: true },
];

const features = [
  'Unlimited Expense Tracking',
  'Income Management',
  'Udhari / Split Bills',
  'Reports & Analytics',
  'Multi-device Access',
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAppStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(email, password);
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
    <div className="min-h-screen bg-background p-4 pb-12 relative">
      <ThemeToggle className="absolute top-4 right-4" />

      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Wallet className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Smart Expense Tracker</h1>
          <p className="text-muted-foreground mt-1">Track, split, and manage your money</p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Pricing Section */}
        <div className="mt-10">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-primary" /> Our Plans
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Choose a plan that suits you</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handlePlanClick(plan)}
                className={`relative rounded-xl border p-4 text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                  plan.popular
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border/50 bg-card'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2.5 right-2 bg-primary text-primary-foreground text-[10px] px-2">
                    Popular
                  </Badge>
                )}
                {plan.best && (
                  <Badge className="absolute -top-2.5 right-2 bg-accent text-accent-foreground text-[10px] px-2">
                    Best Value
                  </Badge>
                )}
                <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                <p className="text-2xl font-bold text-primary mt-1">₹{plan.price}</p>
                <p className="text-xs text-muted-foreground">{plan.duration}</p>
                <p className="text-[10px] text-muted-foreground mt-1">~₹{plan.perMonth}/mo</p>
              </button>
            ))}
          </div>

          {/* Features */}
          <div className="mt-5 bg-card border border-border/50 rounded-xl p-4">
            <p className="text-sm font-semibold text-foreground mb-3">All plans include:</p>
            <ul className="space-y-2">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Need help? Contact Support</p>
          <div className="flex items-center justify-center gap-4">
            <a href="tel:+917668974586" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <Phone className="w-4 h-4" /> +91 7668974586
            </a>
            <a href="https://wa.me/917668974586" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;