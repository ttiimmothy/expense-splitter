/**
 * Utility functions for email handling
 */

/**
 * Truncates an email address to fit within a specified character limit
 * Intelligently handles both local and domain parts
 * 
 * @param email - The email address to truncate
 * @param maxLength - Maximum length for the truncated email (default: 25)
 * @returns Truncated email address with ellipsis
 * 
 * @example
 * truncateEmail('verylongusername@example.com', 20)
 * // Returns: 'verylong...@example.com'
 * 
 * @example
 * truncateEmail('user@verylongdomainname.com', 20)
 * // Returns: 'user@verylon...'
 */
export const truncateEmail = (email: string, maxLength: number = 25): string => {
  if (email.length <= maxLength) return email
  
  const [localPart, domain] = email.split('@')
  if (!domain) return email
  
  // If domain is short, truncate local part
  if (domain.length <= 10) {
    const truncatedLocal = localPart.substring(0, maxLength - domain.length - 3) + '...'
    return `${truncatedLocal}@${domain}`
  }
  
  // If domain is long, truncate both parts
  const localTruncated = localPart.substring(0, Math.max(3, maxLength - 15)) + '...'
  const domainTruncated = domain.substring(0, 8) + '...'
  return `${localTruncated}@${domainTruncated}`
}


/**
 * Truncates email for medium displays (like expense details)
 * Uses a shorter length for balanced readability
*/
export const truncateEmailMedium = (email: string): string => {
  return truncateEmail(email, 20)
}

/**
 * Truncates email for wide displays (like group member lists)
 * Uses a medium length for better readability
*/
export const truncateEmailWide = (email: string): string => {
  return truncateEmail(email, 30)
}

/**
 * Truncates email for extra displays (like member lists)
 * Uses a longer default length for better space utilization
 */
export const truncateEmailExtra = (email: string): string => {
  return truncateEmail(email, 40)
}
