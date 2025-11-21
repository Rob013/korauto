/**
 * Safe string operations utility
 * Prevents "toLowerCase is not a function" errors
 */

/**
 * Safely converts a value to lowercase string
 * @param value - Any value that should be converted to lowercase
 * @param defaultValue - Value to return if conversion fails (default: empty string)
 * @returns Lowercase string or default value
 */
export const safeToLowerCase = (value: unknown, defaultValue: string = ''): string => {
    if (value === null || value === undefined) {
        return defaultValue;
    }

    if (typeof value === 'string') {
        return value.toLowerCase();
    }

    try {
        return String(value).toLowerCase();
    } catch {
        return defaultValue;
    }
};

/**
 * Safely converts a value to uppercase string
 * @param value - Any value that should be converted to uppercase
 * @param defaultValue - Value to return if conversion fails (default: empty string)
 * @returns Uppercase string or default value
 */
export const safeToUpperCase = (value: unknown, defaultValue: string = ''): string => {
    if (value === null || value === undefined) {
        return defaultValue;
    }

    if (typeof value === 'string') {
        return value.toUpperCase();
    }

    try {
        return String(value).toUpperCase();
    } catch {
        return defaultValue;
    }
};

/**
 * Safely trims a string
 * @param value - Value to trim
 * @param defaultValue - Value to return if trimming fails (default: empty string)
 * @returns Trimmed string or default value
 */
export const safeTrim = (value: unknown, defaultValue: string = ''): string => {
    if (value === null || value === undefined) {
        return defaultValue;
    }

    if (typeof value === 'string') {
        return value.trim();
    }

    try {
        return String(value).trim();
    } catch {
        return defaultValue;
    }
};

/**
 * Safely converts value to string
 * @param value - Value to convert
 * @param defaultValue - Value to return if conversion fails (default: empty string)
 * @returns String representation or default value
 */
export const safeString = (value: unknown, defaultValue: string = ''): string => {
    if (value === null || value === undefined) {
        return defaultValue;
    }

    if (typeof value === 'string') {
        return value;
    }

    try {
        return String(value);
    } catch {
        return defaultValue;
    }
};

/**
 * Normalize a string for comparison (trim and lowercase)
 * @param value - Value to normalize
 * @param defaultValue - Value to return if normalization fails (default: empty string)
 * @returns Normalized string or default value
 */
export const normalizeString = (value: unknown, defaultValue: string = ''): string => {
    return safeToLowerCase(safeTrim(value, defaultValue), defaultValue);
};
