import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Progress, Spin } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAccountStore } from '../stores/accountStore';
import { getSummary, getByCategory } from '../api/stats';
import { getTransactions } from '../api/transactions';
import AmountText from '../components/AmountText';
import type { Transaction } from '../types';

export default function Dashboard() {
  const { accounts, fetchAccounts } = useAccountStore();
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [topCategories, setTopCategories] = useState<{ name: string; total: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        await fetchAccounts();
        const [summaryRes, txnRes, catRes] = await Promise.all([
          getSummary(monthStart, monthEnd),
          getTransactions({ page: 1, page_size: 5 }),
          getByCategory('expense', monthStart, monthEnd),
        ]);
        const summary = summaryRes.data || [];
        setIncome(summary.find(s => s.type === 'income')?.total || 0);
        setExpense(summary.find(s => s.type === 'expense')?.total || 0);
        setRecentTransactions(txnRes.data?.items || []);
        setTopCategories((catRes.data || []).slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const balance = income - expense;
  const maxCatTotal = topCategories.length > 0 ? topCategories[0]!.total : 1;

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="本月收入" value={income} precision={2} formatter={(value) => '¥' + value} valueStyle={{ color: '#52c41a' }} prefix={<ArrowUpOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="本月支出" value={expense} precision={2} formatter={(value) => '¥' + value} valueStyle={{ color: '#ff4d4f' }} prefix={<ArrowDownOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="本月结余" value={balance} precision={2} formatter={(value) => '¥' + value} valueStyle={{ color: balance >= 0 ? '#1890ff' : '#ff4d4f' }} prefix={<MinusOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="账户余额" size="small">
            {accounts.map(acc => (
              <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>{acc.name}</span>
                <span style={{ fontWeight: 600 }}>¥{acc.balance.toFixed(2)}</span>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="支出排行" size="small">
            {topCategories.map(cat => (
              <div key={cat.name} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{cat.name}</span>
                  <span style={{ color: '#ff4d4f' }}>¥{cat.total.toFixed(2)}</span>
                </div>
                <Progress percent={Math.round((cat.total / maxCatTotal) * 100)} showInfo={false} strokeColor="#ff4d4f" size="small" />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Card title="最近交易" size="small" style={{ marginTop: 16 }}>
        <List
          size="small"
          dataSource={recentTransactions}
          renderItem={(item) => (
            <List.Item extra={<AmountText amount={item.amount} type={item.type} />}>
              <List.Item.Meta
                title={`${item.category_name || ''} ${item.sub_category_name ? '/ ' + item.sub_category_name : ''}`}
                description={`${item.date} · ${item.account_name || ''}`}
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无交易记录' }}
        />
      </Card>
    </Spin>
  );
}
