import { useEffect, useState } from 'react';
import { Card, Table, Select, DatePicker, Radio, Space, Button, Popconfirm, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTransactionStore } from '../stores/transactionStore';
import { useAccountStore } from '../stores/accountStore';
import { useCategoryStore } from '../stores/categoryStore';
import AmountText from '../components/AmountText';
import type { TransactionQuery } from '../types';

const { RangePicker } = DatePicker;

export default function TransactionList() {
  const { transactions, total, loading, fetchTransactions, removeTransaction } = useTransactionStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { expenseTree, incomeTree, fetchCategories } = useCategoryStore();
  const [query, setQuery] = useState<TransactionQuery>({ page: 1, page_size: 20 });

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions(query);
  }, [query]);

  const allCategories = [...expenseTree, ...incomeTree];

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 70,
      render: (type: string) => type === 'income' ? <Tag color="green">收入</Tag> : <Tag color="red">支出</Tag>,
    },
    {
      title: '分类',
      key: 'category',
      render: (_: any, record: any) =>
        `${record.category_name || ''}${record.sub_category_name ? ' / ' + record.sub_category_name : ''}`,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number, record: any) => <AmountText amount={amount} type={record.type} />,
    },
    {
      title: '账户',
      dataIndex: 'account_name',
      key: 'account_name',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, record: any) => (
        <Popconfirm title="确认删除？" onConfirm={() => removeTransaction(record.id)}>
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card title="交易明细">
      <Space wrap style={{ marginBottom: 16 }}>
        <Radio.Group
          value={query.type}
          onChange={e => setQuery({ ...query, type: e.target.value, page: 1 })}
          optionType="button"
        >
          <Radio.Button value={undefined}>全部</Radio.Button>
          <Radio.Button value="expense">支出</Radio.Button>
          <Radio.Button value="income">收入</Radio.Button>
        </Radio.Group>
        <Select
          placeholder="分类"
          allowClear
          style={{ width: 140 }}
          value={query.category_id}
          onChange={val => setQuery({ ...query, category_id: val, page: 1 })}
        >
          {allCategories.map(cat => (
            <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
          ))}
        </Select>
        <Select
          placeholder="账户"
          allowClear
          style={{ width: 140 }}
          value={query.account_id}
          onChange={val => setQuery({ ...query, account_id: val, page: 1 })}
        >
          {accounts.map(acc => (
            <Select.Option key={acc.id} value={acc.id}>{acc.name}</Select.Option>
          ))}
        </Select>
        <RangePicker
          onChange={dates => {
            if (dates && dates[0] && dates[1]) {
              setQuery({ ...query, date_from: dates[0].format('YYYY-MM-DD'), date_to: dates[1].format('YYYY-MM-DD'), page: 1 });
            } else {
              setQuery({ ...query, date_from: undefined, date_to: undefined, page: 1 });
            }
          }}
        />
      </Space>
      <Table
        columns={columns}
        dataSource={transactions}
        rowKey="id"
        loading={loading}
        pagination={{
          current: query.page,
          pageSize: query.page_size,
          total,
          onChange: (page, pageSize) => setQuery({ ...query, page, page_size: pageSize }),
        }}
        scroll={{ x: 700 }}
        size="small"
      />
    </Card>
  );
}
