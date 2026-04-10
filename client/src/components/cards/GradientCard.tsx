import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface GradientCardProps {
  children: ReactNode;
  className?: string;
}

export default function GradientCard({ children, className }: GradientCardProps) {
  return (
    <div className={cn('rounded-2xl bg-gradient-to-br from-primary to-primary-light p-5 text-white shadow-lg shadow-primary/20', className)}>
      {children}
    </div>
  );
}
