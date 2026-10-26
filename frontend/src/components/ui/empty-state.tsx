import * as React from 'react';
import { cn } from './utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[var(--radius-tile)] border border-dashed border-[var(--border-strong)] bg-[var(--tile-white)]/50',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center text-[var(--text-muted)] mb-4 shadow-2xs">
          {icon}
        </div>
      )}
      <h4 className="text-base font-semibold text-[var(--text-main)]">{title}</h4>
      <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
