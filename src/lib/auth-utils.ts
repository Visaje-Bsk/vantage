/**
 * Utility functions for authentication
 */

/**
 * Convert username to internal email format
 * @param username - The username (lowercase, alphanumeric with ., _, -)
 * @returns Internal email format for Supabase Auth
 */
export function toEmail(username: string): string {
  return `${username.toLowerCase().trim()}@erp.local`;
}

/**
 * Extract username from internal email format
 * @param email - Internal email format
 * @returns Username without domain
 */
export function fromEmail(email: string): string {
  return email.replace('@erp.local', '');
}

/**
 * Validate username format
 * @param username - Username to validate
 * @returns True if valid, false otherwise
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-z0-9._-]{3,32}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns True if valid, false otherwise
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Sanitize username to lowercase and trim
 * @param username - Username to sanitize
 * @returns Sanitized username
 */
export function sanitizeUsername(username: string): string {
  return username.toLowerCase().trim();
}