import React, { useState, useEffect } from 'react';
import { X, Upload, User, Check, Camera, Link as LinkIcon } from 'lucide-react';
import { Student } from '../types';
import { uploadAsset } from '../lib/supabase';
import { DefaultStudentAvatar } from './CambodianEmblems';
import { formatDriveImageUrl, isGoogleDriveUrl, getDriveImageFallbackUrl } from '../lib/driveUtils';
import { formatPhoneNumber } from '../lib/phoneUtils';

interface StudentFormModalProps {
  isOpen: boolean;
  studentToEdit?: Student | null;
  onClose: () => void;
  onSave: (student: Student) => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  studentToEdit,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    student_id: '',
    full_name: '',
    gender: 'ប្រុស',
    dob: '',
    pob: '',
    grade: '11B',
    class_number: '8',
    father_name: '',
    mother_name: '',
    phone_number: '',
    student_phone: '',
    parent_phone: '',
    photo_url: '',
    qr_code_data: '',
  });

  const [previewPhoto, setPreviewPhoto] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (studentToEdit) {
      setFormData(studentToEdit);
      setPreviewPhoto(formatDriveImageUrl(studentToEdit.photo_url) || '');
    } else {
      const generatedId = `ID-${Math.floor(1000 + Math.random() * 9000)}`;
      setFormData({
        student_id: generatedId,
        full_name: '',
        gender: 'ប្រុស',
        dob: '១៥-០៨-២០០៨',
        pob: '',
        grade: '11B',
        class_number: '8',
        father_name: '',
        mother_name: '',
        phone_number: '',
        student_phone: '',
        parent_phone: '',
        photo_url: '',
        qr_code_data: `https://verify.moeys.gov.kh/student/${generatedId}`,
      });
      setPreviewPhoto('');
    }
    setErrors({});
  }, [studentToEdit, isOpen]);

  if (!isOpen) return null;

  const handlePhotoUrlChange = (urlInput: string) => {
    const formatted = formatDriveImageUrl(urlInput);
    setFormData((prev) => ({ ...prev, photo_url: formatted }));
    setPreviewPhoto(formatted);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewPhoto(localUrl);

    setIsUploading(true);
    try {
      const studentId = formData.student_id || `ID-${Date.now()}`;
      const url = await uploadAsset(file, 'student-photos', `${studentId}_${Date.now()}.jpg`);
      setFormData((prev) => ({ ...prev, photo_url: url }));
    } catch (err) {
      console.error('Failed to upload photo', err);
    } finally {
      setIsUploading(false);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.student_id?.trim()) newErrors.student_id = 'សូមបញ្ចូលអត្តលេខសិស្ស';
    if (!formData.full_name?.trim()) newErrors.full_name = 'សូមបញ្ចូលគោត្តនាម-នាមសិស្ស';
    if (!formData.dob?.trim()) newErrors.dob = 'សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើត';
    if (!formData.pob?.trim()) newErrors.pob = 'សូមបញ្ចូលទីកន្លែងកំណើត';
    if (!formData.grade?.trim()) newErrors.grade = 'សូមបញ្ចូលថ្នាក់រៀន';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const studentId = formData.student_id?.trim() || '';
    const student: Student = {
      id: studentToEdit?.id || `student-${Date.now()}`,
      student_id: studentId,
      full_name: formData.full_name?.trim() || '',
      latin_name: formData.latin_name?.trim() || '',
      gender: formData.gender || 'ប្រុស',
      dob: formData.dob?.trim() || '',
      pob: formData.pob?.trim() || '',
      grade: formData.grade?.trim() || '11B',
      class_number: formData.class_number?.trim() || '8',
      father_name: formData.father_name?.trim() || '',
      mother_name: formData.mother_name?.trim() || '',
      student_phone: formatPhoneNumber(formData.student_phone),
      parent_phone: formatPhoneNumber(formData.parent_phone || formData.phone_number),
      phone_number: formatPhoneNumber(formData.parent_phone || formData.phone_number || formData.student_phone),
      blood_type: formData.blood_type?.trim() || '',
      expiry_date: formData.expiry_date?.trim() || '',
      photo_url: formData.photo_url || previewPhoto || '',
      qr_code_data:
        formData.qr_code_data?.trim() || `https://verify.moeys.gov.kh/student/${studentId}`,
    };

    onSave(student);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-neutral-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/80">
          <h3 className="text-base font-semibold text-neutral-900 font-kantumruy flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            {studentToEdit ? 'កែប្រែព័ត៌មានសិស្ស (Edit Student)' : 'បញ្ចូលព័ត៌មានសិស្សថ្មី (Add Student)'}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 font-kantumruy text-xs">
          
          {/* Top row: Photo upload + primary identifiers */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            
            {/* 3x4 Photo Picker */}
            <div className="flex flex-col items-center shrink-0 w-32">
              <span className="text-neutral-600 font-medium mb-1.5 text-[11px]">រូបថត 3x4 សិស្ស</span>
              <div className="relative w-28 h-36 border-2 border-dashed border-neutral-300 rounded-lg overflow-hidden bg-neutral-100 group flex items-center justify-center shadow-xs">
                {previewPhoto ? (
                  <img
                    src={previewPhoto}
                    alt="Student Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const fallback = getDriveImageFallbackUrl(formData.photo_url);
                      if (fallback && e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                  />
                ) : (
                  <DefaultStudentAvatar gender={formData.gender} />
                )}

                {/* Upload overlay */}
                <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">ជ្រើសរើសឯកសារ</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>

              {isUploading && (
                <span className="text-[10px] text-blue-600 mt-1 animate-pulse">កំពុង Upload...</span>
              )}

              <label className="mt-2 text-[10px] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 cursor-pointer transition-colors flex items-center gap-1 font-medium">
                <Upload className="w-3 h-3" />
                <span>Upload រូបពីម៉ាស៊ីន</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>

            {/* Basic details */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Student ID */}
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  អត្តលេខសិស្ស (Student ID) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.student_id || ''}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  placeholder="ID-5997"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                {errors.student_id && <p className="text-red-500 text-[10px] mt-0.5">{errors.student_id}</p>}
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  គោត្តនាម-នាម (Full Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="សុខ ចាន់ដារ៉ា"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                {errors.full_name && <p className="text-red-500 text-[10px] mt-0.5">{errors.full_name}</p>}
              </div>

              {/* Photo URL / Google Drive link input */}
              <div className="sm:col-span-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-neutral-800 text-[11px] flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                    តំណភ្ជាប់រូបថត (Google Drive Link ឬ Web URL)
                  </label>
                  {isGoogleDriveUrl(formData.photo_url) && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Google Drive Link
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.photo_url || ''}
                    onChange={(e) => handlePhotoUrlChange(e.target.value)}
                    placeholder="https://drive.google.com/file/d/1i6TuDtDfbxqa7PsAcyVxZ7c3X25kNRqY/view?usp=drivesdk"
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                  {formData.photo_url && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, photo_url: '' }));
                        setPreviewPhoto('');
                      }}
                      className="px-2 py-1 text-neutral-400 hover:text-neutral-600 text-xs"
                      title="លុប Link"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  💡 អ្នកអាច copy link ពី Google Drive មកដាក់ផ្ទាល់បាន (ត្រូវប្រាកដថា Share ជា «Anyone with the link can view»)។
                </p>
              </div>

              {/* Latin / English Name */}
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  ឈ្មោះជាអក្សរឡាតាំង (Latin Name)
                </label>
                <input
                  type="text"
                  value={formData.latin_name || ''}
                  onChange={(e) => setFormData({ ...formData, latin_name: e.target.value.toUpperCase() })}
                  placeholder="SOK CHANDARA"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs uppercase font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block font-medium text-neutral-700 mb-1">ភេទ (Gender)</label>
                <select
                  value={formData.gender || 'ប្រុស'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="ប្រុស">ប្រុស (Male)</option>
                  <option value="ស្រី">ស្រី (Female)</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  ថ្ងៃខែឆ្នាំកំណើត (DOB) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dob || ''}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  placeholder="១៥-០៨-២០០៨"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                {errors.dob && <p className="text-red-500 text-[10px] mt-0.5">{errors.dob}</p>}
              </div>
            </div>

          </div>

          {/* Place of Birth */}
          <div>
            <label className="block font-medium text-neutral-700 mb-1">
              ទីកន្លែងកំណើត (Place of Birth) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.pob || ''}
              onChange={(e) => setFormData({ ...formData, pob: e.target.value })}
              placeholder="ភូមិពាមរក៍ ស្រុកពាមរក៍ ខេត្តព្រៃវែង"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            {errors.pob && <p className="text-red-500 text-[10px] mt-0.5">{errors.pob}</p>}
          </div>

          {/* Grade and Room */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                ថ្នាក់ទី (Grade) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.grade || ''}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder="11B"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              {errors.grade && <p className="text-red-500 text-[10px] mt-0.5">{errors.grade}</p>}
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">លេខបន្ទប់ (Room Number)</label>
              <input
                type="text"
                value={formData.class_number || ''}
                onChange={(e) => setFormData({ ...formData, class_number: e.target.value })}
                placeholder="8"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                លេខទូរស័ព្ទអាណាព្យាបាល (Parent Phone)
                <span className="text-[10px] text-emerald-600 font-semibold ml-1.5">★ បង្ហាញលើ Digital Card</span>
              </label>
              <input
                type="text"
                value={formData.parent_phone || formData.phone_number || ''}
                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value, phone_number: e.target.value })}
                onBlur={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setFormData({ ...formData, parent_phone: formatted, phone_number: formatted });
                }}
                placeholder="095 858 545 ឬ 012 345 678"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Student Personal Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                លេខទូរស័ព្ទផ្ទាល់ខ្លួនសិស្ស (Student Personal Phone)
                <span className="text-[10px] text-blue-600 font-semibold ml-1.5">★ លេខផ្ទាល់</span>
              </label>
              <input
                type="text"
                value={formData.student_phone || ''}
                onChange={(e) => setFormData({ ...formData, student_phone: e.target.value })}
                onBlur={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setFormData({ ...formData, student_phone: formatted });
                }}
                placeholder="098 776 543 ឬ 097 123 456"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center text-[11px] text-neutral-500 pt-5">
              <span>💡 លេខទូរស័ព្ទនឹងត្រូវបំពេញលេខ <strong>0</strong> នៅខាងមុខស្វ័យប្រវត្តិតាមស្ដង់ដារកម្ពុជា។</span>
            </div>
          </div>

          {/* Parents info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">ឈ្មោះឪពុក (Father's Name)</label>
              <input
                type="text"
                value={formData.father_name || ''}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                placeholder="សុខ គឹមហុង"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">ឈ្មោះម្ដាយ (Mother's Name)</label>
              <input
                type="text"
                value={formData.mother_name || ''}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                placeholder="ឡុង ស្រីមុំ"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Blood group and expiry date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">ក្រុមឈាម (Blood Group)</label>
              <select
                value={formData.blood_type || ''}
                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="">មិនបានបញ្ជាក់ (None)</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">កាលបរិច្ឆេទផុតកំណត់ប័ណ្ណ (Expiry Date)</label>
              <input
                type="text"
                value={formData.expiry_date || ''}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                placeholder="៣១ សីហា ២០២៦"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* QR Code Payload */}
          <div>
            <label className="block font-medium text-neutral-700 mb-1">
              តំណភ្ជាប់ QR Code ផ្ទាល់ខ្លួន (Custom QR Code Data - មិនទាមទារ)
            </label>
            <input
              type="text"
              value={formData.qr_code_data || ''}
              onChange={(e) => setFormData({ ...formData, qr_code_data: e.target.value })}
              placeholder="ទុកទំនេរដើម្បីប្រើតំណភ្ជាប់ពីការកំណត់សាលាដោយស្វ័យប្រវត្តិ"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-[11px] text-neutral-600 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <p className="text-[10px] text-neutral-500 mt-1">
              💡 ប្រសិនបើទុកទំនេរ ប្រព័ន្ធនឹងប្រើប្រាស់តំណភ្ជាប់ដែលបានកំណត់ក្នុង «ការកំណត់សាលា» (School Settings) + អត្តលេខសិស្ស (ID) ដោយស្វ័យប្រវត្តិ។
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors font-medium"
            >
              បោះបង់ (Cancel)
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              រក្សាទុក (Save Student)
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
