import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Settings,
  Subject,
  ClassSchedule,
  AttendanceRecord,
  Holiday,
  RescheduledClass,
} from '../types';
import * as Storage from '../services/storage';

interface DataContextType {
  settings: Settings | null;
  subjects: Subject[];
  classes: ClassSchedule[];
  attendance: AttendanceRecord[];
  holidays: Holiday[];
  rescheduledClasses: RescheduledClass[];
  loading: boolean;
  updateSettings: (settings: Settings) => Promise<void>;
  addSubject: (subject: Subject) => Promise<void>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addClass: (classSchedule: ClassSchedule) => Promise<void>;
  updateClass: (id: string, updates: Partial<ClassSchedule>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  markAttendance: (record: AttendanceRecord) => Promise<void>;
  updateAttendance: (id: string, status: AttendanceRecord['status']) => Promise<void>;
  addHoliday: (holiday: Holiday) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
  markDayAsHoliday: (date: string) => Promise<void>;
  addRescheduledClass: (rescheduled: RescheduledClass) => Promise<void>;
  deleteRescheduledClass: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [rescheduledClasses, setRescheduledClasses] = useState<RescheduledClass[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedSettings, loadedSubjects, loadedClasses, loadedAttendance, loadedHolidays, loadedRescheduled] =
        await Promise.all([
          Storage.getSettings(),
          Storage.getSubjects(),
          Storage.getClasses(),
          Storage.getAttendance(),
          Storage.getHolidays(),
          Storage.getRescheduledClasses(),
        ]);

      setSettings(loadedSettings);
      setSubjects(loadedSubjects);
      setClasses(loadedClasses);
      setAttendance(loadedAttendance);
      setHolidays(loadedHolidays);
      setRescheduledClasses(loadedRescheduled);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateSettings = async (newSettings: Settings) => {
    await Storage.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const addSubject = async (subject: Subject) => {
    const updated = [...subjects, subject];
    await Storage.saveSubjects(updated);
    setSubjects(updated);
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    const updated = subjects.map(s => (s.id === id ? { ...s, ...updates } : s));
    await Storage.saveSubjects(updated);
    setSubjects(updated);
  };

  const deleteSubject = async (id: string) => {
    const updated = subjects.filter(s => s.id !== id);
    await Storage.saveSubjects(updated);
    setSubjects(updated);

    // Also delete associated classes and attendance
    const updatedClasses = classes.filter(c => c.subjectId !== id);
    await Storage.saveClasses(updatedClasses);
    setClasses(updatedClasses);

    const updatedAttendance = attendance.filter(a => a.subjectId !== id);
    await Storage.saveAttendance(updatedAttendance);
    setAttendance(updatedAttendance);
  };

  const addClass = async (classSchedule: ClassSchedule) => {
    const updated = [...classes, classSchedule];
    await Storage.saveClasses(updated);
    setClasses(updated);
  };

  const updateClass = async (id: string, updates: Partial<ClassSchedule>) => {
    const updated = classes.map(c => (c.id === id ? { ...c, ...updates } : c));
    await Storage.saveClasses(updated);
    setClasses(updated);
  };

  const deleteClass = async (id: string) => {
    const updated = classes.filter(c => c.id !== id);
    await Storage.saveClasses(updated);
    setClasses(updated);

    // Also delete associated attendance
    const updatedAttendance = attendance.filter(a => a.classId !== id);
    await Storage.saveAttendance(updatedAttendance);
    setAttendance(updatedAttendance);
  };

  const markAttendance = async (record: AttendanceRecord) => {
    // Check if attendance already exists for this class and date
    const existingIndex = attendance.findIndex(
      a => a.classId === record.classId && a.date === record.date
    );

    let updated;
    if (existingIndex >= 0) {
      // Update existing record
      updated = [...attendance];
      updated[existingIndex] = record;
    } else {
      // Add new record
      updated = [...attendance, record];
    }

    await Storage.saveAttendance(updated);
    setAttendance(updated);
  };

  const updateAttendance = async (id: string, status: AttendanceRecord['status']) => {
    const updated = attendance.map(a => (a.id === id ? { ...a, status } : a));
    await Storage.saveAttendance(updated);
    setAttendance(updated);
  };

  const addHoliday = async (holiday: Holiday) => {
    const updated = [...holidays, holiday];
    await Storage.saveHolidays(updated);
    setHolidays(updated);
  };

  const deleteHoliday = async (id: string) => {
    const updated = holidays.filter(h => h.id !== id);
    await Storage.saveHolidays(updated);
    setHolidays(updated);
  };

  const markDayAsHoliday = async (date: string) => {
    // Add holiday for the specific date
    const holiday: Holiday = {
      id: `holiday_${date}`,
      startDate: date,
      endDate: date,
      note: 'Day marked as holiday',
    };
    await addHoliday(holiday);

    // Mark all classes on that day as holiday
    const dayOfWeek = new Date(date).getDay();
    const dayClasses = classes.filter(c => c.weekday === dayOfWeek);
    
    const updatedAttendance = [...attendance];
    dayClasses.forEach(cls => {
      const existingIndex = updatedAttendance.findIndex(
        a => a.classId === cls.id && a.date === date
      );
      
      const record: AttendanceRecord = {
        id: `${cls.id}_${date}`,
        classId: cls.id,
        subjectId: cls.subjectId,
        date,
        status: 'holiday',
      };
      
      if (existingIndex >= 0) {
        updatedAttendance[existingIndex] = record;
      } else {
        updatedAttendance.push(record);
      }
    });
    
    await Storage.saveAttendance(updatedAttendance);
    setAttendance(updatedAttendance);
  };

  const addRescheduledClass = async (rescheduled: RescheduledClass) => {
    const updated = [...rescheduledClasses, rescheduled];
    await Storage.saveRescheduledClasses(updated);
    setRescheduledClasses(updated);
  };

  const deleteRescheduledClass = async (id: string) => {
    const updated = rescheduledClasses.filter(r => r.id !== id);
    await Storage.saveRescheduledClasses(updated);
    setRescheduledClasses(updated);
  };

  const refreshData = async () => {
    await loadData();
  };

  return (
    <DataContext.Provider
      value={{
        settings,
        subjects,
        classes,
        attendance,
        holidays,
        rescheduledClasses,
        loading,
        updateSettings,
        addSubject,
        updateSubject,
        deleteSubject,
        addClass,
        updateClass,
        deleteClass,
        markAttendance,
        updateAttendance,
        addHoliday,
        deleteHoliday,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
