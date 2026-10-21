/**
 * Message filtering utilities to prevent spam, links, and inappropriate content
 */

// Regex patterns for detecting URLs and links
const URL_PATTERNS = [
  // Standard URLs with protocol
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
  
  // URLs without protocol
  /(?:^|\s)(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
  
  // Detect common TLDs at end of words
  /\b\w+\.(com|net|org|fi|se|no|dk|io|app|co|uk|de|fr|es|it|ru|jp|cn|in|br|au|ca|nl|be|ch|at|pl|cz)\b/gi,
  
  // Detect email-like patterns
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  
  // Detect bit.ly style short URLs
  /\b[a-z]{2,}\.[a-z]{2,3}\/[a-zA-Z0-9]+\b/gi,
]

// Additional patterns for obfuscated links
const OBFUSCATED_PATTERNS = [
  // Spaces in URLs: "google . com"
  /\b\w+\s*\.\s*(?:com|net|org|fi|se|io)\b/gi,
  
  // Brackets/parentheses around dots: "google(.)com"
  /\b\w+[\(\[\{]\s*\.\s*[\)\]\}](?:com|net|org|fi|se|io)\b/gi,
  
  // "dot" written out: "google dot com"
  /\b\w+\s+(?:dot|piste)\s+(?:com|net|org|fi|se|io)\b/gi,
]

/**
 * Check if a message contains URLs or links
 */
export function containsURL(text: string): boolean {
  if (!text || typeof text !== "string") return false
  
  // Check standard URL patterns
  for (const pattern of URL_PATTERNS) {
    if (pattern.test(text)) {
      return true
    }
  }
  
  // Check obfuscated patterns
  for (const pattern of OBFUSCATED_PATTERNS) {
    if (pattern.test(text)) {
      return true
    }
  }
  
  return false
}

/**
 * Validate a message before sending
 */
export function validateMessage(text: string): { valid: boolean; error?: string } {
  // Check for empty message
  if (!text || text.trim().length === 0) {
    return { valid: false, error: "Viesti on tyhjä" }
  }
  
  // Check for URLs
  if (containsURL(text)) {
    return { valid: false, error: "Linkkien jakaminen ei ole sallittua chatissa" }
  }
  
  // Check message length (max 1000 characters)
  if (text.length > 1000) {
    return { valid: false, error: "Viesti on liian pitkä (max 1000 merkkiä)" }
  }
  
  return { valid: true }
}

/**
 * Sanitize message text (remove potentially dangerous content)
 */
export function sanitizeMessage(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .slice(0, 1000) // Ensure max length
}
