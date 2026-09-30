import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Printer,
  Settings,
  Database,
  HardDrive,
  UploadCloud,
  RefreshCw,
  Plus,
  FileSpreadsheet,
  CheckCircle,
  ExternalLink,
  Palette,
  Smartphone,
  LogOut,
  UserCheck,
  CreditCard,
} from 'lucide-react';
import { SchoolSettings, Student, CardTemplateConfig, DataSourceMode, AppUser } from './types';
import {
  fetchSchoolSettings,
  saveSchoolSettings,
  fetchStudents,
  fetchStudentsFromSupabase,
  fetchStudentsFromLocal,
  getSupabaseStudentCount,
  fetchSingleStudentFromSupabase,
  syncStudentsToSupabase,
  saveStudent,
  deleteStudent,
  deleteStudents,
  bulkUpsertStudents,
  DEFAULT_SCHOOL_SETTINGS,
  INITIAL_STUDENTS,
} from './lib/supabase';
import { StudentManagementView } from './components/StudentManagementView';
import { BatchPrintView } from './components/BatchPrintView';
import { PvcCardPrintView } from './components/PvcCardPrintView';
import { SchoolSettingsView } from './components/SchoolSettingsView';
import { CardTemplateEditorView } from './components/CardTemplateEditorView';
import { StudentFormModal } from './components/StudentFormModal';
import { BulkImportModal } from './components/BulkImportModal';
import { SqlMigrationModal } from './components/SqlMigrationModal';
import { DigitalCardView } from './components/DigitalCardView';
import { LoginView } from './components/LoginView';
import { getCurrentUser, logout } from './lib/auth';
import { getEffectiveTemplateConfig } from './lib/templatePresets';

/**
 * Checks if the current request is for the public digital card view.
 * Scanned QR codes or direct digital card links bypass login completely!
 */
function getInitialPublicCardInfo(): { isPublic: boolean; studentId: string | null } {
  if (typeof window === 'undefined') return { isPublic: false, studentId: null };

  const params = new URLSearchParams(window.location.search);
  const qId = params.get('id') || params.get('student_id') || params.get('student') || params.get('card');
  const viewParam = params.get('view');

  if (qId && qId.trim()) {
    return { isPublic: true, studentId: qId.trim() };
  }
  if (viewParam === 'digitalcard' || viewParam === 'card') {
    return { isPublic: true, studentId: null };
  }

  const hash = window.location.hash;
  if (hash) {
    if (hash.toLowerCase().includes('digitalcard')) {
      return { isPublic: true, studentId: null };
    }
    const cleanHash = hash.replace(/^#\/?/, '').replace(/^(card|student|id)\//i, '').trim();
    const reserved = ['students', 'template', 'print', 'settings', 'login'];
    if (cleanHash && !reserved.includes(cleanHash.toLowerCase())) {
      return { isPublic: true, studentId: decodeURIComponent(cleanHash) };
    }
  }

  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0) {
    const last = segments[segments.length - 1];
    const reserved = ['cardme', 'index.html', 'students', 'template', 'print', 'settings', 'dist', 'src', 'login'];
    if (last && !reserved.includes(last.toLowerCase())) {
      return { isPublic: true, studentId: decodeURIComponent(last).trim() };
    }
  }

  return { isPublic: false, studentId: null };
}

export default function App() {
  const initialPublic = getInitialPublicCardInfo();
  const [currentView, setCurrentView] = useState<'students' | 'template' | 'print' | 'pvc-print' | 'settings'>('students');
  const [publicStudentId, setPublicStudentId] = useState<string | null>(initialPublic.studentId);
  const [isPublicMode, setIsPublicMode] = useState<boolean>(initialPublic.isPublic);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getCurrentUser());
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Data source mode: 'supabase' (Cloud Live) vs 'local' (LocalStorage)
  const [dataSource, setDataSource] = useState<DataSourceMode>(() => {
    const saved = localStorage.getItem('cardme_data_source');
    return (saved === 'local' || saved === 'supabase') ? saved : 'supabase';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [sourceCounts, setSourceCounts] = useState<{ supabase: number | null; local: number }>({
    supabase: null,
    local: 0,
  });

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fast count query without downloading 3,000 student records
  const refreshCounts = useCallback(async () => {
    const localList = fetchStudentsFromLocal();
    const supCount = await getSupabaseStudentCount();
    setSourceCounts({
      local: localList.length,
      supabase: supCount,
    });
  }, []);

  // Initialize data on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [settings] = await Promise.all([
          fetchSchoolSettings(),
        ]);
        setSchoolSettings({
          ...settings,
          template_config: getEffectiveTemplateConfig(settings.template_config),
        });

        // Fast path for Digital Card QR Code scan:
        // When visiting a public card (/ID-5997), display that single student immediately,
        // then fetch remaining students in the background so search by name works for all students!
        if (publicStudentId) {
          const singleStudent = await fetchSingleStudentFromSupabase(publicStudentId);
          if (singleStudent) {
            setStudents([singleStudent]);
            setSelectedIds(new Set([singleStudent.id]));
            setIsLoading(false);

            // Background load for searching by name
            fetchStudents(dataSource).then((fullList) => {
              if (fullList && fullList.length > 0) {
                setStudents(fullList);
              }
            });
            return;
          }
        }

        const studentList = await fetchStudents(dataSource);
        setStudents(studentList);
        setSelectedIds(new Set(studentList.map((s) => s.id)));
        refreshCounts();
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [dataSource, publicStudentId, refreshCounts]);

  const handleToggleDataSource = async (newSource: DataSourceMode) => {
    setDataSource(newSource);
    localStorage.setItem('cardme_data_source', newSource);
    setIsLoading(true);
    try {
      const list = await fetchStudents(newSource);
      setStudents(list);
      setSelectedIds(new Set(list.map((s) => s.id)));
      refreshCounts();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    try {
      const res = await syncStudentsToSupabase(students);
      if (res.success) {
        alert(`ជោគជ័យ! បានបញ្ចូល/ធ្វើបច្ចុប្បន្នភាពសិស្សចំនួន ${res.count} នាក់ទៅកាន់ Database Supabase រួចរាល់!`);
        setDataSource('supabase');
        localStorage.setItem('cardme_data_source', 'supabase');
        const supList = await fetchStudents('supabase');
        setStudents(supList);
        setSelectedIds(new Set(supList.map((s) => s.id)));
        refreshCounts();
      } else {
        alert(`មានបញ្ហាក្នុងការផ្ទេរទិន្នន័យទៅ Supabase៖ ${res.error}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // URL listener for direct student ID access (e.g. /1850 or ?id=1850 or #1850)
  useEffect(() => {
    const checkUrlForStudent = () => {
      const info = getInitialPublicCardInfo();
      if (info.isPublic) {
        setPublicStudentId(info.studentId);
        setIsPublicMode(true);
      }
    };

    checkUrlForStudent();
    window.addEventListener('popstate', checkUrlForStudent);
    return () => window.removeEventListener('popstate', checkUrlForStudent);
  }, []);

  // Automatically switch to print view if keyboard shortcut (Ctrl+P / Cmd+P) is pressed
  useEffect(() => {
    const handleBeforePrint = () => {
      if (currentView !== 'print') {
        setCurrentView('print');
      }
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, [currentView]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  // Student CRUD
  const handleAddStudent = () => {
    setStudentToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsFormModalOpen(true);
  };

  const handleSaveStudent = async (student: Student) => {
    await saveStudent(student);
    const updated = await fetchStudents(dataSource);
    setStudents(updated);
    setSelectedIds((prev) => new Set(prev).add(student.id));
    refreshCounts();
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យសិស្សនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។')) return;
    // Optimistically remove from state immediately
    setStudents((prev) => prev.filter((s) => s.id !== id && s.student_id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    try {
      await deleteStudent(id, students);
      const updated = await fetchStudents(dataSource);
      setStudents(updated);
      setSelectedIds((prev) => {
        const existingIds = new Set(updated.map((s) => s.id));
        return new Set(Array.from(prev).filter((x) => existingIds.has(x)));
      });
      refreshCounts();
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  const handleDeleteSelectedStudents = async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);

    // Optimistically remove from state immediately so UI responds instantaneously
    setStudents((prev) => prev.filter((s) => !idSet.has(s.id) && !idSet.has(s.student_id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });

    try {
      const res = await deleteStudents(ids, students);
      if (!res.success && res.error) {
        console.warn('Some deletions had errors:', res.error);
      }
      const updated = await fetchStudents(dataSource);
      setStudents(updated);
      setSelectedIds((prev) => {
        const existingIds = new Set(updated.map((s) => s.id));
        return new Set(Array.from(prev).filter((x) => existingIds.has(x)));
      });
      refreshCounts();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('មានបញ្ហាក្នុងការលុបទិន្នន័យ៖ ' + (err?.message || 'សូមព្យាយាមម្តងទៀត'));
    }
  };

  // Bulk import
  const handleImportComplete = async (importedStudents: Student[]) => {
    await bulkUpsertStudents(importedStudents);
    const updated = await fetchStudents(dataSource);
    setStudents(updated);
    setSelectedIds(new Set(updated.map((s) => s.id)));
    refreshCounts();
  };

  // Settings
  const handleSaveSettings = async (newSettings: SchoolSettings) => {
    setSchoolSettings(newSettings);
    await saveSchoolSettings(newSettings);
  };

  // Card Template Config
  const handleSaveTemplate = async (newTemplate: CardTemplateConfig) => {
    const effective = getEffectiveTemplateConfig(newTemplate);
    const updated: SchoolSettings = {
      ...schoolSettings,
      template_config: effective,
    };
    setSchoolSettings(updated);
    await saveSchoolSettings(updated);
  };

  // Sample data reset
  const handleResetSampleData = async (samples: Student[]) => {
    await bulkUpsertStudents(samples);
    const updated = await fetchStudents(dataSource);
    setStudents(updated);
    setSelectedIds(new Set(updated.map((s) => s.id)));
    refreshCounts();
  };

  // Filter students for printing (only selected)
  const studentsToPrint = students.filter((s) => selectedIds.has(s.id));

  // 🛡️ Standalone Public Digital Card View (No back button, NO admin header, NO data editing)
  if (isPublicMode || publicStudentId) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-neutral-900">
        <header className="bg-white border-b border-neutral-200 py-3.5 px-4 shadow-xs sticky top-0 z-30">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {schoolSettings.logo_url ? (
                <img
                  src={schoolSettings.logo_url}
                  alt="Logo"
                  className="w-9 h-9 rounded-full object-contain border border-neutral-200 bg-white"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-bold text-sm flex items-center justify-center">
                  {schoolSettings.school_name ? schoolSettings.school_name.charAt(0) : 'S'}
                </div>
              )}
              <div>
                <h1 className="text-xs sm:text-sm font-bold text-neutral-900 font-kantumruy leading-tight">
                  {schoolSettings.school_name}
                </h1>
                <p className="text-[10px] text-neutral-500 font-kantumruy">
                  ប្រព័ន្ធផ្ទៀងផ្ទាត់ប័ណ្ណសម្គាល់ខ្លួនសិស្ស (Digital Student ID)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>ផ្លូវការ (Verified)</span>
              </div>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPublicMode(false);
                    setPublicStudentId(null);
                    window.history.pushState({}, '', window.location.pathname.replace(/\/$/, '') || '/');
                  }}
                  className="text-xs font-semibold px-2.5 py-1 text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                >
                  ← ផ្ទាំងគ្រប់គ្រង
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center font-kantumruy text-neutral-500">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs">កំពុងទាញយកព័ត៌មានប័ណ្ណ...</p>
            </div>
          ) : (
            <DigitalCardView
              students={students}
              school={schoolSettings}
              initialStudentId={publicStudentId}
              isPublicMode={true}
            />
          )}
        </main>

        <footer className="py-4 text-center text-xs text-neutral-400 font-kantumruy border-t border-neutral-200 bg-white">
          <p>© {new Date().getFullYear()} {schoolSettings.school_name} · រក្សាសិទ្ធិគ្រប់យ៉ាង</p>
        </footer>
      </div>
    );
  }

  // 🔒 Restricted Administrative Access (Requires Login to protect student management, printing, etc.)
  if (!currentUser) {
    return (
      <LoginView
        school={schoolSettings}
        onLoginSuccess={(user) => setCurrentUser(user)}
        onOpenPublicDigitalCard={() => {
          setIsPublicMode(true);
          setPublicStudentId(students.length > 0 ? students[0].student_id : 'ID-5997');
        }}
      />
    );
  }

  const handleLogout = () => {
    if (window.confirm('តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?')) {
      logout();
      setCurrentUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans">
      
      {/* Top Bar Contract (hidden during print) */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('students')}
              className="text-left group cursor-pointer"
            >
              <span className="font-muol text-sm sm:text-base text-sky-950 group-hover:text-blue-700 transition-colors">
                ប័ណ្ណសម្គាល់ខ្លួនសិស្ស
              </span>
              <span className="hidden sm:inline font-kantumruy text-xs text-neutral-500 ml-2">
                · {schoolSettings.school_name}
              </span>
            </button>
          </div>

          {/* Zone 2: Clean text navigation links */}
          <nav className="flex items-center gap-1 sm:gap-3 font-kantumruy text-xs sm:text-sm font-medium">
            <button
              onClick={() => setCurrentView('students')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'students'
                  ? 'text-blue-700 bg-blue-50 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>គ្រប់គ្រងសិស្ស</span>
              </span>
            </button>

            <button
              onClick={() => setCurrentView('template')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'template'
                  ? 'text-blue-700 bg-blue-50 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Palette className="w-4 h-4" />
                <span>កែ Template កាត</span>
              </span>
            </button>

            <button
              onClick={() => setCurrentView('print')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'print'
                  ? 'text-blue-700 bg-blue-50 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Printer className="w-4 h-4" />
                <span>បោះពុម្ព & PDF ({selectedIds.size})</span>
              </span>
            </button>

            <button
              onClick={() => setCurrentView('pvc-print')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'pvc-print'
                  ? 'text-amber-900 bg-amber-100 font-bold border border-amber-300 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
              title="បោះពុម្ពកាតរឹង PVC ផ្ទាល់ (Direct Card Printer / CR-80)"
            >
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>កាតរឹង PVC</span>
              </span>
            </button>

            <button
              onClick={() => setCurrentView('settings')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'settings'
                  ? 'text-blue-700 bg-blue-50 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-4 h-4" />
                <span>ការកំណត់សាលា</span>
              </span>
            </button>

            <button
              onClick={() => {
                setIsPublicMode(true);
                setPublicStudentId(students.length > 0 ? students[0].student_id : 'ID-5997');
              }}
              className="px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
              title="មើលគំរូប័ណ្ណឌីជីថលសាធារណៈ (Public View)"
            >
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>ប័ណ្ណឌីជីថល</span>
              </span>
            </button>
          </nav>

          {/* Zone 3: Primary actions, Data Source Switcher, & User Logout */}
          <div className="flex items-center gap-2 font-kantumruy">
            {/* Top Bar Data Source Switcher */}
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-300 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => handleToggleDataSource('supabase')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-semibold ${
                  dataSource === 'supabase'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                }`}
                title="បង្ហាញទិន្នន័យពី Supabase Database (Live Cloud)"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Supabase</span>
                {sourceCounts.supabase !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    dataSource === 'supabase' ? 'bg-blue-800 text-blue-100' : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {sourceCounts.supabase}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleToggleDataSource('local')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-semibold ${
                  dataSource === 'local'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                }`}
                title="បង្ហាញទិន្នន័យពី Local Storage ក្នុងម៉ាស៊ីន (Offline)"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Local</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  dataSource === 'local' ? 'bg-emerald-800 text-emerald-100' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {sourceCounts.local}
                </span>
              </button>
            </div>

            <button
              onClick={() => setIsSqlModalOpen(true)}
              title="មើល Supabase SQL Migration Script"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase SQL</span>
            </button>

            {currentView !== 'print' ? (
              <button
                onClick={() => setCurrentView('print')}
                disabled={selectedIds.size === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5 text-amber-200" />
                <span>បោះពុម្ព ({selectedIds.size})</span>
              </button>
            ) : (
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>បោះពុម្ព A4</span>
              </button>
            )}

            {/* User Account Info & Logout */}
            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-neutral-200">
              <div
                title={`គណនីកំពុងប្រើ៖ ${currentUser.username} (${currentUser.role})`}
                className="hidden xl:flex items-center gap-1.5 text-xs text-neutral-700 bg-neutral-100 px-2.5 py-1.5 rounded-lg border border-neutral-200"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold">{currentUser.fullName || currentUser.username}</span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="ចាកចេញពីប្រព័ន្ធ (Log Out)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ចាកចេញ</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center font-kantumruy text-neutral-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">កំពុងផ្ទុកទិន្នន័យ...</p>
          </div>
        ) : (
          <>
            {currentView === 'students' && (
              <StudentManagementView
                students={students}
                school={schoolSettings}
                selectedIds={selectedIds}
                dataSource={dataSource}
                supabaseCount={sourceCounts.supabase}
                localCount={sourceCounts.local}
                isSyncing={isSyncing}
                onToggleDataSource={handleToggleDataSource}
                onSyncToSupabase={handleSyncToSupabase}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onAddStudent={handleAddStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                onDeleteSelectedStudents={handleDeleteSelectedStudents}
                onOpenBulkImport={() => setIsBulkModalOpen(true)}
                onGoToPrint={() => setCurrentView('print')}
                onGoToPvcPrint={() => setCurrentView('pvc-print')}
                onGoToTemplateEditor={() => setCurrentView('template')}
                onResetSampleData={handleResetSampleData}
                onOpenDigitalCard={(st) => {
                  const origin = window.location.origin;
                  const pathname = window.location.pathname.replace(/\/$/, '');
                  const url = `${origin}${pathname}?id=${encodeURIComponent(st.student_id)}`;
                  window.open(url, '_blank');
                }}
              />
            )}

            {currentView === 'template' && (
              <CardTemplateEditorView
                school={schoolSettings}
                students={students}
                onSaveTemplate={handleSaveTemplate}
                onGoToPrint={() => setCurrentView('print')}
              />
            )}

            {currentView === 'print' && (
              <BatchPrintView
                students={studentsToPrint}
                school={schoolSettings}
                onBackToStudents={() => setCurrentView('students')}
                onGoToTemplateEditor={() => setCurrentView('template')}
                onSaveTemplate={handleSaveTemplate}
              />
            )}

            {currentView === 'pvc-print' && (
              <PvcCardPrintView
                students={studentsToPrint.length > 0 ? studentsToPrint : students}
                school={schoolSettings}
                selectedStudentIds={selectedIds}
                onBackToStudents={() => setCurrentView('students')}
                onGoToTemplateEditor={() => setCurrentView('template')}
              />
            )}

            {currentView === 'settings' && (
              <SchoolSettingsView
                settings={schoolSettings}
                onSave={handleSaveSettings}
                onOpenSqlModal={() => setIsSqlModalOpen(true)}
                onGoToTemplateEditor={() => setCurrentView('template')}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        studentToEdit={studentToEdit}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveStudent}
      />

      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      <SqlMigrationModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      {/* Global Print-only watermark or footer avoidance */}
      <footer className="no-print border-t border-neutral-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 font-kantumruy gap-2">
          <div className="flex items-center gap-2">
            <span>ប្រព័ន្ធគ្រប់គ្រង និងបោះពុម្ពប័ណ្ណសម្គាល់ខ្លួនសិស្សមធ្យមសិក្សាទុតិយភូមិ</span>
            <span>·</span>
            <span>ក្រសួងអប់រំ យុវជន និងកីឡា (MoEYS)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="text-emerald-700 hover:underline"
            >
              Supabase SQL Schema
            </button>
            <span>A4 Sheet (6 Cards / 8 Cards Grid)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
