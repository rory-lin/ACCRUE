interface AmountDisplayProps {
  amount: string;
}

export default function AmountDisplay({ amount }: AmountDisplayProps) {
  return (
    <div className="text-center py-4">
      <span className="text-3xl font-bold text-text">¥ {amount || '0'}</span>
    </div>
  );
}
