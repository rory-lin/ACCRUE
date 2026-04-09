export function formatAmount(amount: number, type: string): string {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}${amount.toFixed(2)}`;
}

export function formatDate(date: string): string {
  return date;
}

export function formatMonth(date: string): string {
  return date.substring(0, 7);
}

export function getAmountColor(type: string): string {
  return type === 'income' ? '#52c41a' : '#ff4d4f';
}
