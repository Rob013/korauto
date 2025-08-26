import { ParsedUrlQuery } from 'querystring';

export interface APIFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  grade_iaai?: string;
  trim_level?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  search?: string;
  seats_count?: string;
  max_accidents?: string;
  per_page?: string;
}

export const defaultFilters: APIFilters = {
  manufacturer_id: 'all',
  model_id: '',
  generation_id: '',
  grade_iaai: 'all',
  trim_level: '',
  color: '',
  fuel_type: '',
  transmission: '',
  body_type: '',
  odometer_from_km: '',
  odometer_to_km: '',
  from_year: '',
  to_year: '',
  buy_now_price_from: '',
  buy_now_price_to: '',
  search: '',
  seats_count: '',
  max_accidents: '',
  per_page: '50'
};

export const buildBuyNowQueryParams = (filters: APIFilters): string => {
  const params = new URLSearchParams();

  if (filters.manufacturer_id && filters.manufacturer_id !== 'all') {
    params.append('manufacturer_id', filters.manufacturer_id);
  }
  if (filters.model_id) {
    params.append('model_id', filters.model_id);
  }
  if (filters.generation_id) {
    params.append('generation_id', filters.generation_id);
  }
  if (filters.grade_iaai && filters.grade_iaai !== 'all') {
    params.append('grade_iaai', filters.grade_iaai);
  }
  if (filters.trim_level) {
    params.append('trim_level', filters.trim_level);
  }
  if (filters.color) {
    params.append('color', filters.color);
  }
  if (filters.fuel_type) {
    params.append('fuel_type', filters.fuel_type);
  }
  if (filters.transmission) {
    params.append('transmission', filters.transmission);
  }
  if (filters.body_type) {
    params.append('body_type', filters.body_type);
  }
  if (filters.odometer_from_km) {
    params.append('odometer_from_km', filters.odometer_from_km);
  }
  if (filters.odometer_to_km) {
    params.append('odometer_to_km', filters.odometer_to_km);
  }
  if (filters.from_year) {
    params.append('from_year', filters.from_year);
  }
  if (filters.to_year) {
    params.append('to_year', filters.to_year);
  }
  if (filters.buy_now_price_from) {
    params.append('buy_now_price_from', filters.buy_now_price_from);
  }
  if (filters.buy_now_price_to) {
    params.append('buy_now_price_to', filters.buy_now_price_to);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
   if (filters.seats_count) {
    params.append('seats_count', filters.seats_count);
  }
  if (filters.max_accidents) {
    params.append('max_accidents', filters.max_accidents);
  }
  if (filters.per_page) {
    params.append('per_page', filters.per_page);
  }

  return params.toString();
};

export const parseBuyNowQueryParams = (query: ParsedUrlQuery): APIFilters => {
  const filters: APIFilters = {};

  if (query.manufacturer_id) {
    filters.manufacturer_id = String(query.manufacturer_id);
  }
  if (query.model_id) {
    filters.model_id = String(query.model_id);
  }
  if (query.generation_id) {
    filters.generation_id = String(query.generation_id);
  }
  if (query.grade_iaai) {
    filters.grade_iaai = String(query.grade_iaai);
  }
  if (query.trim_level) {
    filters.trim_level = String(query.trim_level);
  }
  if (query.color) {
    filters.color = String(query.color);
  }
  if (query.fuel_type) {
    filters.fuel_type = String(query.fuel_type);
  }
  if (query.transmission) {
    filters.transmission = String(query.transmission);
  }
  if (query.body_type) {
    filters.body_type = String(query.body_type);
  }
  if (query.odometer_from_km) {
    filters.odometer_from_km = String(query.odometer_from_km);
  }
  if (query.odometer_to_km) {
    filters.odometer_to_km = String(query.odometer_to_km);
  }
  if (query.from_year) {
    filters.from_year = String(query.from_year);
  }
  if (query.to_year) {
    filters.to_year = String(query.to_year);
  }
  if (query.buy_now_price_from) {
    filters.buy_now_price_from = String(query.buy_now_price_from);
  }
  if (query.buy_now_price_to) {
    filters.buy_now_price_to = String(query.buy_now_price_to);
  }
  if (query.search) {
    filters.search = String(query.search);
  }
  if (query.seats_count) {
    filters.seats_count = String(query.seats_count);
  }
  if (query.max_accidents) {
    filters.max_accidents = String(query.max_accidents);
  }
   if (query.per_page) {
    filters.per_page = String(query.per_page);
  }

  return filters;
};
