import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ArrowDownCircle, HandCoins, BarChart3, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Home', url: '/', icon: LayoutDashboard },
  { title: 'Expense', url: '/add-expense', icon: PlusCircle },
  { title: 'Accounts', url: '/udhari', icon: HandCoins },
  { title: 'Income', url: '/add-income', icon: ArrowDownCircle },
  { title: 'Profile', url: '/profile', icon: UserCircle },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40">
      <div className="mx-3 mb-3 bg-card/80 backdrop-blur-xl border border-border/30 rounded-2xl shadow-[0_-4px_30px_-8px_rgba(0,0,0,0.12)] flex items-center justify-around px-2 py-1">
        {items.map((item) => {
          const isActive = item.url === '/' ? location.pathname === '/' : location.pathname.startsWith(item.url);
          return (
            <RouterNavLink
              key={item.url}
              to={item.url}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-xs transition-all duration-300',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300',
                isActive && 'bg-primary/10 scale-110'
              )}>
                <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              </div>
              <span className={cn('font-medium text-[10px]', isActive && 'font-bold')}>{item.title}</span>
            </RouterNavLink>
          );
        })}
      </div>
    </nav>
  );
}
