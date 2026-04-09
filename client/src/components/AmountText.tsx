import { getAmountColor, formatAmount } from '../utils/format';

interface Props {
  amount: number;
  type: string;
}

export default function AmountText({ amount, type }: Props) {
  return (
    <span style={{ color: getAmountColor(type), fontWeight: 600 }}>
      {formatAmount(amount, type)}
    </span>
  );
}
