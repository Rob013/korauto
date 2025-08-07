// Shared car interfaces to reduce duplication across components

export interface BaseCarProps {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  vin?: string;
  mileage?: string;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot?: string;
  title?: string;
  status?: number;
  sale_status?: string;
  final_price?: number;
}

export interface InsuranceInfo {
  accident_history?: string;
  repair_count?: string;
  total_loss?: string;
  repair_cost?: string;
  flood_damage?: string;
  own_damage?: string;
  other_damage?: string;
}

export interface InsuranceV2Info {
  myAccidentCnt?: number;
  otherAccidentCnt?: number;
  ownerChangeCnt?: number;
  accidentCnt?: number;
}

export interface CarDetails {
  seats_count?: number;
  cylinders?: number;
  trim_level?: string;
}

export interface EnhancedCarProps extends BaseCarProps {
  location?: string;
  isNew?: boolean;
  isCertified?: boolean;
  cylinders?: number;
  insurance?: InsuranceInfo;
  insurance_v2?: InsuranceV2Info;
  details?: CarDetails;
}

// Car status utilities
export const getStatusColor = (status?: number, sale_status?: string) => {
  if (status === 3 || sale_status === 'sold') return 'bg-red-100 text-red-800';
  if (status === 2 || sale_status === 'pending') return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

export const getStatusText = (status?: number, sale_status?: string) => {
  if (status === 3 || sale_status === 'sold') return 'Sold';
  if (status === 2 || sale_status === 'pending') return 'Pending';
  return 'Available';
};

// Price formatting utility
export const formatPrice = (price: number, final_price?: number) => {
  const displayPrice = final_price || price;
  return displayPrice ? displayPrice.toLocaleString() : 'Contact for price';
};

// Mileage formatting utility
export const formatMileage = (mileage?: string) => {
  if (!mileage) return 'Unknown';
  const numericMileage = parseInt(mileage.replace(/[^\d]/g, ''));
  return isNaN(numericMileage) ? mileage : `${numericMileage.toLocaleString()} km`;
};