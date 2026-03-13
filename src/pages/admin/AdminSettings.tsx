import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Database, Shield, Info } from 'lucide-react';

const AdminSettings = () => {
  const { users, expenses, incomes, adminUser } = useAppStore();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Info className="w-4 h-4 text-primary" />System Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">App Name</span><span className="font-medium">Smart Expense Tracker</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-medium">1.0.0</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Storage</span><span className="font-medium">Local Storage</span></div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Database className="w-4 h-4 text-primary" />Data Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Users</span><Badge variant="secondary">{users.length}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Expenses</span><Badge variant="secondary">{expenses.length}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Incomes</span><Badge variant="secondary">{incomes.length}</Badge></div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Current Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{adminUser?.fullName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{adminUser?.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><Badge className="capitalize">{adminUser?.role.replace('_', ' ')}</Badge></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
