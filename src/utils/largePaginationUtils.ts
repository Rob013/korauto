/**
 * Large Dataset Pagination Utilities
 * 
 * This module provides utilities for handling pagination with large datasets
 * such as 180,000+ cars across 3000+ pages as specified in the requirements.
 */

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  itemsOnCurrentPage: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Calculate comprehensive pagination information for any dataset size
 */
export function calculatePaginationInfo(
  currentPage: number,
  totalItems: number,
  itemsPerPage: number = 50
): PaginationInfo {
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 0;
  const clampedCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  
  const startIndex = (clampedCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const itemsOnCurrentPage = Math.max(0, endIndex - startIndex);
  
  return {
    currentPage: clampedCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    itemsOnCurrentPage,
    isFirstPage: clampedCurrentPage === 1,
    isLastPage: clampedCurrentPage === totalPages || totalPages === 0,
    hasNextPage: clampedCurrentPage < totalPages,
    hasPrevPage: clampedCurrentPage > 1,
  };
}

/**
 * Format large numbers for display in pagination UI
 */
export function formatPaginationNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Generate page range for display in pagination controls
 * Optimized for large page counts (e.g., 3000+ pages)
 */
export function generatePageRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | '...')[] {
  if (totalPages <= maxVisible + 2) {
    // Show all pages if total is small
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  // Always show first page
  pages.push(1);

  // Calculate start and end of middle section
  let start = Math.max(2, currentPage - halfVisible);
  let end = Math.min(totalPages - 1, currentPage + halfVisible);

  // Adjust if we're near the beginning
  if (currentPage <= halfVisible + 1) {
    end = Math.min(totalPages - 1, maxVisible);
  }

  // Adjust if we're near the end
  if (currentPage >= totalPages - halfVisible) {
    start = Math.max(2, totalPages - maxVisible + 1);
  }

  // Add ellipsis before middle section if needed
  if (start > 2) {
    pages.push('...');
  }

  // Add middle section
  for (let i = start; i <= end; i++) {
    if (i !== 1 && i !== totalPages) {
      pages.push(i);
    }
  }

  // Add ellipsis after middle section if needed
  if (end < totalPages - 1) {
    pages.push('...');
  }

  // Always show last page (if different from first)
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

/**
 * Validate if a page number is within valid bounds
 */
export function isValidPageNumber(
  page: number,
  totalPages: number
): boolean {
  return page >= 1 && page <= totalPages && Number.isInteger(page);
}

/**
 * Calculate pagination stats for status display
 */
export function getPaginationStats(
  currentPage: number,
  totalItems: number,
  itemsPerPage: number = 50
): {
  displayText: string;
  shortText: string;
  showing: string;
} {
  const info = calculatePaginationInfo(currentPage, totalItems, itemsPerPage);
  
  if (info.totalItems === 0) {
    return {
      displayText: 'No items found',
      shortText: '0 items',
      showing: 'Showing 0 items'
    };
  }

  const startNum = formatPaginationNumber(info.startIndex + 1);
  const endNum = formatPaginationNumber(info.endIndex);
  const totalFormatted = formatPaginationNumber(info.totalItems);
  const pageFormatted = formatPaginationNumber(info.currentPage);
  const totalPagesFormatted = formatPaginationNumber(info.totalPages);

  return {
    displayText: `${totalFormatted} items total • Page ${pageFormatted} of ${totalPagesFormatted} • Showing ${info.itemsOnCurrentPage} items`,
    shortText: `${totalFormatted} items`,
    showing: `Showing ${startNum}-${endNum} of ${totalFormatted}`
  };
}

/**
 * Generate API parameters for paginated requests
 */
export function generateApiPaginationParams(
  page: number,
  itemsPerPage: number = 50
): {
  page: string;
  per_page: string;
  offset: string;
  limit: string;
} {
  const offset = (page - 1) * itemsPerPage;
  
  return {
    page: page.toString(),
    per_page: itemsPerPage.toString(),
    offset: offset.toString(),
    limit: itemsPerPage.toString(),
  };
}

/**
 * Calculate memory-efficient data slicing for large datasets
 * Only loads the data needed for the current page
 */
export function sliceDataForPage<T>(
  data: T[],
  currentPage: number,
  itemsPerPage: number = 50
): T[] {
  const info = calculatePaginationInfo(currentPage, data.length, itemsPerPage);
  return data.slice(info.startIndex, info.endIndex);
}

/**
 * Performance optimized pagination for very large datasets
 * Prevents performance issues with massive page counts
 */
export function getOptimizedPaginationConfig(totalPages: number) {
  return {
    // Enable enhanced features for large datasets
    showJumpToPage: totalPages > 10,
    showFirstLastButtons: totalPages > 5,
    showPageNumbers: totalPages <= 1000, // Hide individual page numbers for very large datasets
    maxVisiblePages: totalPages > 100 ? 3 : 5,
    enableKeyboardShortcuts: totalPages > 20,
  };
}