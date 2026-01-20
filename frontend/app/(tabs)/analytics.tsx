import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { Calendar } from 'react-native-calendars';
import { calculateSubjectStats, calculateOverallStats, getCalendarMarkedDates } from '../services/calculator';

const { width } = Dimensions.get('window');

export default function Analytics() {
  const { settings, subjects, attendance, holidays } = useData();
  const { colors, theme } = useTheme();
  const [showDetailedBunk, setShowDetailedBunk] = useState(false);

  const subjectStats = useMemo(() => {
    return subjects.map(subject =>
      calculateSubjectStats(
        subject.id,
        subject.name,
        attendance,
        subject.targetPercentage || settings?.targetPercentage || 75
      )
    );
  }, [subjects, attendance, settings]);

  const overallStats = useMemo(() => {
    if (!settings) return null;
    return calculateOverallStats(attendance, settings.targetPercentage);
  }, [attendance, settings]);

  const markedDates = useMemo(() => {
    return getCalendarMarkedDates(attendance, holidays);
  }, [attendance, holidays]);

  // Prepare chart data
  const barData = useMemo(() => {
    return subjectStats.slice(0, 5).map((stat, index) => ({
      value: stat.percentage,
      label: stat.subjectName.slice(0, 8),
      frontColor: subjects.find(s => s.id === stat.subjectId)?.color || colors.primary,
    }));
  }, [subjectStats, subjects]);

  const pieData = useMemo(() => {
    if (!overallStats) return [];
    return [
      {
        value: overallStats.attended,
        color: colors.success,
        text: `${overallStats.attended}`,
      },
      {
        value: overallStats.totalClasses - overallStats.attended,
        color: colors.error,
        text: `${overallStats.totalClasses - overallStats.attended}`,
      },
    ];
  }, [overallStats]);

  const targetPercentage = settings?.targetPercentage || 75;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Overall Stats Card */}
      {overallStats && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Overall Performance</Text>

          <View style={styles.pieContainer}>
            <PieChart
              data={pieData}
              donut
              radius={80}
              innerRadius={60}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text style={[styles.centerValue, { color: colors.text }]}>
                    {overallStats.percentage.toFixed(1)}%
                  </Text>
                  <Text style={[styles.centerLabelText, { color: colors.textSecondary }]}>
                    Attendance
                  </Text>
                </View>
              )}
            />
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>
                Present ({overallStats.attended})
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>
                Absent ({overallStats.totalClasses - overallStats.attended})
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Bunk Calculator */}
      {overallStats && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Bunk Calculator</Text>
            <TouchableOpacity onPress={() => setShowDetailedBunk(!showDetailedBunk)}>
              <Ionicons
                name={showDetailedBunk ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Simple View */}
          <View style={[styles.bunkSummary, { backgroundColor: colors.background }]}>
            {overallStats.percentage >= targetPercentage ? (
              <View style={styles.bunkRow}>
                <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                <View style={styles.bunkContent}>
                  <Text style={[styles.bunkTitle, { color: colors.text }]}>
                    You're on track!
                  </Text>
                  <Text style={[styles.bunkValue, { color: colors.success }]}>
                    Can skip {overallStats.bunkable} more class{overallStats.bunkable !== 1 ? 'es' : ''}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.bunkRow}>
                <Ionicons name="warning" size={32} color={colors.warning} />
                <View style={styles.bunkContent}>
                  <Text style={[styles.bunkTitle, { color: colors.text }]}>
                    Need improvement
                  </Text>
                  <Text style={[styles.bunkValue, { color: colors.warning }]}>
                    Must attend next {overallStats.required} class{overallStats.required !== 1 ? 'es' : ''}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Detailed View */}
          {showDetailedBunk && (
            <View style={styles.detailedBunk}>
              <View style={styles.bunkDetail}>
                <Text style={[styles.bunkDetailLabel, { color: colors.textSecondary }]}>
                  Current Attendance
                </Text>
                <Text style={[styles.bunkDetailValue, { color: colors.text }]}>
                  {overallStats.percentage.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.bunkDetail}>
                <Text style={[styles.bunkDetailLabel, { color: colors.textSecondary }]}>
                  Target Attendance
                </Text>
                <Text style={[styles.bunkDetailValue, { color: colors.text }]}>
                  {targetPercentage}%
                </Text>
              </View>
              <View style={styles.bunkDetail}>
                <Text style={[styles.bunkDetailLabel, { color: colors.textSecondary }]}>
                  Total Classes
                </Text>
                <Text style={[styles.bunkDetailValue, { color: colors.text }]}>
                  {overallStats.totalClasses}
                </Text>
              </View>
              <View style={styles.bunkDetail}>
                <Text style={[styles.bunkDetailLabel, { color: colors.textSecondary }]}>
                  Classes Attended
                </Text>
                <Text style={[styles.bunkDetailValue, { color: colors.text }]}>
                  {overallStats.attended}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Subject-wise Chart */}
      {barData.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Subject-wise Attendance</Text>

          <View style={styles.chartContainer}>
            <BarChart
              data={barData}
              width={width - 80}
              height={200}
              barWidth={32}
              spacing={24}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: colors.textSecondary }}
              noOfSections={4}
              maxValue={100}
            />
          </View>
        </View>
      )}

      {/* Subject List */}
      {subjectStats.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Subject Details</Text>

          {subjectStats.map(stat => {
            const subject = subjects.find(s => s.id === stat.subjectId);
            const target = subject?.targetPercentage || targetPercentage;
            const isOnTrack = stat.percentage >= target;

            return (
              <View key={stat.subjectId} style={styles.subjectItem}>
                <View style={styles.subjectHeader}>
                  <View style={styles.subjectInfo}>
                    <View style={[styles.colorDot, { backgroundColor: subject?.color }]} />
                    <Text style={[styles.subjectName, { color: colors.text }]}>
                      {stat.subjectName}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.subjectPercentage,
                      { color: isOnTrack ? colors.success : colors.error },
                    ]}
                  >
                    {stat.percentage.toFixed(1)}%
                  </Text>
                </View>

                <Text style={[styles.subjectDetail, { color: colors.textSecondary }]}>
                  {stat.present} / {stat.total} classes • {' '}
                  {isOnTrack
                    ? `Can skip ${stat.bunkable} more`
                    : `Attend next ${stat.required}`}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Calendar View */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Attendance Calendar</Text>

        <Calendar
          markedDates={markedDates}
          theme={{
            backgroundColor: colors.surface,
            calendarBackground: colors.surface,
            textSectionTitleColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: colors.textSecondary,
            dotColor: colors.primary,
            selectedDotColor: '#ffffff',
            arrowColor: colors.primary,
            monthTextColor: colors.text,
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
          }}
        />

        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Present</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Absent</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Half</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.textSecondary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Holiday</Text>
          </View>
        </View>
      </View>

      {subjects.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Ionicons name="analytics-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Data Yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Add subjects and mark attendance to see analytics
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pieContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  centerLabel: {
    alignItems: 'center',
  },
  centerValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  centerLabelText: {
    fontSize: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
  },
  bunkSummary: {
    padding: 16,
    borderRadius: 12,
  },
  bunkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bunkContent: {
    flex: 1,
  },
  bunkTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bunkValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailedBunk: {
    gap: 12,
    marginTop: 8,
  },
  bunkDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  bunkDetailLabel: {
    fontSize: 14,
  },
  bunkDetailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
  },
  subjectItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
  },
  subjectPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subjectDetail: {
    fontSize: 14,
    marginLeft: 20,
  },
  calendarLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    borderRadius: 16,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
