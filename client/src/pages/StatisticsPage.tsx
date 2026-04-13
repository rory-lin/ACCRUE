import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useStatsStore } from '@/stores/statsStore';

export default function StatisticsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { summary, categoryData, trendData, loadStats } = useStatsStore();

  const getRange = (p: 'week' | 'month' | 'year'): [string, string] => {
    const now = dayjs();
    if (p === 'week') return [now.subtract(6, 'day').format('YYYY-MM-DD'), now.format('YYYY-MM-DD')];
    if (p === 'month') return [now.startOf('month').format('YYYY-MM-DD'), now.endOf('month').format('YYYY-MM-DD')];
    return [now.startOf('year').format('YYYY-MM-DD'), now.endOf('year').format('YYYY-MM-DD')];
  };

  useEffect(() => { const [f, t] = getRange(period); loadStats(f, t); }, [period]);

  const income = summary.find(s => s.type === 'income')?.total || 0;
  const expense = summary.find(s => s.type === 'expense')?.total || 0;
  const maxCat = categoryData[0]?.total || 1;

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    series: [{ type: 'pie', radius: ['40%', '70%'], data: categoryData.map(c => ({ name: c.name, value: c.total })), label: { formatter: '{b}\n¥{c}', fontSize: 11 } }],
  };

  const trendDates = [...new Set(trendData.map(t => t.date))].sort();
  const trendOption = trendDates.length > 0 ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'], bottom: 0 },
    grid: { left: 40, right: 10, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: trendDates },
    yAxis: { type: 'value' },
    series: [
      { name: '收入', type: 'line', data: trendDates.map(d => trendData.find(t => t.date === d && t.type === 'income')?.total || 0), itemStyle: { color: '#10B981' } },
      { name: '支出', type: 'line', data: trendDates.map(d => trendData.find(t => t.date === d && t.type === 'expense')?.total || 0), itemStyle: { color: '#EF4444' } },
    ],
  } : null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex bg-gray-100 rounded-xl p-1">
        {(['week', 'month', 'year'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${period === p ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>
            {p === 'week' ? '周' : p === 'month' ? '月' : '年'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-white rounded-2xl"><div className="text-xs text-gray-400">收入</div><div className="text-lg font-bold text-success">¥{income.toFixed(2)}</div></div>
        <div className="p-4 bg-white rounded-2xl"><div className="text-xs text-gray-400">支出</div><div className="text-lg font-bold text-danger">¥{expense.toFixed(2)}</div></div>
      </div>
      {categoryData.length > 0 && <div className="bg-white rounded-2xl p-2"><ReactECharts option={pieOption} style={{ height: 280 }} /></div>}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">支出排行</h3>
          {categoryData.slice(0, 8).map(cat => (
            <div key={cat.name}>
              <div className="flex justify-between text-sm mb-1"><span>{cat.name}</span><span className="text-danger">¥{cat.total.toFixed(2)}</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-danger rounded-full" style={{ width: `${Math.round((cat.total / maxCat) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {trendOption && <div className="bg-white rounded-2xl p-2"><ReactECharts option={trendOption} style={{ height: 240 }} /></div>}
    </div>
  );
}