import * as React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from './utils';

export type BentoVariant = 'white' | 'lavender' | 'mint' | 'peach' | 'sky' | 'dark';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BentoVariant;
  icon?: React.ReactNode;
  actionArrow?: boolean;
  onActionClick?: () => void;
  isHero?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'white',
      icon,
      actionArrow = false,
      onActionClick,
      isHero = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<BentoVariant, string> = {
      white: 'bg-[var(--tile-white)] text-[var(--text-main)] border-[var(--border)]',
      lavender: 'bg-[var(--tile-lavender)] text-[#24104F] border-[rgba(0,0,0,0.05)]',
      mint: 'bg-[var(--tile-mint)] text-[#064E3B] border-[rgba(0,0,0,0.05)]',
      peach: 'bg-[var(--tile-peach)] text-[#7C2D12] border-[rgba(0,0,0,0.05)]',
      sky: 'bg-[var(--tile-sky)] text-[#0C4A6E] border-[rgba(0,0,0,0.05)]',
      dark: 'bg-[var(--tile-dark)] text-[var(--tile-dark-text)] border-[var(--tile-dark-border)]',
    };

    const isDark = variant === 'dark';

    return (
      <div
        ref={ref}
        className={cn(
          'bento-tile relative flex flex-col justify-between overflow-hidden',
          variantStyles[variant],
          isHero && 'ring-1 ring-[var(--border-strong)]',
          className
        )}
        {...props}
      >
        {/* Top Header Strip with Icon Chip and Action Arrow */}
        {(icon || actionArrow) && (
          <div className="flex items-center justify-between mb-4 w-full">
            {icon ? (
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105',
                  isDark
                    ? 'bg-white/10 text-white'
                    : 'bg-white text-[var(--text-main)] border border-[var(--border)]'
                )}
              >
                {icon}
              </div>
            ) : <div />}

            {actionArrow && (
              <button
                type="button"
                onClick={onActionClick}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--ring)]',
                  isDark
                    ? 'text-[var(--tile-dark-muted)] hover:text-white hover:bg-white/10'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5'
                )}
                aria-label="View tile detail"
              >
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1 mb-3', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-xs text-[var(--text-muted)]', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-3 mt-auto', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
