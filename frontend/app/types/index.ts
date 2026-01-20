export type AttendanceStatus = 'present' | 'absent' | 'half' | 'holiday' | 'cancelled';

export interface Settings {
  targetPercentage: number;
  termStart: string;
  termEnd: string;
  weekStart: number;
  isOnboarded: boolean;
  notificationsEnabled: boolean;
  reminderMinutesBefore: number;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  color: string;
  targetPercentage?: number;
}

export interface ClassSchedule {
  id: string;
  subjectId: string;
  weekday: number;
  startTime: string;
  durationMinutes: number;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  subjectId: string;
  date: string;
  status: AttendanceStatus;
}

export interface Holiday {
  id: string;
  startDate: string;
  endDate: string;
  note: string;
}

export interface SubjectStats {
  subjectId: string;
  subjectName: string;
  present: number;
  absent: number;
  half: number;
  total: number;
  percentage: number;
  bunkable: number;
  required: number;
}

export interface OverallStats {
  totalClasses: number;
  attended: number;
  percentage: number;
  bunkable: number;
  required: number;
}
