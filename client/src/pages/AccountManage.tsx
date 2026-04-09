import { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Modal, Form, Input, InputNumber, Select, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useAccountStore } from '../stores/accountStore';

const ACCOUNT_TYPES = [
  { value: 'alipay', label: '支付宝' },
  { value: 'wechat', label: '微信钱包' },
  { value: 'bank_card', label: '银行卡' },
  { value: 'credit_card', label: '信用卡' },
  { value: 'cash', label: '现金' },
  { value: 'other', label: '其他' },
];

export default function AccountManage() {
  const { accounts, fetchAccounts, addAccount, editAccount, removeAccount } = useAccountStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { fetchAccounts(); }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (account: any) => {
    setEditingId(account.id);
    form.setFieldsValue(account);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await editAccount(editingId, values);
        message.success('更新成功');
      } else {
        await addAccount(values);
        message.success('添加成功');
      }
      setModalOpen(false);
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加账户</Button>
      </div>
      <Row gutter={[16, 16]}>
        {accounts.map(acc => (
          <Col xs={24} sm={12} md={8} key={acc.id}>
            <Card
              size="small"
              title={acc.name}
              extra={
                <Space>
                  <Button type="text" icon={<EditOutlined />} size="small" onClick={() => handleEdit(acc)} />
                  <Popconfirm title="确认删除？" onConfirm={() => removeAccount(acc.id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                  </Popconfirm>
                </Space>
              }
            >
              <div style={{ fontSize: 24, fontWeight: 'bold', color: acc.balance >= 0 ? '#1890ff' : '#ff4d4f' }}>
                ¥{acc.balance.toFixed(2)}
              </div>
              <div style={{ color: '#999', fontSize: 12 }}>
                类型：{ACCOUNT_TYPES.find(t => t.value === acc.type)?.label || acc.type}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <Modal
        title={editingId ? '编辑账户' : '添加账户'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={ACCOUNT_TYPES} />
          </Form.Item>
          {!editingId && (
            <Form.Item name="initial_balance" label="初始余额">
              <InputNumber prefix="¥" style={{ width: '100%' }} min={0} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
