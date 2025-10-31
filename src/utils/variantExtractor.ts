/**
 * Extract vehicle variant from title or model string
 * Examples: "A-Class W177 A220 Hatchback" -> "220"
 *           "C 220 d" -> "220d"
 *           "E 200 d 4MATIC" -> "200d 4MATIC"
 */
export const extractVariant = (title?: string, model?: string): string | null => {
  if (!title && !model) return null;
  
  const text = title || model || '';
  
  // Common patterns for Mercedes variants: A220, C220d, E200, etc.
  // Pattern 1: Letter followed by numbers and optional d/i (e.g., "A220", "C220d")
  const pattern1 = /[A-Z](\d{3}(?:d|i|e)?(?:\s*4MATIC)?)/i;
  const match1 = text.match(pattern1);
  if (match1) {
    return match1[1].trim();
  }
  
  // Pattern 2: Numbers with optional d/i and 4MATIC (e.g., "220 d", "200 d 4MATIC")
  const pattern2 = /\b(\d{3}(?:\s*d|\s*i|\s*e)?(?:\s*4MATIC)?)\b/i;
  const match2 = text.match(pattern2);
  if (match2) {
    return match2[1].replace(/\s+/g, ' ').trim();
  }
  
  // Pattern 3: Model codes like "260920" -> extract meaningful part
  const pattern3 = /(\d{3})\d+/;
  const match3 = text.match(pattern3);
  if (match3) {
    return match3[1];
  }
  
  return null;
};

/**
 * Format model name with variant
 * Examples: 
 *   "A-klasse" + "220d" -> "A-Class 220d"
 *   "C-klasse" + "200d 4MATIC" -> "C-Class 200d 4MATIC"
 */
export const formatModelWithVariant = (model: string, variant?: string | null): string => {
  if (!variant) return model;
  
  // Clean up model name (e.g., "A-klasse" -> "A-Class")
  let cleanModel = model
    .replace(/klasse/i, 'Class')
    .replace(/classe/i, 'Class')
    .trim();
  
  return `${cleanModel} ${variant}`;
};

/**
 * Get variant from car data
 * Checks multiple sources: title, grade, engine name
 */
export const getCarVariant = (carData: {
  car_data?: { title?: string };
  grade?: string;
  engine?: { name?: string };
  sale_title?: string;
  model?: string;
}): string | null => {
  // Try extracting from API title first (most reliable)
  if (carData.car_data?.title) {
    const variant = extractVariant(carData.car_data.title);
    if (variant) return variant;
  }
  
  // Try sale_title
  if (carData.sale_title) {
    const variant = extractVariant(carData.sale_title);
    if (variant) return variant;
  }
  
  // Try grade field
  if (carData.grade) {
    const variant = extractVariant(carData.grade);
    if (variant) return variant;
  }
  
  // Try engine name
  if (carData.engine?.name) {
    const variant = extractVariant(carData.engine.name);
    if (variant) return variant;
  }
  
  // Try model field as last resort
  if (carData.model) {
    const variant = extractVariant(carData.model);
    if (variant) return variant;
  }
  
  return null;
};
