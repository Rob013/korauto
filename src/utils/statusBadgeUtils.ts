/**
 * Utility functions for car status badges
 */

export interface StatusBadgeConfig {
  text: string;
  className: string;
  show: boolean;
}

export interface CarStatus {
  status?: number | string;
  sale_status?: string;
}

/**
 * Determines the appropriate status badge configuration based on car status
 * @param carStatus - Object containing status and sale_status properties  
 * @returns StatusBadgeConfig object with text, className, and show properties
 */
export function getStatusBadgeConfig(carStatus: CarStatus): StatusBadgeConfig {
  const { status, sale_status } = carStatus;

  // Normalize status to number for consistent comparison
  const numericStatus = typeof status === 'string' ? parseInt(status, 10) : status;

  // Priority order: sold > reserved > pending > available (no badge)
  
  // 🔴 SOLD - Red background badges for sold cars (status=3 or sale_status='sold')
  if (numericStatus === 3 || sale_status === 'sold') {
    return {
      text: 'SOLD',
      className: 'bg-red-600 text-white border-red-700',
      show: true
    };
  }

  // 🟠 RESERVED - Orange background badges for reserved cars (sale_status='reserved')
  if (sale_status === 'reserved') {
    return {
      text: 'RESERVED',
      className: 'bg-orange-600 text-white border-orange-700',
      show: true
    };
  }

  // 🟡 PENDING - Yellow background badges for pending sales (status=2 or sale_status='pending')
  if (numericStatus === 2 || sale_status === 'pending') {
    return {
      text: 'PENDING',
      className: 'bg-yellow-600 text-black border-yellow-700',
      show: true
    };
  }

  // ✅ AVAILABLE - No badge shown for available cars (default state)
  return {
    text: '',
    className: '',
    show: false
  };
}