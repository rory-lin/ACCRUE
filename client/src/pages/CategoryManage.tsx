import { useEffect, useState } from 'react';
import { Card, Tabs, Tree, Button, Modal, Form, Input, Select, Space, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';
import { useCategoryStore } from '../stores/categoryStore';
import { updateCategory } from '../api/categories';
import type { CategoryTreeNode } from '../types';

const NATURE_MAP: Record<string, { label: string; color: string }> = {
  fixed: { label: '固定支出', color: 'blue' },
  variable: { label: '可变支出', color: 'orange' },
  discretionary: { label: '非必要', color: 'purple' },
};

const NATURE_OPTIONS = [
  { label: '固定支出', value: 'fixed' },
  { label: '可变支出', value: 'variable' },
  { label: '非必要支出', value: 'discretionary' },
];

export default function CategoryManage() {
  const { expenseTree, incomeTree, fetchCategories, addCategory, removeCategory } = useCategoryStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [parentId, setParentId] = useState<number | null>(null);
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');
  const [form] = Form.useForm();

  useEffect(() => { fetchCategories(); }, []);

  const handleAddSub = (parentNodeId: number, type: string) => {
    setParentId(parentNodeId);
    setCatType(type as 'expense' | 'income');
    form.resetFields();
    setModalOpen(true);
  };

  const handleAddRoot = (type: string) => {
    setParentId(null);
    setCatType(type as 'expense' | 'income');
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await addCategory({
        name: values.name,
        type: catType,
        parent_id: parentId,
        expense_nature: catType === 'expense' ? (values.expense_nature || null) : undefined,
      });
      message.success('添加成功');
      setModalOpen(false);
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleNatureChange = async (nodeId: number, nature: string) => {
    try {
      await updateCategory(nodeId, { expense_nature: nature } as any);
      message.success('属性已更新');
      fetchCategories(true);
    } catch (err: any) {
      message.error(err.message || '更新失败');
    }
  };

  const buildTreeData = (nodes: CategoryTreeNode[], type: string): any[] =>
    nodes.map(node => ({
      key: node.id,
      title: (
        <Space>
          <span>{node.name}</span>
          {node.is_system === 1 && <LockOutlined style={{ color: '#999', fontSize: 12 }} />}
          {type === 'expense' && node.expense_nature && NATURE_MAP[node.expense_nature as keyof typeof NATURE_MAP] && (
            <Tag color={NATURE_MAP[node.expense_nature as keyof typeof NATURE_MAP]!.color} style={{ fontSize: 11, lineHeight: '18px', padding: '0 4px' }}>
              {NATURE_MAP[node.expense_nature as keyof typeof NATURE_MAP]!.label}
            </Tag>
          )}
          {type === 'expense' && (
            <Select
              size="small"
              value={node.expense_nature || undefined}
              placeholder="属性"
              allowClear
              style={{ width: 100, fontSize: 12 }}
              options={NATURE_OPTIONS}
              onChange={(val) => handleNatureChange(node.id, val)}
            />
          )}
          {!node.is_system && (
            <Popconfirm title="确认删除？" onConfirm={() => removeCategory(node.id)}>
              <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 12 }} />
            </Popconfirm>
          )}
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => handleAddSub(node.id, type)}>
            子分类
          </Button>
        </Space>
      ),
      children: node.children ? buildTreeData(node.children, type) : [],
    }));

  return (
    <Card title="分类管理">
      <Tabs
        items={[
          {
            key: 'expense',
            label: '支出分类',
            children: (
              <>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddRoot('expense')} style={{ marginBottom: 12 }}>
                  添加支出分类
                </Button>
                <Tree treeData={buildTreeData(expenseTree, 'expense')} defaultExpandAll />
              </>
            ),
          },
          {
            key: 'income',
            label: '收入分类',
            children: (
              <>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddRoot('income')} style={{ marginBottom: 12 }}>
                  添加收入分类
                </Button>
                <Tree treeData={buildTreeData(incomeTree, 'income')} defaultExpandAll />
              </>
            ),
          },
        ]}
      />
      <Modal
        title={parentId ? '添加子分类' : '添加分类'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {catType === 'expense' && (
            <Form.Item name="expense_nature" label="支出属性">
              <Select placeholder="选择支出属性（可选）" allowClear options={NATURE_OPTIONS} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
