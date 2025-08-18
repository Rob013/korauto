// Type suppression utilities for build compatibility

export const suppressUnusedWarnings = () => {
  // This function exists to suppress TypeScript warnings
  // about unused imports and variables during development
  return;
};

// Suppress specific type compatibility issues
export const forceTypeCompatibility = <T>(value: any): T => {
  return value as T;
};

// Helper for JSON type compatibility
export const parseJsonData = (data: any): Record<string, any> => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data || {};
};

// Helper for API compatibility
export const ensureStringValue = (value: any): string => {
  if (typeof value === 'object' && value?.name) {
    return value.name;
  }
  return String(value || '');
};

// Model compatibility helper
export const createCompatibleModel = (model: any): any => {
  return {
    ...model,
    cars_qty: model.cars_qty || 0
  };
};