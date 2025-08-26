import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnhancedPagination } from '@/components/ui/enhanced-pagination';

describe('EnhancedPagination Component', () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  it('should not render for single page', () => {
    const { container } = render(
      <EnhancedPagination
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should handle large page numbers correctly', () => {
    render(
      <EnhancedPagination
        currentPage={1800}
        totalPages={3600}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Check that page numbers are formatted with commas
    expect(screen.getByText(/Page 1,800 of 3,600/)).toBeInTheDocument();
  });

  it('should enable/disable navigation buttons correctly', () => {
    // Test first page
    const { rerender } = render(
      <EnhancedPagination
        currentPage={1}
        totalPages={3600}
        onPageChange={mockOnPageChange}
      />
    );
    
    const firstPageBtn = screen.getByTitle('First page');
    const prevBtn = screen.getByText('Previous');
    const nextBtn = screen.getByText('Next');
    const lastPageBtn = screen.getByTitle('Last page');
    
    expect(firstPageBtn).toBeDisabled();
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();
    expect(lastPageBtn).not.toBeDisabled();
    
    // Test last page
    rerender(
      <EnhancedPagination
        currentPage={3600}
        totalPages={3600}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(firstPageBtn).not.toBeDisabled();
    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();
    expect(lastPageBtn).toBeDisabled();
  });

  it('should navigate to correct pages when buttons are clicked', () => {
    render(
      <EnhancedPagination
        currentPage={1800}
        totalPages={3600}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Test first page navigation
    fireEvent.click(screen.getByTitle('First page'));
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
    
    // Test previous page navigation
    fireEvent.click(screen.getByText('Previous'));
    expect(mockOnPageChange).toHaveBeenCalledWith(1799);
    
    // Test next page navigation
    fireEvent.click(screen.getByText('Next'));
    expect(mockOnPageChange).toHaveBeenCalledWith(1801);
    
    // Test last page navigation
    fireEvent.click(screen.getByTitle('Last page'));
    expect(mockOnPageChange).toHaveBeenCalledWith(3600);
  });

  it('should show jump to page input for large datasets', () => {
    render(
      <EnhancedPagination
        currentPage={1}
        totalPages={3600}
        onPageChange={mockOnPageChange}
        showJumpToPage={true}
      />
    );
    
    expect(screen.getByText('Go to:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Page')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
  });

  it('should handle jump to page functionality', () => {
    render(
      <EnhancedPagination
        currentPage={1}
        totalPages={3600}
        onPageChange={mockOnPageChange}
      />
    );
    
    const jumpInput = screen.getByPlaceholderText('Page');
    const goButton = screen.getByText('Go');
    
    // Enter a page number
    fireEvent.change(jumpInput, { target: { value: '2500' } });
    fireEvent.click(goButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(2500);
  });

  it('should handle jump to page with Enter key', () => {
    render(
      <EnhancedPagination
        currentPage={1}
        totalPages={3600}
        onPageChange={mockOnPageChange}
      />
    );
    
    const jumpInput = screen.getByPlaceholderText('Page');
    
    // Enter a page number and press Enter
    fireEvent.change(jumpInput, { target: { value: '1500' } });
    fireEvent.keyDown(jumpInput, { key: 'Enter' });
    
    expect(mockOnPageChange).toHaveBeenCalledWith(1500);
  });

  it('should validate jump to page input bounds', () => {
    render(
      <EnhancedPagination
        currentPage={1}
        totalPages={100}
        onPageChange={mockOnPageChange}
      />
    );
    
    const jumpInput = screen.getByPlaceholderText('Page');
    const goButton = screen.getByText('Go');
    
    // Test invalid page numbers
    fireEvent.change(jumpInput, { target: { value: '0' } });
    fireEvent.click(goButton);
    expect(mockOnPageChange).not.toHaveBeenCalledWith(0);
    
    fireEvent.change(jumpInput, { target: { value: '101' } });
    fireEvent.click(goButton);
    expect(mockOnPageChange).not.toHaveBeenCalledWith(101);
    
    // Test valid page number
    fireEvent.change(jumpInput, { target: { value: '50' } });
    fireEvent.click(goButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(50);
  });

  it('should generate correct page numbers for different scenarios', () => {
    // Test small total pages (show all)
    const { rerender } = render(
      <EnhancedPagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Should show pages 1, 2, 3, 4, 5
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Test large total pages with current page in middle
    rerender(
      <EnhancedPagination
        currentPage={1800}
        totalPages={3600}
        onPageChange={mockOnPageChange}
      />
    );
    
    // Should show 1, ..., around 1800, ..., 3600
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3600')).toBeInTheDocument();
    expect(screen.getByText('1800')).toBeInTheDocument();
  });

  it('should handle disabled state correctly', () => {
    render(
      <EnhancedPagination
        currentPage={1800}
        totalPages={3600}
        onPageChange={mockOnPageChange}
        disabled={true}
      />
    );
    
    // All buttons should be disabled
    expect(screen.getByTitle('First page')).toBeDisabled();
    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).toBeDisabled();
    expect(screen.getByTitle('Last page')).toBeDisabled();
    expect(screen.getByText('Go')).toBeDisabled();
    expect(screen.getByPlaceholderText('Page')).toBeDisabled();
  });

  it('should handle specific pagination scenarios from problem statement', () => {
    // Test Audi A5 scenario: 187 cars → 4 pages
    const { rerender } = render(
      <EnhancedPagination
        currentPage={4}
        totalPages={4}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.getByText(/Page 4 of 4/)).toBeInTheDocument();
    expect(screen.getByTitle('Last page')).toBeDisabled();
    expect(screen.getByText('Next')).toBeDisabled();
    
    // Test large dataset scenario: 180,000 cars → 3,600 pages
    rerender(
      <EnhancedPagination
        currentPage={1800}
        totalPages={3600}
        onPageChange={mockOnPageChange}
      />
    );
    
    expect(screen.getByText(/Page 1,800 of 3,600/)).toBeInTheDocument();
    expect(screen.getByTitle('First page')).not.toBeDisabled();
    expect(screen.getByTitle('Last page')).not.toBeDisabled();
  });
});