import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit,
  Eye,
  CheckSquare,
  Square,
  Users,
  UserCheck,
  RefreshCw,
  Filter,
  Download,
  Database,
  HardDrive,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Smartphone,
  PhoneCall,
  Send,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import { Student, SchoolSettings, DataSourceMode } from '../types';
import { StudentCard } from './StudentCard';
import { INITIAL_STUDENTS } from '../lib/supabase';
import { formatDriveImageUrl, isGoogleDriveUrl, getDriveImageFallbackUrl } from '../lib/driveUtils';
import { downloadStudentImportTemplate } from '../lib/excelTemplate';
import { exportSingleCardToPdf } from '../lib/pdfExport';
import { getEffectiveTemplateConfig } from '../lib/templatePresets';
import { formatKhmerDob } from '../lib/khmerDateUtils';
import { formatPhoneNumber, getTelegramUrl, cleanPhoneNumber } from '../lib/phoneUtils';

interface StudentManagementViewProps {
  students: Student[];
  school: SchoolSettings;
  selectedIds: Set<string>;
  dataSource?: DataSourceMode;
  supabaseCount?: number | null;
  localCount?: number;
  isSyncing?: boolean;
  onToggleDataSource?: (source: DataSourceMode) => void;
  onSyncToSupabase?: () => Promise<void>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onDeleteSelectedStudents?: (ids: string[]) => void | Promise<void>;
  onOpenBulkImport: () => void;
  onGoToPrint: () => void;
  onGoToPvcPrint?: () => void;
  onGoToTemplateEditor?: () => void;
  onResetSampleData: (samples: Student[]) => void;
  onOpenDigitalCard?: (student: Student) => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  students,
  school,
  selectedIds,
  dataSource = 'supabase',
  supabaseCount,
  localCount,
  isSyncing = false,
  onToggleDataSource,
  onSyncToSupabase,
  onToggleSelect,
  onToggleSelectAll,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onDeleteSelectedStudents,
  onOpenBulkImport,
  onGoToPrint,
  onGoToPvcPrint,
  onGoToTemplateEditor,
  onResetSampleData,
  onOpenDigitalCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [pageSize, setPageSize] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [previewBackSide, setPreviewBackSide] = useState(false);
  const [previewShowStamp, setPreviewShowStamp] = useState<boolean | null>(null);
  const [isDownloadingSinglePdf, setIsDownloadingSinglePdf] = useState(false);

  // Reset to page 1 whenever search, grade, or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGrade, pageSize]);

  const handleDownloadSinglePdf = async () => {
    if (!previewStudent) return;
    const cardEl = document.getElementById('single-preview-card-wrapper');
    if (!cardEl) return;
    try {
      setIsDownloadingSinglePdf(true);
      await exportSingleCardToPdf(cardEl, previewStudent.full_name, previewStudent.student_id);
    } catch (err) {
      console.error('Single card PDF export failed', err);
      alert('មិនអាចទាញយក PDF បានឡើយ។ សូមសាកល្បងបោះពុម្ពជំនួសវិញ');
    } finally {
      setIsDownloadingSinglePdf(false);
    }
  };

  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      alert('សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ម្នាក់ (តាមរយៈ Checkbox ក្នុងតារាង) ជាមុនសិនដើម្បីលុប!');
      return;
    }
    const count = selectedIds.size;
    const ok = window.confirm(
      `តើអ្នកពិតជាចង់លុបទិន្នន័យសិស្សទាំង ${count} នាក់ដែលបានជ្រើសរើសមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។`
    );
    if (!ok) return;

    try {
      setIsDeletingSelected(true);
      if (onDeleteSelectedStudents) {
        await onDeleteSelectedStudents(Array.from(selectedIds));
      } else {
        for (const id of Array.from(selectedIds)) {
          onDeleteStudent(id);
        }
      }
    } finally {
      setIsDeletingSelected(false);
    }
  };

  // Extract unique grades for filter dropdown
  const uniqueGrades = useMemo(() => {
    const grades = new Set<string>();
    students.forEach((s) => {
      if (s.grade) grades.add(s.grade);
    });
    return Array.from(grades).sort();
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const matchesSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        (s.latin_name && s.latin_name.toLowerCase().includes(q)) ||
        s.student_id.toLowerCase().includes(q) ||
        (s.phone_number && s.phone_number.includes(q)) ||
        (s.student_phone && s.student_phone.includes(q)) ||
        (s.parent_phone && s.parent_phone.includes(q)) ||
        (s.class_number && s.class_number.includes(q)) ||
        s.pob.toLowerCase().includes(q) ||
        s.grade.toLowerCase().includes(q);

      const matchesGrade = selectedGrade === 'ALL' || s.grade === selectedGrade;

      return matchesSearch && matchesGrade;
    });
  }, [students, searchQuery, selectedGrade]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredStudents.length);

  const displayedStudents = useMemo(() => {
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, startIndex, endIndex]);

  const maleCount = students.filter((s) => s.gender === 'ប្រុស').length;
  const femaleCount = students.filter((s) => s.gender === 'ស្រី').length;
  const isAllSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedIds.has(s.id));

  const isCurrentPageAllSelected =
    displayedStudents.length > 0 &&
    displayedStudents.every((s) => selectedIds.has(s.id));

  const handleToggleSelectCurrentPage = () => {
    if (displayedStudents.length === 0) return;
    if (isCurrentPageAllSelected) {
      displayedStudents.forEach((s) => {
        if (selectedIds.has(s.id)) {
          onToggleSelect(s.id);
        }
      });
    } else {
      displayedStudents.forEach((s) => {
        if (!selectedIds.has(s.id)) {
          onToggleSelect(s.id);
        }
      });
    }
  };

  // Generate 12 realistic high school students
  const handleGenerateExtendedSamples = () => {
    const extendedList: Student[] = [
      ...INITIAL_STUDENTS,
      {
        id: 's-7',
        student_id: 'ID-6003',
        full_name: 'ព្រុំ វិចិត្រ',
        gender: 'ប្រុស',
        dob: '១១-០២-២០០៨',
        pob: 'ស្រុកមេមត់ ខេត្តត្បូងឃ្មុំ',
        grade: '11B',
        class_number: '8',
        father_name: 'ព្រុំ ផល្លា',
        mother_name: 'ជា សុខុម',
        photo_url: '',
        qr_code_data: 'https://verify.moeys.gov.kh/student/ID-6003',
        phone_number: '088 776 543',
        student_phone: '088 776 543',
        parent_phone: '097 554 321',
      },
      {
        id: 's-8',
        student_id: 'ID-6004',
        full_name: 'ឡាយ ច័ន្ទរស្មី',
        gender: 'ស្រី',
        dob: '០៥-០៩-២០០៨',
        pob: 'ស្រុកកោះសូទិន ខេត្តកំពង់ចាម',
        grade: '11A',
        class_number: '5',
        father_name: 'ឡាយ វុទ្ធី',
        mother_name: 'នួន ស្រីពៅ',
        photo_url: '',
        qr_code_data: 'https://verify.moeys.gov.kh/student/ID-6004',
        phone_number: '070 334 455',
        student_phone: '070 334 455',
        parent_phone: '012 345 678',
      },
      {
        id: 's-9',
        student_id: 'ID-6005',
        full_name: 'ថៃ សម្បត្តិ',
        gender: 'ប្រុស',
        dob: '២៨-០៦-២០០៧',
        pob: 'ក្រុងកំពង់ចាម ខេត្តកំពង់ចាម',
        grade: '12A',
        class_number: '2',
        father_name: 'ថៃ សំអុល',
        mother_name: 'ប៉ុក គឹមហួរ',
        photo_url: '',
        qr_code_data: 'https://verify.moeys.gov.kh/student/ID-6005',
        phone_number: '012 332 211',
        student_phone: '012 332 211',
        parent_phone: '088 998 877',
      },
      {
        id: 's-10',
        student_id: 'ID-6006',
        full_name: 'មាស ម៉ូនីកា',
        gender: 'ស្រី',
        dob: '១៤-០១-២០០៨',
        pob: 'ស្រុកពញាក្រែក ខេត្តត្បូងឃ្មុំ',
        grade: '11B',
        class_number: '8',
        father_name: 'មាស វណ្ណារ៉ា',
        mother_name: 'ខៀវ ស្រីណែត',
        photo_url: '',
        qr_code_data: 'https://verify.moeys.gov.kh/student/ID-6006',
        phone_number: '097 998 877',
        student_phone: '097 998 877',
        parent_phone: '092 112 233',
      },
      {
        id: 's-11',
        student_id: 'ID-6007',
        full_name: 'ឃុន ដារិទ្ធ',
        gender: 'ប្រុស',
        dob: '០៣-១១-២០០៨',
        pob: 'ស្រុកត្បូងឃ្មុំ ខេត្តត្បូងឃ្មុំ',
        grade: '11C',
        class_number: '12',
        father_name: 'ឃុន ហុកលី',
        mother_name: 'ទូច ចរិយា',
        photo_url: '',
        qr_code_data: 'https://verify.moeys.gov.kh/student/ID-6007',
        phone_number: '096 112 233',
        student_phone: '096 112 233',
        parent_phone: '070 889 900',
      },
      {
        id: 's-12',
        student_id: 'ID-6008',
        full_name: 'អ៊ុក គឹមលាង',
        gender: 'ស្រី',
        dob: '៣០-០៣-២០០៨',
        pob: 'ស្រុកព្រៃឈរ ខេត្តកំពង់ចាម',
        grade: '11B',
        class_number: '8',
        father_name: 'អ៊ុក សុផល',
        mother_name: 'លី សុគន្ធា',
        photo_url: '',
        qr_code_data: 'https://verify.moeys.gov.kh/student/ID-6008',
        phone_number: '092 887 766',
        student_phone: '092 887 766',
        parent_phone: '088 123 456',
      },
    ];

    onResetSampleData(extendedList);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Stats and Print Action */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Stats Group */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-neutral-500 font-kantumruy">សិស្សសរុប (Total)</p>
                <p className="text-xl font-bold font-mono text-neutral-900">{students.length}</p>
              </div>
            </div>

            <div className="h-8 w-px bg-neutral-200 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-neutral-500 font-kantumruy">បានជ្រើសរើស (Selected)</p>
                <p className="text-xl font-bold font-mono text-emerald-700">{selectedIds.size}</p>
              </div>
            </div>

            <div className="h-8 w-px bg-neutral-200 hidden sm:block" />

            <div className="text-xs font-kantumruy text-neutral-600 space-y-0.5">
              <p>ប្រុស៖ <span className="font-mono font-semibold text-neutral-900">{maleCount}</span> នាក់</p>
              <p>ស្រី៖ <span className="font-mono font-semibold text-neutral-900">{femaleCount}</span> នាក់</p>
            </div>

            <div className="h-8 w-px bg-neutral-200 hidden md:block" />

            {/* Data Source Switcher (Supabase Cloud vs Local Storage) */}
            <div className="flex items-center gap-2 bg-neutral-100/90 px-2.5 py-1.5 rounded-lg border border-neutral-300">
              <span className="text-[11px] font-semibold text-neutral-700 font-kantumruy">ប្រភពទិន្នន័យ៖</span>
              <div className="flex items-center bg-white p-0.5 rounded-md border border-neutral-300 text-xs font-kantumruy shadow-2xs">
                <button
                  type="button"
                  onClick={() => onToggleDataSource?.('supabase')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all font-semibold ${
                    dataSource === 'supabase'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                  title="បង្ហាញទិន្នន័យពី Supabase Database"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Supabase</span>
                  {supabaseCount !== undefined && supabaseCount !== null && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      dataSource === 'supabase' ? 'bg-blue-800 text-blue-100' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {supabaseCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleDataSource?.('local')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all font-semibold ${
                    dataSource === 'local'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                  title="បង្ហាញទិន្នន័យពី Local Storage ក្នុងម៉ាស៊ីន"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Local</span>
                  {localCount !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      dataSource === 'local' ? 'bg-emerald-800 text-emerald-100' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {localCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Sync Button */}
              {onSyncToSupabase && (
                <button
                  type="button"
                  onClick={onSyncToSupabase}
                  disabled={isSyncing}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-all disabled:opacity-50 font-kantumruy"
                  title="បញ្ចូល/ផ្ទេរទិន្នន័យបច្ចុប្បន្នទាំងអស់ទៅកាន់ Supabase Database"
                >
                  <UploadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isSyncing ? 'កំពុងផ្ទេរ...' : 'ផ្ទេរទៅ Supabase'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleGenerateExtendedSamples}
              title="បង្កើតទិន្នន័យគំរូសិស្ស ១២ នាក់សម្រាប់តេស្តបោះពុម្ព"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors font-kantumruy"
            >
              <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
              ទិន្នន័យគំរូ (12 Students)
            </button>

            <button
              onClick={downloadStudentImportTemplate}
              title="ទាញយកគំរូតារាង Excel សម្រាប់បំពេញបញ្ជីឈ្មោះសិស្ស"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors font-kantumruy"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              គំរូ Excel (.xlsx)
            </button>

            <button
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors font-kantumruy"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              នាំចូល Excel / CSV
            </button>

            {onGoToTemplateEditor && (
              <button
                onClick={onGoToTemplateEditor}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors font-kantumruy"
                title="កែសម្រួលគំរូប័ណ្ណតាមចិត្តចង់បាន (ID Card Template Studio)"
              >
                <span>កែ Template កាត</span>
              </button>
            )}

            <button
              onClick={onAddStudent}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors font-kantumruy"
            >
              <Plus className="w-4 h-4" />
              បញ្ចូលសិស្សថ្មី
            </button>

            <button
              onClick={onGoToPrint}
              disabled={selectedIds.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors font-kantumruy"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              បោះពុម្ពប័ណ្ណ ({selectedIds.size})
            </button>

            {onGoToPvcPrint && (
              <button
                onClick={onGoToPvcPrint}
                disabled={selectedIds.size === 0}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors font-kantumruy cursor-pointer"
                title="បោះពុម្ពកាតរឹង PVC ផ្ទាល់ (CR-80 / Zebra / Fargo / Evolis)"
              >
                <CreditCard className="w-4 h-4 text-amber-900" />
                កាតរឹង PVC ({selectedIds.size})
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input & Delete All Data Select Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ, ទីកន្លែងកំណើត..."
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg text-xs font-kantumruy focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
            />
          </div>

          {/* Delete All Data Select Button (at the right of search input) */}
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={isDeletingSelected}
            title={
              selectedIds.size > 0
                ? `លុបទិន្នន័យសិស្សទាំង ${selectedIds.size} នាក់ដែលបានជ្រើសរើស (Delete Selected Data)`
                : 'សូមជ្រើសរើសសិស្ស (Checkbox) ដើម្បីលុប'
            }
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg shadow-2xs transition-all font-kantumruy cursor-pointer ${
              selectedIds.size > 0
                ? 'text-white bg-rose-600 hover:bg-rose-700 border border-rose-700 active:scale-98 shadow-sm'
                : 'text-neutral-500 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300'
            }`}
          >
            {isDeletingSelected ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>
              {isDeletingSelected
                ? 'កំពុងលុប...'
                : `លុបទិន្នន័យដែលបានជ្រើស (${selectedIds.size})`}
            </span>
          </button>
        </div>

        {/* Grade filter, Page size & Selection */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Grade filter */}
          <div className="flex items-center gap-1.5 text-xs font-kantumruy text-neutral-600">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <span>ថ្នាក់៖</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-2 py-1.5 border border-neutral-300 rounded-md text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
            >
              <option value="ALL">ទាំងអស់ (All)</option>
              {uniqueGrades.map((g) => (
                <option key={g} value={g}>
                  ថ្នាក់ {g}
                </option>
              ))}
            </select>
          </div>

          {/* Page Size Option Selector: 100, 200, 500, 1000 */}
          <div className="flex items-center gap-1.5 text-xs font-kantumruy text-neutral-600 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-200">
            <span className="font-medium text-neutral-700">បង្ហាញ៖</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-0.5 border border-neutral-300 rounded text-xs bg-white font-bold text-blue-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value={100}>100 នាក់</option>
              <option value={200}>200 នាក់</option>
              <option value={500}>500 នាក់</option>
              <option value={1000}>1000 នាក់</option>
            </select>
          </div>

          {/* Select all button */}
          <button
            onClick={onToggleSelectAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-md transition-colors font-kantumruy shadow-2xs"
            title={isAllSelected ? 'ដោះការជ្រើសរើសសិស្សទាំងអស់' : 'ជ្រើសរើសសិស្សទាំងអស់សម្រាប់បោះពុម្ព'}
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-neutral-400" />
            )}
            {isAllSelected ? 'ដោះទាំងអស់' : 'ជ្រើសទាំងអស់'}
          </button>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-kantumruy">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isCurrentPageAllSelected}
                    onChange={handleToggleSelectCurrentPage}
                    title={isCurrentPageAllSelected ? 'ដោះការជ្រើសរើសទំព័រនេះ' : 'ជ្រើសរើសទាំងអស់ក្នុងទំព័រនេះ'}
                    className="w-4 h-4 text-blue-600 rounded-xs border-neutral-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">រូបថត</th>
                <th className="py-3 px-3">អត្តលេខ</th>
                <th className="py-3 px-4">គោត្តនាម-នាម</th>
                <th className="py-3 px-3">ភេទ</th>
                <th className="py-3 px-3">ថ្ងៃខែឆ្នាំកំណើត</th>
                <th className="py-3 px-3">ថ្នាក់/បន្ទប់</th>
                <th className="py-3 px-4">ឪពុក-ម្ដាយ</th>
                <th className="py-3 px-4">ទីកន្លែងកំណើត</th>
                <th className="py-3 px-4 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-neutral-500 font-kantumruy">
                    <Database className="w-10 h-10 text-neutral-300 mx-auto mb-2.5" />
                    <p className="font-semibold text-neutral-700 text-sm">
                      {students.length === 0
                        ? 'មិនទាន់មានទិន្នន័យសិស្សនៅក្នុង Database នៅឡើយទេ'
                        : 'មិនមានទិន្នន័យសិស្សត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {students.length === 0
                        ? 'លោកអ្នកអាចចុច «បញ្ចូលសិស្សថ្មី» ឬ «នាំចូល Excel / CSV» ដើម្បីរក្សាទុកទិន្នន័យចូល Database'
                        : 'សូមសាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬជ្រើសរើសថ្នាក់ផ្សេង'}
                    </p>
                  </td>
                </tr>
              ) : (
                displayedStudents.map((st) => {
                  const isSelected = selectedIds.has(st.id);
                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(st.id)}
                          className="w-4 h-4 text-blue-600 rounded-xs border-neutral-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="py-2.5 px-3">
                        <div className="relative group w-8 h-10 rounded-xs overflow-hidden bg-neutral-100 border border-neutral-300 flex items-center justify-center">
                          {st.photo_url ? (
                            <>
                              <img
                                src={formatDriveImageUrl(st.photo_url)}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const fallback = getDriveImageFallbackUrl(st.photo_url);
                                  if (fallback && e.currentTarget.src !== fallback) {
                                    e.currentTarget.src = fallback;
                                  }
                                }}
                              />
                              {isGoogleDriveUrl(st.photo_url) && (
                                <span
                                  className="absolute bottom-0 right-0 bg-emerald-600/90 text-[6.5px] text-white px-0.5 rounded-tl font-mono"
                                  title="Google Drive Image"
                                >
                                  GD
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[8px] text-neutral-400 font-mono">
                              {st.gender === 'ស្រី' ? '♀' : '♂'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-2.5 px-3 font-mono font-bold text-sky-950">
                        {st.student_id}
                      </td>

                      {/* Full Name */}
                      <td className="py-2.5 px-4 font-semibold text-neutral-900 font-muol text-[11px]">
                        {st.full_name}
                      </td>

                      {/* Gender */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-medium ${
                            st.gender === 'ស្រី' ? 'text-rose-600' : 'text-blue-700'
                          }`}
                        >
                          {st.gender}
                        </span>
                      </td>

                      {/* DOB */}
                      <td className="py-2.5 px-3 font-mono tabular-nums text-neutral-700">
                        {formatKhmerDob(st.dob, 'digits') || st.dob}
                      </td>

                      {/* Grade & Class */}
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-sky-900">{st.grade}</span>
                        {st.class_number && (
                          <span className="text-neutral-500 text-[10px] ml-1">
                            (បន្ទប់ {st.class_number})
                          </span>
                        )}
                      </td>

                      {/* Parents & Contact Phone */}
                      <td className="py-2.5 px-4 text-[11px] text-neutral-600 leading-tight">
                        <p className="font-semibold text-neutral-900">{st.father_name || '-'}</p>
                        <p className="text-neutral-400">{st.mother_name || '-'}</p>

                        {/* Parent Phone */}
                        {st.parent_phone && (
                          <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] text-emerald-800 font-semibold">អាណាព្យាបាល:</span>
                            <span className="font-mono font-bold text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {formatPhoneNumber(st.parent_phone)}
                            </span>
                            <a
                              href={`tel:${cleanPhoneNumber(st.parent_phone)}`}
                              title="ហៅទូរស័ព្ទអាណាព្យាបាល (Call Now)"
                              className="p-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded border border-emerald-200 transition-colors"
                            >
                              <PhoneCall className="w-3 h-3" />
                            </a>
                            <a
                              href={getTelegramUrl(st.parent_phone)}
                              target="_blank"
                              rel="noreferrer"
                              title="[ផ្ញើសារ Telegram ទៅអាណាព្យាបាល]"
                              className="p-1 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white rounded border border-sky-200 transition-colors"
                            >
                              <Send className="w-3 h-3" />
                            </a>
                            <a
                              href={`sms:${cleanPhoneNumber(st.parent_phone)}`}
                              title="ផ្ញើសារ SMS ទៅអាណាព្យាបាល"
                              className="p-1 bg-neutral-50 hover:bg-neutral-600 text-neutral-700 hover:text-white rounded border border-neutral-200 transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {/* Student Personal Phone */}
                        {st.student_phone && (
                          <div className="mt-1 flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] text-blue-800 font-semibold">លេខផ្ទាល់:</span>
                            <span className="font-mono font-bold text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {formatPhoneNumber(st.student_phone)}
                            </span>
                            <a
                              href={`tel:${cleanPhoneNumber(st.student_phone)}`}
                              title="ហៅទូរស័ព្ទសិស្សផ្ទាល់ (Call Now)"
                              className="p-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded border border-blue-200 transition-colors"
                            >
                              <PhoneCall className="w-3 h-3" />
                            </a>
                            <a
                              href={getTelegramUrl(st.student_phone)}
                              target="_blank"
                              rel="noreferrer"
                              title="[ផ្ញើសារ Telegram ទៅសិស្ស]"
                              className="p-1 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white rounded border border-sky-200 transition-colors"
                            >
                              <Send className="w-3 h-3" />
                            </a>
                            <a
                              href={`sms:${cleanPhoneNumber(st.student_phone)}`}
                              title="ផ្ញើសារ SMS ទៅសិស្ស"
                              className="p-1 bg-neutral-50 hover:bg-neutral-600 text-neutral-700 hover:text-white rounded border border-neutral-200 transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </td>

                      {/* POB */}
                      <td className="py-2.5 px-4 text-[11px] text-neutral-600 max-w-[180px] truncate" title={st.pob}>
                        {st.pob}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onOpenDigitalCard && (
                            <button
                              onClick={() => onOpenDigitalCard(st)}
                              title="បើកប័ណ្ណឌីជីថល (Digital Card & លេខទូរស័ព្ទអាណាព្យាបាល)"
                              className="p-1.5 text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            >
                              <Smartphone className="w-4 h-4 text-emerald-600" />
                            </button>
                          )}
                          <button
                            onClick={() => setPreviewStudent(st)}
                            title="មើលប័ណ្ណសម្គាល់ខ្លួន (Preview Card)"
                            className="p-1.5 text-neutral-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditStudent(st)}
                            title="កែសម្រួលព័ត៌មាន (Edit)"
                            className="p-1.5 text-neutral-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteStudent(st.id)}
                            title="លុបចេញ (Delete)"
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info & Pagination Controls */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-neutral-600 font-kantumruy">
          
          {/* Left summary & Selected indicator */}
          <div className="flex flex-wrap items-center gap-3">
            <span>
              បង្ហាញពី <strong className="text-neutral-900">{filteredStudents.length === 0 ? 0 : startIndex + 1}</strong> ដល់{' '}
              <strong className="text-neutral-900">{endIndex}</strong> នៃសិស្ស{' '}
              <strong className="text-neutral-900">{filteredStudents.length}</strong> នាក់
              {filteredStudents.length !== students.length && (
                <span className="text-neutral-400 ml-1">(សរុប {students.length} នាក់)</span>
              )}
            </span>

            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              បានជ្រើសរើស៖ {selectedIds.size} នាក់
            </span>
          </div>

          {/* Right Pagination & Per Page Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Per-page selector */}
            <div className="flex items-center gap-1.5 text-neutral-500">
              <span>បង្ហាញ៖</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-neutral-300 rounded bg-white font-medium text-neutral-800 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value={100}>100 នាក់</option>
                <option value={200}>200 នាក់</option>
                <option value={500}>500 នាក់</option>
                <option value={1000}>1000 នាក់</option>
              </select>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* First page button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={validCurrentPage <= 1}
                  className="p-1 rounded border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-600"
                  title="ទំព័រដំបូង"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous page button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage <= 1}
                  className="px-2 py-1 rounded border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-600 flex items-center gap-1"
                  title="ទំព័រមុន"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>ថយ</span>
                </button>

                {/* Page Jump Selector */}
                <div className="flex items-center gap-1 px-1">
                  <select
                    value={validCurrentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="px-2 py-1 border border-blue-300 rounded bg-blue-50 font-bold text-blue-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <span className="text-neutral-500">/ {totalPages}</span>
                </div>

                {/* Next page button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage >= totalPages}
                  className="px-2 py-1 rounded border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-600 flex items-center gap-1"
                  title="ទំព័របន្ទាប់"
                >
                  <span>បន្ទាប់</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Last page button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validCurrentPage >= totalPages}
                  className="p-1 rounded border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-600"
                  title="ទំព័រចុងក្រោយ"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Single Card Preview Modal */}
      {previewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-neutral-200 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3 pb-2 border-b border-neutral-200">
              <h3 className="font-semibold text-xs sm:text-sm text-neutral-900 font-kantumruy truncate">
                គំរូប័ណ្ណ៖ {previewStudent.full_name} ({previewStudent.student_id})
              </h3>
              <div className="flex items-center gap-2">
                {/* Stamp Toggle Button */}
                <button
                  type="button"
                  onClick={() =>
                    setPreviewShowStamp((prev) =>
                      prev === null
                        ? (school.template_config?.showStamp === false ? true : false)
                        : !prev
                    )
                  }
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                    (previewShowStamp !== null
                      ? previewShowStamp
                      : school.template_config?.showStamp !== false)
                      ? 'bg-rose-50 text-rose-700 border-rose-300 font-semibold'
                      : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                  }`}
                  title="ចុចដើម្បីប្តូររវាង បង្ហាញត្រា ឬ អត់បង្ហាញត្រា"
                >
                  <span>
                    {(previewShowStamp !== null
                      ? previewShowStamp
                      : school.template_config?.showStamp !== false)
                      ? '🔴'
                      : '⚪'}
                  </span>
                  <span>
                    {(previewShowStamp !== null
                      ? previewShowStamp
                      : school.template_config?.showStamp !== false)
                      ? 'បង្ហាញត្រា'
                      : 'អត់បង្ហាញត្រា'}
                  </span>
                </button>

                <div className="inline-flex rounded-md border border-neutral-200 p-0.5 bg-neutral-100 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPreviewBackSide(false)}
                    className={`px-2 py-0.5 rounded font-medium ${
                      !previewBackSide ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'
                    }`}
                  >
                    មុខ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBackSide(true)}
                    className={`px-2 py-0.5 rounded font-medium ${
                      previewBackSide ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'
                    }`}
                  >
                    ក្រោយ
                  </button>
                </div>
                <button
                  onClick={() => setPreviewStudent(null)}
                  className="text-neutral-400 hover:text-neutral-700 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Exact StudentCard rendering */}
            <div id="single-preview-card-wrapper" className="border border-neutral-300 rounded-sm bg-white">
              <StudentCard
                student={previewStudent}
                school={school}
                template={{
                  ...getEffectiveTemplateConfig(school.template_config),
                  showStamp:
                    previewShowStamp !== null
                      ? previewShowStamp
                      : school.template_config?.showStamp !== false,
                }}
                showCutLines={true}
                borderStyle="solid"
                showBackSide={previewBackSide}
              />
            </div>

            {/* Quick Contact Bar in Preview Modal: Both Parent & Student Personal Phone */}
            <div className="w-full mt-3 space-y-2 text-xs font-kantumruy">
              {previewStudent.parent_phone && (
                <div className="p-3 bg-linear-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                  <div>
                    <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wide">
                      លេខទូរស័ព្ទអាណាព្យាបាល៖
                    </span>
                    <span className="text-base font-black font-mono text-emerald-900">
                      {formatPhoneNumber(previewStudent.parent_phone)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <a
                      href={`tel:${cleanPhoneNumber(previewStudent.parent_phone)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-2xs transition-all active:scale-98"
                      title="ហៅទូរស័ព្ទអាណាព្យាបាល (Call Now)"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>ហៅទូរស័ព្ទ (Call Now)</span>
                    </a>
                    <a
                      href={getTelegramUrl(previewStudent.parent_phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold shadow-2xs transition-all active:scale-98"
                      title="[ផ្ញើសារ Telegram ទៅអាណាព្យាបាល]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>[ផ្ញើសារ Telegram]</span>
                    </a>
                    <a
                      href={`sms:${cleanPhoneNumber(previewStudent.parent_phone)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-lg font-bold shadow-2xs transition-all active:scale-98"
                      title="ផ្ញើសារ SMS ទៅអាណាព្យាបាល"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-700" />
                      <span>ផ្ញើសារ SMS</span>
                    </a>
                  </div>
                </div>
              )}

              {previewStudent.student_phone && (
                <div className="p-3 bg-linear-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                  <div>
                    <span className="text-[10px] text-blue-800 font-bold block uppercase tracking-wide">
                      លេខទូរស័ព្ទផ្ទាល់ខ្លួនសិស្ស៖
                    </span>
                    <span className="text-base font-black font-mono text-blue-900">
                      {formatPhoneNumber(previewStudent.student_phone)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <a
                      href={`tel:${cleanPhoneNumber(previewStudent.student_phone)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-2xs transition-all active:scale-98"
                      title="ហៅទូរស័ព្ទសិស្សផ្ទាល់ (Call Now)"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>ហៅទូរស័ព្ទ (Call Now)</span>
                    </a>
                    <a
                      href={getTelegramUrl(previewStudent.student_phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold shadow-2xs transition-all active:scale-98"
                      title="[ផ្ញើសារ Telegram ទៅសិស្ស]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>[ផ្ញើសារ Telegram]</span>
                    </a>
                    <a
                      href={`sms:${cleanPhoneNumber(previewStudent.student_phone)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-lg font-bold shadow-2xs transition-all active:scale-98"
                      title="ផ្ញើសារ SMS ទៅសិស្ស"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-700" />
                      <span>ផ្ញើសារ SMS</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-neutral-200 text-xs font-kantumruy">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSinglePdf}
                  disabled={isDownloadingSinglePdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 disabled:bg-neutral-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  title="ទាញយកប័ណ្ណសិស្សនេះជាឯកសារ PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingSinglePdf ? 'កំពុងទាញយក...' : 'ទាញយកជា PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!selectedIds.has(previewStudent.id)) {
                      onToggleSelect(previewStudent.id);
                    }
                    setPreviewStudent(null);
                    onGoToPrint();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  title="ទៅកាន់ផ្ទាំងបោះពុម្ព A4 ជាមួយសិស្សនេះ"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>បោះពុម្ព A4</span>
                </button>

                {onGoToPvcPrint && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedIds.has(previewStudent.id)) {
                        onToggleSelect(previewStudent.id);
                      }
                      setPreviewStudent(null);
                      onGoToPvcPrint();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                    title="បោះពុម្ពកាតរឹង PVC ផ្ទាល់ (Direct CR-80) សម្រាប់សិស្សនេះ"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-900" />
                    <span>កាតរឹង PVC</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onGoToTemplateEditor && (
                  <button
                    onClick={() => {
                      setPreviewStudent(null);
                      onGoToTemplateEditor();
                    }}
                    className="text-neutral-500 hover:text-blue-700 hover:underline text-xs"
                  >
                    កែគំរូប័ណ្ណ
                  </button>
                )}
                <button
                  onClick={() => setPreviewStudent(null)}
                  className="px-3 py-1.5 text-xs text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium cursor-pointer"
                >
                  បិទ (Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
