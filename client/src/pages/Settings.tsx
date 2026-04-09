import { Card, Descriptions, Typography, Divider } from 'antd';

const { Title, Paragraph } = Typography;

export default function Settings() {
  return (
    <Card title="设置">
      <Typography>
        <Title level={5}>LLM 配置</Title>
        <Paragraph>
          AI 记账功能需要在项目根目录的 <code>config.yaml</code> 中配置 LLM 参数。
          请复制 <code>config.example.yaml</code> 并修改以下内容：
        </Paragraph>
      </Typography>
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="base_url">LLM API 地址（支持 OpenAI 协议）</Descriptions.Item>
        <Descriptions.Item label="api_key">API 密钥</Descriptions.Item>
        <Descriptions.Item label="model">模型名称</Descriptions.Item>
        <Descriptions.Item label="temperature">温度参数（建议 0.1）</Descriptions.Item>
      </Descriptions>

      <Divider />

      <Typography>
        <Title level={5}>MySQL 配置</Title>
        <Paragraph>
          数据库连接信息也在 <code>config.yaml</code> 中配置：
        </Paragraph>
      </Typography>
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="host">数据库地址</Descriptions.Item>
        <Descriptions.Item label="port">端口号</Descriptions.Item>
        <Descriptions.Item label="user">用户名</Descriptions.Item>
        <Descriptions.Item label="password">密码</Descriptions.Item>
        <Descriptions.Item label="database">数据库名</Descriptions.Item>
      </Descriptions>

      <Divider />

      <Typography>
        <Title level={5}>关于</Title>
        <Paragraph>
          Accrue - AI 智能记账助手 v0.1.0
        </Paragraph>
        <Paragraph type="secondary">
          支持自然语言记账、语音记账、预算管理、数据统计与导出。
        </Paragraph>
      </Typography>
    </Card>
  );
}