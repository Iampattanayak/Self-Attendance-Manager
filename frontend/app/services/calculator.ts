import { format, parseISO, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { AttendanceRecord, Subject, SubjectStats, OverallStats, Holiday, ClassSchedule } from '../types';

export const calculateSubjectStats = (
  subjectId: string,
  subjectName: string,
  attendance: AttendanceRecord[],
  targetPercentage: number
): SubjectStats => {
  const subjectAttendance = attendance.filter(a => a.subjectId === subjectId);
  
  let present = 0;
  let absent = 0;
  let half = 0;
  
  subjectAttendance.forEach(record => {
    if (record.status === 'present') present += 1;
    else if (record.status === 'absent') absent += 1;
    else if (record.status === 'half') {
      present += 0.5;
      half += 1;
    }
    // holiday and cancelled don't count in total
  });
  
  // Total classes = present + absent + half (not holidays/cancelled)
  const total = subjectAttendance.filter(
    a => a.status !== 'holiday' && a.status !== 'cancelled'
  ).length;
  
  const percentage = total > 0 ? (present / total) * 100 : 0;
  const target = targetPercentage / 100;
  
  // Bunkable: How many classes can skip and still maintain target
  // Formula: (Present - Target × Total) / (1 - Target)
  const bunkable = total > 0 
    ? Math.floor((present - target * total) / (1 - target))
    : 0;
  
  // Required: How many classes must attend to reach target
  // Formula: (Target × Total - Present) / Target
  const required = total > 0 && percentage < targetPercentage
    ? Math.ceil((target * total - present) / target)
    : 0;
  
  return {
    subjectId,
    subjectName,
    present: Math.floor(present),
    absent,
    half,
    total,
    percentage: Math.round(percentage * 100) / 100,
    bunkable: Math.max(0, bunkable),
    required: Math.max(0, required),
  };
};

export const calculateOverallStats = (
  attendance: AttendanceRecord[],
  targetPercentage: number
): OverallStats => {
  let present = 0;
  
  attendance.forEach(record => {
    if (record.status === 'present') present += 1;
    else if (record.status === 'half') present += 0.5;
  });
  
  const totalClasses = attendance.filter(
    a => a.status !== 'holiday' && a.status !== 'cancelled'
  ).length;
  
  const percentage = totalClasses > 0 ? (present / totalClasses) * 100 : 0;
  const target = targetPercentage / 100;
  
  const bunkable = totalClasses > 0 
    ? Math.floor((present - target * totalClasses) / (1 - target))
    : 0;
  
  const required = totalClasses > 0 && percentage < targetPercentage
    ? Math.ceil((target * totalClasses - present) / target)
    : 0;
  
  return {
    totalClasses,
    attended: Math.floor(present),
    percentage: Math.round(percentage * 100) / 100,
    bunkable: Math.max(0, bunkable),
    required: Math.max(0, required),
  };
};

export const isHoliday = (date: string, holidays: Holiday[]): boolean => {
  const checkDate = parseISO(date);
  
  return holidays.some(holiday => {
    const start = parseISO(holiday.startDate);
    const end = parseISO(holiday.endDate);
    return isWithinInterval(checkDate, { start, end });
  });
};

export const getCalendarMarkedDates = (
  attendance: AttendanceRecord[],
  holidays: Holiday[]
): { [date: string]: { marked: boolean; dotColor: string; selected?: boolean } } => {
  const marked: { [date: string]: { marked: boolean; dotColor: string } } = {};
  
  // Mark attendance
  attendance.forEach(record => {
    let color = '#9CA3AF'; // grey for holiday/cancelled
    
    if (record.status === 'present') color = '#10B981'; // green
    else if (record.status === 'absent') color = '#EF4444'; // red
    else if (record.status === 'half') color = '#F59E0B'; // orange
    
    marked[record.date] = { marked: true, dotColor: color };
  });
  
  return marked;
};
