import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createVirtualScrollConfig } from '@/utils/performance';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
}

/**
 * Virtual scrolling component for performance with large lists
 */
export function VirtualScroll<T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5,
  onScroll
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate virtual scroll configuration
  const config = useMemo(() => 
    createVirtualScrollConfig(itemHeight, containerHeight), 
    [itemHeight, containerHeight]
  );

  // Calculate visible range with overscan
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + config.visibleCount + config.overscan,
      items.length
    );
    
    return {
      start: Math.max(0, startIndex - overscan),
      end: endIndex
    };
  }, [scrollTop, itemHeight, config, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  // Handle scroll events with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={actualIndex}
                style={{ height: itemHeight }}
                className="virtual-scroll-item"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing virtual scroll state
 */
export const useVirtualScroll = <T,>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const config = useMemo(() => 
    createVirtualScrollConfig(itemHeight, containerHeight), 
    [itemHeight, containerHeight]
  );

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + config.visibleCount + config.overscan,
      items.length
    );
    
    return {
      start: Math.max(0, startIndex - config.bufferSize),
      end: endIndex
    };
  }, [scrollTop, itemHeight, config, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const scrollToIndex = useCallback((index: number) => {
    const scrollPosition = index * itemHeight;
    setScrollTop(scrollPosition);
    return scrollPosition;
  }, [itemHeight]);

  const scrollToTop = useCallback(() => {
    setScrollTop(0);
  }, []);

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    visibleItems,
    scrollToIndex,
    scrollToTop,
    totalHeight: items.length * itemHeight,
    offsetY: visibleRange.start * itemHeight
  };
};

/**
 * Grid virtual scroll component for car catalogs
 */
interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  itemWidth: number;
  containerHeight: number;
  containerWidth: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  gap?: number;
}

export function VirtualGrid<T,>({
  items,
  itemHeight,
  itemWidth,
  containerHeight,
  containerWidth,
  renderItem,
  className = '',
  gap = 16
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate columns that fit in container
  const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const actualItemWidth = (containerWidth - (columnsPerRow - 1) * gap) / columnsPerRow;
  
  // Calculate rows
  const totalRows = Math.ceil(items.length / columnsPerRow);
  const rowHeight = itemHeight + gap;
  
  // Calculate visible range
  const startRow = Math.floor(scrollTop / rowHeight);
  const visibleRows = Math.ceil(containerHeight / rowHeight) + 2; // +2 for overscan
  const endRow = Math.min(startRow + visibleRows, totalRows);
  
  // Get visible items
  const visibleItems = useMemo(() => {
    const start = startRow * columnsPerRow;
    const end = Math.min(endRow * columnsPerRow, items.length);
    return items.slice(start, end).map((item, index) => ({
      item,
      globalIndex: start + index,
      row: Math.floor((start + index) / columnsPerRow),
      col: (start + index) % columnsPerRow
    }));
  }, [items, startRow, endRow, columnsPerRow]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = totalRows * rowHeight;
  const offsetY = startRow * rowHeight;

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columnsPerRow}, 1fr)`,
            gap: `${gap}px`,
          }}
        >
          {visibleItems.map(({ item, globalIndex, row, col }) => (
            <div
              key={globalIndex}
              style={{ 
                height: itemHeight,
                width: actualItemWidth
              }}
            >
              {renderItem(item, globalIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualScroll;