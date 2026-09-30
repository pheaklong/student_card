export const SUPABASE_SQL_SCRIPT = `-- ==============================================================================
-- CAMBODIAN HIGH SCHOOL STUDENT ID CARD SYSTEM
-- Database Migration Script for Supabase (PostgreSQL + Storage)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create table: school_settings
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name TEXT NOT NULL DEFAULT 'វិទ្យាល័យ តាំងក្រូច',
    academic_year TEXT NOT NULL DEFAULT 'ឆ្នាំសិក្សា ២០២៥-២០២៦',
    department_name TEXT NOT NULL DEFAULT 'មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តកំពង់ចាម',
    ministry_name TEXT NOT NULL DEFAULT 'ក្រសួងអប់រំ យុវជន និងកីឡា',
    contact_number TEXT NOT NULL DEFAULT '095 858 545',
    principal_name TEXT NOT NULL DEFAULT 'ម៉ិច កន្នដ្ឋារ៉ា',
    signature_url TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    stamp_url TEXT DEFAULT '',
    issue_date_lunar TEXT NOT NULL DEFAULT 'ថ្ងៃព្រហស្បតិ៍ ៥កើត ខែមិគសិរ ឆ្នាំរោង ឆស័ក ព.ស. ២៥៦៨',
    issue_date_solar TEXT NOT NULL DEFAULT 'ថ្ងៃទី១៥ ខែមករា ឆ្នាំ២០២៥',
    card_title TEXT NOT NULL DEFAULT 'ប័ណ្ណសម្គាល់ខ្លួនសិស្ស',
    principal_title TEXT NOT NULL DEFAULT 'នាយកវិទ្យាល័យ',
    school_address TEXT DEFAULT 'ឃុំតាំងក្រូច ស្រុកមេមត់ ខេត្តត្បូងឃ្មុំ',
    qr_base_url TEXT DEFAULT 'https://verify.moeys.gov.kh/student/',
    template_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if upgrading existing table
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS qr_base_url TEXT DEFAULT 'https://verify.moeys.gov.kh/student/';
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS template_config JSONB;

-- 3. Create table: students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    latin_name TEXT DEFAULT '',
    gender TEXT NOT NULL CHECK (gender IN ('ប្រុស', 'ស្រី')),
    dob TEXT NOT NULL,
    pob TEXT NOT NULL,
    grade TEXT NOT NULL,
    class_number TEXT NOT NULL,
    father_name TEXT DEFAULT '',
    mother_name TEXT DEFAULT '',
    photo_url TEXT DEFAULT '',
    qr_code_data TEXT DEFAULT '',
    phone_number TEXT DEFAULT '',
    student_phone TEXT DEFAULT '',
    parent_phone TEXT DEFAULT '',
    blood_type TEXT DEFAULT '',
    expiry_date TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if upgrading existing table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS latin_name TEXT DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_phone TEXT DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone TEXT DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS blood_type TEXT DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS expiry_date TEXT DEFAULT '';

-- 4. Create Indexes for ultra-fast queries (Optimized for 3,000+ students)
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_grade ON public.students(grade);
CREATE INDEX IF NOT EXISTS idx_students_class_number ON public.students(class_number);
CREATE INDEX IF NOT EXISTS idx_students_full_name ON public.students(full_name);
CREATE INDEX IF NOT EXISTS idx_students_latin_name ON public.students(latin_name);
CREATE INDEX IF NOT EXISTS idx_students_phone_number ON public.students(phone_number);
CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON public.students(parent_phone);
CREATE INDEX IF NOT EXISTS idx_students_student_phone ON public.students(student_phone);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(created_at DESC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 6. Setup RLS Policies
CREATE POLICY "Allow public read access on school_settings"
    ON public.school_settings FOR SELECT
    USING (true);

CREATE POLICY "Allow public all access on school_settings"
    ON public.school_settings FOR ALL
    USING (true);

CREATE POLICY "Allow public read access on students"
    ON public.students FOR SELECT
    USING (true);

CREATE POLICY "Allow public all access on students"
    ON public.students FOR ALL
    USING (true);

-- 7. Configure Supabase Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies for student-photos
CREATE POLICY "Public Access for student-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos');

CREATE POLICY "Public Upload for student-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'student-photos');

CREATE POLICY "Public Update for student-photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'student-photos');

CREATE POLICY "Public Delete for student-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'student-photos');

-- Storage RLS policies for school-assets
CREATE POLICY "Public Access for school-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'school-assets');

CREATE POLICY "Public Upload for school-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'school-assets');

CREATE POLICY "Public Update for school-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'school-assets');

-- 8. Seed Initial Default School Settings
INSERT INTO public.school_settings (
    id,
    school_name,
    academic_year,
    department_name,
    ministry_name,
    contact_number,
    principal_name,
    issue_date_lunar,
    issue_date_solar,
    card_title,
    principal_title,
    school_address
) VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'វិទ្យាល័យ តាំងក្រូច',
    'ឆ្នាំសិក្សា ២០២៥-២០២៦',
    'មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តកំពង់ចាម',
    'ក្រសួងអប់រំ យុវជន និងកីឡា',
    '095 858 545',
    'ម៉ិច កន្នដ្ឋារ៉ា',
    'ថ្ងៃព្រហស្បតិ៍ ៥កើត ខែមិគសិរ ឆ្នាំរោង ឆស័ក ព.ស. ២៥៦៨',
    'ថ្ងៃទី១៥ ខែមករា ឆ្នាំ២០២៥',
    'ប័ណ្ណសម្គាល់ខ្លួនសិស្ស',
    'នាយកវិទ្យាល័យ',
    'ឃុំតាំងក្រូច ស្រុកមេមត់ ខេត្តត្បូងឃ្មុំ'
) ON CONFLICT (id) DO NOTHING;

-- 9. Seed Sample Students
INSERT INTO public.students (
    student_id,
    full_name,
    gender,
    dob,
    pob,
    grade,
    class_number,
    father_name,
    mother_name,
    qr_code_data
) VALUES 
('ID-5997', 'សុខ ចាន់ដារ៉ា', 'ប្រុស', '១៥-០៨-២០០៨', 'ភូមិពាមរក៍ ស្រុកពាមរក៍ ខេត្តព្រៃវែង', '11B', '8', 'សុខ គឹមហុង', 'ឡុង ស្រីមុំ', 'https://verify.moeys.gov.kh/student/ID-5997'),
('ID-5998', 'កែវ សោភា', 'ស្រី', '០២-០៣-២០០៨', 'សង្កាត់បឹងកក់១ ខណ្ឌទួលគោក រាជធានីភ្នំពេញ', '11B', '8', 'កែវ វិបុល', 'មាស សុផាត', 'https://verify.moeys.gov.kh/student/ID-5998'),
('ID-5999', 'ជា រតនា', 'ប្រុស', '១០-១១-២០០៧', 'ឃុំរកាកោង ស្រុកមុខកំពូល ខេត្តកណ្តាល', '11A', '5', 'ជា សុភ័ក្រ្ត', 'ឃួន វ៉ាន់នី', 'https://verify.moeys.gov.kh/student/ID-5999'),
('ID-6000', 'អ៊ុច ធីតា', 'ស្រី', '២២-០៤-២០០៨', 'ឃុំតាំងក្រូច ស្រុកមេមត់ ខេត្តត្បូងឃ្មុំ', '11B', '8', 'អ៊ុច សំអាត', 'សេង គឹមលី', 'https://verify.moeys.gov.kh/student/ID-6000'),
('ID-6001', 'ហេង សុវណ្ណារិទ្ធ', 'ប្រុស', '០៧-០៧-២០០៨', 'ក្រុងសួង ខេត្តត្បូងឃ្មុំ', '11C', '12', 'ហេង គឹមឡេង', 'ប៉ែន សុជាតា', 'https://verify.moeys.gov.kh/student/ID-6001'),
('ID-6002', 'សាន គឹមសួរ', 'ស្រី', '១៩-១២-២០០៨', 'ស្រុកចំការលើ ខេត្តកំពង់ចាម', '11B', '8', 'សាន វណ្ណា', 'អ៊ុង ស្រីលក្ខណ៍', 'https://verify.moeys.gov.kh/student/ID-6002')
ON CONFLICT (student_id) DO NOTHING;
`;
