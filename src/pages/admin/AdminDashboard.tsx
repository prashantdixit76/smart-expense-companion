import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, DollarSign, UsersRound } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, parseISO, subDays, isAfter } from 'date-fns';

const AdminDashboard = () => {
  const { users, expenses } = useAppStore();

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'approved').length;
    const pendingApprovals = users.filter(u => u.status === 'pending').length;
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const groupExpenses = expenses.filter(e => e.type === 'group');
    const uniqueGroups = new Set(groupExpenses.map(e => e.splitWith.sort().join(','))).size;

    // User growth (last 30 days)
    const userGrowth: { date: string; users: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = users.filter(u => {
        try { return !isAfter(parseISO(u.createdAt), day); } catch { return true; }
      }).length;
      userGrowth.push({ date: format(day, 'MMM dd'), users: count });
    }

    // Expense activity (last 7 days)
    const expenseActivity: { date: string; amount: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayExpenses = expenses.filter(e => e.date === dayStr);
      expenseActivity.push({
        date: format(day, 'EEE'),
        amount: dayExpenses.reduce((s, e) => s + e.amount, 0),
        count: dayExpenses.length,
      });
    }

    return { totalUsers, activeUsers, pendingApprovals, totalExpenses, uniqueGroups, userGrowth, expenseActivity };
  }, [users, expenses]);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Active Users', value: stats.activeUsers, icon: UserCheck, color: 'text-income' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, color: 'text-owe' },
    { label: 'Total Expenses', value: `₹${stats.totalExpenses.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-expense' },
    { label: 'Groups Created', value: stats.uniqueGroups, icon: UsersRound, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
            </div>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">User Growth (30 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.userGrowth}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="hsl(162,63%,41%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">Expense Activity (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.expenseActivity}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="amount" fill="hsl(200,70%,50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
