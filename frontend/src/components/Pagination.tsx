import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const [pageInput, setPageInput] = useState('');

  const handlePageChange = (page: number) => {
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Call the parent's page change handler
    onPageChange(page);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page);
      setPageInput('');
    }
  };

  return (
    <div className="pagination">
      <button
        className="pagination-button pagination-prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={18} />
        <span>Previous</span>
      </button>

      <div className="pagination-numbers">
        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={index}
              className={`pagination-number ${page === currentPage ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="pagination-ellipsis">
              {page}
            </span>
          )
        )}
      </div>

      <button
        className="pagination-button pagination-next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <span>Next</span>
        <ChevronRight size={18} />
      </button>

      <form className="pagination-jump" onSubmit={handlePageInputSubmit}>
        <label htmlFor="page-input" className="pagination-jump-label">
          Go to:
        </label>
        <input
          id="page-input"
          type="number"
          min="1"
          max={totalPages}
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          placeholder={`1-${totalPages}`}
          className="pagination-input"
          aria-label="Jump to page"
        />
      </form>
    </div>
  );
}
