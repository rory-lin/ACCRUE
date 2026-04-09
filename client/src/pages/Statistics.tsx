import { useState, useEffect } from 'react';
import { Card, Tabs, DatePicker, Row, Col, Statistic, Spin, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { getSummary, getByCategory, getTrend, getBalanceOverview } from '../api/stats';

const { RangePicker } = DatePicker;

export default function Statistics() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{ type: string; total: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; total: number; count: number }[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; type: string; total: number }[]>([]);
  const [balanceData, setBalanceData] = useState<{ id: number; name: string; type: string; balance: number }[]>([]);

  const dateFrom = dateRange[0].format('YYYY-MM-DD');
  const dateTo = dateRange[1].format('YYYY-MM-DD');

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo]);

  async function loadData() {
    setLoading(true);
    try {
      const [sumRes, catRes, trendRes, balRes] = await Promise.all([
        getSummary(dateFrom, dateTo),
        getByCategory('expense', dateFrom, dateTo),
        getTrend('daily', dateFrom, dateTo),
        getBalanceOverview(),
      ]);
      setSummary(sumRes.data || []);
      setCategoryData(catRes.data || []);
      setTrendData(trendRes.data || []);
      setBalanceData(balRes.data || []);
    } catch (err: any) {
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  }

  const income = summary.find(s => s.type === 'income')?.total || 0;
  const expense = summary.find(s => s.type === 'expense')?.total || 0;

  const pieOption = {
    title: { text: '支出分类占比', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: categoryData.map(c => ({ name: c.name, value: c.total })),
      label: { formatter: '{b}\n¥{c}' },
    }],
  };

  const dates = [...new Set(trendData.map(t => t.date))].sort();
  const trendOption = {
    title: { text: '收支趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'], bottom: 0 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value' },
    series: [
      {
        name: '收入',
        type: 'line',
        data: dates.map(d => trendData.find(t => t.date === d && t.type === 'income')?.total || 0),
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '支出',
        type: 'line',
        data: dates.map(d => trendData.find(t => t.date === d && t.type === 'expense')?.total || 0),
        itemStyle: { color: '#ff4d4f' },
      },
    ],
  };

  const barOption = {
    title: { text: '支出排行', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: categoryData.map(c => c.name).reverse() },
    series: [{
      type: 'bar',
      data: categoryData.map(c => c.total).reverse(),
      itemStyle: { color: '#ff4d4f' },
    }],
  };

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0], dates[1]]);
            }
          }}
        />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="收入" value={income} precision={2} formatter={(value) => '¥' + value} valueStyle={{ color: '#52c41a' }} prefix={<ArrowUpOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="支出" value={expense} precision={2} formatter={(value) => '¥' + value} valueStyle={{ color: '#ff4d4f' }} prefix={<ArrowDownOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="结余" value={income - expense} precision={2} prefix="¥" valueStyle={{ color: (income - expense) >= 0 ? '#1890ff' : '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'category',
            label: '分类占比',
            children: <ReactECharts option={pieOption} style={{ height: 400 }} />,
          },
          {
            key: 'trend',
            label: '趋势分析',
            children: <ReactECharts option={trendOption} style={{ height: 400 }} />,
          },
          {
            key: 'rank',
            label: '支出排行',
            children: <ReactECharts option={barOption} style={{ height: 400 }} />,
          },
          {
            key: 'accounts',
            label: '账户总览',
            children: (
              <Row gutter={[16, 16]}>
                {balanceData.map(acc => (
                  <Col xs={24} sm={12} md={8} key={acc.id}>
                    <Card size="small">
                      <Statistic title={acc.name} value={acc.balance} precision={2} prefix="¥" />
                    </Card>
                  </Col>
                ))}
              </Row>
            ),
          },
        ]}
      />
    </Spin>
  );
}