import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, Subject, ClassSchedule, AttendanceRecord, Holiday } from '../types';

const KEYS = {
  SETTINGS: 'attendance_settings',
  SUBJECTS: 'attendance_subjects',
  CLASSES: 'attendance_classes',
  ATTENDANCE: 'attendance_records',
  HOLIDAYS: 'attendance_holidays',
};

// Settings
export const getSettings = async (): Promise<Settings | null> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting settings:', error);
    return null;
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

// Subjects
export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SUBJECTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting subjects:', error);
    return [];
  }
};

export const saveSubjects = async (subjects: Subject[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  } catch (error) {
    console.error('Error saving subjects:', error);
  }
};

// Classes
export const getClasses = async (): Promise<ClassSchedule[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.CLASSES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting classes:', error);
    return [];
  }
};

export const saveClasses = async (classes: ClassSchedule[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
  } catch (error) {
    console.error('Error saving classes:', error);
  }
};

// Attendance
export const getAttendance = async (): Promise<AttendanceRecord[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting attendance:', error);
    return [];
  }
};

export const saveAttendance = async (attendance: AttendanceRecord[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(attendance));
  } catch (error) {
    console.error('Error saving attendance:', error);
  }
};

// Holidays
export const getHolidays = async (): Promise<Holiday[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.HOLIDAYS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting holidays:', error);
    return [];
  }
};

export const saveHolidays = async (holidays: Holiday[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.HOLIDAYS, JSON.stringify(holidays));
  } catch (error) {
    console.error('Error saving holidays:', error);
  }
};

// Rescheduled Classes
export const getRescheduledClasses = async (): Promise<RescheduledClass[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.RESCHEDULED);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting rescheduled classes:', error);
    return [];
  }
};

export const saveRescheduledClasses = async (rescheduled: RescheduledClass[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.RESCHEDULED, JSON.stringify(rescheduled));
  } catch (error) {
    console.error('Error saving rescheduled classes:', error);
  }
};

// Backup & Restore
export const exportData = async (): Promise<string> => {
  const [settings, subjects, classes, attendance, holidays, rescheduled] = await Promise.all([
    getSettings(),
    getSubjects(),
    getClasses(),
    getAttendance(),
    getHolidays(),
    getRescheduledClasses(),
  ]);

  return JSON.stringify({
    settings,
    subjects,
    classes,
    attendance,
    holidays,
    rescheduled,
    exportDate: new Date().toISOString(),
  }, null, 2);
};

export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.settings) await saveSettings(data.settings);
    if (data.subjects) await saveSubjects(data.subjects);
    if (data.classes) await saveClasses(data.classes);
    if (data.attendance) await saveAttendance(data.attendance);
    if (data.holidays) await saveHolidays(data.holidays);
    if (data.rescheduled) await saveRescheduledClasses(data.rescheduled);
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// Clear all data
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.SETTINGS,
      KEYS.SUBJECTS,
      KEYS.CLASSES,
      KEYS.ATTENDANCE,
      KEYS.HOLIDAYS,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
