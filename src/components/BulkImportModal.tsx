import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Image as ImageIcon, CheckCircle, AlertCircle, Download, X, Globe, FileText, Info } from 'lucide-react';
import { Student } from '../types';
import { uploadAsset, generateUUID, syncStudentsToSupabase } from '../lib/supabase';
import { getStudentLatinName } from '../lib/khmerTranslit';
import { formatDriveImageUrl, isGoogleDriveUrl, getDriveImageFallbackUrl } from '../lib/driveUtils';
import { downloadStudentImportTemplate } from '../lib/excelTemplate';
import { formatKhmerDob, toKhmerDigits, toArabicDigits } from '../lib/khmerDateUtils';
import { formatPhoneNumber } from '../lib/phoneUtils';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (students: Student[]) => Promise<void> | void;
}

// Robust helper to extract cell value from row across various column naming patterns
const getRowValue = (row: any, candidates: string[]): string => {
  if (!row) return '';
  const rowKeys = Object.keys(row);

  // 1. Exact match
  for (const candidate of candidates) {
    if (row[candidate] !== undefined && row[candidate] !== null) {
      const val = String(row[candidate]).trim();
      if (val !== '') return val;
    }
  }

  // 2. Fuzzy normalized match (ignore spaces, hyphens, parentheses, slashes, case)
  for (const candidate of candidates) {
    const normCandidate = candidate.toLowerCase().replace(/[\s\-_()\/]/g, '');
    const matchedKey = rowKeys.find((k) => {
      const normKey = k.toLowerCase().replace(/[\s\-_()\/]/g, '');
      return normKey === normCandidate || normKey.includes(normCandidate);
    });
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
      const val = String(row[matchedKey]).trim();
      if (val !== '') return val;
    }
  }

  return '';
};

// Robust helper to extract raw cell value (preserving numbers and Date instances for dates)
const getRawRowValue = (row: any, candidates: string[]): any => {
  if (!row) return undefined;
  const rowKeys = Object.keys(row);

  for (const candidate of candidates) {
    if (row[candidate] !== undefined && row[candidate] !== null && row[candidate] !== '') {
      return row[candidate];
    }
  }

  for (const candidate of candidates) {
    const normCandidate = candidate.toLowerCase().replace(/[\s\-_()\/]/g, '');
    const matchedKey = rowKeys.find((k) => {
      const normKey = k.toLowerCase().replace(/[\s\-_()\/]/g, '');
      return normKey === normCandidate || normKey.includes(normCandidate);
    });
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && row[matchedKey] !== '') {
      return row[matchedKey];
    }
  }

  return undefined;
};

// Parse Excel dates safely (supporting JS Date objects, Excel serial codes e.g. 40955, or strings e.g. 9/11/2011)
const parseDateValue = (rawDate: any): string => {
  if (rawDate === undefined || rawDate === null || rawDate === '') return '០១-០១-២០០៨';

  // 1. If it's a JavaScript Date object (from XLSX cellDates: true)
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    const d = String(rawDate.getDate()).padStart(2, '0');
    const m = String(rawDate.getMonth() + 1).padStart(2, '0');
    const y = rawDate.getFullYear();
    return formatKhmerDob(`${d}-${m}-${y}`, 'digits');
  }

  // 2. If it's an Excel serial date number or digit string (e.g. 40955 or Khmer numerals ៤០៩៥៥)
  const strVal = String(rawDate).trim();
  const arabicStr = toArabicDigits(strVal);
  const serialMatch = arabicStr.match(/^(\d{4,5})(?:\.\d+)?$/);

  if (serialMatch) {
    const num = Math.floor(parseFloat(serialMatch[0]));
    if (num >= 10000 && num <= 85000) {
      try {
        if (XLSX?.SSF?.parse_date_code) {
          const dateObj = XLSX.SSF.parse_date_code(num);
          if (dateObj && dateObj.y && dateObj.m && dateObj.d) {
            const d = String(dateObj.d).padStart(2, '0');
            const m = String(dateObj.m).padStart(2, '0');
            const y = dateObj.y;
            return formatKhmerDob(`${d}-${m}-${y}`, 'digits');
          }
        }
      } catch (err) {
        console.warn('XLSX.SSF failed to parse serial date:', num, err);
      }

      // Fallback calculation for Excel serial date (1900 date system)
      let days = num;
      if (days > 60) days--;
      const baseDate = new Date(Date.UTC(1900, 0, 1));
      const targetDate = new Date(baseDate.getTime() + (days - 1) * 86400000);
      const d = String(targetDate.getUTCDate()).padStart(2, '0');
      const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
      const y = targetDate.getUTCFullYear();
      return formatKhmerDob(`${d}-${m}-${y}`, 'digits');
    }
  }

  // 3. String date (e.g. "9/11/2011", "09-11-2011", "2011-11-09", or full Khmer date)
  return formatKhmerDob(strVal, 'digits');
};

// Normalize gender safely
const parseGenderValue = (rawGender: string): 'ប្រុស' | 'ស្រី' => {
  const g = (rawGender || '').trim().toLowerCase();
  if (
    g === 'ស្រី' ||
    g === 'ស' ||
    g === 'f' ||
    g === 'female' ||
    g === 'girl' ||
    g === 'ស្រ' ||
    g === 'ស្ត្រី'
  ) {
    return 'ស្រី';
  }
  return 'ប្រុស';
};

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [photoFiles, setPhotoFiles] = useState<{ [studentId: string]: File }>({});
  const [photoPreviews, setPhotoPreviews] = useState<{ [studentId: string]: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [activeStep, setActiveStep] = useState<'upload-sheet' | 'match-photos' | 'preview'>('upload-sheet');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Excel / CSV File upload
  const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        // Filter out blank rows
        const validRows = (rawJson || []).filter((row) => {
          if (!row || typeof row !== 'object') return false;
          return Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '');
        });

        if (validRows.length === 0) {
          alert('ឯកសារ Excel គ្មានទិន្នន័យឡើយ!');
          return;
        }

        const seenIds = new Set<string>();

        // Map column headers (Supports both Khmer and English, with or without parentheses)
        const mapped: Student[] = validRows.map((row, index) => {
          let student_id =
            getRowValue(row, [
              'អត្តលេខ (Student ID)',
              'អត្តលេខ',
              'student_id',
              'id',
              'ID',
              'Student ID',
              'StudentID',
              'លេខកូដសិស្ស',
              'អត្តលេខសិស្ស',
            ]);

          if (!student_id) {
            student_id = `ID-${6000 + index}`;
          }

          // Ensure student_id is completely unique across the import batch to prevent ON CONFLICT DO UPDATE collisions
          let uniqueStudentId = student_id;
          let dupCount = 1;
          while (seenIds.has(uniqueStudentId)) {
            uniqueStudentId = `${student_id}-${dupCount}`;
            dupCount++;
          }
          seenIds.add(uniqueStudentId);
          student_id = uniqueStudentId;

          let full_name = getRowValue(row, [
            'គោត្តនាម-នាម (Full Name)',
            'គោត្តនាម-នាម',
            'គោត្តនាម និងនាម',
            'គោត្តនាមនិងនាម',
            'ឈ្មោះ',
            'ឈ្មោះសិស្ស',
            'full_name',
            'name',
            'Name',
            'Full Name',
            'Student Name',
          ]);

          if (!full_name) {
            const lastName = getRowValue(row, ['គោត្តនាម', 'ត្រកូល', 'last_name', 'LastName', 'Surname']);
            const firstName = getRowValue(row, ['នាម', 'first_name', 'FirstName', 'GivenName']);
            if (lastName || firstName) {
              full_name = `${lastName} ${firstName}`.trim();
            }
          }
          if (!full_name) full_name = 'សិស្សថ្មី';

          const rawLatin = getRowValue(row, [
            'ឈ្មោះឡាតាំង (Latin Name)',
            'ឈ្មោះឡាតាំង',
            'ឡាតាំង',
            'អក្សរឡាតាំង',
            'latin_name',
            'latin',
            'Latin Name',
            'English Name',
            'english_name',
          ]);
          const latin_name = rawLatin
            ? String(rawLatin).trim().toUpperCase()
            : getStudentLatinName({ full_name } as any);

          const blood_type = getRowValue(row, [
            'ក្រុមឈាម',
            'ក្រុមឈាម (Blood Type)',
            'blood_type',
            'Blood',
            'Blood Type',
          ]);

          const rawExpiry = getRawRowValue(row, [
            'កាលបរិច្ឆេទផុតកំណត់',
            'កាលបរិច្ឆេទផុតកំណត់ (Expiry Date)',
            'expiry_date',
            'Expiry',
            'Expiry Date',
          ]);
          const expiry_date = rawExpiry ? parseDateValue(rawExpiry) : undefined;

          const rawGender = getRowValue(row, [
            'ភេទ (Gender)',
            'ភេទ',
            'gender',
            'Gender',
            'Sex',
            'sex',
          ]);
          const gender = parseGenderValue(rawGender);

          const rawDob = getRawRowValue(row, [
            'ថ្ងៃខែឆ្នាំកំណើត (DOB)',
            'ថ្ងៃខែឆ្នាំកំណើត',
            'ថ្ងៃកំណើត',
            'dob',
            'DOB',
            'Date of Birth',
            'Birth Date',
          ]);
          const dob = parseDateValue(rawDob);

          const pob =
            getRowValue(row, [
              'ទីកន្លែងកំណើត (POB)',
              'ទីកន្លែងកំណើត',
              'កន្លែងកំណើត',
              'pob',
              'POB',
              'Place of Birth',
            ]) || 'ខេត្តកំពង់ចាម';

          const grade =
            getRowValue(row, [
              'ថ្នាក់ (Grade)',
              'ថ្នាក់',
              'ថ្នាក់ទី',
              'grade',
              'Grade',
              'Class',
            ]) || '11B';

          const class_number =
            getRowValue(row, [
              'បន្ទប់ (Room)',
              'បន្ទប់',
              'លេខបន្ទប់',
              'class_number',
              'room',
              'Room',
              'Room Number',
            ]) || '8';

          const father_name = getRowValue(row, [
            'ឪពុក (Father Name)',
            'ឪពុក',
            'ឈ្មោះឪពុក',
            'father_name',
            'Father',
            'Father Name',
          ]);

          const mother_name = getRowValue(row, [
            'ម្ដាយ (Mother Name)',
            'ម្ដាយ',
            'ឈ្មោះម្ដាយ',
            'mother_name',
            'Mother',
            'Mother Name',
          ]);

          // 1. Dedicated Parent Phone extraction (Priority to guardian/parent columns)
          const parent_phone = getRowValue(row, [
            'លេខទូរស័ព្ទអាណាព្យាបាល (Parent Phone)',
            'លេខទូរស័ព្ទអាណាព្យាបាល',
            'ទូរស័ព្ទអាណាព្យាបាល',
            'លេខអាណាព្យាបាល',
            'អាណាព្យាបាល (ទូរស័ព្ទ)',
            'អាណាព្យាបាល',
            'លេខទូរស័ព្ទឪពុកម្ដាយ',
            'ទូរស័ព្ទឪពុកម្ដាយ',
            'លេខឪពុកម្ដាយ',
            'Parent Phone',
            'parent_phone',
            'parentPhone',
            'ParentPhone',
            'Guardian Phone',
            'guardian_phone',
            'guardianPhone',
            'GuardianPhone',
            'Parent Contact',
            'Emergency Contact',
          ]);

          // 2. Dedicated Student Phone extraction (Priority to student personal columns)
          const student_phone = getRowValue(row, [
            'លេខទូរស័ព្ទសិស្ស (Student Phone)',
            'លេខទូរស័ព្ទសិស្ស',
            'ទូរស័ព្ទសិស្ស',
            'លេខសិស្ស (ទូរស័ព្ទ)',
            'លេខទូរស័ព្ទផ្ទាល់ (Personal Phone)',
            'លេខទូរស័ព្ទផ្ទាល់',
            'ទូរស័ព្ទផ្ទាល់',
            'លេខផ្ទាល់',
            'Student Phone',
            'student_phone',
            'studentPhone',
            'StudentID Phone',
            'Personal Phone',
            'personal_phone',
            'personalPhone',
            'Personal Mobile',
          ]);

          // 3. Fallback generic phone column if any
          const generic_phone = getRowValue(row, [
            'លេខទូរស័ព្ទ (Phone)',
            'លេខទូរស័ព្ទ',
            'ទូរស័ព្ទ',
            'phone_number',
            'phone',
            'Phone',
            'Phone Number',
            'Contact',
            'Tel',
          ]);

          const finalParentPhone = parent_phone;
          const finalStudentPhone = student_phone || (!parent_phone ? generic_phone : '');

          const formattedParentPhone = formatPhoneNumber(finalParentPhone);
          const formattedStudentPhone = formatPhoneNumber(finalStudentPhone);
          const formattedPhoneNumber = formattedStudentPhone || formattedParentPhone;

          // Extract photo link (supports Google Drive links, URLs, or image filenames)
          const rawPhoto = getRowValue(row, [
            'រូបថត (Photo or Drive Link)',
            'រូបថត (ឬ Google Drive Link)',
            'រូបថត',
            'រូបភាព',
            'រូប',
            'photo_url',
            'photo',
            'Photo',
            'Image',
            'image',
            'Link',
            'link',
            'Drive',
            'Drive Link',
            'Google Drive',
            'GoogleDrive',
            'តំណភ្ជាប់',
            'តំណភ្ជាប់រូបភាព',
            'តំណភ្ជាប់រូបថត',
          ]);
          const formattedPhotoUrl = rawPhoto ? formatDriveImageUrl(rawPhoto.trim()) : '';

          return {
            id: generateUUID(),
            student_id: String(student_id).trim(),
            full_name: String(full_name).trim(),
            latin_name,
            gender,
            dob: String(dob).trim(),
            pob: String(pob).trim(),
            grade: String(grade).trim(),
            class_number: String(class_number).trim(),
            father_name: String(father_name || '').trim(),
            mother_name: String(mother_name || '').trim(),
            parent_phone: formattedParentPhone,
            student_phone: formattedStudentPhone,
            phone_number: formattedPhoneNumber,
            blood_type: blood_type ? String(blood_type).trim() : undefined,
            expiry_date: expiry_date ? String(expiry_date).trim() : undefined,
            photo_url: formattedPhotoUrl,
            qr_code_data: `https://verify.moeys.gov.kh/student/${String(student_id).trim()}`,
          };
        });

        setParsedStudents(mapped);
        setActiveStep('match-photos');
      } catch (err) {
        console.error('Failed to parse spreadsheet', err);
        alert('មានបញ្ហាក្នុងការអានឯកសារ Excel/CSV សូមពិនិត្យទម្រង់ឯកសារ!');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle Multi-Photo bulk upload
  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileMap: { [id: string]: File } = {};
    const previewMap: { [id: string]: string } = {};

    Array.from(files).forEach((file) => {
      // Extract filename without extension, e.g., "ID-5997.jpg" -> "ID-5997"
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const cleanId = nameWithoutExt.trim();
      fileMap[cleanId] = file;
      previewMap[cleanId] = URL.createObjectURL(file);
    });

    setPhotoFiles(fileMap);
    setPhotoPreviews(previewMap);
  };

  // Generate Sample Excel Template for user download
  const handleDownloadTemplate = () => {
    downloadStudentImportTemplate();
  };

  // Final Commit to Database
  const handleFinalSubmit = async () => {
    setIsProcessing(true);
    setUploadStatus('កំពុងបញ្ចូលរូបថត និងរក្សាទុកទិន្នន័យទៅកាន់ Supabase...');

    try {
      const finalStudents: Student[] = [];

      for (let i = 0; i < parsedStudents.length; i++) {
        const student = parsedStudents[i];
        let photoUrl = student.photo_url;

        // Check if matching photo was uploaded
        const matchedPhoto = photoFiles[student.student_id];
        if (matchedPhoto) {
          setUploadStatus(`កំពុង Upload រូបថតសិស្ស ${student.student_id} (${i + 1}/${parsedStudents.length})...`);
          try {
            photoUrl = await uploadAsset(
              matchedPhoto,
              'student-photos',
              `${student.student_id}_${Date.now()}.jpg`
            );
          } catch (e) {
            console.error(`Failed to upload photo for ${student.student_id}`, e);
          }
        }

        finalStudents.push({
          ...student,
          photo_url: photoUrl,
        });
      }

      setUploadStatus('កំពុងរក្សាទុកទិន្នន័យទៅកាន់ Database Supabase...');
      const syncResult = await syncStudentsToSupabase(finalStudents);
      
      await onImportComplete(finalStudents);
      setIsProcessing(false);
      onClose();

      if (syncResult.success) {
        alert(`ជោគជ័យ! បាននាំចូល និងរក្សាទុកសិស្សចំនួន ${finalStudents.length} នាក់ទៅកាន់ Database Supabase ដោយជោគជ័យ!`);
      } else {
        alert(`បានរក្សាទុកក្នុង Local Storage ប៉ុន្តែមានបញ្ហាបញ្ចូលទៅ Supabase: ${syncResult.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Import failed', err);
      setIsProcessing(false);
      alert('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-neutral-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/80">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 font-kantumruy flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              នាំចូលទិន្នន័យសិស្សជាក្រុម (Bulk Import Excel / CSV)
            </h3>
            <p className="text-xs text-neutral-500 font-kantumruy mt-0.5">
              ផ្ទុកឡើងឯកសារ Excel និងរូបថត 3x4 ដែលដាក់ឈ្មោះតាមអត្តលេខសិស្ស (ឧ. ID-5997.jpg)
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Steps */}
        <div className="p-6 space-y-6">
          
          {/* Step 1: Excel Template & Upload */}
          <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200 space-y-4">
            {/* Template Download Card */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
                  <h4 className="text-xs font-bold text-emerald-950 font-kantumruy">
                    ឯកសារ Excel គំរូផ្លូវការ (Official Student Import Template)
                  </h4>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                    គ្មានបញ្ហាកំហុស
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900/80 font-kantumruy leading-relaxed">
                  ឯកសារនេះមានទម្រង់ត្រឹមត្រូវស្រាប់ (មាន ២ Sheet៖ <strong>Sheet ១ សម្រាប់បំពេញទិន្នន័យ</strong> និង <strong>Sheet ២ សម្រាប់អានការណែនាំលម្អិត</strong>)។
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors shrink-0 font-kantumruy cursor-pointer"
              >
                <Download className="w-4 h-4" />
                ទាញយកគំរូ Excel (.xlsx)
              </button>
            </div>

            {/* Supported Columns Guide */}
            <div className="bg-white border border-neutral-200 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 mb-2">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>ឈ្មោះជួរឈរ (Columns) ក្នុងតារាង Excel គំរូ៖</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-medium">
                  អត្តលេខ *
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-medium">
                  គោត្តនាម-នាម *
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-medium">
                  ភេទ *
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-medium">
                  ថ្ងៃខែឆ្នាំកំណើត *
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-medium">
                  ថ្នាក់ *
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md">
                  ឈ្មោះឡាតាំង
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md">
                  ទីកន្លែងកំណើត
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md">
                  បន្ទប់
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md">
                  ឪពុក
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md">
                  ម្ដាយ
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-medium" title="បង្ហាញលើប័ណ្ណសិស្ស (ID Card)">
                  លេខទូរស័ព្ទសិស្ស (Student Phone)
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-medium" title="បង្ហាញលើ Digital Card សម្រាប់ទាក់ទង">
                  លេខទូរស័ព្ទអាណាព្យាបាល (Parent Phone)
                </span>
                <span className="px-2 py-0.5 text-[11px] bg-sky-50 text-sky-800 border border-sky-200 rounded-md font-medium">
                  រូបថត / Drive Link
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 mt-2">
                * សម្គាល់៖ សញ្ញា (*) ជាទិន្នន័យចាំបាច់។ ប្រព័ន្ធគាំទ្រទាំងភាសាខ្មែរ និងអង់គ្លេសដោយស្វ័យប្រវត្តិ។
              </p>
            </div>

            {/* Upload File Input */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 font-kantumruy flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
                  ជ្រើសរើសឯកសារ Excel របស់អ្នក (.xlsx ឬ .csv)
                </h4>
                <p className="text-xs text-neutral-500 font-kantumruy mt-0.5">
                  បន្ទាប់ពីបានបំពេញទិន្នន័យតាមគំរូរួច សូមចុចប៊ូតុងខាងស្ដាំដើម្បី Upload
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-4 h-4" />
                  ជ្រើសរើសឯកសារ Excel
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleSpreadsheetUpload}
                  />
                </label>
              </div>
            </div>

            {parsedStudents.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md border border-emerald-200">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>បានផ្ទុកទិន្នន័យសិស្សចំនួន <strong>{parsedStudents.length} នាក់</strong> ដោយជោគជ័យ</span>
              </div>
            )}
          </div>

          {/* Step 2: Bulk Photos Upload */}
          {parsedStudents.length > 0 && (
            <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 font-kantumruy flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
                    រូបថតសិស្ស (Google Drive Link ឬ ឯកសាររូបថត 3x4)
                  </h4>
                  <p className="text-xs text-neutral-500 font-kantumruy mt-1">
                    ប្រសិនបើតារាង Excel មានតំណភ្ជាប់ <strong>Google Drive</strong> ប្រព័ន្ធនឹងទាញយករូបភាពដោយស្វ័យប្រវត្តិ។ ឬអ្នកអាចផ្ទុកឡើងរូបថត 3x4 បន្ថែមពីកុំព្យូទ័រ (ដាក់ឈ្មោះតាមអត្តលេខ ID-5997.jpg)។
                  </p>
                </div>

                <div>
                  <label className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-neutral-800 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-300 cursor-pointer transition-colors shadow-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                    ជ្រើសរើសរូបថត (Multi-select)
                    <input
                      ref={photosInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg, image/png, image/webp"
                      className="hidden"
                      onChange={handlePhotosUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Status alerts */}
              <div className="space-y-2 mt-3">
                {parsedStudents.filter((s) => Boolean(s.photo_url)).length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>
                      បានរកឃើញតំណភ្ជាប់រូបថត (Google Drive / URL) ចំនួន{' '}
                      <strong>{parsedStudents.filter((s) => Boolean(s.photo_url)).length} នាក់</strong> ពីតារាង Excel រួចជាស្រេច!
                    </span>
                  </div>
                )}

                {Object.keys(photoFiles).length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-medium text-sky-800 bg-sky-50 px-3 py-1.5 rounded-md border border-sky-200">
                    <CheckCircle className="w-4 h-4 shrink-0 text-sky-600" />
                    <span>
                      បានផ្គូផ្គងរូបថតពីកុំព្យូទ័រ <strong>{Object.keys(photoFiles).length} រូប</strong> ទៅនឹងសិស្សក្នុងបញ្ជី
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Table Preview */}
          {parsedStudents.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider font-kantumruy">
                  ទិដ្ឋភាពទូទៅនៃទិន្នន័យត្រូវបញ្ចូល ({parsedStudents.length} នាក់)
                </h4>
              </div>

              <div className="border border-neutral-200 rounded-lg overflow-x-auto max-h-60 text-xs font-kantumruy">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-neutral-100 text-neutral-700 sticky top-0 border-b border-neutral-200">
                    <tr>
                      <th className="py-2 px-3 font-semibold">រូបថត</th>
                      <th className="py-2 px-3 font-semibold">អត្តលេខ ID</th>
                      <th className="py-2 px-3 font-semibold">គោត្តនាម-នាម</th>
                      <th className="py-2 px-3 font-semibold">ភេទ</th>
                      <th className="py-2 px-3 font-semibold">ថ្ងៃខែឆ្នាំកំណើត</th>
                      <th className="py-2 px-3 font-semibold">ថ្នាក់ / បន្ទប់</th>
                      <th className="py-2 px-3 font-semibold text-blue-700">លេខសិស្ស (Card)</th>
                      <th className="py-2 px-3 font-semibold text-emerald-700">លេខអាណាព្យាបាល (Digital)</th>
                      <th className="py-2 px-3 font-semibold">ទីកន្លែងកំណើត</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {parsedStudents.map((st) => {
                      const localPhoto = photoPreviews[st.student_id];
                      const driveOrWebPhoto = formatDriveImageUrl(st.photo_url);
                      const displayPhoto = localPhoto || driveOrWebPhoto;
                      const isDrive = Boolean(st.photo_url && isGoogleDriveUrl(st.photo_url));

                      return (
                        <tr key={st.id} className="hover:bg-neutral-50/80">
                          <td className="py-1.5 px-3">
                            {displayPhoto ? (
                              <div className="relative group w-8 h-10">
                                <img
                                  src={displayPhoto}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-10 object-cover rounded-xs border border-neutral-300"
                                  onError={(e) => {
                                    const fallback = getDriveImageFallbackUrl(st.photo_url);
                                    if (fallback && e.currentTarget.src !== fallback) {
                                      e.currentTarget.src = fallback;
                                    }
                                  }}
                                />
                                {isDrive && !localPhoto && (
                                  <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-[7px] text-white px-1 rounded font-mono" title="Google Drive Link">
                                    Drive
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="w-8 h-10 bg-neutral-200 text-neutral-400 rounded-xs flex items-center justify-center text-[8px]">
                                គ្មាន
                              </div>
                            )}
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold text-sky-900">{st.student_id}</td>
                          <td className="py-1.5 px-3 font-semibold text-neutral-900">{st.full_name}</td>
                          <td className="py-1.5 px-3">{st.gender}</td>
                          <td className="py-1.5 px-3 font-mono">{st.dob}</td>
                          <td className="py-1.5 px-3">{st.grade} ({st.class_number})</td>
                          <td className="py-1.5 px-3 font-mono text-blue-700 font-semibold">{st.student_phone || '—'}</td>
                          <td className="py-1.5 px-3 font-mono text-emerald-700 font-semibold">{st.parent_phone || '—'}</td>
                          <td className="py-1.5 px-3 text-neutral-600 truncate max-w-[180px]">{st.pob}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Loading status */}
          {isProcessing && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-kantumruy flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>{uploadStatus}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-lg transition-colors"
          >
            បោះបង់ (Cancel)
          </button>

          <button
            type="button"
            disabled={parsedStudents.length === 0 || isProcessing}
            onClick={handleFinalSubmit}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            រក្សាទុកទិន្នន័យ {parsedStudents.length > 0 ? `(${parsedStudents.length} នាក់)` : ''}
          </button>
        </div>

      </div>
    </div>
  );
};
