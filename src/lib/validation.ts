import { z } from "zod";
import DOMPurify from "dompurify";

// Validation schemas
export const inspectionFormSchema = z.object({
  firstName: z
    .string()
    .min(1, "Emri është i detyrueshëm")
    .max(50, "Emri nuk mund të jetë më shumë se 50 karaktere")
    .regex(/^[a-zA-ZëËçÇ\s\-']+$/, "Emri mund të përmbajë vetëm shkronja, hapësira dhe vizë"),
  lastName: z
    .string()
    .min(1, "Mbiemri është i detyrueshëm")
    .max(50, "Mbiemri nuk mund të jetë më shumë se 50 karaktere")
    .regex(/^[a-zA-ZëËçÇ\s\-']+$/, "Mbiemri mund të përmbajë vetëm shkronja, hapësira dhe vizë"),
  email: z
    .string()
    .min(1, "Email është i detyrueshëm")
    .max(254, "Email është shumë i gjatë")
    .email("Format i pavlefshëm i email-it"),
  whatsappPhone: z
    .string()
    .min(1, "Numri i telefonit është i detyrueshëm")
    .max(20, "Numri i telefonit është shumë i gjatë")
    .regex(/^\+?[1-9]\d{1,14}$/, "Format i pavlefshëm i numrit të telefonit (përdorni format ndërkombëtar)"),
});

export type InspectionFormData = z.infer<typeof inspectionFormSchema>;

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input.trim(), { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

export const sanitizeFormData = (data: InspectionFormData): InspectionFormData => {
  return {
    firstName: sanitizeInput(data.firstName),
    lastName: sanitizeInput(data.lastName),
    email: sanitizeInput(data.email),
    whatsappPhone: sanitizeInput(data.whatsappPhone),
  };
};

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export const checkRateLimit = (identifier: string, maxRequests = 3, windowMs = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now - record.lastReset > windowMs) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Security headers for content
export const securityConfig = {
  // Content Security Policy directives
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://wa.me"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  }
};