import * as React from 'react';
import { cn } from './utils';

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, collapsed = false, children, ...props }, ref) => {
    return (
      <aside
        ref={ref}
        className={cn(
          'flex flex-col bg-[var(--tile-white)] border-r border-[var(--border)] transition-all duration-200 select-none',
          collapsed ? 'w-16 p-2 items-center' : 'w-64 p-4',
          className
        )}
        {...props}
      >
        {children}
      </aside>
    );
  }
);
Sidebar.displayName = 'Sidebar';

export const SidebarItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; icon?: React.ReactNode }
>(({ className, active, icon, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-button)] text-xs font-semibold transition-all duration-150 cursor-pointer text-left',
        active
          ? 'bg-[var(--tile-dark)] text-[var(--tile-dark-text)] shadow-xs'
          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--secondary)]/60',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
});
SidebarItem.displayName = 'SidebarItem';
