import type { Account } from '@/types';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

export default function AccountCard({ account, onClick }: AccountCardProps) {
  return (
    <button onClick={onClick}
      className="w-full p-4 bg-white rounded-2xl shadow-sm text-left active:scale-[0.98] transition-transform">
      <div className="text-sm text-gray-500 mb-1">{account.name}</div>
      <div className={`text-xl font-bold ${account.balance < 0 ? 'text-danger' : 'text-text'}`}>
        ¥{account.balance.toFixed(2)}
      </div>
    </button>
  );
}
