import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronsLeft, ChevronsRight } from "lucide-react";

interface EnhancedPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  showJumpToPage?: boolean;
  className?: string;
}

export const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  showJumpToPage = true,
  className = ""
}) => {
  const [jumpToPage, setJumpToPage] = React.useState("");

  // Don't show pagination for single page
  if (totalPages <= 1) return null;

  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpToPage);
    if (pageNumber && pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
      setJumpToPage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJumpToPage();
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // Show 5 page numbers at most
    
    if (totalPages <= 7) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${className}`}>
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          onClick={() => onPageChange(1)}
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || disabled}
          className="flex items-center gap-1"
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous Page */}
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || disabled}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <div className="px-2 py-1 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              ) : (
                <Button
                  onClick={() => onPageChange(page as number)}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  disabled={disabled}
                  className="min-w-[2.5rem]"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Page */}
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || disabled}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last Page */}
        <Button
          onClick={() => onPageChange(totalPages)}
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || disabled}
          className="flex items-center gap-1"
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Page Info and Jump to Page */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="whitespace-nowrap">
          Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}
        </span>
        
        {showJumpToPage && totalPages > 10 && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs">Go to:</span>
            <Input
              type="number"
              placeholder="Page"
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-20 h-8 text-center"
              min={1}
              max={totalPages}
              disabled={disabled}
            />
            <Button
              onClick={handleJumpToPage}
              variant="outline"
              size="sm"
              disabled={disabled || !jumpToPage}
              className="h-8 px-2"
            >
              Go
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};