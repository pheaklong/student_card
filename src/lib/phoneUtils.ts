/**
 * Khmer Phone Number Utility
 * Ensures all Cambodian phone numbers have a leading '0'
 * Handles cases where Excel or users omit the leading '0' (e.g. 97554321 -> 097 554 321)
 */

export function formatPhoneNumber(raw?: string): string {
  if (!raw) return '';
  const str = String(raw).trim();
  if (!str) return '';

  // Extract only digits
  let digits = str.replace(/[^0-9]/g, '');
  if (!digits) return str;

  // Handle +855 or 855 country code
  if (digits.startsWith('855') && digits.length >= 11) {
    digits = '0' + digits.slice(3);
  }

  // If missing leading 0 (common when Excel treats phone numbers as integers)
  // Cambodian phone numbers are 8-9 digits without '0', or 9-10 digits with '0'
  if (!digits.startsWith('0')) {
    digits = '0' + digits;
  }

  // Format spacing nicely for readability
  // 9 digits (012 345 678) or 10 digits (097 554 3210 or 012 345 6789)
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (digits.length === 8) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  }

  return digits;
}

/**
 * Returns raw digits with leading 0 for display or storage
 */
export function normalizePhoneDigits(raw?: string): string {
  if (!raw) return '';
  const formatted = formatPhoneNumber(raw);
  return formatted.replace(/\s+/g, '');
}

/**
 * Returns a clean phone string suitable for tel: links (digits only)
 */
export function cleanPhoneNumber(raw?: string): string {
  if (!raw) return '';
  const formatted = formatPhoneNumber(raw);
  return formatted.replace(/[^0-9]/g, '');
}

/**
 * Generates Telegram link with international +855 format
 */
export function getTelegramUrl(raw?: string): string {
  if (!raw) return '#';
  const clean = cleanPhoneNumber(raw);
  if (!clean) return '#';

  let intlNumber = clean;
  if (clean.startsWith('0')) {
    intlNumber = '855' + clean.slice(1);
  } else if (!clean.startsWith('855')) {
    intlNumber = '855' + clean;
  }

  return `https://t.me/+${intlNumber}`;
}
