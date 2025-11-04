import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { calculateSubjectStats } from '../services/calculator';
import { Subject } from '../types';

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

export default function Subjects() {
  const { settings, subjects, attendance, addSubject, updateSubject, deleteSubject } = useData();
  const { colors } = useTheme();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [customTarget, setCustomTarget] = useState('');

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

  const openAddModal = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setSelectedColor(PRESET_COLORS[0]);
    setCustomTarget('');
    setModalVisible(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setCode(subject.code || '');
    setSelectedColor(subject.color);
    setCustomTarget(subject.targetPercentage?.toString() || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a subject name');
      return;
    }

    const subjectData: Subject = {
      id: editingSubject?.id || `subject_${Date.now()}`,
      name: name.trim(),
      code: code.trim(),
      color: selectedColor,
      targetPercentage: customTarget ? parseInt(customTarget) : undefined,
    };

    if (editingSubject) {
      await updateSubject(editingSubject.id, subjectData);
    } else {
      await addSubject(subjectData);
    }

    setModalVisible(false);
  };

  const handleDelete = (subject: Subject) => {
    Alert.alert(
      'Delete Subject',
      `Are you sure you want to delete ${subject.name}? This will also delete all associated classes and attendance records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSubject(subject.id),
        },
      ]
    );
  };

  const getPercentageColor = (percentage: number, target: number) => {
    if (percentage >= target) return colors.success;
    if (percentage >= target - 5) return colors.warning;
    return colors.error;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {subjects.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Ionicons name="book-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Subjects Yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Add your first subject to start tracking attendance
            </Text>
          </View>
        ) : (
          subjectStats.map(stat => {
            const subject = subjects.find(s => s.id === stat.subjectId)!;
            const targetPercentage = subject.targetPercentage || settings?.targetPercentage || 75;
            
            return (
              <TouchableOpacity
                key={subject.id}
                style={[styles.subjectCard, { backgroundColor: colors.surface }]}
                onPress={() => openEditModal(subject)}
                activeOpacity={0.7}
              >
                <View style={styles.subjectHeader}>
                  <View style={styles.subjectInfo}>
                    <View style={[styles.colorDot, { backgroundColor: subject.color }]} />
                    <View style={styles.subjectText}>
                      <Text style={[styles.subjectName, { color: colors.text }]}>
                        {subject.name}
                      </Text>
                      {subject.code && (
                        <Text style={[styles.subjectCode, { color: colors.textSecondary }]}>
                          {subject.code}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(subject)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      Attendance
                    </Text>
                    <Text
                      style={[
                        styles.statValue,
                        { color: getPercentageColor(stat.percentage, targetPercentage) },
                      ]}
                    >
                      {stat.percentage.toFixed(1)}%
                    </Text>
                  </View>
                  
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(stat.percentage, 100)}%`,
                          backgroundColor: getPercentageColor(stat.percentage, targetPercentage),
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      {stat.present} / {stat.total} classes attended
                    </Text>
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Target: {targetPercentage}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openAddModal}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingSubject ? 'Edit Subject' : 'Add Subject'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Subject Name *</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Mathematics"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Subject Code (Optional)</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  value={code}
                  onChangeText={setCode}
                  placeholder="e.g., MATH101"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Color</Text>
                <View style={styles.colorGrid}>
                  {PRESET_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Custom Target (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                  value={customTarget}
                  onChangeText={setCustomTarget}
                  placeholder={`Default: ${settings?.targetPercentage || 75}%`}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
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
  subjectCard: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  subjectText: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subjectCode: {
    fontSize: 14,
    marginTop: 2,
  },
  statsContainer: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {},
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
