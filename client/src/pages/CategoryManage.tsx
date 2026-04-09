import { useEffect, useState } from 'react';
import { Card, Tabs, Tree, Button, Modal, Form, Input, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';
import { useCategoryStore } from '../stores/categoryStore';

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
      });
      message.success('添加成功');
      setModalOpen(false);
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const buildTreeData = (nodes: any[], type: string): any[] =>
    nodes.map(node => ({
      key: node.id,
      title: (
        <Space>
          <span>{node.name}</span>
          {node.is_system === 1 && <LockOutlined style={{ color: '#999', fontSize: 12 }} />}
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
        </Form>
      </Modal>
    </Card>
  );
}
