import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, PlusCircle, Wallet, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/calendar', icon: Calendar, label: '日历' },
  { path: '/record', icon: PlusCircle, label: '记账', isCenter: true },
  { path: '/accounts', icon: Wallet, label: '账户' },
  { path: '/statistics', icon: BarChart3, label: '统计' },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
      <div className="max-w-md mx-auto flex items-end justify-around h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          if (tab.isCenter) {
            return (
              <button key={tab.path} onClick={() => navigate(tab.path)} className="flex flex-col items-center -mt-5">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                  <tab.icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] mt-0.5 text-primary font-medium">{tab.label}</span>
              </button>
            );
          }
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)} className="flex flex-col items-center justify-center w-16 h-full active:scale-95 transition-transform">
              <tab.icon className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-gray-400')} />
              <span className={cn('text-[10px] mt-0.5', isActive ? 'text-primary font-medium' : 'text-gray-400')}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
