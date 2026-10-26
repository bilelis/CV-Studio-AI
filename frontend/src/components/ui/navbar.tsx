import * as React from 'react';
import { cn } from './utils';

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  brand?: React.ReactNode;
  rightActions?: React.ReactNode;
}

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ className, brand, rightActions, children, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'w-full bg-[var(--tile-white)]/90 backdrop-blur-md border-b border-[var(--border)] px-6 py-3.5 sticky top-0 z-40 flex items-center justify-between',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-4">{brand}</div>
        {children && <div className="flex-1 flex items-center justify-center px-4">{children}</div>}
        <div className="flex items-center gap-3">{rightActions}</div>
      </header>
    );
  }
);
Navbar.displayName = 'Navbar';
