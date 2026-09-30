import * as XLSX from 'xlsx';

export interface SampleStudentRow {
  'អត្តលេខ (Student ID)': string;
  'គោត្តនាម-នាម (Full Name)': string;
  'ឈ្មោះឡាតាំង (Latin Name)': string;
  'ភេទ (Gender)': string;
  'ថ្ងៃខែឆ្នាំកំណើត (DOB)': string;
  'ទីកន្លែងកំណើត (POB)': string;
  'ថ្នាក់ (Grade)': string;
  'បន្ទប់ (Room)': string;
  'ឪពុក (Father Name)': string;
  'ម្ដាយ (Mother Name)': string;
  'លេខទូរស័ព្ទអាណាព្យាបាល (Parent Phone)': string;
  'លេខទូរស័ព្ទផ្ទាល់ (Personal Phone)': string;
  'រូបថត (Photo or Drive Link)': string;
}

export const SAMPLE_STUDENT_DATA: SampleStudentRow[] = [
  {
    'អត្តលេខ (Student ID)': 'ID-5997',
    'គោត្តនាម-នាម (Full Name)': 'សុខ ចាន់ដារ៉ា',
    'ឈ្មោះឡាតាំង (Latin Name)': 'SOK CHANDARA',
    'ភេទ (Gender)': 'ប្រុស',
    'ថ្ងៃខែឆ្នាំកំណើត (DOB)': '15-08-2008',
    'ទីកន្លែងកំណើត (POB)': 'ភូមិពាមរក៍ ស្រុកពាមរក៍ ខេត្តព្រៃវែង',
    'ថ្នាក់ (Grade)': '11B',
    'បន្ទប់ (Room)': '8',
    'ឪពុក (Father Name)': 'សុខ គឹមហុង',
    'ម្ដាយ (Mother Name)': 'ឡុង ស្រីមុំ',
    'លេខទូរស័ព្ទអាណាព្យាបាល (Parent Phone)': '095 858 545',
    'លេខទូរស័ព្ទផ្ទាល់ (Personal Phone)': '098 776 543',
    'រូបថត (Photo or Drive Link)': 'https://drive.google.com/file/d/1i6TuDtDfbxqa7PsAcyVxZ7c3X25kNRqY/view?usp=drivesdk',
  },
  {
    'អត្តលេខ (Student ID)': 'ID-5998',
    'គោត្តនាម-នាម (Full Name)': 'កែវ សោភា',
    'ឈ្មោះឡាតាំង (Latin Name)': 'KEO SOPHEA',
    'ភេទ (Gender)': 'ស្រី',
    'ថ្ងៃខែឆ្នាំកំណើត (DOB)': '02-03-2008',
    'ទីកន្លែងកំណើត (POB)': 'សង្កាត់បឹងកក់១ ខណ្ឌទួលគោក រាជធានីភ្នំពេញ',
    'ថ្នាក់ (Grade)': '11B',
    'បន្ទប់ (Room)': '8',
    'ឪពុក (Father Name)': 'កែវ វិបុល',
    'ម្ដាយ (Mother Name)': 'មាស សុផាត',
    'លេខទូរស័ព្ទអាណាព្យាបាល (Parent Phone)': '088 123 456',
    'លេខទូរស័ព្ទផ្ទាល់ (Personal Phone)': '070 334 455',
    'រូបថត (Photo or Drive Link)': 'ID-5998.jpg',
  },
  {
    'អត្តលេខ (Student ID)': 'ID-5999',
    'គោត្តនាម-នាម (Full Name)': 'ជា រតនា',
    'ឈ្មោះឡាតាំង (Latin Name)': 'CHEA RATTANA',
    'ភេទ (Gender)': 'ប្រុស',
    'ថ្ងៃខែឆ្នាំកំណើត (DOB)': '10-11-2007',
    'ទីកន្លែងកំណើត (POB)': 'ឃុំរកាកោង ស្រុកមុខកំពូល ខេត្តកណ្តាល',
    'ថ្នាក់ (Grade)': '11A',
    'បន្ទប់ (Room)': '5',
    'ឪពុក (Father Name)': 'ជា សុភ័ក្រ្ត',
    'ម្ដាយ (Mother Name)': 'ឃួន វ៉ាន់នី',
    'លេខទូរស័ព្ទអាណាព្យាបាល (Parent Phone)': '012 998 877',
    'លេខទូរស័ព្ទផ្ទាល់ (Personal Phone)': '012 332 211',
    'រូបថត (Photo or Drive Link)': '',
  },
  {
    'អត្តលេខ (Student ID)': 'ID-6000',
    'គោត្តនាម-នាម (Full Name)': 'សេង មុនីនាថ',
    'ឈ្មោះឡាតាំង (Latin Name)': 'SENG MONINEATH',
    'ភេទ (Gender)': 'ស្រី',
    'ថ្ងៃខែឆ្នាំកំណើត (DOB)': '24-12-2008',
    'ទីកន្លែងកំណើត (POB)': 'ក្រុងសៀមរាប ខេត្តសៀមរាប',
    'ថ្នាក់ (Grade)': '11A',
    'បន្ទប់ (Room)': '5',
    'ឪពុក (Father Name)': 'សេង ហេង',
    'ម្ដាយ (Mother Name)': 'លីម គឹមសួរ',
    'លេខទូរស័ព្ទអាណាព្យាបាល (Parent Phone)': '097 889 900',
    'លេខទូរស័ព្ទផ្ទាល់ (Personal Phone)': '096 112 233',
    'រូបថត (Photo or Drive Link)': '',
  },
];

export const INSTRUCTIONS_DATA = [
  {
    'ល.រ (No.)': 1,
    'ឈ្មោះជួរឈរ (Column)': 'អត្តលេខ (Student ID)',
    'ទាមទារ (Required)': 'បាទ/ចាស (Required)',
    'ទម្រង់ទិន្នន័យ (Format)': 'អក្សរ ឬលេខ (ឧ. ID-5997 ឬ 1834)',
    'ការពន្យល់ និងការណែនាំ (Guidelines)': 'លេខសម្គាល់សិស្សម្នាក់ៗមិនត្រូវជាន់គ្នាឡើយ។ QR Code ក៏នឹងភ្ជាប់ជាមួយ ID នេះដោយស្វ័យប្រវត្តិ។',
  },
  {
    'ល.រ (No.)': 2,
    'ឈ្មោះជួរឈរ (Column)': 'គោត្តនាម-នាម (Full Name)',
    'ទាមទារ (Required)': 'បាទ/ចាស (Required)',
    'ទម្រង់ទិន្នន័យ (Format)': 'អក្សរខ្មែរ (ឧ. សុខ ចាន់ដារ៉ា)',
    'ការពន្យល់ និងការណែនាំ (Guidelines)': 'ឈ្មោះសិស្សពេញជាភាសាខ្មែរ សម្រាប់បង្ហាញលើប័ណ្ណសិស្ស។',
  },
  {
    'ល.រ (No.)': 3,
    'ឈ្មោះជួរឈរ (Column)': 'ឈ្មោះឡាតាំង (Latin Name)',
    'ទាមទារ (Required)': 'មិនទាមទារ (Optional)',
    'ទម្រង់ទិន្នន័យ (Format)': 'អក្សរឡាតាំងធំ (ឧ. SOK CHANDARA)',
    'ការពន្យល់ និងការណែនាំ (Guidelines)': 'ឈ្មោះជាអក្សរអង់គ្លេស។ ប្រសិនបើទុកទំនេរ ប្រព័ន្ធនឹងអាចបង្កើតដោយស្វ័យប្រវត្តិតាមឈ្មោះខ្មែរ។',
  },
  {
    'ល.រ (No.)': 4,
    'ឈ្មោះជួរឈរ (Column)': 'ភេទ (Gender)',
    'ទាមទារ (Required)': 'បាទ/ចាស (Required)',
    'ទម្រង់ទិន្នន័យ (Format)': 'ប្រុស ឬ ស្រី (M / F / Male / Female)',
    'ការពន្យល់ និងការណែនាំ (Guidelines)': 'កំណត់ភេទសិស្ស (ប្រុស ឬ ស្រី)។',
  },
  {
    'ល.រ (No.)': 5,
    'ឈ្មោះជួរឈរ (Column)': 'ថ្ងៃខែឆ្នាំកំណើត (DOB)',
    'ទាមទារ (Required)': 'បាទ/ចាស (Required)',
    'ទម្រង់ទិន្នន័យ (Format)': 'DD-MM-YYYY (ឧ. 15-08-2008 ឬ ១៥-០៨-២០០៨)',
    'ការពន្យល់ និងការណែនាំ (Guidelines)': 'ថ្ងៃខែឆ្នាំកំណើតសិស្ស អាចជាលេខអារ៉ាប់ ឬលេខខ្មែរ។',
  },
  {
    'ល.រ (No.)': 6,
    'ឈ្មោះជួរឈរ (Column)': 'ទីកន្លែងកំណើត (POB)',
    'ទាមទារ (Required)': 'មិនទាមទារ (Optional)',
    'ទម្រង់ទិន្នន័យ (Format)': 'អក្សរ (ឧ. ស្រុកពាមរក៍ ខេត្តព្រៃវែង)',
    'ការពន្យល់ និងការណែនាំ (Guidelines)': 'ភូមិ ឃុំ ស្រុក ខេត្តកំណើតរបស់សិស្ស។',
  },
  {
    'ល.រ (No.)': 7,
    'ឈ្មោះជួរឈរ (Column)': 'ថ្នាក់ (Grade)',
    'ទាមទារ (Required)': 'បាទ/ចាស (Required)',
    'ទម្រង់ទិន្នន័យ (Format)': 'ឧ. 11B, 12A, 10C, 7A...',
    'ការពន្យល់ និងការណែនាំ (Guidelines)': 'កម្រិតថ្នាក់សិក្សារបស់សិស្ស។',
  },
  {
    'ល.រ (No.)': 8,
    'ឈ្មោះជួរឈរ (Column)': 'បន្ទប់ (Room)',
    'ទាមទារ (Required)': 'មិនទាមទារ (Optional)',
    'ទម្រង់ទិន្នន័យ (Format)': 'ឧ. 8, 5, 12, B01...',
    'ការពន្យល់ និងការណែនាំ (Guidelines)': 'លេខបន្ទប់សិក្សា។',
  },
  {
    'ល.រ (No.)': 9,
    'ឈ្មោះជួរឈរ (Column)': 'ឪពុក (Father Name)',
    'ទាមទារ (Required)': 'មិនទាមទារ (Optional)',
    'ទម្រង់ទិន្នន័យ (Format)': 'ឈ្មោះឪពុក',
    'ការពន្យល់ និងការណែនាំ (Guidelines)': 'ឈ្មោះឪពុកសិស្ស។',
  },
  {
    'ល.រ (No.)': 10,
    'ឈ្មោះជួរឈរ (Column)': 'ម្ដាយ (Mother Name)',
    'ទាមទារ (Required)': 'មិនទាមទារ (Optional)',
    'ទម្រង់ទិន្នន័យ (Format)': 'ឈ្មោះម្ដាយ',
    'ការពន្យល់ និងការណែនាំ (Guidelines)': 'ឈ្មោះម្ដាយសិស្ស។',
  },
  {
    'ល.រ (No.)': 11,
    'ឈ្មោះជួរឈរ (Column)': 'ទូរស័ព្ទ (Phone)',
    'ទាមទារ (Required)': 'មិនទាមទារ (Optional)',
    'ទម្រង់ទិន្នន័យ (Format)': 'ឧ. 095 858 545',
    'ការពន្យល់ និងការណែនាំ (Guidelines)': 'លេខទូរស័ព្ទទាក់ទងអាណាព្យាបាល ឬសិស្ស។',
  },
  {
    'ល.រ (No.)': 12,
    'ឈ្មោះជួរឈរ (Column)': 'រូបថត (Photo or Drive Link)',
    'ទាមទារ (Required)': 'មិនទាមទារ (Optional)',
    'ទម្រង់ទិន្នន័យ (Format)': 'Google Drive Link, URL, ឬ ឈ្មោះ File',
    'ការពន្យល់ និងការណែនាំ (Guidelines)': 'ជម្រើសទី ១៖ ដាក់ Link Google Drive (ត្រូវ Share ជា Anyone with the link can view)។ ជម្រើសទី ២៖ ដាក់ឈ្មោះ File ដូចជា ID-5998.jpg ហើយពេល Import ជ្រើសរើសរូបភាពពីកុំព្យូទ័រចូល។',
  },
];

/**
 * Downloads a well-formatted Excel file (.xlsx) with:
 * Sheet 1: Sample student data table with clear column headers
 * Sheet 2: Detailed guidelines and explanations for every field
 */
export function downloadStudentImportTemplate() {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Student Data
  const wsStudents = XLSX.utils.json_to_sheet(SAMPLE_STUDENT_DATA);

  // Set column widths for readability
  wsStudents['!cols'] = [
    { wch: 18 }, // អត្តលេខ (Student ID)
    { wch: 22 }, // គោត្តនាម-នាម (Full Name)
    { wch: 22 }, // ឈ្មោះឡាតាំង (Latin Name)
    { wch: 14 }, // ភេទ (Gender)
    { wch: 20 }, // ថ្ងៃខែឆ្នាំកំណើត (DOB)
    { wch: 36 }, // ទីកន្លែងកំណើត (POB)
    { wch: 14 }, // ថ្នាក់ (Grade)
    { wch: 14 }, // បន្ទប់ (Room)
    { wch: 20 }, // ឪពុក (Father Name)
    { wch: 20 }, // ម្ដាយ (Mother Name)
    { wch: 16 }, // ទូរស័ព្ទ (Phone)
    { wch: 55 }, // រូបថត (Photo or Drive Link)
  ];

  XLSX.utils.book_append_sheet(wb, wsStudents, 'តារាងសិស្ស_Students');

  // 2. Sheet 2: Guidelines
  const wsInstructions = XLSX.utils.json_to_sheet(INSTRUCTIONS_DATA);
  wsInstructions['!cols'] = [
    { wch: 10 }, // No
    { wch: 26 }, // Column Name
    { wch: 20 }, // Required
    { wch: 30 }, // Format
    { wch: 60 }, // Guidelines
  ];

  XLSX.utils.book_append_sheet(wb, wsInstructions, 'ការណែនាំ_Instructions');

  // Save the file
  XLSX.writeFile(wb, 'គំរូតារាងទិន្នន័យសិស្ស_Student_Import_Template.xlsx');
}
