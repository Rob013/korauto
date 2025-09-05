/**
 * Utility functions for car status management
 */

export type CarStatus = 'available' | 'sold' | 'pending' | 'reserved';

export interface CarStatusInfo {
  status: CarStatus;
  label: string;
  colorClass: string;
  shouldShow: boolean;
}

export interface CarStatusProps {
  status?: number;
  sale_status?: string;
  is_archived?: boolean;
  archived_at?: string;
  archive_reason?: string;
}

/**
 * Determines the current status of a car based on various status fields
 */
export function getCarStatus(car: CarStatusProps): CarStatusInfo {
  // Check if car is sold
  if (car.status === 3 || car.sale_status === 'sold') {
    return {
      status: 'sold',
      label: 'SOLD',
      colorClass: 'bg-red-600 text-white',
      shouldShow: true
    };
  }

  // Check if car is pending
  if (car.status === 2 || car.sale_status === 'pending') {
    return {
      status: 'pending',
      label: 'PENDING',
      colorClass: 'bg-yellow-600 text-white',
      shouldShow: true
    };
  }

  // Check if car is reserved
  if (car.sale_status === 'reserved') {
    return {
      status: 'reserved',
      label: 'RESERVED',
      colorClass: 'bg-orange-600 text-white',
      shouldShow: true
    };
  }

  // Default to available - don't show badge for available cars
  return {
    status: 'available',
    label: 'AVAILABLE',
    colorClass: 'bg-green-600 text-white',
    shouldShow: false // Don't show "available" badge as it's the default state
  };
}

/**
 * Checks if a sold car should be hidden based on 24-hour rule
 */
export function shouldHideSoldCar(car: CarStatusProps): boolean {
  // Only hide if it's definitively a sold car that's clearly old
  if (car.is_archived && car.archived_at && car.archive_reason === 'sold') {
    try {
      const archivedTime = new Date(car.archived_at);
      
      // Check if date is valid
      if (isNaN(archivedTime.getTime())) {
        return true; // Hide cars with invalid dates as safety measure
      }
      
      const now = new Date();
      const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
      
      // Only hide if clearly over 24 hours (with small buffer for timing differences)
      return hoursSinceArchived > 24.5; // 30-minute buffer to account for timing differences
    } catch (error) {
      // In case of any error, hide the car as a safety measure
      return true;
    }
  }
  
  // Default: show the car (trust database filtering)
  return false;
}

/**
 * Gets the appropriate status badge text based on language/locale
 */
export function getLocalizedStatusLabel(status: CarStatus, locale: 'en' | 'sq' = 'en'): string {
  const labels = {
    en: {
      sold: 'SOLD',
      pending: 'PENDING',
      reserved: 'RESERVED',
      available: 'AVAILABLE'
    },
    sq: {
      sold: 'E SHITUR',
      pending: 'NË PRITJE',
      reserved: 'E REZERVUAR',
      available: 'E DISPONUESHME'
    }
  };

  return labels[locale][status];
}