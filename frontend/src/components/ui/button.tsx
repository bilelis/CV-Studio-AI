import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer rounded-[var(--radius-button)] focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] shadow-[var(--shadow-button)]',
      secondary:
        'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary-hover)] active:bg-[var(--secondary-active)] border border-[var(--border)]',
      ghost:
        'bg-transparent text-[var(--text-main)] hover:bg-[var(--ghost-hover)] active:bg-[var(--ghost-active)]',
      destructive:
        'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive-hover)] active:bg-[var(--destructive-active)] shadow-[var(--shadow-button)]',
      outline:
        'bg-[var(--tile-white)] text-[var(--text-main)] hover:bg-[var(--bg-page)] border border-[var(--border-strong)] active:bg-[var(--secondary)]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" strokeWidth={2} />
            {size !== 'icon' && <span>{children}</span>}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
