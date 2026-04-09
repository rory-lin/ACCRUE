import { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Select, DatePicker, Radio, Button, message, Space } from 'antd';
import { AudioOutlined, RobotOutlined, FormOutlined, SwapOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAccountStore } from '../stores/accountStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { parseInput } from '../api/ai';
import { getSetting } from '../api/settings';
import { createTransfer } from '../api/transactions';
import type { CreateTransactionRequest } from '../types';

type RecordMode = 'manual' | 'ai' | 'voice' | 'transfer';

const EXPENSE_NATURE_OPTIONS = [
  { label: '固定支出', value: 'fixed' },
  { label: '可变支出', value: 'variable' },
  { label: '非必要支出', value: 'discretionary' },
];

export default function RecordPage() {
  const [mode, setMode] = useState<RecordMode>('manual');
  const [form] = Form.useForm();
  const [transferForm] = Form.useForm();
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const { accounts, fetchAccounts } = useAccountStore();
  const { expenseTree, incomeTree, fetchCategories } = useCategoryStore();
  const { addTransaction } = useTransactionStore();

  useEffect(() => {
    const initData = async () => {
      await Promise.all([fetchAccounts(), fetchCategories()]);
      // Load default account from settings
      try {
        const res = await getSetting('default_account_id');
        if (res.data?.value) {
          const defaultId = parseInt(res.data.value, 10);
          if (!isNaN(defaultId)) {
            form.setFieldValue('account_id', defaultId);
          }
        }
      } catch {
        // Settings may not exist yet, ignore
      }
    };
    initData();
  }, []);

  const tree = txType === 'expense' ? expenseTree : incomeTree;

  // Auto-fill expense_nature when category changes
  const handleCategoryChange = (catId: number) => {
    setSelectedCategoryId(catId);
    form.setFieldValue('sub_category_id', undefined);
    if (txType === 'expense') {
      const cat = tree.find(c => c.id === catId);
      if (cat?.expense_nature) {
        form.setFieldValue('expense_nature', cat.expense_nature);
      }
    }
  };

  const handleSubCategoryChange = (subCatId: number) => {
    if (txType === 'expense' && subCatId) {
      const cat = tree.find(c => c.id === selectedCategoryId);
      if (cat) {
        const sub = cat.children?.find(c => c.id === subCatId);
        if (sub?.expense_nature) {
          form.setFieldValue('expense_nature', sub.expense_nature);
        }
      }
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data: CreateTransactionRequest = {
        type: values.type,
        amount: values.amount,
        category_id: values.sub_category_id || values.category_id,
        sub_category_id: values.sub_category_id || null,
        account_id: values.account_id,
        date: values.date.format('YYYY-MM-DD'),
        note: values.note || '',
        tags: [],
        expense_nature: values.type === 'expense' ? (values.expense_nature || null) : null,
      };
      await addTransaction(data);
      message.success('记账成功！');
      form.resetFields();
      // Restore default account after reset
      try {
        const res = await getSetting('default_account_id');
        if (res.data?.value) {
          const defaultId = parseInt(res.data.value, 10);
          if (!isNaN(defaultId)) {
            form.setFieldValue('account_id', defaultId);
          }
        }
      } catch { /* ignore */ }
      form.setFieldValue('date', dayjs());
    } catch (err: any) {
      message.error(err.message || '记账失败');
    }
  };

  const handleTransferSubmit = async (values: any) => {
    try {
      await createTransfer({
        from_account_id: values.from_account_id,
        to_account_id: values.to_account_id,
        amount: values.amount,
        date: values.date.format('YYYY-MM-DD'),
        note: values.note || '',
      });
      message.success('转账成功！');
      transferForm.resetFields();
      transferForm.setFieldValue('date', dayjs());
    } catch (err: any) {
      message.error(err.message || '转账失败');
    }
  };

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const res = await parseInput(aiInput);
      if (res.data) {
        const parsed = res.data;
        form.setFieldsValue({
          type: parsed.type,
          amount: parsed.amount,
          category_id: parsed.category_id,
          sub_category_id: parsed.sub_category_id,
          account_id: parsed.account_id,
          date: parsed.date ? dayjs(parsed.date) : dayjs(),
          note: parsed.note || '',
        });
        setTxType(parsed.type);
        setSelectedCategoryId(parsed.category_id);
        setMode('manual');
        message.success('AI 解析成功，请确认后提交');
      }
    } catch (err: any) {
      message.error(err.message || 'AI 解析失败');
    } finally {
      setAiLoading(false);
    }
  };

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      message.warning('您的浏览器不支持语音识别，请使用 Chrome');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiInput(transcript);
      // Auto trigger AI parse
      setTimeout(async () => {
        setAiLoading(true);
        try {
          const res = await parseInput(transcript);
          if (res.data) {
            const parsed = res.data;
            form.setFieldsValue({
              type: parsed.type,
              amount: parsed.amount,
              category_id: parsed.category_id,
              sub_category_id: parsed.sub_category_id,
              account_id: parsed.account_id,
              date: parsed.date ? dayjs(parsed.date) : dayjs(),
              note: parsed.note || '',
            });
            setTxType(parsed.type);
            setSelectedCategoryId(parsed.category_id);
            setMode('manual');
            message.success('语音解析成功，请确认后提交');
          }
        } catch {
          message.error('AI 解析失败');
        } finally {
          setAiLoading(false);
        }
      }, 100);
    };
    recognition.start();
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card title="记一笔">
        <Space style={{ marginBottom: 16 }}>
          <Button
            type={mode === 'manual' ? 'primary' : 'default'}
            icon={<FormOutlined />}
            onClick={() => setMode('manual')}
          >
            手动
          </Button>
          <Button
            type={mode === 'ai' ? 'primary' : 'default'}
            icon={<RobotOutlined />}
            onClick={() => setMode('ai')}
          >
            智能
          </Button>
          <Button
            type={mode === 'voice' ? 'primary' : 'default'}
            icon={<AudioOutlined />}
            onClick={() => setMode('voice')}
          >
            语音
          </Button>
          <Button
            type={mode === 'transfer' ? 'primary' : 'default'}
            icon={<SwapOutlined />}
            onClick={() => setMode('transfer')}
          >
            转账
          </Button>
        </Space>

        {(mode === 'ai' || mode === 'voice') && (
          <div style={{ marginBottom: 16 }}>
            {mode === 'ai' && (
              <>
                <Input.TextArea
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder="说一句话，AI 帮你记账，例如：午饭花了25"
                  rows={3}
                  style={{ marginBottom: 8 }}
                />
                <Button type="primary" onClick={handleAiParse} loading={aiLoading} block>
                  AI 解析
                </Button>
              </>
            )}
            {mode === 'voice' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={<AudioOutlined />}
                  onClick={handleVoice}
                  loading={listening}
                  style={{ width: 80, height: 80, fontSize: 32 }}
                />
                <div style={{ marginTop: 8, color: '#999' }}>
                  {listening ? '正在聆听...' : '点击开始说话'}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'transfer' ? (
          <Form
            form={transferForm}
            layout="vertical"
            initialValues={{ date: dayjs() }}
            onFinish={handleTransferSubmit}
          >
            <Form.Item name="from_account_id" label="转出账户" rules={[{ required: true, message: '请选择转出账户' }]}>
              <Select placeholder="选择转出账户">
                {accounts.map(acc => (
                  <Select.Option key={acc.id} value={acc.id}>
                    {acc.name} (¥{acc.balance.toFixed(2)})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="to_account_id" label="转入账户" rules={[{ required: true, message: '请选择转入账户' }]}>
              <Select placeholder="选择转入账户">
                {accounts.map(acc => (
                  <Select.Option key={acc.id} value={acc.id}>
                    {acc.name} (¥{acc.balance.toFixed(2)})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
              <InputNumber prefix="¥" min={0.01} step={0.01} style={{ width: '100%' }} size="large" />
            </Form.Item>

            <Form.Item name="date" label="日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="note" label="备注">
              <Input.TextArea rows={2} placeholder="可选备注" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block>
                确认转账
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form
            form={form}
            layout="vertical"
            initialValues={{ type: 'expense', date: dayjs() }}
            onFinish={handleSubmit}
          >
            <Form.Item name="type" label="类型">
              <Radio.Group onChange={e => {
                setTxType(e.target.value);
                setSelectedCategoryId(undefined);
                form.setFieldValue('category_id', undefined);
                form.setFieldValue('sub_category_id', undefined);
                form.setFieldValue('expense_nature', undefined);
              }}>
                <Radio.Button value="expense">支出</Radio.Button>
                <Radio.Button value="income">收入</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
              <InputNumber prefix="¥" min={0.01} step={0.01} style={{ width: '100%' }} size="large" />
            </Form.Item>

            <Form.Item name="category_id" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
              <Select placeholder="选择分类" onChange={handleCategoryChange}>
                {tree.map(cat => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.category_id !== cur.category_id}>
              {({ getFieldValue }) => {
                const catId = getFieldValue('category_id');
                const parent = tree.find(c => c.id === catId);
                if (!parent || parent.children.length === 0) return null;
                return (
                  <Form.Item name="sub_category_id" label="子分类">
                    <Select placeholder="选择子分类" allowClear onChange={handleSubCategoryChange}>
                      {parent.children.map(sub => (
                        <Select.Option key={sub.id} value={sub.id}>
                          {sub.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }}
            </Form.Item>

            {txType === 'expense' && (
              <Form.Item name="expense_nature" label="属性">
                <Select placeholder="选择支出属性" allowClear options={EXPENSE_NATURE_OPTIONS} />
              </Form.Item>
            )}

            <Form.Item name="account_id" label="账户" rules={[{ required: true, message: '请选择账户' }]}>
              <Select placeholder="选择账户">
                {accounts.map(acc => (
                  <Select.Option key={acc.id} value={acc.id}>
                    {acc.name} (¥{acc.balance.toFixed(2)})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="date" label="日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="note" label="备注">
              <Input.TextArea rows={2} placeholder="可选备注" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block>
                保存
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
}
