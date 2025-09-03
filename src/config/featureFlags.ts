// Feature flags configuration for KorAuto
export interface FeatureFlags {
  READ_SOURCE: 'db' | 'external';
}

// Get feature flag from environment with defaults
export const getFeatureFlag = (flag: keyof FeatureFlags): FeatureFlags[keyof FeatureFlags] => {
  const envValue = import.meta.env[`VITE_${flag}`] || process.env[flag];
  
  switch (flag) {
    case 'READ_SOURCE':
      return (envValue as FeatureFlags['READ_SOURCE']) || 'db'; // Default to database-only
    default:
      throw new Error(`Unknown feature flag: ${flag}`);
  }
};

// Feature flag constants for easy access
export const FEATURE_FLAGS = {
  READ_SOURCE: getFeatureFlag('READ_SOURCE'),
} as const;

// Helper function to check if we're in database-only mode
export const isDbOnlyMode = (): boolean => {
  return FEATURE_FLAGS.READ_SOURCE === 'db';
};

// Helper function to check if external API calls are allowed
export const isExternalApiAllowed = (): boolean => {
  return FEATURE_FLAGS.READ_SOURCE === 'external';
};