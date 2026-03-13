import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CATEGORY_ICONS } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, CalendarDays, Phone, MessageCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const CHART_COLORS = [
  'hsl(162,63%,41%)', 'hsl(200,70%,50%)', 'hsl(38,92%,50%)',
  'hsl(280,60%,55%)', 'hsl(0,72%,51%)', 'hsl(45,90%,55%)',
  'hsl(190,80%,42%)', 'hsl(330,65%,50%)', 'hsl(100,55%,45%)',
];

const Dashboard = () => {
  const { expenses, incomes, currentUser } = useAppStore();

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const monthlyExpenses = expenses.filter((e) => {
      try { return isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd }); }
      catch { return false; }
    });
    const monthSpending = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Monthly chart (last 6 months)
    const monthlyData: { month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      const mExpenses = expenses.filter((e) => {
        try { return isWithinInterval(parseISO(e.date), { start: mStart, end: mEnd }); }
        catch { return false; }
      }).reduce((s, e) => s + e.amount, 0);
      const mIncome = incomes.filter((inc) => {
        try { return isWithinInterval(parseISO(inc.date), { start: mStart, end: mEnd }); }
        catch { return false; }
      }).reduce((s, inc) => s + inc.amount, 0);
      monthlyData.push({ month: format(d, 'MMM'), income: mIncome, expenses: mExpenses });
    }

    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses, monthSpending, categoryData, monthlyData };
  }, [expenses, incomes]);

  // Settlements
  const settlements = useMemo(() => {
    const balances: Record<string, number> = {};
    expenses.filter((e) => e.type === 'group' && e.splitWith.length > 0).forEach((e) => {
      const total = e.splitWith.length + 1;
      const share = e.amount / total;
      e.splitWith.forEach((userId) => {
        if (userId !== e.paidBy) {
          // userId owes paidBy
          const key = `${userId}->${e.paidBy}`;
          balances[key] = (balances[key] || 0) + share;
        }
      });
    });
    return balances;
  }, [expenses]);

  const youOwe = useMemo(() => {
    let total = 0;
    Object.entries(settlements).forEach(([key, amount]) => {
      const [from] = key.split('->');
      if (from === currentUser?.id) total += amount;
    });
    return total;
  }, [settlements, currentUser]);

  const youAreOwed = useMemo(() => {
    let total = 0;
    Object.entries(settlements).forEach(([key, amount]) => {
      const to = key.split('->')[1];
      if (to === currentUser?.id) total += amount;
    });
    return total;
  }, [settlements, currentUser]);

  const statCards = [
    { label: 'Total Balance', value: stats.balance, icon: Wallet, color: 'text-primary' },
    { label: 'Total Income', value: stats.totalIncome, icon: TrendingUp, color: 'text-income' },
    { label: 'Total Expenses', value: stats.totalExpenses, icon: TrendingDown, color: 'text-expense' },
    { label: 'This Month', value: stats.monthSpending, icon: CalendarDays, color: 'text-owe' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome, {currentUser?.fullName?.split(' ')[0] || 'User'}</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's your financial overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
            </div>
            <p className={`text-xl md:text-2xl font-bold ${card.color}`}>
              ₹{card.value.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* Owe Cards */}
      {(youOwe > 0 || youAreOwed > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card border-l-4 border-l-expense">
            <p className="text-xs text-muted-foreground font-medium mb-1">You Owe</p>
            <p className="text-lg font-bold text-expense">₹{youOwe.toLocaleString('en-IN')}</p>
          </div>
          <div className="stat-card border-l-4 border-l-income">
            <p className="text-xs text-muted-foreground font-medium mb-1">You Are Owed</p>
            <p className="text-lg font-bold text-income">₹{youAreOwed.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyData.some((d) => d.income > 0 || d.expenses > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="income" fill="hsl(142,70%,45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet. Add expenses or income to see charts.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${CATEGORY_ICONS[name] || '📦'} ${(percent * 100).toFixed(0)}%`}>
                    {stats.categoryData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No expenses yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No expenses yet. Tap "Add Expense" to get started.</p>
          ) : (
            <div className="space-y-2">
              {expenses.slice(-5).reverse().map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{CATEGORY_ICONS[e.category] || '📦'}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.description || e.category}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(e.date), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-expense">-₹{e.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
