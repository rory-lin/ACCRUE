import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import TabBar from './TabBar';

export default function MobileLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-md mx-auto flex items-center justify-between h-12 px-4">
          <span className="text-lg font-bold text-primary">Accrue</span>
          <button onClick={() => navigate('/settings')} className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition">
            <Settings className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
      <div className="max-w-md mx-auto pb-20">
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
}
