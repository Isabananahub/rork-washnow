import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, X } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface DateTimePickerProps {
  value?: Date;
  onDateTimeSelect: (dateTime: Date, formattedString: string) => void;
  placeholder?: string;
  isRush?: boolean;
  style?: any;
}

export default function CustomDateTimePicker({
  value,
  onDateTimeSelect,
  placeholder = 'Select pickup time',
  isRush = false,
  style,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(value || new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(value || new Date());
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [displayText, setDisplayText] = useState<string>('');

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setSelectedTime(value);
      updateDisplayText(value);
    }
  }, [value]);

  const updateDisplayText = (dateTime: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    setDisplayText(dateTime.toLocaleDateString('en-US', options));
  };

  const getMinimumDate = (): Date => {
    const now = new Date();
    if (isRush) {
      // Rush orders can be scheduled immediately
      return now;
    } else {
      // Non-rush orders must be at least 2 hours from now
      const minDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return minDate;
    }
  };

  const getMaximumDate = (): Date => {
    // Allow scheduling up to 14 days (2 weeks) in advance
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    return maxDate;
  };

  const isValidTime = (time: Date): boolean => {
    const hours = time.getHours();
    // Service hours: 5 AM to 8 PM (20:00)
    return hours >= 5 && hours < 20;
  };

  const getNextValidTime = (date: Date): Date => {
    const newTime = new Date(date);
    const hours = newTime.getHours();
    
    if (hours < 5) {
      // Before 5 AM, set to 5 AM
      newTime.setHours(5, 0, 0, 0);
    } else if (hours >= 20) {
      // After 8 PM, set to 5 AM next day
      newTime.setDate(newTime.getDate() + 1);
      newTime.setHours(5, 0, 0, 0);
    }
    
    return newTime;
  };

  const handleDateChange = (event: any, date?: Date) => {
    console.log('📅 Date picker event:', event.type, date);
    
    // Always close picker on Android, and on iOS when user cancels or confirms
    if (Platform.OS === 'android' || event.type === 'dismissed' || event.type === 'set') {
      setShowDatePicker(false);
    }
    
    // Only process date if user didn't cancel
    if (date && event.type !== 'dismissed') {
      const newDateTime = new Date(date);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      
      // Validate against minimum date
      const minDate = getMinimumDate();
      if (newDateTime < minDate) {
        Alert.alert(
          'Invalid Date',
          isRush 
            ? 'Rush orders can be scheduled immediately.'
            : 'Non-rush orders must be scheduled at least 2 hours in advance.'
        );
        return;
      }
      
      console.log('📅 Setting new date:', date);
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    console.log('🕐 Time picker event:', event.type, time);
    
    // Always close picker on Android, and on iOS when user cancels or confirms
    if (Platform.OS === 'android' || event.type === 'dismissed' || event.type === 'set') {
      setShowTimePicker(false);
    }
    
    // Only process time if user didn't cancel
    if (time && event.type !== 'dismissed') {
      if (!isValidTime(time)) {
        Alert.alert(
          'Invalid Time',
          'Pickup times are available from 5:00 AM to 8:00 PM only.',
          [
            {
              text: 'OK',
              onPress: () => {
                const validTime = getNextValidTime(time);
                console.log('🕐 Setting valid time:', validTime);
                setSelectedTime(validTime);
              }
            }
          ]
        );
        return;
      }
      
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(time.getHours());
      newDateTime.setMinutes(time.getMinutes());
      
      // Validate against minimum date/time
      const minDate = getMinimumDate();
      if (newDateTime < minDate) {
        Alert.alert(
          'Invalid Time',
          isRush 
            ? 'Rush orders can be scheduled immediately.'
            : 'Non-rush orders must be scheduled at least 2 hours in advance.'
        );
        return;
      }
      
      console.log('🕐 Setting new time:', time);
      setSelectedTime(time);
    }
  };

  const handleConfirm = () => {
    const finalDateTime = new Date(selectedDate);
    finalDateTime.setHours(selectedTime.getHours());
    finalDateTime.setMinutes(selectedTime.getMinutes());
    
    // Final validation
    const minDate = getMinimumDate();
    if (finalDateTime < minDate) {
      Alert.alert(
        'Invalid Date/Time',
        isRush 
          ? 'Rush orders can be scheduled immediately.'
          : 'Non-rush orders must be scheduled at least 2 hours in advance.'
      );
      return;
    }
    
    if (!isValidTime(finalDateTime)) {
      Alert.alert(
        'Invalid Time',
        'Pickup times are available from 5:00 AM to 8:00 PM only.'
      );
      return;
    }
    
    updateDisplayText(finalDateTime);
    onDateTimeSelect(finalDateTime, finalDateTime.toISOString());
    setShowModal(false);
  };

  const handleRushNow = () => {
    const now = new Date();
    if (!isValidTime(now)) {
      Alert.alert(
        'Service Hours',
        'Our service hours are 5:00 AM to 8:00 PM. Rush pickup will be scheduled for the next available time.'
      );
      const validTime = getNextValidTime(now);
      setSelectedDate(validTime);
      setSelectedTime(validTime);
      updateDisplayText(validTime);
      onDateTimeSelect(validTime, 'ASAP (Next Available)');
    } else {
      updateDisplayText(now);
      onDateTimeSelect(now, 'ASAP');
    }
    setShowModal(false);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={() => setShowModal(true)}
      >
        <Calendar size={20} color={Colors.light.primary} />
        <Text style={[styles.inputText, !displayText && styles.placeholderText]}>
          {displayText || placeholder}
        </Text>
        <Clock size={20} color={Colors.light.gray} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Pickup Time</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={24} color={Colors.light.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {isRush && (
              <TouchableOpacity
                style={styles.rushButton}
                onPress={handleRushNow}
              >
                <Text style={styles.rushButtonText}>📱 Rush Pickup - ASAP</Text>
                <Text style={styles.rushButtonSubtext}>Available now during service hours</Text>
              </TouchableOpacity>
            )}

            <View style={styles.pickerSection}>
              <Text style={styles.sectionTitle}>Select Date</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={Colors.light.primary} />
                <Text style={styles.pickerButtonText}>
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerSection}>
              <Text style={styles.sectionTitle}>Select Time</Text>
              <Text style={styles.serviceHours}>Service Hours: 5:00 AM - 8:00 PM</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={20} color={Colors.light.primary} />
                <Text style={styles.pickerButtonText}>
                  {selectedTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>📋 Pickup Information</Text>
              <Text style={styles.infoText}>
                • {isRush ? 'Rush orders: Available immediately during service hours' : 'Standard orders: Minimum 2 hours advance notice'}
              </Text>
              <Text style={styles.infoText}>
                • Service hours: 5:00 AM to 8:00 PM daily
              </Text>
              <Text style={styles.infoText}>
                • Scheduling available up to 2 weeks in advance
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm Pickup Time</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={getMinimumDate()}
                maximumDate={getMaximumDate()}
                style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
                textColor={Platform.OS === 'ios' ? '#000000' : '#333333'}
                accentColor={Colors.light.primary}
                themeVariant="light"
              />
              {Platform.OS === 'ios' && (
                <View style={styles.pickerActions}>
                  <TouchableOpacity
                    style={styles.pickerActionButton}
                    onPress={() => {
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.pickerActionText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerActionButton, styles.pickerActionButtonPrimary]}
                    onPress={() => {
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[styles.pickerActionText, styles.pickerActionTextPrimary]}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {showTimePicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
                textColor={Platform.OS === 'ios' ? '#000000' : '#333333'}
                accentColor={Colors.light.primary}
                themeVariant="light"
              />
              {Platform.OS === 'ios' && (
                <View style={styles.pickerActions}>
                  <TouchableOpacity
                    style={styles.pickerActionButton}
                    onPress={() => {
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={styles.pickerActionText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerActionButton, styles.pickerActionButtonPrimary]}
                    onPress={() => {
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={[styles.pickerActionText, styles.pickerActionTextPrimary]}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: Colors.light.gray,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  rushButton: {
    backgroundColor: Colors.light.warning,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  rushButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rushButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  pickerSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  serviceHours: {
    fontSize: 12,
    color: Colors.light.gray,
    marginBottom: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: Colors.light.primaryBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.gray,
    lineHeight: 20,
    marginBottom: 4,
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.light.lightGray,
    paddingVertical: 10,
  },
  iosPicker: {
    backgroundColor: '#fff',
    height: 200,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.lightGray,
  },
  pickerActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pickerActionButtonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  pickerActionText: {
    fontSize: 16,
    color: Colors.light.primary,
  },
  pickerActionTextPrimary: {
    color: '#fff',
    fontWeight: '600',
  },
});