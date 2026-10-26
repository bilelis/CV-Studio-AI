import * as React from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full h-10 px-3.5 text-sm bg-[var(--tile-white)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]',
            'border rounded-[var(--radius-input)] transition-all duration-150',
            'border-[var(--input-border)] hover:border-[var(--border-strong)]',
            'focus-visible:outline-none focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/20',
            'disabled:opacity-40 disabled:bg-[var(--bg-page)] disabled:cursor-not-allowed',
            error && 'border-[var(--destructive)] focus-visible:border-[var(--destructive)] focus-visible:ring-[var(--destructive)]/20',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] flex items-center justify-center">
            {rightIcon}
          </div>
        )}
        {typeof error === 'string' && error && (
          <p className="mt-1.5 text-xs text-[var(--destructive)] font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
