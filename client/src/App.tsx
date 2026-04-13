import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import RecordPage from '@/pages/RecordPage';
import CalendarPage from '@/pages/CalendarPage';
import AccountsPage from '@/pages/AccountsPage';
import StatisticsPage from '@/pages/StatisticsPage';
import SettingsPage from '@/pages/SettingsPage';
import CategoryManagePage from '@/pages/CategoryManagePage';
import BudgetPage from '@/pages/BudgetPage';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return <LoginPage onLogin={(t) => { localStorage.setItem('token', t); setToken(t); }} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MobileLayout />}>
          <Route index element={<HomePage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="settings" element={<SettingsPage onLogout={handleLogout} />} />
          <Route path="settings/categories" element={<CategoryManagePage />} />
          <Route path="settings/budgets" element={<BudgetPage />} />
        </Route>
        <Route path="/record" element={<RecordPage />} />
      </Routes>
    </BrowserRouter>
  );
}
