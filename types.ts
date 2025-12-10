export enum DevelopmentLevel {
  BB = 'BB',   // Belum Berkembang
  MB = 'MB',   // Mulai Berkembang
  BSH = 'BSH', // Berkembang Sesuai Harapan
  BSB = 'BSB'  // Berkembang Sangat Baik
}

export enum CharacterScore {
  SB = 'Sangat Baik',
  B = 'Baik',
  PB = 'Perlu Bimbingan'
}

export interface StudentInfo {
  name: string;
  nis: string;
  dob: string;
  parentName: string;
  address: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  group: string;
  photoUrl?: string; // New: Foto Siswa
}

export interface HealthData {
  weight: string; // Berat Badan (kg)
  height: string; // Tinggi Badan (cm)
  headCircumference: string; // Lingkar Kepala (cm)
  eyes: string; // Penglihatan
  ears: string; // Pendengaran
  teeth: string; // Kesehatan Gigi
}

export interface CPPAItem {
  id: string;
  scope: string; // Lingkup Perkembangan (e.g., Nilai Agama)
  description: string;
  level: DevelopmentLevel;
}

export interface DailyActivity {
  id: string;
  activity: string;
  indicator: string;
  grade: 'A' | 'B' | 'C';
  note: string;
}

export interface CharacterItem {
  id: string;
  aspect: string; // e.g., Sopan Santun
  score: CharacterScore;
}

export interface Attendance {
  present: number;
  sick: number;
  permission: number;
  alpha: number;
}

export interface Extracurricular {
  id: string;
  name: string;
  grade: string;
  note: string;
}

export interface ReportData {
  student: StudentInfo;
  health: HealthData; // New: Data Kesehatan
  cppa: CPPAItem[];
  dailyActivities: DailyActivity[];
  character: CharacterItem[];
  attendance: Attendance;
  extras: Extracurricular[];
  narrative: string; 
  teacherNote: string; 
  principalName: string;
  teacherName: string;
  date: string;
  place: string;
}