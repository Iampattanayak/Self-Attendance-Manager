import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { calculateOverallStats } from '../services/calculator';
import { wp, hp, fp, getPadding, getCardGap } from '../utils/responsive';

export default function Dashboard() {
  const { settings, subjects, classes, attendance, refreshData, markAttendance: markAttendanceContext } = useData();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Get today's classes
  const todayClasses = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todayStr = format(today, 'yyyy-MM-dd');

    return classes
      .filter(c => c.weekday === dayOfWeek)
      .map(c => {
        const subject = subjects.find(s => s.id === c.subjectId);
        const attendanceRecord = attendance.find(
          a => a.classId === c.id && a.date === todayStr
        );

        return {
          ...c,
          subject,
          attendanceRecord,
        };
      });
  }, [classes, subjects, attendance]);

  // Calculate overall stats
  const stats = useMemo(() => {
    if (!settings) return null;
    return calculateOverallStats(attendance, settings.targetPercentage);
  }, [attendance, settings]);

  const handleMarkAttendance = async (classId: string, subjectId: string, status: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    await markAttendanceContext({
      id: `${classId}_${today}`,
      classId,
      subjectId,
      date: today,
      status: status as any,
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'present':
        return colors.success;
      case 'absent':
        return colors.error;
      case 'half':
        return colors.warning;
      case 'holiday':
      case 'cancelled':
        return colors.textSecondary;
      default:
        return colors.border;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'present':
        return 'checkmark-circle';
      case 'absent':
        return 'close-circle';
      case 'half':
        return 'radio-button-on';
      case 'holiday':
        return 'sunny';
      case 'cancelled':
        return 'ban';
      default:
        return 'ellipse-outline';
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Overall Stats Card */}
      {stats && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Overall Attendance</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats.percentage.toFixed(1)}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Current
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.attended}/{stats.totalClasses}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Attended
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: settings?.targetPercentage || 75 }]}>
                {settings?.targetPercentage || 75}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Target
              </Text>
            </View>
          </View>

          {/* Bunk Calculator Summary */}
          <View style={[styles.bunkCard, { backgroundColor: colors.background }]}>
            {stats.percentage >= (settings?.targetPercentage || 75) ? (
              <View style={styles.bunkInfo}>
                <Ionicons name="happy-outline" size={24} color={colors.success} />
                <Text style={[styles.bunkText, { color: colors.text }]}>
                  You can skip <Text style={{ fontWeight: 'bold', color: colors.success }}>{stats.bunkable}</Text> more class{stats.bunkable !== 1 ? 'es' : ''}
                </Text>
              </View>
            ) : (
              <View style={styles.bunkInfo}>
                <Ionicons name="alert-circle-outline" size={24} color={colors.warning} />
                <Text style={[styles.bunkText, { color: colors.text }]}>
                  Attend next <Text style={{ fontWeight: 'bold', color: colors.warning }}>{stats.required}</Text> class{stats.required !== 1 ? 'es' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Today's Classes */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Classes</Text>
        
        {todayClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No classes scheduled for today
            </Text>
          </View>
        ) : (
          todayClasses.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.classItem,
                { borderBottomColor: colors.border },
                index === todayClasses.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.classHeader}>
                <View style={styles.classInfo}>
                  <View
                    style={[styles.colorDot, { backgroundColor: item.subject?.color || colors.primary }]}
                  />
                  <View>
                    <Text style={[styles.className, { color: colors.text }]}>
                      {item.subject?.name || 'Unknown Subject'}
                    </Text>
                    <Text style={[styles.classTime, { color: colors.textSecondary }]}>
                      {item.startTime} • {item.durationMinutes} min
                    </Text>
                  </View>
                </View>
                {item.attendanceRecord && (
                  <Ionicons
                    name={getStatusIcon(item.attendanceRecord.status)}
                    size={24}
                    color={getStatusColor(item.attendanceRecord.status)}
                  />
                )}
              </View>

              {!item.attendanceRecord && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                    onPress={() => handleMarkAttendance(item.id, item.subjectId, 'present')}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Present</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.error }]}
                    onPress={() => handleMarkAttendance(item.id, item.subjectId, 'absent')}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Absent</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Quick Stats */}
      {subjects.length === 0 && classes.length === 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={48} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Get Started
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Add your subjects and create a timetable to start tracking attendance
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  },
  bunkCard: {
    padding: 16,
    borderRadius: 12,
  },
  bunkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bunkText: {
    fontSize: 16,
    flex: 1,
  },
  classItem: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
  },
  classTime: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
