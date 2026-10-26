import * as React from 'react';
import { cn } from './utils';

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-[16px] w-full auto-rows-[minmax(140px,auto)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
