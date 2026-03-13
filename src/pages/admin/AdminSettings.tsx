import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Shield, Info } from 'lucide-react';

const AdminSettings = () => {
  const { profile, role } = useAuth();
  const [counts, setCounts] = useState({ users: 0, expenses: 0, incomes: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [u, e, i] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('expenses').select('id', { count: 'exact', head: true }),
        supabase.from('incomes').select('id', { count: 'exact', head: true }),
      ]);
      setCounts({ users: u.count || 0, expenses: e.count || 0, incomes: i.count || 0 });
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Info className="w-4 h-4 text-primary" />System Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">App Name</span><span className="font-medium">Smart Expense Tracker</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-medium">2.0.0</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Storage</span><span className="font-medium">Lovable Cloud</span></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Database className="w-4 h-4 text-primary" />Data Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Users</span><Badge variant="secondary">{counts.users}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Expenses</span><Badge variant="secondary">{counts.expenses}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Incomes</span><Badge variant="secondary">{counts.incomes}</Badge></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Current Admin</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{profile?.full_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{profile?.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><Badge className="capitalize">{role.replace('_', ' ')}</Badge></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
