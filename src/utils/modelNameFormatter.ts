/**
 * Format BMW model names to full series names
 * Transforms: 1er → 1 SERIES, 2er → 2 SERIES, etc.
 */
export const formatBMWModelName = (modelName: string): string => {
  if (!modelName) return modelName;
  
  const bmwSeriesMap: Record<string, string> = {
    '1er': '1 SERIES',
    '2er': '2 SERIES',
    '3er': '3 SERIES',
    '4er': '4 SERIES',
    '5er': '5 SERIES',
    '6er': '6 SERIES',
    '7er': '7 SERIES',
    '8er': '8 SERIES',
  };
  
  // Check if it's a BMW series model that needs transformation
  const lowerModel = modelName.toLowerCase().trim();
  
  if (bmwSeriesMap[lowerModel]) {
    return bmwSeriesMap[lowerModel];
  }
  
  return modelName;
};

/**
 * Format model name for any manufacturer
 * Currently handles BMW series names, can be extended for other brands
 */
export const formatModelName = (modelName: string, manufacturerName?: string): string => {
  if (!modelName) return modelName;
  
  // Handle BMW models
  if (manufacturerName?.toLowerCase() === 'bmw') {
    return formatBMWModelName(modelName);
  }
  
  return modelName;
};
