import * as React from 'react';
import { cn } from './utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full min-h-[100px] p-3.5 text-sm bg-[var(--tile-white)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]',
            'border rounded-[var(--radius-input)] transition-all duration-150 resize-y',
            'border-[var(--input-border)] hover:border-[var(--border-strong)]',
            'focus-visible:outline-none focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/20',
            'disabled:opacity-40 disabled:bg-[var(--bg-page)] disabled:cursor-not-allowed',
            error && 'border-[var(--destructive)] focus-visible:border-[var(--destructive)] focus-visible:ring-[var(--destructive)]/20',
            className
          )}
          {...props}
        />
        {typeof error === 'string' && error && (
          <p className="mt-1.5 text-xs text-[var(--destructive)] font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
