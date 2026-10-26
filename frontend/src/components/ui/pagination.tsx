import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="h-8 w-8 rounded-[8px] flex items-center justify-center border border-[var(--border)] bg-[var(--tile-white)] text-[var(--text-main)] hover:bg-[var(--secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
      </button>

      {Array.from({ length: totalPages }).map((_, i) => {
        const page = i + 1;
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'h-8 min-w-[32px] px-2 rounded-[8px] text-xs font-semibold transition-all duration-150',
              isActive
                ? 'bg-[var(--tile-dark)] text-white shadow-xs'
                : 'bg-[var(--tile-white)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--secondary)]'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="h-8 w-8 rounded-[8px] flex items-center justify-center border border-[var(--border)] bg-[var(--tile-white)] text-[var(--text-main)] hover:bg-[var(--secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next Page"
      >
        <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
      </button>
    </nav>
  );
}
