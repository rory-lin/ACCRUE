import { useEffect, useState } from 'react';
import { Card, DatePicker, Row, Col, Progress, InputNumber, Button, message, Popconfirm, Spin } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getBudgetStatus, setBudget, deleteBudget } from '../api/budgets';
import { useCategoryStore } from '../stores/categoryStore';
import type { BudgetStatus } from '../types';

export default function BudgetPage() {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { expenseTree, fetchCategories } = useCategoryStore();
  const [newBudgets, setNewBudgets] = useState<Record<number, number>>({});

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => { loadBudgets(); }, [month]);

  async function loadBudgets() {
    setLoading(true);
    try {
      const res = await getBudgetStatus(month);
      setBudgets(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  const handleSetBudget = async (categoryId: number) => {
    const amount = newBudgets[categoryId];
    if (!amount || amount <= 0) return;
    try {
      await setBudget({ category_id: categoryId, month, amount });
      message.success('预算设置成功');
      setNewBudgets(prev => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });
      loadBudgets();
    } catch (err: any) {
      message.error(err.message || '设置失败');
    }
  };

  const handleDelete = async (categoryId: number) => {
    try {
      const budget = budgets.find(b => b.category_id === categoryId);
      if (budget) {
        // Find budget ID from the API
        const { getBudgets } = await import('../api/budgets');
        const res = await getBudgets(month);
        const b = (res.data || []).find((x: any) => x.category_id === categoryId);
        if (b) await deleteBudget(b.id);
        loadBudgets();
      }
    } catch (err: any) {
      message.error('删除失败');
    }
  };

  const budgetedCategoryIds = new Set(budgets.map(b => b.category_id));
  const unbudgetedCategories = expenseTree.filter(c => !budgetedCategoryIds.has(c.id));

  const totalBudget = budgets.reduce((s, b) => s + b.budget_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.actual_spent, 0);

  return (
    <Spin spinning={loading}>
      <Card title="预算管理">
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <DatePicker
            picker="month"
            value={dayjs(month, 'YYYY-MM')}
            onChange={d => d && setMonth(d.format('YYYY-MM'))}
          />
          <div>
            总预算: ¥{totalBudget.toFixed(2)} / 已支出: ¥{totalSpent.toFixed(2)}
            {totalBudget > 0 && (
              <Progress
                percent={Math.round((totalSpent / totalBudget) * 100)}
                status={totalSpent > totalBudget ? 'exception' : undefined}
                style={{ width: 200, marginLeft: 12 }}
              />
            )}
          </div>
        </div>

        {budgets.map(budget => (
          <Card key={budget.category_id} size="small" style={{ marginBottom: 8 }}>
            <Row align="middle" gutter={16}>
              <Col span={6}>
                <strong>{budget.category_name}</strong>
                <div style={{ fontSize: 12, color: '#999' }}>
                  预算 ¥{budget.budget_amount.toFixed(2)}
                </div>
              </Col>
              <Col span={12}>
                <Progress
                  percent={Math.min(Math.round(budget.percentage), 100)}
                  status={budget.is_over ? 'exception' : undefined}
                  format={() => `¥${budget.actual_spent.toFixed(2)} / ¥${budget.budget_amount.toFixed(2)}`}
                />
              </Col>
              <Col span={6} style={{ textAlign: 'right' }}>
                <Popconfirm title="删除此预算？" onConfirm={() => handleDelete(budget.category_id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
              </Col>
            </Row>
          </Card>
        ))}

        {unbudgetedCategories.length > 0 && (
          <Card title="设置新预算" size="small" style={{ marginTop: 16 }}>
            {unbudgetedCategories.map(cat => (
              <Row key={cat.id} align="middle" gutter={8} style={{ marginBottom: 8 }}>
                <Col span={8}>{cat.name}</Col>
                <Col span={10}>
                  <InputNumber
                    prefix="¥"
                    min={0}
                    value={newBudgets[cat.id]}
                    onChange={val => setNewBudgets(prev => ({ ...prev, [cat.id]: val || 0 }))}
                    style={{ width: '100%' }}
                    size="small"
                  />
                </Col>
                <Col span={6}>
                  <Button type="primary" size="small" onClick={() => handleSetBudget(cat.id)}>设置</Button>
                </Col>
              </Row>
            ))}
          </Card>
        )}
      </Card>
    </Spin>
  );
}