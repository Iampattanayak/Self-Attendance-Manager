import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { clearAllData } from '../services/storage';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Settings() {
  const { settings, updateSettings, refreshData } = useData();
  const { colors, theme, setTheme } = useTheme();

  const [targetPercentage, setTargetPercentage] = useState(settings?.targetPercentage.toString() || '75');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleUpdateTarget = async () => {
    const value = parseInt(targetPercentage);
    if (value < 0 || value > 100) {
      Alert.alert('Error', 'Target percentage must be between 0 and 100');
      return;
    }

    if (settings) {
      await updateSettings({ ...settings, targetPercentage: value });
      Alert.alert('Success', 'Target percentage updated');
    }
  };

  const handleUpdateTermDates = async (field: 'termStart' | 'termEnd', date: Date) => {
    if (settings) {
      await updateSettings({
        ...settings,
        [field]: format(date, 'yyyy-MM-dd'),
      });
    }
  };

  const handleUpdateWeekStart = async (day: number) => {
    if (settings) {
      await updateSettings({ ...settings, weekStart: day });
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your data including subjects, classes, and attendance records. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            
            // Recreate default settings after clearing
            const defaultSettings = {
              termStart: format(new Date(), 'yyyy-MM-dd'),
              termEnd: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
              targetPercentage: 75,
              weekStart: 1,
              isOnboarded: true,
              notificationsEnabled: true,
              reminderMinutesBefore: 10,
            };
            
            await updateSettings(defaultSettings);
            await refreshData();
            Alert.alert('Success', 'All data cleared successfully!');
          },
        },
      ]
    );
  };

  if (!settings) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Academic Term */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Academic Term</Text>

        <View style={styles.settingItem}>
          <Text style={[styles.label, { color: colors.text }]}>Term Start Date</Text>
          <TouchableOpacity
            style={[styles.dateButton, { borderColor: colors.border }]}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>
              {format(parseISO(settings.termStart), 'MMM dd, yyyy')}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={parseISO(settings.termStart)}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartPicker(Platform.OS === 'ios');
              if (date) handleUpdateTermDates('termStart', date);
            }}
          />
        )}

        <View style={styles.settingItem}>
          <Text style={[styles.label, { color: colors.text }]}>Term End Date</Text>
          <TouchableOpacity
            style={[styles.dateButton, { borderColor: colors.border }]}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>
              {format(parseISO(settings.termEnd), 'MMM dd, yyyy')}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {showEndPicker && (
          <DateTimePicker
            value={parseISO(settings.termEnd)}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndPicker(Platform.OS === 'ios');
              if (date) handleUpdateTermDates('termEnd', date);
            }}
          />
        )}
      </View>

      {/* Target Attendance */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Target Attendance</Text>

        <View style={styles.percentageContainer}>
          <TextInput
            style={[
              styles.percentageInput,
              { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
            ]}
            value={targetPercentage}
            onChangeText={setTargetPercentage}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Text style={[styles.percentageSymbol, { color: colors.text }]}>%</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleUpdateTarget}
        >
          <Text style={styles.buttonText}>Update Target</Text>
        </TouchableOpacity>
      </View>

      {/* Week Start Day */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Week Start Day</Text>

        <View style={styles.weekDaysContainer}>
          {WEEKDAYS.map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.weekDayButton,
                { borderColor: colors.border },
                settings.weekStart === index && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleUpdateWeekStart(index)}
            >
              <Text
                style={[
                  styles.weekDayText,
                  { color: settings.weekStart === index ? '#fff' : colors.text },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Theme Settings */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

        <View style={styles.themeContainer}>
          <TouchableOpacity
            style={[
              styles.themeOption,
              { borderColor: colors.border },
              theme === 'light' && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setTheme('light')}
          >
            <Ionicons 
              name="sunny" 
              size={24} 
              color={theme === 'light' ? '#fff' : colors.text} 
            />
            <Text style={[
              styles.themeText,
              { color: theme === 'light' ? '#fff' : colors.text },
            ]}>
              Light
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              { borderColor: colors.border },
              theme === 'dark' && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setTheme('dark')}
          >
            <Ionicons 
              name="moon" 
              size={24} 
              color={theme === 'dark' ? '#fff' : colors.text} 
            />
            <Text style={[
              styles.themeText,
              { color: theme === 'dark' ? '#fff' : colors.text },
            ]}>
              Dark
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              { borderColor: colors.border },
              theme === 'auto' && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setTheme('auto')}
          >
            <Ionicons 
              name="phone-portrait-outline" 
              size={24} 
              color={theme === 'auto' ? '#fff' : colors.text} 
            />
            <Text style={[
              styles.themeText,
              { color: theme === 'auto' ? '#fff' : colors.text },
            ]}>
              Auto
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Data Management */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.error }]}
          onPress={handleClearAllData}
        >
          <View style={styles.actionContent}>
            <Ionicons name="trash-outline" size={24} color={colors.error} />
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.error }]}>Clear All Data</Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                Permanently delete everything
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>App Version</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Theme</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>Auto (System)</Text>
        </View>
      </View>
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
  loadingText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingItem: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentageInput: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  percentageSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  weekDaysContainer: {
    gap: 8,
  },
  weekDayButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  themeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
