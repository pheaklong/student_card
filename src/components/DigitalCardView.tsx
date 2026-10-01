import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Phone,
  Copy,
  Check,
  Share2,
  QrCode,
  ShieldCheck,
  Search,
  Users,
  Eye,
  Calendar,
  MapPin,
  Building,
  GraduationCap,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  CreditCard,
  X,
  PhoneCall,
  RotateCw,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { Student, SchoolSettings, CardTemplateConfig } from '../types';
import { StudentCard } from './StudentCard';
import { formatDriveImageUrl, getDriveImageFallbackUrl, isGoogleDriveUrl } from '../lib/driveUtils';
import { formatKhmerDob } from '../lib/khmerDateUtils';
import { getEffectiveTemplateConfig } from '../lib/templatePresets';
import { QRCodeSVG } from 'qrcode.react';
import { MoEYSEmblem, OfficialRedStamp, PrincipalSignature } from './CambodianEmblems';
import { formatPhoneNumber } from '../lib/phoneUtils';

interface DigitalCardViewProps {
  students: Student[];
  school: SchoolSettings;
  initialStudentId?: string | null;
  isPublicMode?: boolean;
}

export const DigitalCardView: React.FC<DigitalCardViewProps> = ({
  students,
  school,
  initialStudentId,
  isPublicMode = false,
}) => {
  // Find initial student
  const defaultStudent = useMemo(() => {
    if (initialStudentId && students.length > 0) {
      const clean = initialStudentId.trim().toLowerCase();
      const found = students.find(
        (s) =>
          s.student_id.toLowerCase() === clean ||
          s.id.toLowerCase() === clean ||
          s.student_id.toLowerCase().replace(/^(id|st)-?/i, '') === clean.replace(/^(id|st)-?/i, '')
      );
      if (found) return found;
    }
    return students.length > 0 ? students[0] : null;
  }, [students, initialStudentId]);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(defaultStudent);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'physical' | 'profile' | 'qr'>('physical');
  const [physicalCardSide, setPhysicalCardSide] = useState<'front' | 'back'>('front');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedParentPhone, setCopiedParentPhone] = useState(false);
  const [copiedStudentPhone, setCopiedStudentPhone] = useState(false);

  // Sync selectedStudent if defaultStudent changes
  React.useEffect(() => {
    if (defaultStudent && (!selectedStudent || selectedStudent.id !== defaultStudent.id)) {
      setSelectedStudent(defaultStudent);
    }
  }, [defaultStudent]);

  // Filter students for search dropdown (Khmer name, Latin name, Student ID, Phone, Grade, Class)
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students.slice(0, 30);
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.latin_name && s.latin_name.toLowerCase().includes(q)) ||
        s.student_id.toLowerCase().includes(q) ||
        (s.phone_number && s.phone_number.includes(q)) ||
        (s.student_phone && s.student_phone.includes(q)) ||
        (s.parent_phone && s.parent_phone.includes(q)) ||
        s.grade.toLowerCase().includes(q) ||
        s.class_number.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [students, searchQuery]);

  // Build the public Digital Card URL
  const publicCardUrl = useMemo(() => {
    if (!selectedStudent) return '';
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/\/$/, '');
    return `${origin}${pathname}?id=${encodeURIComponent(selectedStudent.student_id)}`;
  }, [selectedStudent]);

  // Clean phone number
  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/[^0-9+]/g, '');
  };

  const handleCopyLink = () => {
    if (!publicCardUrl) return;
    navigator.clipboard.writeText(publicCardUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyParentPhone = (phone?: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedParentPhone(true);
    setTimeout(() => setCopiedParentPhone(false), 2500);
  };

  const handleCopyStudentPhone = (phone?: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedStudentPhone(true);
    setTimeout(() => setCopiedStudentPhone(false), 2500);
  };

  const [scaleMode, setScaleMode] = useState<'auto' | '100' | '85'>('auto');
  const cardContainerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(360);

  React.useEffect(() => {
    const updateSize = () => {
      if (cardContainerRef.current) {
        setContainerWidth(cardContainerRef.current.clientWidth);
      } else if (typeof window !== 'undefined') {
        setContainerWidth(Math.min(window.innerWidth - 32, 600));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const effectiveTemplate = useMemo(() => {
    return getEffectiveTemplateConfig(school.template_config);
  }, [school.template_config]);

  const isLandscape = effectiveTemplate.orientation === 'landscape';
  const cardWidthMm = effectiveTemplate.cardWidthMm || (isLandscape ? 128 : 92);
  const cardHeightMm = effectiveTemplate.cardHeightMm || (isLandscape ? 92 : 128);
  const cardWidthPx = cardWidthMm * 3.779528;
  const cardHeightPx = cardHeightMm * 3.779528;

  const autoScale = useMemo(() => {
    const avail = Math.max(260, containerWidth - 16);
    return Math.min(1, parseFloat((avail / cardWidthPx).toFixed(3)));
  }, [containerWidth, cardWidthPx]);

  const effectiveCardScale = scaleMode === 'auto' ? autoScale : scaleMode === '85' ? 0.85 : 1;

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share && publicCardUrl) {
      try {
        await navigator.share({
          title: `ប័ណ្ណសិស្ស៖ ${selectedStudent?.full_name}`,
          text: `ប័ណ្ណសម្គាល់ខ្លួនសិស្សផ្លូវការ ${selectedStudent?.full_name} (${selectedStudent?.student_id}) - ${school.school_name}`,
          url: publicCardUrl,
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  // If student is not found
  if (!selectedStudent) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center font-kantumruy">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4 border border-amber-200 shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-neutral-800 mb-2">រកមិនឃើញទិន្នន័យសិស្សឡើយ</h2>
        <p className="text-xs text-neutral-500 max-w-md mb-6">
          អត្តលេខដែលអ្នកបានស្កេន ឬស្វែងរក មិនមាននៅក្នុងប្រព័ន្ធឡើយ។ សូមស្វែងរកតាមឈ្មោះសិស្សខាងក្រោម។
        </p>

        {/* Search Box on Not Found */}
        <div className="w-full max-w-md relative z-30 text-left">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4 text-blue-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="ស្វែងរកតាមឈ្មោះសិស្ស ឬអត្តលេខ..."
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-neutral-300 rounded-2xl text-xs sm:text-sm font-medium text-neutral-800 placeholder:text-neutral-400 shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchFocused(false);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto z-40 p-2 divide-y divide-neutral-100">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-400">
                  រកមិនឃើញសិស្សឈ្មោះ «{searchQuery}» ឡើយ
                </div>
              ) : (
                filteredStudents.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSelectedStudent(st);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="w-full text-left p-2.5 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-neutral-900">{st.full_name}</p>
                      <p className="text-[10px] text-neutral-500 font-mono">{st.student_id} · ថ្នាក់ {st.grade}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      ជ្រើសរើស
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const studentPhone = formatPhoneNumber(selectedStudent.student_phone || '');
  const parentPhone = formatPhoneNumber(selectedStudent.parent_phone || '');
  const cleanedParentPhone = cleanPhone(parentPhone);
  const cleanedStudentPhone = cleanPhone(studentPhone);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8 font-kantumruy">
      {/* Standalone Official Verification Header (Strictly Isolated - No back button, No admin menu) */}
      <div className="text-center py-1 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white text-emerald-800 border border-emerald-300 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>ប្រព័ន្ធផ្ទៀងផ្ទាត់ប័ណ្ណសម្គាល់ខ្លួនសិស្សផ្លូវការ (Official Digital ID)</span>
        </div>
      </div>

      {/* 🔍 Search Student by Name or ID */}
      <div className="relative z-30">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4 text-blue-600" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchFocused(true);
            }}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="ស្វែងរកឈ្មោះសិស្ស, អក្សរឡាតាំង, អត្តលេខ (ID) ឬថ្នាក់..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-neutral-300 hover:border-blue-400 focus:border-blue-500 rounded-2xl text-xs sm:text-sm font-medium text-neutral-800 placeholder:text-neutral-400 shadow-xs focus:ring-3 focus:ring-blue-100 outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearchFocused(false);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Backdrop to close on click outside */}
        {isSearchFocused && (
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsSearchFocused(false)}
          />
        )}

        {/* Dropdown Search Results */}
        {isSearchFocused && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-200/90 rounded-2xl shadow-2xl max-h-80 overflow-y-auto z-40 p-2 divide-y divide-neutral-100">
            {filteredStudents.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-400">
                រកមិនឃើញសិស្សដែលមានឈ្មោះ ឬអត្តលេខ «{searchQuery}» ឡើយ
              </div>
            ) : (
              <>
                <div className="px-2 py-1 text-[11px] font-bold text-neutral-400 flex items-center justify-between">
                  <span>លទ្ធផលស្វែងរកឈ្មោះ ({filteredStudents.length})</span>
                  {searchQuery && <span className="font-normal text-neutral-400">ពាក្យគន្លឹះ៖ "{searchQuery}"</span>}
                </div>
                {filteredStudents.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSelectedStudent(st);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                      const origin = window.location.origin;
                      const pathname = window.location.pathname.replace(/\/$/, '');
                      window.history.pushState({}, '', `${origin}${pathname}?id=${encodeURIComponent(st.student_id)}`);
                    }}
                    className={`w-full text-left p-2.5 hover:bg-blue-50/80 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      selectedStudent.id === st.id ? 'bg-blue-50 border border-blue-200 shadow-2xs' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-blue-200">
                        {st.photo_url ? (
                          <img
                            src={formatDriveImageUrl(st.photo_url)}
                            alt={st.full_name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = getDriveImageFallbackUrl(st.photo_url);
                              if (fallback && target.src !== fallback) {
                                target.src = fallback;
                              } else {
                                target.style.display = 'none';
                              }
                            }}
                          />
                        ) : (
                          st.full_name.charAt(0)
                        )}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-neutral-900 truncate">
                            {st.full_name}
                          </p>
                          {st.latin_name && (
                            <span className="text-[10px] text-neutral-400 uppercase font-sans truncate">
                              ({st.latin_name})
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          ID: <span className="font-bold text-blue-700">{st.student_id}</span> · ថ្នាក់ {st.grade}
                          {st.class_number ? ` (បន្ទប់ ${st.class_number})` : ''}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      selectedStudent.id === st.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-blue-700 hover:bg-blue-100'
                    }`}>
                      {selectedStudent.id === st.id ? 'កំពុងមើល' : 'ជ្រើសរើស'}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs: Official Card vs Detailed Profile vs QR Verification */}
      <div className="flex items-center justify-center">
        <div className="inline-flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs shadow-2xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('physical')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'physical'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>ប័ណ្ណផ្លូវការ (Official Card)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>ព័ត៌មានលម្អិត (Full Profile)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>ស្កេន QR</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Digital Card Main Profile View */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Main Digital ID Card Wrapper */}
          <div className="bg-linear-to-b from-white via-white to-sky-50/30 border border-neutral-200/90 rounded-3xl shadow-xl overflow-hidden">
            {/* Top Cambodian Royal Banner */}
            <div className="bg-linear-to-r from-blue-900 via-sky-900 to-blue-950 text-white px-6 py-4 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                <MoEYSEmblem className="w-36 h-36" />
              </div>
              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  {school.logo_url ? (
                    <img
                      src={formatDriveImageUrl(school.logo_url)}
                      alt="Logo"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-contain rounded-full bg-white/10 p-1 border border-white/20"
                    />
                  ) : (
                    <MoEYSEmblem className="w-12 h-12" />
                  )}
                  <div>
                    <h2 className="font-muol text-xs sm:text-sm text-amber-200 tracking-wide">
                      {school.school_name || 'សាលារៀន'}
                    </h2>
                    <p className="text-[11px] text-sky-200">
                      {school.department_name || 'មន្ទីរអប់រំ យុវជន និងកីឡា'} • {school.academic_year || 'ឆ្នាំសិក្សា ២០២៥-២០២៦'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>VERIFIED</span>
                  </span>
                  <span className="text-[9px] text-sky-300 mt-1 font-mono">
                    ID: {selectedStudent.student_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Student Identity Hero */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Photo Thumbnail */}
                <div className="relative group shrink-0">
                  <div className="w-32 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden bg-neutral-100 border-3 border-white shadow-lg ring-2 ring-blue-600/30 flex items-center justify-center">
                    {selectedStudent.photo_url ? (
                      <img
                        src={formatDriveImageUrl(selectedStudent.photo_url)}
                        alt={selectedStudent.full_name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const fallback = getDriveImageFallbackUrl(selectedStudent.photo_url);
                          if (fallback && e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-neutral-400">
                        <Users className="w-12 h-12 mb-1" />
                        <span className="text-[10px]">គ្មានរូបថត</span>
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-700 text-white shadow-xs">
                    {selectedStudent.gender}
                  </span>
                </div>

                {/* Identity Information */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-block px-3 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-900 mb-2">
                    ប័ណ្ណសម្គាល់ខ្លួនសិស្សផ្លូវការ
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 font-muol leading-tight">
                    {selectedStudent.full_name}
                  </h3>

                  {selectedStudent.latin_name && (
                    <p className="text-xs sm:text-sm font-semibold text-neutral-500 font-mono tracking-wider uppercase mt-0.5">
                      {selectedStudent.latin_name}
                    </p>
                  )}

                  {/* Student Attributes Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-neutral-100 text-xs">
                    <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/70">
                      <span className="text-[10px] text-neutral-500 block">អត្តលេខសិស្ស</span>
                      <span className="font-mono font-bold text-blue-900 text-sm">
                        {selectedStudent.student_id}
                      </span>
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/70">
                      <span className="text-[10px] text-neutral-500 block">ថ្នាក់/បន្ទប់</span>
                      <span className="font-bold text-neutral-800 text-sm">
                        ថ្នាក់ទី {selectedStudent.grade}{' '}
                        {selectedStudent.class_number ? `(បន្ទប់ ${selectedStudent.class_number})` : ''}
                      </span>
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/70 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-neutral-500 block">ថ្ងៃខែឆ្នាំកំណើត</span>
                      <span className="font-mono font-semibold text-neutral-800 text-xs">
                        {formatKhmerDob(selectedStudent.dob, 'digits') || selectedStudent.dob}
                      </span>
                    </div>
                  </div>

                  {selectedStudent.pob && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-neutral-600">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>ទីកន្លែងកំណើត៖ {selectedStudent.pob}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 🌟 ផ្តោតសំខាន់បំផុត៖ ព័ត៌មានអាណាព្យាបាល & លេខទូរស័ព្ទ (HERO CARD) 🌟 */}
              <div className="mt-8 space-y-4">
                {/* 1. Parent Phone Card */}
                <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-blue-500/10 border-2 border-emerald-500/30 p-5 sm:p-6 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Phone className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-neutral-900 flex items-center gap-1.5">
                          <span>លេខទូរស័ព្ទអាណាព្យាបាល (Parent Phone)</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white">
                            សំខាន់បំផុត
                          </span>
                        </h4>
                        <p className="text-[11px] text-neutral-500">
                          សម្រាប់ទំនាក់ទំនងបន្ទាន់ និងការតាមដានការសិក្សារបស់សិស្ស
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parent Names */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-100">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">ឈ្មោះឪពុក (Father's Name)</span>
                      <span className="font-semibold text-neutral-900 text-xs sm:text-sm">
                        {selectedStudent.father_name || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">ឈ្មោះម្ដាយ (Mother's Name)</span>
                      <span className="font-semibold text-neutral-900 text-xs sm:text-sm">
                        {selectedStudent.mother_name || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Primary Parent Phone Display */}
                  {parentPhone ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          លេខទំនាក់ទំនងអាណាព្យាបាល (Guardian Contact Number)
                        </span>
                        <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 tracking-wider">
                          {parentPhone}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {cleanedParentPhone && (
                          <a
                            href={`tel:${cleanedParentPhone}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                            title="ខលទៅកាន់លេខអាណាព្យាបាលនេះភ្លាមៗ"
                          >
                            <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                            <span>ខលភ្លាមៗ</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyParentPhone(parentPhone)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors self-start sm:self-center cursor-pointer shadow-2xs active:scale-98"
                          title="ចម្លងលេខទូរស័ព្ទអាណាព្យាបាលនេះ"
                        >
                          {copiedParentPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedParentPhone ? 'បានចម្លង!' : 'ចម្លងលេខ'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
                      <p className="text-xs font-semibold text-amber-800">
                        ⚠️ មិនទាន់មានលេខទូរស័ព្ទអាណាព្យាបាលសម្រាប់សិស្សនេះនៅឡើយទេ
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Student Personal Phone Card */}
                {studentPhone && (
                  <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-500/10 via-sky-500/5 to-indigo-500/10 border-2 border-blue-500/30 p-5 sm:p-6 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-neutral-900 flex items-center gap-1.5">
                            <span>លេខទូរស័ព្ទផ្ទាល់ខ្លួនសិស្ស (Student Personal Phone)</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                              លេខផ្ទាល់
                            </span>
                          </h4>
                          <p className="text-[11px] text-neutral-500">
                            លេខទូរស័ព្ទផ្ទាល់ខ្លួនរបស់សិស្ស {selectedStudent.full_name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                      <div>
                        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                          លេខទូរស័ព្ទផ្ទាល់ (Personal Mobile)
                        </span>
                        <span className="text-2xl sm:text-3xl font-black font-mono text-blue-700 tracking-wider">
                          {studentPhone}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {cleanedStudentPhone && (
                          <a
                            href={`tel:${cleanedStudentPhone}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                            title="ខលទៅកាន់លេខទូរស័ព្ទផ្ទាល់ខ្លួនសិស្ស"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>ខលភ្លាមៗ</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyStudentPhone(studentPhone)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold transition-colors self-start sm:self-center cursor-pointer shadow-2xs active:scale-98"
                          title="ចម្លងលេខទូរស័ព្ទផ្ទាល់ខ្លួនសិស្សនេះ"
                        >
                          {copiedStudentPhone ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedStudentPhone ? 'បានចម្លង!' : 'ចម្លងលេខ'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* School Official Signature & Stamp Preview */}
              <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-6 text-xs text-neutral-500">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="font-semibold text-neutral-700 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>{school.school_name}</span>
                  </p>
                  {school.contact_number && (
                    <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      <span>ទំនាក់ទំនងសាលា៖ <a href={`tel:${cleanPhone(school.contact_number)}`} className="text-blue-700 font-mono font-bold hover:underline">{school.contact_number}</a></span>
                    </p>
                  )}
                  {school.school_address && (
                    <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{school.school_address}</span>
                    </p>
                  )}
                </div>

                {/* Official Red Stamp and Signature */}
                <div className="flex items-center gap-4 bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-200">
                  <div className="text-center">
                    <span className="text-[10px] text-neutral-400 block mb-1">ត្រា & ហត្ថលេខា</span>
                    <div className="relative w-20 h-16 flex items-center justify-center">
                      <OfficialRedStamp className="w-16 h-16 opacity-85 absolute" schoolName={school.school_name} />
                      <PrincipalSignature className="w-14 h-8 relative z-10" />
                    </div>
                  </div>
                  <div className="text-[11px] leading-tight text-neutral-600 border-l border-neutral-200 pl-3">
                    <p className="font-bold text-neutral-900">{school.principal_name || 'នាយកសាលា'}</p>
                    <p className="text-[10px] text-neutral-400">{school.principal_title || 'នាយក'}</p>
                    <p className="text-[9px] text-emerald-600 font-bold mt-1">✓ បានផ្ទៀងផ្ទាត់</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Official Card View with Auto-Responsive Scale & Contact Info */}
      {activeTab === 'physical' && (
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-4 sm:p-7 shadow-xl flex flex-col items-center">
          {/* Controls Bar: Side Toggle, Flip Button, and Scale Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-xl mb-4 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 font-medium hidden sm:inline">ផ្ទៃប័ណ្ណ៖</span>
              <div className="inline-flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPhysicalCardSide('front')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    physicalCardSide === 'front'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  ខាងមុខ (Front)
                </button>
                <button
                  type="button"
                  onClick={() => setPhysicalCardSide('back')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    physicalCardSide === 'back'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  ខាងក្រោយ (Back)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPhysicalCardSide((prev) => (prev === 'front' ? 'back' : 'front'))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                title="ត្រឡប់ផ្ទៃប័ណ្ណមុខ/ក្រោយ"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>ត្រឡប់ប័ណ្ណ</span>
              </button>

              <div className="inline-flex bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-[11px] font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setScaleMode('auto')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${scaleMode === 'auto' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-neutral-500'}`}
                  title="ពង្រីក/បង្រួមសមស្របតាមទូរស័ព្ទស្វ័យប្រវត្តិ"
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setScaleMode('85')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${scaleMode === '85' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-neutral-500'}`}
                >
                  85%
                </button>
                <button
                  type="button"
                  onClick={() => setScaleMode('100')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${scaleMode === '100' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-neutral-500'}`}
                >
                  100%
                </button>
              </div>
            </div>
          </div>

          {/* Actual Card Render with Dynamic Responsive Auto-Fit (No overflow, Fits Phone 100%) */}
          <div ref={cardContainerRef} className="w-full flex flex-col items-center justify-center py-2 px-1">
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-300 bg-white transition-all duration-300"
              style={{
                width: `${Math.round(cardWidthPx * effectiveCardScale)}px`,
                height: `${Math.round(cardHeightPx * effectiveCardScale)}px`,
              }}
            >
              <div
                style={{
                  width: `${cardWidthPx}px`,
                  height: `${cardHeightPx}px`,
                  transform: `scale(${effectiveCardScale})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              >
                <StudentCard
                  student={selectedStudent}
                  school={school}
                  template={effectiveTemplate}
                  showCutLines={true}
                  borderStyle="solid"
                  showBackSide={physicalCardSide === 'back'}
                />
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-3 text-center">
              ទម្រង់ប័ណ្ណផ្លូវការ ({physicalCardSide === 'front' ? 'ផ្ទៃខាងមុខ' : 'ផ្ទៃខាងក្រោយ - បទបញ្ជាផ្ទៃក្នុង'}) · {Math.round(effectiveCardScale * 100)}% Auto-fit
            </p>
          </div>

          {/* 🌟 Direct Essential Contact & Verification Section below Card 🌟 */}
          <div className="w-full max-w-xl mt-6 pt-5 border-t border-neutral-200/80 space-y-3.5">
            {/* 1. Parent Phone Card */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border-2 border-emerald-500/30 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Phone className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      លេខទូរស័ព្ទអាណាព្យាបាល (Parent Phone)
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono text-neutral-900">
                      {parentPhone || 'មិនមានលេខទូរស័ព្ទ'}
                    </span>
                    {(selectedStudent.father_name || selectedStudent.mother_name) && (
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        អាណាព្យាបាល៖ {[selectedStudent.father_name && `ឪពុក: ${selectedStudent.father_name}`, selectedStudent.mother_name && `ម្ដាយ: ${selectedStudent.mother_name}`].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {cleanedParentPhone && (
                    <a
                      href={`tel:${cleanedParentPhone}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>ខលភ្លាមៗ</span>
                    </a>
                  )}
                  {parentPhone && (
                    <button
                      type="button"
                      onClick={() => handleCopyParentPhone(parentPhone)}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {copiedParentPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedParentPhone ? 'បានចម្លង' : 'ចម្លងលេខ'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Student Phone Card */}
            {studentPhone && (
              <div className="rounded-2xl bg-sky-50/70 border border-sky-200/80 p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-sky-800 font-bold block">លេខទូរស័ព្ទផ្ទាល់របស់សិស្ស</span>
                    <span className="text-sm font-bold font-mono text-neutral-900">{studentPhone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {cleanedStudentPhone && (
                    <a
                      href={`tel:${cleanedStudentPhone}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>ខល</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopyStudentPhone(studentPhone)}
                    className="p-1.5 bg-white hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-lg text-xs transition-colors cursor-pointer"
                    title="ចម្លងលេខទូរស័ព្ទសិស្ស"
                  >
                    {copiedStudentPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Student Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/70">
                <span className="text-[10px] text-neutral-400 block">អត្តលេខ (ID)</span>
                <span className="font-mono font-bold text-blue-900">{selectedStudent.student_id}</span>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/70">
                <span className="text-[10px] text-neutral-400 block">ថ្នាក់/បន្ទប់</span>
                <span className="font-bold text-neutral-800">ថ្នាក់ {selectedStudent.grade}</span>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/70">
                <span className="text-[10px] text-neutral-400 block">ភេទ</span>
                <span className="font-bold text-neutral-800">{selectedStudent.gender}</span>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/70">
                <span className="text-[10px] text-neutral-400 block">ថ្ងៃខែឆ្នាំកំណើត</span>
                <span className="font-semibold text-neutral-800">{formatKhmerDob(selectedStudent.dob, 'digits') || selectedStudent.dob}</span>
              </div>
            </div>

            {/* Action button to switch to Full Profile */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <span>មើលព័ត៌មានលម្អិតទាំងអស់របស់សិស្ស</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QR Code Verification View */}
      {activeTab === 'qr' && (
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mb-3">
            <QrCode className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-neutral-900">QR Code ផ្ទៀងផ្ទាត់ប័ណ្ណសិស្ស</h3>
          <p className="text-xs text-neutral-500 max-w-md mt-1 mb-6">
            ស្កេន QR Code នេះដោយប្រើទូរស័ព្ទដៃ ឬ Camera ដើម្បីបើកមើលប័ណ្ណឌីជីថល និងលេខទូរស័ព្ទអាណាព្យាបាលផ្ទាល់
          </p>

          {/* Big QR Code display */}
          <div className="p-6 bg-white border-2 border-neutral-200 rounded-2xl shadow-lg mb-5 flex flex-col items-center">
            <QRCodeSVG
              value={publicCardUrl}
              size={220}
              level="H"
              includeMargin={true}
            />
            <span className="text-[11px] font-mono font-bold text-neutral-600 mt-3">
              {selectedStudent.student_id} • {selectedStudent.full_name}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer active:scale-98"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'បានចម្លងតំណ!' : 'ចម្លង Link សម្រាប់ផ្ញើ'}</span>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer active:scale-98"
              >
                <Share2 className="w-4 h-4 text-sky-300" />
                <span>ចែករំលែក (Share)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Official Footnote (Read-only, no admin link) */}
      <div className="text-center pt-4 pb-2 border-t border-neutral-200/60">
        <p className="text-[11px] text-neutral-400">
          ប័ណ្ណសម្គាល់ខ្លួនឌីជីថលផ្លូវការ ចេញដោយ {school.school_name}
        </p>
      </div>
    </div>
  );
};
