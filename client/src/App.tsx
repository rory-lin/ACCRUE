import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RecordPage from './pages/RecordPage';
import TransactionList from './pages/TransactionList';
import Statistics from './pages/Statistics';
import AccountManage from './pages/AccountManage';
import CategoryManage from './pages/CategoryManage';
import BudgetPage from './pages/BudgetPage';
import Settings from './pages/Settings';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={(t) => setToken(t)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout onLogout={handleLogout} />}>
          <Route index element={<Dashboard />} />
          <Route path="record" element={<RecordPage />} />
          <Route path="transactions" element={<TransactionList />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="accounts" element={<AccountManage />} />
          <Route path="categories" element={<CategoryManage />} />
          <Route path="budgets" element={<BudgetPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
