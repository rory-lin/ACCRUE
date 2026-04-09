import { Tag } from 'antd';

interface Props {
  type: string;
}

export default function TypeTag({ type }: Props) {
  return type === 'income' ? (
    <Tag color="green">收入</Tag>
  ) : (
    <Tag color="red">支出</Tag>
  );
}
