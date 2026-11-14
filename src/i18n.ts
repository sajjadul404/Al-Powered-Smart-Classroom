import { LanguageCode, PageId } from './types';

export const PAGE_TITLES: Record<PageId, { en: string; bn: string }> = {
  dashboard: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  users: { en: 'User Management', bn: 'ব্যবহারকারী ব্যবস্থাপনা' },
  students: { en: 'Student Management', bn: 'শিক্ষার্থী ব্যবস্থাপনা' },
  attendance: { en: 'Attendance & Access', bn: 'উপস্থিতি ও প্রবেশাধিকার' },
  safety: { en: 'Safety & Emergency', bn: 'নিরাপত্তা ও জরুরি অবস্থা' },
  devices: { en: 'Device Management', bn: 'ডিভাইস ব্যবস্থাপনা' },
  'remote-config': { en: 'Remote Configuration', bn: 'রিমোট কনফিগারেশন' },
  'ota-updates': { en: 'OTA Updates', bn: 'ওটিএ আপডেট' },
  camera: { en: 'Classroom Monitoring', bn: 'শ্রেণিকক্ষ পর্যবেক্ষণ' },
  'hand-raise': { en: 'AI Hand-Raise', bn: 'এআই হাত তোলা শনাক্তকরণ' },
  'wifi-csi': { en: 'Wi-Fi CSI', bn: 'ওয়াই-ফাই সিএসআই' },
  'weather-analytics': { en: 'Weather & Analytics', bn: 'আবহাওয়া ও বিশ্লেষণ' },
  'history-reports': { en: 'History & Reports', bn: 'ইতিহাস ও প্রতিবেদন' },
  'ai-assistant': { en: 'AI Assistant', bn: 'এআই সহকারী' },
  'offline-sync': { en: 'Offline & Sync', bn: 'অফলাইন ও সিঙ্ক' },
  notifications: { en: 'Notifications', bn: 'বিজ্ঞপ্তি কেন্দ্র' },
  settings: { en: 'Settings', bn: 'সেটিংস' },
};

export const UI_COPY: Record<
  LanguageCode,
  {
    brandSubtitle: string;
    demoNotice: string;
    totalStudents: string;
    presentStudents: string;
    absentStudents: string;
    lateStudents: string;
    temperature: string;
    humidity: string;
    heatIndex: string;
    roomOccupancy: string;
    deviceStatus: string;
    activeAlerts: string;
    logout: string;
    resetFire: string;
    acknowledge: string;
    searchPlaceholder: string;
    exportCsv: string;
    printReport: string;
    saveChanges: string;
    fireBannerTitle: string;
    panicBannerTitle: string;
  }
> = {
  en: {
    brandSubtitle: 'Smart Classroom Platform',
    demoNotice: 'Demo Telemetry Mode — Interactive simulated ESP32-S3-CAM data for evaluation',
    totalStudents: 'Total Students',
    presentStudents: 'Present Students',
    absentStudents: 'Absent Students',
    lateStudents: 'Late Students',
    temperature: 'Classroom Temp',
    humidity: 'Humidity',
    heatIndex: 'Heat Index',
    roomOccupancy: 'Room Occupancy',
    deviceStatus: 'Device Status',
    activeAlerts: 'Active Alerts',
    logout: 'Logout',
    resetFire: 'Reset Fire',
    acknowledge: 'Acknowledge',
    searchPlaceholder: 'Search records...',
    exportCsv: 'Export CSV',
    printReport: 'Print Report',
    saveChanges: 'Save Configuration',
    fireBannerTitle: 'FIRE DETECTED — Emergency Door Override Active (Unlocked)',
    panicBannerTitle: 'PANIC ALERT — Immediate Classroom Assistance Requested',
  },
  bn: {
    brandSubtitle: 'স্মার্ট শ্রেণিকক্ষ প্ল্যাটফর্ম',
    demoNotice: 'ডেমো টেলিমেট্রি মোড — মূল্যায়নের জন্য সিমুলেটেড ESP32-S3-CAM ডেটা',
    totalStudents: 'মোট শিক্ষার্থী',
    presentStudents: 'উপস্থিত শিক্ষার্থী',
    absentStudents: 'অনুপস্থিত শিক্ষার্থী',
    lateStudents: 'বিলম্বিত শিক্ষার্থী',
    temperature: 'শ্রেণিকক্ষের তাপমাত্রা',
    humidity: 'আর্দ্রতা',
    heatIndex: 'তাপ সূচক',
    roomOccupancy: 'কক্ষের উপস্থিতি',
    deviceStatus: 'ডিভাইস অবস্থা',
    activeAlerts: 'সক্রিয় সতর্কতা',
    logout: 'লগআউট',
    resetFire: 'আগুন রিসেট করুন',
    acknowledge: 'স্বীকার করুন',
    searchPlaceholder: 'তথ্য খুঁজুন...',
    exportCsv: 'সিএসভি ডাউনলোড',
    printReport: 'প্রতিবেদন প্রিন্ট',
    saveChanges: 'কনফিগারেশন সংরক্ষণ',
    fireBannerTitle: 'আগুন শনাক্ত হয়েছে — জরুরি দরজা খোলা রাখা হয়েছে',
    panicBannerTitle: 'প্যানিক সতর্কতা — শ্রেণিকক্ষে তাৎক্ষণিক সহায়তা প্রয়োজন',
  },
};

export function tPage(page: PageId, lang: LanguageCode): string {
  return PAGE_TITLES[page][lang];
}
