import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SchoolSettings, Student, SupabaseConfig } from '../types';
import { DEFAULT_TEMPLATE_CONFIG } from './templatePresets';
import { getStudentLatinName } from './khmerTranslit';
import { formatKhmerDob } from './khmerDateUtils';
import { formatPhoneNumber } from './phoneUtils';

const STORAGE_KEY_SETTINGS = 'cambodia_student_id_school_settings';
const STORAGE_KEY_STUDENTS = 'cambodia_student_id_students';
const STORAGE_KEY_CONFIG = 'cambodia_student_id_supabase_config';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  school_name: 'វិទ្យាល័យ តាំងក្រូច',
  academic_year: 'ឆ្នាំសិក្សា ២០២៥-២០២៦',
  department_name: 'មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តកំពង់ចាម',
  ministry_name: 'ក្រសួងអប់រំ យុវជន និងកីឡា',
  contact_number: '095 858 545',
  principal_name: 'ម៉ិច កន្នដ្ឋារ៉ា',
  signature_url: '',
  logo_url: '',
  stamp_url: '',
  issue_date_lunar: 'ថ្ងៃព្រហស្បតិ៍ ៥កើត ខែមិគសិរ ឆ្នាំរោង ឆស័ក ព.ស. ២៥៦៨',
  issue_date_solar: 'ថ្ងៃទី១៥ ខែមករា ឆ្នាំ២០២៥',
  card_title: 'ប័ណ្ណសម្គាល់ខ្លួនសិស្ស',
  principal_title: 'នាយកវិទ្យាល័យ',
  school_address: 'ឃុំតាំងក្រូច ស្រុកមេមត់ ខេត្តត្បូងឃ្មុំ',
  qr_base_url: 'https://verify.moeys.gov.kh/student/',
  template_config: DEFAULT_TEMPLATE_CONFIG,
};

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's-1',
    student_id: 'ID-5997',
    full_name: 'សុខ ចាន់ដារ៉ា',
    latin_name: 'SOK CHANDARA',
    gender: 'ប្រុស',
    dob: '១៥-០៨-២០០៨',
    pob: 'ភូមិពាមរក៍ ស្រុកពាមរក៍ ខេត្តព្រៃវែង',
    grade: '11B',
    class_number: '8',
    father_name: 'សុខ គឹមហុង',
    mother_name: 'ឡុង ស្រីមុំ',
    photo_url: 'https://drive.google.com/file/d/1i6TuDtDfbxqa7PsAcyVxZ7c3X25kNRqY/view?usp=drivesdk',
    qr_code_data: 'https://verify.moeys.gov.kh/student/ID-5997',
    phone_number: '097 554 321',
    student_phone: '098 776 543',
    parent_phone: '097 554 321',
  },
  {
    id: 's-2',
    student_id: 'ID-5998',
    full_name: 'កែវ សោភា',
    latin_name: 'KEO SOPHEA',
    gender: 'ស្រី',
    dob: '០២-០៣-២០០៨',
    pob: 'សង្កាត់បឹងកក់១ ខណ្ឌទួលគោក រាជធានីភ្នំពេញ',
    grade: '11B',
    class_number: '8',
    father_name: 'កែវ វិបុល',
    mother_name: 'មាស សុផាត',
    photo_url: '',
    qr_code_data: 'https://verify.moeys.gov.kh/student/ID-5998',
    phone_number: '088 123 456',
    student_phone: '070 334 455',
    parent_phone: '088 123 456',
  },
  {
    id: 's-3',
    student_id: 'ID-5999',
    full_name: 'ជា រតនា',
    latin_name: 'CHEA RATTANA',
    gender: 'ប្រុស',
    dob: '១០-១១-២០០៧',
    pob: 'ឃុំរកាកោង ស្រុកមុខកំពូល ខេត្តកណ្តាល',
    grade: '11A',
    class_number: '5',
    father_name: 'ជា សុភ័ក្រ្ត',
    mother_name: 'ឃួន វ៉ាន់នី',
    photo_url: '',
    qr_code_data: 'https://verify.moeys.gov.kh/student/ID-5999',
    phone_number: '012 998 877',
    student_phone: '012 332 211',
    parent_phone: '012 998 877',
  },
  {
    id: 's-4',
    student_id: 'ID-6000',
    full_name: 'អ៊ុច ធីតា',
    latin_name: 'UCH THIDA',
    gender: 'ស្រី',
    dob: '២២-០៤-២០០៨',
    pob: 'ឃុំតាំងក្រូច ស្រុកមេមត់ ខេត្តត្បូងឃ្មុំ',
    grade: '11B',
    class_number: '8',
    father_name: 'អ៊ុច សំអាត',
    mother_name: 'សេង គឹមលី',
    photo_url: '',
    qr_code_data: 'https://verify.moeys.gov.kh/student/ID-6000',
    phone_number: '092 345 678',
    student_phone: '097 998 877',
    parent_phone: '092 345 678',
  },
  {
    id: 's-5',
    student_id: 'ID-6001',
    full_name: 'ហេង សុវណ្ណារិទ្ធ',
    latin_name: 'HENG SOVANNARITH',
    gender: 'ប្រុស',
    dob: '០៧-០៧-២០០៨',
    pob: 'ក្រុងសួង ខេត្តត្បូងឃ្មុំ',
    grade: '11C',
    class_number: '12',
    father_name: 'ហេង គឹមឡេង',
    mother_name: 'ប៉ែន សុជាតា',
    photo_url: '',
    qr_code_data: 'https://verify.moeys.gov.kh/student/ID-6001',
    phone_number: '070 889 900',
    student_phone: '096 112 233',
    parent_phone: '070 889 900',
  },
  {
    id: 's-6',
    student_id: 'ID-6002',
    full_name: 'សាន គឹមសួរ',
    latin_name: 'SAN KIMSOUR',
    gender: 'ស្រី',
    dob: '១៩-១២-២០០៨',
    pob: 'ស្រុកចំការលើ ខេត្តកំពង់ចាម',
    grade: '11B',
    class_number: '8',
    father_name: 'សាន វណ្ណា',
    mother_name: 'អ៊ុង ស្រីលក្ខណ៍',
    photo_url: '',
    qr_code_data: 'https://verify.moeys.gov.kh/student/ID-6002',
    phone_number: '096 443 211',
    student_phone: '092 887 766',
    parent_phone: '096 443 211',
  },
];

export const DEFAULT_SUPABASE_URL = 'https://yqcchyjbmvthavdupfat.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxY2NoeWpibXZ0aGF2ZHVwZmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTYzNjIsImV4cCI6MjEwNTc5MjM2Mn0.drM3DeXnPZOZfvCeFArM--8y4nx2kEwyse_952ZFxAM';

export function isValidUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (_) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper to get saved config or env
export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      const url = parsed.url || envUrl;
      const anonKey = parsed.anonKey || envKey;
      return {
        url,
        anonKey,
        isConnected: Boolean(url && anonKey),
      };
    }
  } catch (e) {
    console.error('Error reading config from storage', e);
  }

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: Boolean(envUrl && envKey),
  };
}

export function saveSupabaseConfig(config: { url: string; anonKey: string }): void {
  try {
    localStorage.setItem(
      STORAGE_KEY_CONFIG,
      JSON.stringify({ ...config, isConnected: Boolean(config.url && config.anonKey) })
    );
  } catch (e) {
    console.error('Failed to save supabase config', e);
  }
}

// Client instance cache
let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }
  const key = `${config.url}_${config.anonKey}`;
  if (cachedClient && currentClientKey === key) {
    return cachedClient;
  }
  try {
    cachedClient = createClient(config.url, config.anonKey);
    currentClientKey = key;
    return cachedClient;
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    return null;
  }
}

// ==========================================
// Database Operations (Supabase + Local fallback)
// ==========================================

export async function fetchSchoolSettings(): Promise<SchoolSettings> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('school_settings')
        .select('*')
        .limit(1)
        .single();

      if (!error && data) {
        // Retrieve local template_config if remote table did not have that column
        let localConfig = DEFAULT_SCHOOL_SETTINGS.template_config;
        try {
          const local = localStorage.getItem(STORAGE_KEY_SETTINGS);
          if (local) {
            const parsed = JSON.parse(local);
            if (parsed.template_config) localConfig = parsed.template_config;
          }
        } catch (_) {}

        const merged: SchoolSettings = {
          ...DEFAULT_SCHOOL_SETTINGS,
          ...data,
          template_config: data.template_config || localConfig,
        };
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local storage:', e);
    }
  }

  // Fallback to localStorage
  try {
    const local = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (local) {
      const parsed = JSON.parse(local);
      return {
        ...DEFAULT_SCHOOL_SETTINGS,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Failed to load local settings', e);
  }

  return DEFAULT_SCHOOL_SETTINGS;
}

export async function saveSchoolSettings(settings: SchoolSettings): Promise<boolean> {
  // Always update local storage
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Local storage save failed', e);
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const payload: any = {
        ...settings,
        updated_at: new Date().toISOString(),
      };
      const { error } = await client
        .from('school_settings')
        .upsert(payload);

      if (error) {
        // If error is PGRST204 (missing template_config column), retry with core fields
        if (error.code === 'PGRST204' || error.message?.includes('template_config')) {
          const { template_config, ...coreSettings } = payload;
          const { error: retryError } = await client
            .from('school_settings')
            .upsert(coreSettings);
          if (retryError) {
            console.error('Supabase save error (core fields):', retryError);
            return false;
          }
          return true;
        }
        console.error('Supabase save error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase exception:', e);
      return false;
    }
  }

  return true;
}

// Helper to normalize raw student row from DB or storage
export function normalizeStudentFromDb(s: any, idx?: number): Student {
  const student_phone = formatPhoneNumber(s.student_phone);
  const parent_phone = formatPhoneNumber(s.parent_phone);
  const phone_number = student_phone || parent_phone || formatPhoneNumber(s.phone_number);
  return {
    ...s,
    dob: formatKhmerDob(s.dob, 'digits'),
    latin_name: s.latin_name || (idx !== undefined ? INITIAL_STUDENTS[idx]?.latin_name : undefined) || getStudentLatinName(s),
    student_phone,
    parent_phone,
    phone_number,
  };
}

// Fetch all students from Supabase using chunked range pagination
// IMPORTANT: Supabase PostgREST defaults to a maximum of 1,000 rows per request.
// With 3,000+ students, a single .select('*') query will truncate data!
// We loop using .range() in 1,000-row chunks until all records are completely fetched.
export async function fetchStudentsFromSupabase(): Promise<{ data: Student[]; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: [], error: 'មិនអាចភ្ជាប់ទៅកាន់ Supabase Client បានឡើយ (URL ឬ Key មិនទាន់ត្រឹមត្រូវ)' };
  }
  try {
    const CHUNK_SIZE = 1000;
    let allData: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await client
        .from('students')
        .select('*')
        .order('student_id', { ascending: true })
        .range(from, from + CHUNK_SIZE - 1);

      if (error) {
        console.error('Supabase query students error:', error);
        return { data: [], error: error.message };
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        if (data.length < CHUNK_SIZE) {
          hasMore = false;
        } else {
          from += CHUNK_SIZE;
        }
      }
    }

    const students: Student[] = allData.map((s, idx) => normalizeStudentFromDb(s, idx));
    return { data: students, error: null };
  } catch (err: any) {
    console.error('Supabase fetch exception:', err);
    return { data: [], error: err?.message || 'បញ្ហាបណ្តាញតភ្ជាប់ទៅកាន់ Supabase' };
  }
}

// Fast count query using PostgreSQL count(*) with head: true
// Returns total student count in milliseconds without downloading 3000 rows of data
export async function getSupabaseStudentCount(): Promise<number | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { count, error } = await client
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('Supabase count error:', error);
      return null;
    }
    return count ?? 0;
  } catch (e) {
    console.warn('Supabase count exception:', e);
    return null;
  }
}

// Single student fetch for ultra-fast QR code scanning or direct link access (/ID-5997)
// When someone scans a QR code, only 1 student record is downloaded instead of 3000
export async function fetchSingleStudentFromSupabase(identifier: string): Promise<Student | null> {
  const client = getSupabaseClient();
  if (!client || !identifier) return null;
  try {
    const cleanId = identifier.trim();

    // 1. Exact match by student_id or UUID
    const { data, error } = await client
      .from('students')
      .select('*')
      .or(`student_id.eq."${cleanId}",id.eq."${cleanId}"`)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return normalizeStudentFromDb(data);
    }

    // 2. Case-insensitive or numeric stripped match (e.g. "5997" matching "ID-5997")
    const stripped = cleanId.replace(/^(id|st)-?/i, '');
    const { data: fallbackData } = await client
      .from('students')
      .select('*')
      .ilike('student_id', `%${stripped}%`)
      .limit(1)
      .maybeSingle();

    if (fallbackData) {
      return normalizeStudentFromDb(fallbackData);
    }

    return null;
  } catch (err) {
    console.error('Failed to fetch single student from Supabase:', err);
    return null;
  }
}

export function fetchStudentsFromLocal(): Student[] {
  try {
    const local = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: Student, idx: number) => normalizeStudentFromDb(s, idx));
      }
    }
  } catch (e) {
    console.error('Failed to parse local students', e);
  }
  return INITIAL_STUDENTS;
}

// Safe localStorage saving with automatic compacting if browser 5MB storage limit is exceeded
export function saveStudentsToLocal(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.warn('LocalStorage quota limit reached, compacting dataset:', e);
    try {
      // 1. Strip heavy base64 data URLs if present, keeping only cloud URLs or empty strings
      const compacted = students.map((s) => ({
        ...s,
        photo_url: s.photo_url?.startsWith('data:image') ? '' : s.photo_url,
      }));
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(compacted));
    } catch (compactErr) {
      console.warn('Could not save all students to localStorage, saving latest 1000 items as offline cache:', compactErr);
      try {
        const slice1000 = students.slice(0, 1000).map((s) => ({
          ...s,
          photo_url: s.photo_url?.startsWith('data:image') ? '' : s.photo_url,
        }));
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(slice1000));
      } catch (finalErr) {
        console.error('Final localStorage fallback save failed:', finalErr);
      }
    }
  }
}

export async function syncStudentsToSupabase(
  students: Student[],
  onProgress?: (synced: number, total: number) => void
): Promise<{ success: boolean; count: number; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, error: 'មិនទាន់បានភ្ជាប់ Supabase Client នៅឡើយទេ' };
  }
  if (!students || students.length === 0) {
    return { success: true, count: 0, error: null };
  }

  try {
    // 1. Deduplicate by student_id to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
    const uniqueMap = new Map<string, any>();
    students.forEach((s) => {
      const core = getCoreStudentPayload(s);
      if (core.student_id) {
        uniqueMap.set(core.student_id, core);
      }
    });

    const coreList = Array.from(uniqueMap.values());
    // Optimized batch size of 150 rows: 3x faster than 50, stays safely below PostgreSQL payload limits
    const BATCH_SIZE = 150;
    let totalSynced = 0;

    for (let i = 0; i < coreList.length; i += BATCH_SIZE) {
      const batch = coreList.slice(i, i + BATCH_SIZE);
      let { data, error } = await client
        .from('students')
        .upsert(batch, { onConflict: 'student_id' })
        .select('id, student_id');

      if (error && (error.message?.includes('column') || error.code === '42703')) {
        const fallbackBatch = batch.map((item: any) => {
          const c = { ...item };
          delete c.student_phone;
          delete c.parent_phone;
          return c;
        });
        const retry = await client
          .from('students')
          .upsert(fallbackBatch, { onConflict: 'student_id' })
          .select('id, student_id');
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('Supabase sync batch error:', error);
        return { success: false, count: totalSynced, error: error.message };
      }
      totalSynced += (data ? data.length : batch.length);
      if (onProgress) {
        onProgress(totalSynced, coreList.length);
      }
    }

    return { success: true, count: totalSynced, error: null };
  } catch (err: any) {
    console.error('Supabase sync exception:', err);
    return { success: false, count: 0, error: err?.message || 'Sync exception' };
  }
}

export async function fetchStudents(preferredSource: 'supabase' | 'local' | 'auto' = 'supabase'): Promise<Student[]> {
  if (preferredSource === 'local') {
    return fetchStudentsFromLocal();
  }

  // Pure Database Mode: fetch strictly from Supabase
  const res = await fetchStudentsFromSupabase();
  if (!res.error) {
    saveStudentsToLocal(res.data);
    return res.data;
  }

  console.warn('Supabase fetch returned error, falling back to local storage:', res.error);
  return fetchStudentsFromLocal();
}

// Helper to strip non-core columns if remote database table has an older schema
function getCoreStudentPayload(student: Student) {
  const student_phone = formatPhoneNumber(student.student_phone);
  const parent_phone = formatPhoneNumber(student.parent_phone);
  const phone_number = student_phone || parent_phone || formatPhoneNumber(student.phone_number);

  const payload: any = {
    student_id: String(student.student_id).trim(),
    full_name: String(student.full_name).trim(),
    gender: (student.gender === 'ស្រី' ? 'ស្រី' : 'ប្រុស'),
    dob: formatKhmerDob(String(student.dob || '').trim(), 'digits'),
    pob: String(student.pob || '').trim(),
    grade: String(student.grade || '11B').trim(),
    class_number: String(student.class_number || '1').trim(),
    father_name: String(student.father_name || '').trim(),
    mother_name: String(student.mother_name || '').trim(),
    photo_url: String(student.photo_url || '').trim(),
    qr_code_data: String(student.qr_code_data || `https://verify.moeys.gov.kh/student/${student.student_id}`).trim(),
    phone_number: phone_number,
    student_phone: student_phone,
    parent_phone: parent_phone,
    updated_at: new Date().toISOString(),
  };

  return payload;
}

export async function saveStudent(student: Student): Promise<boolean> {
  const student_phone = formatPhoneNumber(student.student_phone);
  const parent_phone = formatPhoneNumber(student.parent_phone);
  const phone_number = student_phone || parent_phone || formatPhoneNumber(student.phone_number);

  const normalizedStudent: Student = {
    ...student,
    student_phone,
    parent_phone,
    phone_number,
  };

  // 1. Update local cache immediately without downloading all 3,000 students from Supabase
  try {
    const list = fetchStudentsFromLocal();
    const index = list.findIndex(s => s.id === normalizedStudent.id || s.student_id === normalizedStudent.student_id);
    if (index >= 0) {
      list[index] = normalizedStudent;
    } else {
      list.unshift(normalizedStudent);
    }
    saveStudentsToLocal(list);
  } catch (e) {
    console.error('Local student save error', e);
  }

  // 2. Direct upsert to Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      const corePayload = getCoreStudentPayload(normalizedStudent);
      let { error } = await client
        .from('students')
        .upsert(corePayload, { onConflict: 'student_id' });

      // Fallback if table doesn't have student_phone / parent_phone columns yet
      if (error && (error.message?.includes('column') || error.code === '42703')) {
        const fallback = { ...corePayload };
        delete fallback.student_phone;
        delete fallback.parent_phone;
        const retry = await client
          .from('students')
          .upsert(fallback, { onConflict: 'student_id' });
        error = retry.error;
      }

      if (error) {
        console.error('Supabase upsert student error:', error);
        return false;
      }
    } catch (e) {
      console.error('Supabase error saving student:', e);
      return false;
    }
  }

  return true;
}

export async function deleteStudent(id: string, currentStudents?: Student[]): Promise<{ success: boolean; error: string | null }> {
  const res = await deleteStudents([id], currentStudents);
  return { success: res.success, error: res.error };
}

export async function deleteStudents(
  ids: string[],
  currentStudents?: Student[]
): Promise<{ success: boolean; count: number; error: string | null }> {
  if (ids.length === 0) return { success: true, count: 0, error: null };
  const idSet = new Set(ids);

  // 1. Collect all target student_ids and UUIDs to delete
  const matchedStudentIds = new Set<string>();
  const matchedUuids = new Set<string>();

  ids.forEach((id) => {
    if (isValidUUID(id)) matchedUuids.add(id);
    matchedStudentIds.add(id);
  });

  if (currentStudents && currentStudents.length > 0) {
    currentStudents.forEach((s) => {
      if (idSet.has(s.id) || idSet.has(s.student_id)) {
        if (isValidUUID(s.id)) matchedUuids.add(s.id);
        if (s.student_id) matchedStudentIds.add(s.student_id);
      }
    });
  }

  // 2. Delete from LocalStorage directly by filtering actual stored students
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const remaining = parsed.filter(
          (s: Student) => !idSet.has(s.id) && !idSet.has(s.student_id) && !matchedStudentIds.has(s.student_id)
        );
        saveStudentsToLocal(remaining);
      }
    }
  } catch (e) {
    console.error('Local student delete error', e);
  }

  // 3. Delete from Supabase in safe chunks of 150
  const client = getSupabaseClient();
  let supabaseError: string | null = null;
  if (client) {
    try {
      const CHUNK_SIZE = 150;

      // Delete by UUIDs in chunks
      const uuidList = Array.from(matchedUuids);
      for (let i = 0; i < uuidList.length; i += CHUNK_SIZE) {
        const chunk = uuidList.slice(i, i + CHUNK_SIZE);
        const { error } = await client.from('students').delete().in('id', chunk);
        if (error) {
          console.error('Supabase delete by id error:', error);
          supabaseError = error.message;
        }
      }

      // Delete by student_id in chunks
      const studentIdList = Array.from(matchedStudentIds);
      for (let i = 0; i < studentIdList.length; i += CHUNK_SIZE) {
        const chunk = studentIdList.slice(i, i + CHUNK_SIZE);
        const { error } = await client.from('students').delete().in('student_id', chunk);
        if (error) {
          console.error('Supabase delete by student_id error:', error);
          supabaseError = error.message;
        }
      }
    } catch (e: any) {
      console.error('Supabase delete exception:', e);
      supabaseError = e?.message || 'Delete exception';
    }
  }

  return { success: !supabaseError, count: ids.length, error: supabaseError };
}

export async function bulkUpsertStudents(newStudents: Student[]): Promise<boolean> {
  if (newStudents.length === 0) return true;

  const preparedStudents = newStudents.map((s) => ({
    ...s,
    id: isValidUUID(s.id) ? s.id : generateUUID(),
    latin_name: s.latin_name || getStudentLatinName(s),
  }));

  const current = fetchStudentsFromLocal();
  const map = new Map<string, Student>();
  
  // existing
  current.forEach(s => map.set(s.student_id, s));
  // merge or replace
  preparedStudents.forEach(s => map.set(s.student_id, { ...map.get(s.student_id), ...s }));

  const merged = Array.from(map.values());
  saveStudentsToLocal(merged);

  const client = getSupabaseClient();
  if (client) {
    try {
      // Deduplicate by student_id to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
      const uniqueMap = new Map<string, any>();
      preparedStudents.forEach((s) => {
        const core = getCoreStudentPayload(s);
        if (core.student_id) {
          uniqueMap.set(core.student_id, core);
        }
      });
      const coreList = Array.from(uniqueMap.values());
      
      // Upsert in batches of 150 for database stability and fast execution
      const BATCH_SIZE = 150;
      for (let i = 0; i < coreList.length; i += BATCH_SIZE) {
        const batch = coreList.slice(i, i + BATCH_SIZE);
        const { data, error } = await client
          .from('students')
          .upsert(batch, { onConflict: 'student_id' })
          .select('id, student_id');

        if (error) {
          console.error('Supabase bulk upsert error for batch:', error);
          return false;
        }

        if (data && data.length > 0) {
          const dbIdMap = new Map(data.map((r: any) => [r.student_id, r.id]));
          merged.forEach(s => {
            if (dbIdMap.has(s.student_id)) {
              s.id = dbIdMap.get(s.student_id)!;
            }
          });
        }
      }

      saveStudentsToLocal(merged);
    } catch (e) {
      console.error('Supabase bulk insert exception:', e);
      return false;
    }
  }

  return true;
}

// Upload file to Supabase storage or convert to Base64 data URL
export async function uploadAsset(
  file: File,
  bucket: 'student-photos' | 'school-assets',
  pathName: string
): Promise<string> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.storage
        .from(bucket)
        .upload(pathName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicData } = client.storage
          .from(bucket)
          .getPublicUrl(pathName);
        return publicData.publicUrl;
      }
    } catch (e) {
      console.warn('Supabase storage upload failed, converting to DataURL:', e);
    }
  }

  // Fallback: Read as Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
