import * as React from 'react';
import { cn } from './utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'dark'
    | 'lavender'
    | 'mint'
    | 'peach'
    | 'sky'
    | 'outline'
    | 'success'
    | 'warning'
    | 'destructive';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-transparent',
    dark: 'bg-[var(--tile-dark)] text-[var(--tile-dark-text)] border-transparent',
    lavender: 'bg-[var(--tile-lavender)] text-[#4C1D95] border-transparent',
    mint: 'bg-[var(--tile-mint)] text-[#065F46] border-transparent',
    peach: 'bg-[var(--tile-peach)] text-[#9A3412] border-transparent',
    sky: 'bg-[var(--tile-sky)] text-[#075985] border-transparent',
    outline: 'bg-transparent text-[var(--text-main)] border-[var(--border-strong)]',
    success: 'bg-[#D1FAE5] text-[#065F46] border-transparent',
    warning: 'bg-[#FEF3C7] text-[#92400E] border-transparent',
    destructive: 'bg-[#FEE2E2] text-[#991B1B] border-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[var(--radius-badge)] border px-2.5 py-0.5 text-xs font-medium transition-colors select-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
