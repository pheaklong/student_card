import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  Phone,
  User,
  Upload,
  Check,
  Database,
  Code,
  Sparkles,
  Info,
  ShieldCheck,
  QrCode,
  ExternalLink,
  Link2,
  Globe,
  KeyRound,
  Lock,
  UserPlus,
  Trash2,
  Shield,
  UserCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SchoolSettings, SupabaseConfig, AppUser } from '../types';
import { uploadAsset, saveSupabaseConfig, getStoredSupabaseConfig } from '../lib/supabase';
import { MoEYSEmblem, OfficialRedStamp, PrincipalSignature } from './CambodianEmblems';
import { resolveStudentQrCode } from '../lib/qrUtils';
import { getAllUsers, changePassword, addUser, deleteUser, getCurrentUser } from '../lib/auth';

interface SchoolSettingsViewProps {
  settings: SchoolSettings;
  onSave: (updated: SchoolSettings) => void;
  onOpenSqlModal: () => void;
  onGoToTemplateEditor?: () => void;
}

const PRESET_SCHOOLS: Partial<SchoolSettings>[] = [
  {
    school_name: 'វិទ្យាល័យកំរៀង',
    department_name: 'មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តបាត់ដំបង',
    academic_year: 'ឆ្នាំសិក្សា ២០២៥-២០២៦',
    contact_number: '',
    principal_name: 'ម៉ិច គន្ធា',
    principal_title: 'នាយកវិទ្យាល័យ',
    issue_date_lunar: 'ថ្ងៃសៅរ៍ ១១កើត ខែកត្តិក ឆ្នាំម្សាញ់ ព.ស ២៥៦៩',
    issue_date_solar: 'វ.កំរៀង , ថ្ងៃទី១ ខែវិច្ឆិកា ឆ្នាំ២០២៥',
    school_address: 'ស្រុកកំរៀង ខេត្តបាត់ដំបង',
  },
  {
    school_name: 'វិទ្យាល័យ តាំងក្រូច',
    department_name: 'មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តកំពង់ចាម',
    academic_year: 'ឆ្នាំសិក្សា ២០២៥-២០២៦',
    contact_number: '095 858 545',
    principal_name: 'ម៉ិច កន្នដ្ឋារ៉ា',
    school_address: 'ឃុំតាំងក្រូច ស្រុកមេមត់ ខេត្តត្បូងឃ្មុំ',
  },
  {
    school_name: 'វិទ្យាល័យ ព្រះស៊ីសុវត្ថិ',
    department_name: 'មន្ទីរអប់រំ យុវជន និងកីឡារាជធានីភ្នំពេញ',
    academic_year: 'ឆ្នាំសិក្សា ២០២៥-២០២៦',
    contact_number: '023 218 844',
    principal_name: 'សួង គឹមស្រ៊ុន',
    school_address: 'វិថីព្រះស៊ីសុវត្ថិ សង្កាត់ជ័យជំនះ ខណ្ឌដូនពេញ រាជធានីភ្នំពេញ',
  },
  {
    school_name: 'វិទ្យាល័យ បាក់ទូក',
    department_name: 'មន្ទីរអប់រំ យុវជន និងកីឡារាជធានីភ្នំពេញ',
    academic_year: 'ឆ្នាំសិក្សា ២០២៥-២០២៦',
    contact_number: '023 881 992',
    principal_name: 'តូច កន្តាល',
    school_address: 'មហាវិថីសហព័ន្ធរុស្ស៊ី សង្កាត់វាលវង់ ខណ្ឌ៧មករា រាជធានីភ្នំពេញ',
  },
  {
    school_name: 'វិទ្យាល័យ ហ៊ុនសែន កំពង់ចាម',
    department_name: 'មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តកំពង់ចាម',
    academic_year: 'ឆ្នាំសិក្សា ២០២៥-២០២៦',
    contact_number: '042 941 230',
    principal_name: 'អ៊ុំ វ៉ាន់ណា',
    school_address: 'ក្រុងកំពង់ចាម ខេត្តកំពង់ចាម',
  },
];

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({
  settings,
  onSave,
  onOpenSqlModal,
  onGoToTemplateEditor,
}) => {
  const [formData, setFormData] = useState<SchoolSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  // Supabase connection state
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(getStoredSupabaseConfig());
  const [supabaseSuccess, setSupabaseSuccess] = useState(false);

  // Test student ID for QR code preview
  const [testStudentId, setTestStudentId] = useState('1834');

  const previewResolvedUrl = resolveStudentQrCode(
    testStudentId || '1834',
    formData.qr_base_url,
    null
  );

  // User Security State & Handlers
  const currentUser = getCurrentUser();
  const [usersList, setUsersList] = useState<AppUser[]>(() => getAllUsers());
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add user state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPwd, setNewUserPwd] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'staff'>('staff');
  const [userActionMsg, setUserActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    const targetUser = currentUser?.username || 'admin';
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'ពាក្យសម្ងាត់ថ្មី និងបញ្ជាក់ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ' });
      return;
    }
    const res = changePassword(targetUser, currentPwd, newPwd);
    if (res.success) {
      setPwdMsg({ type: 'success', text: 'បានផ្លាស់ប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ!' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setTimeout(() => setPwdMsg(null), 3500);
    } else {
      setPwdMsg({ type: 'error', text: res.error || 'ការផ្លាស់ប្តូរពាក្យសម្ងាត់បរាជ័យ' });
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionMsg(null);
    const res = addUser(newUsername, newUserPwd, newFullName, newUserRole);
    if (res.success) {
      setUsersList(getAllUsers());
      setUserActionMsg({ type: 'success', text: `បានបង្កើតគណនី "${newUsername}" ជោគជ័យ!` });
      setNewUsername('');
      setNewUserPwd('');
      setNewFullName('');
      setIsAddingUser(false);
      setTimeout(() => setUserActionMsg(null), 3500);
    } else {
      setUserActionMsg({ type: 'error', text: res.error || 'មិនអាចបង្កើតគណនីបានទេ' });
    }
  };

  const handleDeleteUser = (userId: string, uName: string) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបគណនី "${uName}" មែនទេ?`)) return;
    const res = deleteUser(userId);
    if (res.success) {
      setUsersList(getAllUsers());
      setUserActionMsg({ type: 'success', text: `បានលុបគណនី "${uName}" រួចរាល់` });
      setTimeout(() => setUserActionMsg(null), 3000);
    } else {
      setUserActionMsg({ type: 'error', text: res.error || 'មិនអាចលុបគណនីបានទេ' });
    }
  };

  const handleChange = (field: keyof SchoolSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo_url' | 'signature_url' | 'stamp_url',
    prefix: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadAsset(file, 'school-assets', `${prefix}_${Date.now()}.png`);
      handleChange(field, url);
    } catch (err) {
      console.error(`Failed to upload ${prefix}`, err);
    }
  };

  const handlePresetSelect = (preset: Partial<SchoolSettings>) => {
    setFormData((prev) => ({ ...prev, ...preset }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig({
      url: supabaseConfig.url.trim(),
      anonKey: supabaseConfig.anonKey.trim(),
    });
    setSupabaseSuccess(true);
    setTimeout(() => setSupabaseSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Presets */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 font-kantumruy flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              គំរូគ្រឹះស្ថានសិក្សាល្បីៗ (Quick School Presets)
            </h3>
            <p className="text-xs text-neutral-500 font-kantumruy mt-0.5">
              ចុចដើម្បីជ្រើសរើសឈ្មោះវិទ្យាល័យ និងទិន្នន័យរដ្ឋបាលជាគំរូភ្លាមៗ
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_SCHOOLS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 hover:text-neutral-900 rounded-lg transition-colors font-kantumruy"
              >
                {preset.school_name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Template Studio Shortcut Card */}
      {onGoToTemplateEditor && (
        <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-indigo-950 text-white rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-kantumruy">
          <div className="space-y-1">
            <h4 className="text-sm font-bold flex items-center gap-2 text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              មុខងារកែសម្រួលគំរូប័ណ្ណតាមចិត្តចង់បាន (Card Template Studio)
            </h4>
            <p className="text-xs text-sky-100/90 leading-relaxed max-w-2xl">
              លោកអ្នកអាចផ្លាស់ប្តូរពណ៌កាត ម៉ូដស៊ុម ទីតាំងរូបថត 3x4 បើក/បិទព័ត៌មានសិស្ស កែសម្រួលស្លាកខ្មែរ-អង់គ្លេស
              និងកែប្រែបទបញ្ជាខ្នងក្រោយប័ណ្ណបានតាមចិត្ត ជាមួយនឹងការមើលឃើញផ្ទាល់ (Live Preview)!
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToTemplateEditor}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-sky-950 bg-amber-300 hover:bg-amber-200 rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto shrink-0"
          >
            <span>បើកកែ Template កាត</span>
            <span>→</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 font-kantumruy text-xs">
        
        {/* Section 1: School Identity */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
          <h4 className="text-sm font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            ព័ត៌មានគ្រឹះស្ថានសិក្សា និងក្រសួង (School & Ministry Identity)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                ឈ្មោះវិទ្យាល័យ / អនុវិទ្យាល័យ (School Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.school_name}
                onChange={(e) => handleChange('school_name', e.target.value)}
                placeholder="វិទ្យាល័យ តាំងក្រូច"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-semibold text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                ឆ្នាំសិក្សា (Academic Year) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.academic_year}
                onChange={(e) => handleChange('academic_year', e.target.value)}
                placeholder="ឆ្នាំសិក្សា ២០២៥-២០២៦"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                ក្រសួងសាមី (Ministry Name)
              </label>
              <input
                type="text"
                value={formData.ministry_name}
                onChange={(e) => handleChange('ministry_name', e.target.value)}
                placeholder="ក្រសួងអប់រំ យុវជន និងកីឡា"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                មន្ទីរអប់រំរាជធានី-ខេត្ត (Department Name)
              </label>
              <input
                type="text"
                value={formData.department_name}
                onChange={(e) => handleChange('department_name', e.target.value)}
                placeholder="មន្ទីរអប់រំ យុវជន និងកីឡាខេត្តកំពង់ចាម"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                លេខទូរស័ព្ទទាក់ទង (School Contact / Hotline)
              </label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => handleChange('contact_number', e.target.value)}
                placeholder="095 858 545"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                អាសយដ្ឋានសាលា (School Address)
              </label>
              <input
                type="text"
                value={formData.school_address || ''}
                onChange={(e) => handleChange('school_address', e.target.value)}
                placeholder="ឃុំតាំងក្រូច ស្រុកមេមត់ ខេត្តត្បូងឃ្មុំ"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Principal, Dates & Titles */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
          <h4 className="text-sm font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-200 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            គណៈគ្រប់គ្រង និងកាលបរិច្ឆេទចេញប័ណ្ណ (Principal & Issue Dates)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                គោត្តនាម-នាមនាយក (Principal Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.principal_name}
                onChange={(e) => handleChange('principal_name', e.target.value)}
                placeholder="ម៉ិច កន្នដ្ឋារ៉ា"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-semibold text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                តួនាទី (Principal Title)
              </label>
              <input
                type="text"
                value={formData.principal_title || 'នាយកវិទ្យាល័យ'}
                onChange={(e) => handleChange('principal_title', e.target.value)}
                placeholder="នាយកវិទ្យាល័យ"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                កាលបរិច្ឆេទចន្ទគតិខ្មែរ (Khmer Lunar Issue Date)
              </label>
              <input
                type="text"
                value={formData.issue_date_lunar}
                onChange={(e) => handleChange('issue_date_lunar', e.target.value)}
                placeholder="ថ្ងៃព្រហស្បតិ៍ ៥កើត ខែមិគសិរ ឆ្នាំរោង ឆស័ក ព.ស. ២៥៦៨"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                កាលបរិច្ឆេទសុរិយគតិ (Khmer Solar Issue Date)
              </label>
              <input
                type="text"
                value={formData.issue_date_solar}
                onChange={(e) => handleChange('issue_date_solar', e.target.value)}
                placeholder="ថ្ងៃទី១៥ ខែមករា ឆ្នាំ២០២៥"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Logos, Stamps & Signatures */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
          <h4 className="text-sm font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-200 flex items-center gap-2">
            <Upload className="w-4 h-4 text-purple-600" />
            រូបសញ្ញា ត្រាក្រហម និងហត្ថលេខា (Logos, Stamps & Signatures)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Logo */}
            <div className="flex flex-col items-center p-4 border border-dashed border-neutral-300 rounded-lg bg-neutral-50/50">
              <span className="font-semibold text-neutral-800 mb-2">រូបសញ្ញាសាលា / ក្រសួង</span>
              <div className="w-20 h-20 bg-white rounded-lg border border-neutral-200 flex items-center justify-center p-2 mb-3 shadow-xs">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <MoEYSEmblem size={64} />
                )}
              </div>
              <label className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-md font-medium text-neutral-700 cursor-pointer shadow-xs">
                {formData.logo_url ? 'ផ្លាស់ប្តូររូបសញ្ញា' : 'ផ្ទុកឡើង Logo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'logo_url', 'logo')}
                />
              </label>
              {formData.logo_url && (
                <button
                  type="button"
                  onClick={() => handleChange('logo_url', '')}
                  className="mt-1 text-[10px] text-red-500 hover:underline"
                >
                  ប្រើរូបសញ្ញាក្រសួងដើម
                </button>
              )}
            </div>

            {/* Signature */}
            <div className="flex flex-col items-center p-4 border border-dashed border-neutral-300 rounded-lg bg-neutral-50/50">
              <span className="font-semibold text-neutral-800 mb-2">ហត្ថលេខានាយក (Signature)</span>
              <div className="w-28 h-20 bg-white rounded-lg border border-neutral-200 flex items-center justify-center p-2 mb-3 shadow-xs">
                {formData.signature_url ? (
                  <img
                    src={formData.signature_url}
                    alt="Signature"
                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <PrincipalSignature width={100} height={36} />
                )}
              </div>
              <label className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-md font-medium text-neutral-700 cursor-pointer shadow-xs">
                {formData.signature_url ? 'ផ្លាស់ប្តូរហត្ថលេខា' : 'ផ្ទុកឡើង Signature'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'signature_url', 'signature')}
                />
              </label>
              {formData.signature_url && (
                <button
                  type="button"
                  onClick={() => handleChange('signature_url', '')}
                  className="mt-1 text-[10px] text-red-500 hover:underline"
                >
                  ប្រើហត្ថលេខាឌីជីថលដើម
                </button>
              )}
            </div>

            {/* Official Stamp */}
            <div className="flex flex-col items-center p-4 border border-dashed border-neutral-300 rounded-lg bg-neutral-50/50">
              <span className="font-semibold text-neutral-800 mb-2">ត្រាក្រហមរដ្ឋបាល (Red Stamp)</span>
              <div className="w-20 h-20 bg-white rounded-lg border border-neutral-200 flex items-center justify-center p-1 mb-3 shadow-xs">
                {formData.stamp_url ? (
                  <img
                    src={formData.stamp_url}
                    alt="Stamp"
                    className="max-h-full max-w-full object-contain -rotate-6 mix-blend-multiply"
                  />
                ) : (
                  <OfficialRedStamp
                    schoolName={formData.school_name}
                    principalName={formData.principal_name}
                    size={64}
                  />
                )}
              </div>
              <label className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-md font-medium text-neutral-700 cursor-pointer shadow-xs">
                {formData.stamp_url ? 'ផ្លាស់ប្តូរត្រា' : 'ផ្ទុកឡើង Stamp'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'stamp_url', 'stamp')}
                />
              </label>
              {formData.stamp_url && (
                <button
                  type="button"
                  onClick={() => handleChange('stamp_url', '')}
                  className="mt-1 text-[10px] text-red-500 hover:underline"
                >
                  ប្រើត្រាក្រហមស្វ័យប្រវត្តិ
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Section 4: QR Code Redirection Link Setting */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-neutral-200">
            <h4 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-sky-600" />
              តំណភ្ជាប់ស្កេន QR Code លើកាតសិស្ស (QR Code Redirection URL)
            </h4>
            <span className="text-[11px] text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full font-medium">
              ភ្ជាប់ជាមួយ Student ID ដោយស្វ័យប្រវត្តិ
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Input & Presets */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block font-medium text-neutral-800 mb-1.5 text-xs">
                  តំណភ្ជាប់គោល (QR Code Base Link / Domain)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.qr_base_url ?? ''}
                    onChange={(e) => handleChange('qr_base_url', e.target.value)}
                    placeholder="ឧ. www.exsample.com/ ឬ https://myschool.edu.kh/student/"
                    className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                  ពេលស្កេន QR Code លើកាតសិស្ស វានឹងបើក (Direct) ទៅកាន់តំណភ្ជាប់នេះដោយភ្ជាប់ថែម <strong>ID របស់សិស្ស</strong> នៅខាងចុង។
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[11px] font-semibold text-neutral-600 block mb-1.5">
                  គំរូ link ឆាប់រហ័ស (Quick Presets)៖
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange('qr_base_url', 'www.exsample.com/')}
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-neutral-300 rounded-md transition-colors"
                  >
                    www.exsample.com/
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('qr_base_url', 'https://verify.moeys.gov.kh/student/')}
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-neutral-300 rounded-md transition-colors"
                  >
                    verify.moeys.gov.kh/student/
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('qr_base_url', 'https://school.edu.kh/student/')}
                    className="px-2.5 py-1 text-[11px] font-mono bg-neutral-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-neutral-300 rounded-md transition-colors"
                  >
                    school.edu.kh/student/
                  </button>
                </div>
              </div>

              {/* Explanation tip */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <Info className="w-3.5 h-3.5" /> របៀបដំណើរការ (How it works)៖
                </div>
                <p>• ប្រព័ន្ធនឹងភ្ជាប់លេខ ID នៅខាងចុង link ដោយផ្ទាល់ <strong>(គ្មានការថែមសញ្ញា <code>/</code> ដោយស្វ័យប្រវត្តិទេ សូមដាក់ <code>/</code> នៅខាងចុងដោយខ្លួនឯងប្រសិនបើចង់បាន)</strong>។</p>
                <p>• ឧទាហរណ៍៖ បញ្ចូល <code>www.exsample.com/</code> ➜ សិស្ស ID <code>1834</code> នឹងចេញ <code>www.exsample.com/1834</code></p>
                <p>• ប្រសិនបើតំណភ្ជាប់មានសញ្ញា <code>{'{id}'}</code> ដូចជា <code>https://example.com/verify?id={'{id}'}</code> ប្រព័ន្ធនឹងជំនួស <code>{'{id}'}</code> ដោយលេខ ID ផ្ទាល់។</p>
              </div>
            </div>

            {/* Right: Live Interactive QR Test & Preview */}
            <div className="lg:col-span-5 bg-neutral-50 rounded-xl p-4 border border-neutral-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    សាកល្បងស្កេនផ្ទាល់ (Live QR Test)
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-neutral-500">សាក ID៖</span>
                    <input
                      type="text"
                      value={testStudentId}
                      onChange={(e) => setTestStudentId(e.target.value)}
                      placeholder="1834"
                      className="w-16 px-1.5 py-0.5 border border-neutral-300 rounded bg-white text-center font-mono font-bold text-sky-900 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-neutral-200 flex items-center gap-3 mb-3 shadow-xs">
                  <div className="p-1.5 bg-white border border-neutral-300 rounded-md shadow-2xs shrink-0">
                    <QRCodeSVG
                      value={previewResolvedUrl}
                      size={72}
                      level="M"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                      លទ្ធផលពេលស្កេន
                    </span>
                    <p className="font-mono text-[11px] font-bold text-sky-900 break-all leading-tight mt-0.5 select-all">
                      {previewResolvedUrl}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3" /> ត្រៀមរួចជាស្រេច
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
                <span>អ្នកអាចយកទូរស័ព្ទមកស្កេន QR នេះសាកល្បងបាន</span>
                {previewResolvedUrl && (
                  <a
                    href={
                      /^https?:\/\//i.test(previewResolvedUrl)
                        ? previewResolvedUrl
                        : `https://${previewResolvedUrl}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 hover:underline"
                  >
                    <span>ចុចតេស្តបើក</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            {isSaved && (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                <Check className="w-4 h-4" />
                បានរក្សាទុកការកំណត់ជោគជ័យ!
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4" />
            រក្សាទុកការកំណត់គំរូប័ណ្ណ (Save School Settings)
          </button>
        </div>

      </form>

      {/* Section 4: User Accounts & Login Security Panel */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs font-kantumruy text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>សុវត្ថិភាពប្រព័ន្ធ & គណនីចូលប្រើ (Security & User Accounts)</span>
            </h4>
            <p className="text-neutral-500 mt-0.5">
              គ្រប់គ្រងគណនីបុគ្គលិករដ្ឋបាល និងផ្លាស់ប្តូរពាក្យសម្ងាត់ដើម្បីការពារការចូលប្រើប្រាស់ដោយគ្មានការអនុញ្ញាត។
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold shrink-0">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>កំពុងចូលប្រើ៖ <strong className="font-mono">{currentUser?.username || 'admin'}</strong> ({currentUser?.role === 'admin' ? 'អ្នកគ្រប់គ្រង' : 'បុគ្គលិក'})</span>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <h5 className="text-xs font-bold text-neutral-800 flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>ផ្លាស់ប្តូរពាក្យសម្ងាត់ (Change Password)</span>
            </h5>

            {pwdMsg && (
              <div
                className={`mb-3 p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  pwdMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  ពាក្យសម្ងាត់បច្ចុប្បន្ន (Current Password)
                </label>
                <input
                  type="password"
                  required
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    ពាក្យសម្ងាត់ថ្មី (New)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="យ៉ាងហោច ៤ តួ"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    បញ្ជាក់ពាក្យសម្ងាត់ថ្មី (Confirm)
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="វាយម្តងទៀត"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-1 text-right">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  រក្សាទុកពាក្យសម្ងាត់ថ្មី
                </button>
              </div>
            </form>
          </div>

          {/* User Accounts List & Creation */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-xs font-bold text-neutral-800 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>បញ្ជីគណនីមានសិទ្ធិចូលប្រើ ({usersList.length})</span>
                </h5>
                <button
                  type="button"
                  onClick={() => setIsAddingUser(!isAddingUser)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors cursor-pointer"
                >
                  {isAddingUser ? 'បិទផ្ទាំង' : '+ បង្កើតគណនីថ្មី'}
                </button>
              </div>

              {userActionMsg && (
                <div
                  className={`mb-3 p-2.5 rounded-lg border text-xs ${
                    userActionMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {userActionMsg.text}
                </div>
              )}

              {/* Add user form inline */}
              {isAddingUser && (
                <form onSubmit={handleCreateUser} className="mb-3 p-3 bg-white border border-emerald-300 rounded-xl space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Username</label>
                      <input
                        type="text"
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="staff1"
                        className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Password</label>
                      <input
                        type="password"
                        required
                        value={newUserPwd}
                        onChange={(e) => setNewUserPwd(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">ឈ្មោះពេញ</label>
                      <input
                        type="text"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="លោកគ្រូ/អ្នកគ្រូ..."
                        className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">តួនាទី</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-xs"
                      >
                        <option value="staff">Staff (បុគ្គលិក)</option>
                        <option value="admin">Admin (អ្នកគ្រប់គ្រង)</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-1 text-right">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer"
                    >
                      បង្កើតគណនី
                    </button>
                  </div>
                </form>
              )}

              {/* Users table */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-200 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-neutral-900 font-mono">{u.username}</span>
                        <span className="text-neutral-500 ml-1.5">({u.fullName})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-900' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {u.role === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                      {u.username !== 'admin' && u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          title="លុបគណនីនេះ"
                          className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 mt-3">
              សម្គាល់៖ អ្នកណាក៏ដោយដែលស្កេន QR Code ប័ណ្ណសិស្ស (Digital Card) នឹងអាចមើលឃើញព័ត៌មានប័ណ្ណដោយមិនចាំបាច់ Login ឡើយ។
            </p>
          </div>
        </div>
      </div>

      {/* Section 5: Supabase Connection & SQL Migration Panel */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs font-kantumruy text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              ការតភ្ជាប់ Supabase Backend (PostgreSQL + Cloud Storage)
            </h4>
            <p className="text-neutral-500 mt-0.5">
              កម្មវិធីអាចដំណើរការទាំងមូលបានភ្លាមៗ (Offline / Local) ឬតភ្ជាប់ទៅកាន់ Supabase ផ្ទាល់ខ្លួនរបស់អ្នក។
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenSqlModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shrink-0"
          >
            <Code className="w-4 h-4 text-emerald-600" />
            មើល Supabase SQL Migration Script
          </button>
        </div>

        <form onSubmit={handleSaveSupabase} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseConfig.url}
                onChange={(e) =>
                  setSupabaseConfigState({ ...supabaseConfig, url: e.target.value })
                }
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                value={supabaseConfig.anonKey}
                onChange={(e) =>
                  setSupabaseConfigState({ ...supabaseConfig, anonKey: e.target.value })
                }
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  supabaseConfig.url && supabaseConfig.anonKey ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
              />
              <span className="text-neutral-600">
                {supabaseConfig.url && supabaseConfig.anonKey
                  ? 'បានភ្ជាប់ Supabase Client'
                  : 'ដំណើរការដោយស្វ័យប្រវត្តិតាមរយៈ Local Storage (រួចរាល់សម្រាប់ការបោះពុម្ព)'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {supabaseSuccess && (
                <span className="text-emerald-600 font-semibold">បានរក្សាទុក!</span>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg font-semibold transition-colors shadow-xs"
              >
                ភ្ជាប់ Supabase
              </button>
            </div>
          </div>
        </form>
      </div>

    </div>
  );
};
