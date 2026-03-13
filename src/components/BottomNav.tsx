import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ArrowDownCircle, HandCoins, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Home', url: '/', icon: LayoutDashboard },
  { title: 'Expense', url: '/add-expense', icon: PlusCircle },
  { title: 'Udhari', url: '/udhari', icon: HandCoins },
  { title: 'Income', url: '/add-income', icon: ArrowDownCircle },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 flex md:hidden z-40">
      {items.map((item) => {
        const isActive = item.url === '/' ? location.pathname === '/' : location.pathname.startsWith(item.url);
        return (
          <RouterNavLink
            key={item.url}
            to={item.url}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
            <span className="font-medium">{item.title}</span>
          </RouterNavLink>
        );
      })}
    </nav>
  );
}
