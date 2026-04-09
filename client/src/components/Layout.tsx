import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu } from 'antd';
import {
  DashboardOutlined,
  EditOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  FundOutlined,
  WalletOutlined,
  TagsOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Sider, Content } = AntLayout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/record', icon: <EditOutlined />, label: '记账' },
  { key: '/transactions', icon: <UnorderedListOutlined />, label: '明细' },
  { key: '/statistics', icon: <BarChartOutlined />, label: '统计' },
  { key: '/budgets', icon: <FundOutlined />, label: '预算' },
  { key: '/accounts', icon: <WalletOutlined />, label: '账户' },
  { key: '/categories', icon: <TagsOutlined />, label: '分类' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
];

const bottomNavItems = menuItems.slice(0, 5); // Mobile only shows first 5

export default function MainLayout({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div style={{ paddingBottom: 60 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0',
        }}>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>Accrue</span>
          <span onClick={onLogout} style={{ cursor: 'pointer', color: '#999', fontSize: 14 }}>
            <LogoutOutlined /> 退出
          </span>
        </div>
        <Content style={{ padding: '12px', minHeight: '100vh' }}>
          <Outlet />
        </Content>
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', background: '#fff', borderTop: '1px solid #f0f0f0',
          zIndex: 100, height: 56,
        }}>
          {bottomNavItems.map(item => (
            <div
              key={item.key}
              onClick={() => navigate(item.key)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: location.pathname === item.key ? '#1890ff' : '#999',
                fontSize: 12, cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="light" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold', color: '#1890ff', borderBottom: '1px solid #f0f0f0' }}>
          Accrue
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, flex: 1 }}
        />
        <div
          onClick={onLogout}
          style={{
            padding: '12px 24px', borderTop: '1px solid #f0f0f0',
            cursor: 'pointer', color: '#999', fontSize: 14,
          }}
        >
          <LogoutOutlined /> 退出登录
        </div>
      </Sider>
      <AntLayout>
        <Content style={{ padding: '24px', background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
