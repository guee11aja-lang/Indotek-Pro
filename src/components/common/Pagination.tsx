import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 1 && totalItems <= pageSize) {
    return (
      <div className={`flex items-center justify-between text-xs text-[#69766F] py-3 px-4 ${className}`}>
        <span>Menampilkan {totalItems} data</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#69766F] py-3 px-4 border-t border-[#E2E8E4] ${className}`}>
      <div>
        Menampilkan <span className="font-medium text-[#202B26] tabular-nums font-mono">{startItem}</span> -{' '}
        <span className="font-medium text-[#202B26] tabular-nums font-mono">{endItem}</span> dari{' '}
        <span className="font-medium text-[#202B26] tabular-nums font-mono">{totalItems}</span> data
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded border border-[#E2E8E4] bg-white text-[#202B26] hover:bg-[#F5F7F6] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          const page = idx + 1;
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-7 h-7 text-xs font-mono font-medium rounded transition-colors ${
                isActive
                  ? 'bg-[#12352B] text-white'
                  : 'bg-white border border-[#E2E8E4] text-[#202B26] hover:bg-[#F5F7F6]'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded border border-[#E2E8E4] bg-white text-[#202B26] hover:bg-[#F5F7F6] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
