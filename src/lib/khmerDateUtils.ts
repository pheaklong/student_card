/**
 * Khmer Date Utilities
 * Accurately formats and parses Khmer dates, numbers, and full date representations (ថ្ងៃខែពេញ).
 */

const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const ARABIC_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const KHMER_MONTHS = [
  'មករា',     // 1 - January
  'កុម្ភៈ',    // 2 - February
  'មីនា',      // 3 - March
  'មេសា',     // 4 - April
  'ឧសភា',     // 5 - May
  'មិថុនា',    // 6 - June
  'កក្កដា',    // 7 - July
  'សីហា',     // 8 - August
  'កញ្ញា',     // 9 - September
  'តុលា',     // 10 - October
  'វិច្ឆិកា',   // 11 - November
  'ធ្នូ',       // 12 - December
];

/**
 * Converts Arabic digits to Khmer digits (e.g. 2008 -> ២០០៨).
 */
export function toKhmerDigits(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === '') return '';
  return String(val).replace(/[0-9]/g, (d) => KHMER_DIGITS[parseInt(d, 10)]);
}

/**
 * Converts Khmer digits to Arabic digits (e.g. ២០០៨ -> 2008).
 */
export function toArabicDigits(val: string | undefined | null): string {
  if (!val) return '';
  let res = String(val);
  KHMER_DIGITS.forEach((kd, i) => {
    res = res.replaceAll(kd, ARABIC_DIGITS[i]);
  });
  return res;
}

/**
 * Parses any date format (Khmer, ISO, DD-MM-YYYY, DD/MM/YYYY) into day, month, year.
 */
export function parseDateComponents(dateStr: string | undefined | null): { day: number; month: number; year: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleanStr = toArabicDigits(dateStr.trim());

  // Pattern 0: Excel serial date code (e.g. 40955, 40857, or Khmer numerals ៤០៩៥៥)
  const serialMatch = cleanStr.match(/^(\d{4,5})(?:\.\d+)?$/);
  if (serialMatch) {
    const num = Math.floor(parseFloat(serialMatch[0]));
    // Typical Excel date serials for birth dates (10000 = 1927 up to 85000 = 2132)
    if (num >= 10000 && num <= 85000) {
      let days = num;
      if (days > 60) days--; // fix 1900 leap year bug
      const baseDate = new Date(Date.UTC(1900, 0, 1));
      const targetDate = new Date(baseDate.getTime() + (days - 1) * 86400000);
      return {
        year: targetDate.getUTCFullYear(),
        month: targetDate.getUTCMonth() + 1,
        day: targetDate.getUTCDate(),
      };
    }
  }

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = cleanStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10),
      day: parseInt(isoMatch[3], 10),
    };
  }

  // Pattern 2: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = cleanStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    return {
      day: parseInt(dmyMatch[1], 10),
      month: parseInt(dmyMatch[2], 10),
      year: parseInt(dmyMatch[3], 10),
    };
  }

  // Pattern 3: Khmer Month Name inside string (e.g. "១៥ សីហា ២០០៨" or "ថ្ងៃទី១៥ ខែសីហា ឆ្នាំ២០០៨")
  for (let m = 0; m < KHMER_MONTHS.length; m++) {
    const monthName = KHMER_MONTHS[m];
    if (dateStr.includes(monthName)) {
      const nums = cleanStr.match(/\d+/g);
      if (nums && nums.length >= 2) {
        return {
          day: parseInt(nums[0], 10),
          month: m + 1,
          year: parseInt(nums[nums.length - 1], 10),
        };
      }
    }
  }

  return null;
}

/**
/**
 * Formats a student date of birth into standardized Khmer full date or clean digits.
 * If the input date already contains Khmer words (ថ្ងៃ, ខែ, ឆ្នាំ, or month name),
 * it preserves the full date with clean Khmer digits.
 * e.g. "ថ្ងៃទី១៥ ខែសីហា ឆ្នាំ២០០៨" -> "ថ្ងៃទី១៥ ខែសីហា ឆ្នាំ២០០៨"
 * e.g. "15-08-2008" -> "១៥-០៨-២០០៨"
 */
export function formatKhmerDob(
  dateStr: string | undefined | null,
  style: 'digits' | 'words' | 'full' = 'digits'
): string {
  if (!dateStr || typeof dateStr !== 'string') return '-';
  const trimmed = dateStr.trim();
  if (!trimmed) return '-';

  // If the string already has full Khmer date words, preserve it with Khmer numerals
  const hasKhmerWords =
    trimmed.includes('ថ្ងៃ') ||
    trimmed.includes('ខែ') ||
    trimmed.includes('ឆ្នាំ') ||
    trimmed.includes('ព.ស') ||
    KHMER_MONTHS.some((m) => trimmed.includes(m));

  if (hasKhmerWords) {
    return toKhmerDigits(trimmed);
  }

  const parsed = parseDateComponents(trimmed);
  if (!parsed) {
    return toKhmerDigits(trimmed);
  }

  const dayStr = String(parsed.day).padStart(2, '0');
  const monthStr = String(parsed.month).padStart(2, '0');
  const monthName = KHMER_MONTHS[parsed.month - 1] || monthStr;

  if (style === 'words') {
    return `${toKhmerDigits(dayStr)} ${monthName} ${toKhmerDigits(parsed.year)}`;
  }

  if (style === 'full') {
    return `ថ្ងៃទី${toKhmerDigits(dayStr)} ខែ${monthName} ឆ្នាំ${toKhmerDigits(parsed.year)}`;
  }

  // Default 'digits': ១៥-០៨-២០០៨
  return `${toKhmerDigits(dayStr)}-${toKhmerDigits(monthStr)}-${toKhmerDigits(parsed.year)}`;
}
