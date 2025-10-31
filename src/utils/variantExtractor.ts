/**
 * Extract vehicle variant from title or model string
 * Examples: 
 *   "A-Class W177 A220 Hatchback" -> "220"
 *   "C-Class W205 C220d" -> "220d"
 *   "E 200 d 4MATIC" -> "200d 4MATIC"
 *   "A-klasse 260920" -> "200" (numeric code extraction)
 */
export const extractVariant = (title?: string, model?: string): string | null => {
  if (!title && !model) return null;
  
  const text = title || model || '';
  
  // Pattern 1: After W-code (e.g., "W177 A220" -> "220", "W205 C220d" -> "220d")
  // This handles full titles like "A-Class W177 A220 Hatchback"
  const patternAfterWCode = /W\d{3}\s+[A-Z]?(\d{3}[a-z]?(?:\s*4MATIC)?)/i;
  const matchWCode = text.match(patternAfterWCode);
  if (matchWCode) {
    return matchWCode[1].replace(/\s+/g, '').trim();
  }
  
  // Pattern 2: Letter followed by numbers and optional d/i/e (e.g., "A220", "C220d")
  const patternLetterNumber = /[A-Z](\d{3}[die]?(?:\s*4MATIC)?)/i;
  const matchLetterNumber = text.match(patternLetterNumber);
  if (matchLetterNumber) {
    return matchLetterNumber[1].replace(/\s+/g, '').trim();
  }
  
  // Pattern 3: Numbers with space and optional d/i/e and 4MATIC (e.g., "220 d 4MATIC", "200 d")
  const patternSpacedNumber = /\b(\d{3})\s+(d|i|e)(?:\s+(4MATIC))?\b/i;
  const matchSpaced = text.match(patternSpacedNumber);
  if (matchSpaced) {
    const variant = matchSpaced[1] + matchSpaced[2];
    return matchSpaced[3] ? `${variant} ${matchSpaced[3]}` : variant;
  }
  
  // Pattern 4: Just numbers with optional d/i/e (e.g., "220d", "200i")
  const patternJustNumber = /\b(\d{3}[die]?)\b/i;
  const matchJust = text.match(patternJustNumber);
  if (matchJust) {
    return matchJust[1].trim();
  }
  
  // Pattern 5: Model codes like "260920" -> extract first 3 digits as variant
  const patternNumericCode = /^(\d{3})\d+$/;
  const matchNumeric = text.match(patternNumericCode);
  if (matchNumeric) {
    return matchNumeric[1];
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
