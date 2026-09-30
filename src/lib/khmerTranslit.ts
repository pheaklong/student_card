/**
 * Khmer to Latin Name Transliteration Helper
 * Provides standard Romanization for Cambodian student names to ensure
 * cards maintain uniform layout even if Latin name wasn't explicitly entered.
 */

const KNOWN_STUDENT_NAMES: Record<string, string> = {
  'សុខ ចាន់ដារ៉ា': 'SOK CHANDARA',
  'កែវ សោភា': 'KEO SOPHEA',
  'ជា រតនា': 'CHEA RATTANA',
  'អ៊ុច ធីតា': 'UCH THIDA',
  'ហេង សុវណ្ណារិទ្ធ': 'HENG SOVANNARITH',
  'សាន គឹមសួរ': 'SAN KIMSOUR',
  'សុខ គឹមហុង': 'SOK KIMHONG',
  'ឡុង ស្រីមុំ': 'LONG SREYMOAM',
  'កែវ វិបុល': 'KEO VIBOL',
  'មាស សុផាត': 'MEAS SOPHAT',
  'ម៉ិច កន្នដ្ឋារ៉ា': 'MECH KANITHARA',
};

const KHMER_CONSONANTS: Record<string, string> = {
  'ក': 'K', 'ខ': 'KH', 'គ': 'K', 'ឃ': 'KH', 'ង': 'NG',
  'ច': 'CH', 'ឆ': 'CHH', 'ជ': 'CH', 'ឈ': 'CHH', 'ញ': 'NH',
  'ដ': 'D', 'ឋ': 'TH', 'ឌ': 'D', 'ឍ': 'TH', 'ណ': 'N',
  'ត': 'T', 'ថ': 'TH', 'ទ': 'T', 'ធ': 'TH', 'ន': 'N',
  'ប': 'B', 'ផ': 'PH', 'ព': 'P', 'ភ': 'PH', 'ម': 'M',
  'យ': 'Y', 'រ': 'R', 'ល': 'L', 'វ': 'V', 'ស': 'S',
  'ហ': 'H', 'ឡ': 'L', 'អ': 'A', 'ឣ': 'A', 'ឤ': 'A',
};

const KHMER_VOWELS: Record<string, string> = {
  'ា': 'A', 'ិ': 'I', 'ី': 'EY', 'ឹ': 'OE', 'ឺ': 'EU',
  'ុ': 'U', 'ូ': 'OU', 'ួ': 'UOR', 'ើ': 'AEU', 'ឿ': 'UEA',
  'ៀ': 'IE', 'េ': 'E', 'ែ': 'AE', 'ៃ': 'AI', 'ោ': 'AO',
  'ៅ': 'AU', 'ុំ': 'OM', 'ំ': 'OM', 'ាំ': 'AM', 'ះ': 'AH',
  'ុះ': 'OH', 'េះ': 'EH', 'ោះ': 'AOH',
};

export function transliterateKhmerToLatin(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (KNOWN_STUDENT_NAMES[trimmed]) {
    return KNOWN_STUDENT_NAMES[trimmed];
  }

  // Split words by spaces
  const words = trimmed.split(/\s+/);
  const romanizedWords = words.map((word) => {
    let out = '';
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (KHMER_CONSONANTS[char]) {
        out += KHMER_CONSONANTS[char];
      } else if (KHMER_VOWELS[char]) {
        out += KHMER_VOWELS[char];
      } else if (char === '្') {
        // Subscript sign - skip or take next consonant
        continue;
      } else if (/[a-zA-Z0-9]/.test(char)) {
        out += char.toUpperCase();
      }
    }
    return out || word;
  });

  return romanizedWords.join(' ').trim().toUpperCase();
}

export function getStudentLatinName(student: { full_name?: string; latin_name?: string }): string {
  if (student.latin_name && student.latin_name.trim()) {
    return student.latin_name.trim().toUpperCase();
  }
  if (student.full_name) {
    return transliterateKhmerToLatin(student.full_name);
  }
  return '';
}
