import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Camera, CheckCircle, Clock, MapPin } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import * as ImagePicker from 'expo-image-picker';

interface Job {
  id: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupTime: string;
  isRush: boolean;
  price: number;
  tip?: number;
  specialNotes?: string;
  status: string;
  pickupLocation: { latitude: number; longitude: number };
  dropoffLocation: { latitude: number; longitude: number };
  timeline: {
    step: string;
    timestamp: Date | null;
    completed: boolean;
  }[];
}

interface JobCompletionFlowProps {
  job: Job;
  onClose: () => void;
  onStatusUpdate: (jobId: string, step: string) => void;
}

const stepLabels = {
  accepted: 'Job Accepted',
  picked_up: 'Picked Up',
  washing: 'Washing',
  dropped_off: 'Dropped Off',
  completed: 'Completed',
};

const stepDescriptions = {
  accepted: 'You have accepted this job',
  picked_up: 'Laundry has been picked up from customer',
  washing: 'Laundry is being washed',
  dropped_off: 'Laundry has been delivered to customer',
  completed: 'Job completed successfully',
};

export default function JobCompletionFlow({ job, onClose, onStatusUpdate }: JobCompletionFlowProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('accepted');
  
  const updateStatusMutation = trpc.jobs.updateStatus.useMutation({
    onSuccess: (data) => {
      console.log('Status updated:', data);
      onStatusUpdate(job.id, data.step);
      Alert.alert('Success', `Job status updated to ${stepLabels[data.step as keyof typeof stepLabels]}`);
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update job status');
    },
  });

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera not available', 'Photo capture is not available on web');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedPhoto(result.assets[0].uri);
    }
  };

  const handleUpdateStatus = async (step: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        jobId: job.id,
        step: step as any,
        photoUrl: selectedPhoto || undefined,
      });
      setCurrentStep(step);
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getNextStep = () => {
    const steps = ['accepted', 'picked_up', 'washing', 'dropped_off', 'completed'];
    const currentIndex = steps.indexOf(currentStep);
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
  };

  const nextStep = getNextStep();
  const needsPhoto = nextStep === 'dropped_off' || nextStep === 'completed';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Progress</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.jobInfo}>
          <Text style={styles.customerName}>{job.customerName}</Text>
          <View style={styles.addressContainer}>
            <MapPin size={16} color="#87CEEB" />
            <Text style={styles.address}>{job.pickupAddress}</Text>
          </View>
          <View style={styles.addressContainer}>
            <MapPin size={16} color="#87CEEB" />
            <Text style={styles.address}>{job.dropoffAddress}</Text>
          </View>
          {job.isRush && (
            <View style={styles.rushBadge}>
              <Clock size={14} color="#FF6B6B" />
              <Text style={styles.rushText}>RUSH ORDER</Text>
            </View>
          )}
        </View>

        <View style={styles.timeline}>
          <Text style={styles.sectionTitle}>Progress Timeline</Text>
          {Object.entries(stepLabels).map(([step, label]) => {
            const isCompleted = job.timeline.find(t => t.step === step)?.completed || false;
            const isCurrent = step === currentStep;
            
            return (
              <View key={step} style={styles.timelineItem}>
                <View style={[
                  styles.timelineIcon,
                  isCompleted && styles.timelineIconCompleted,
                  isCurrent && styles.timelineIconCurrent,
                ]}>
                  {isCompleted ? (
                    <CheckCircle size={20} color="white" />
                  ) : (
                    <View style={styles.timelineIconEmpty} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineLabel,
                    isCompleted && styles.timelineLabelCompleted,
                    isCurrent && styles.timelineLabelCurrent,
                  ]}>
                    {label}
                  </Text>
                  <Text style={styles.timelineDescription}>
                    {stepDescriptions[step as keyof typeof stepDescriptions]}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {needsPhoto && (
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Photo Confirmation</Text>
            <Text style={styles.photoDescription}>
              Take a photo to confirm completion of this step
            </Text>
            
            {selectedPhoto ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: selectedPhoto }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={handleTakePhoto}
                >
                  <Camera size={16} color="#87CEEB" />
                  <Text style={styles.retakeButtonText}>Retake Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.photoButton}
                onPress={handleTakePhoto}
              >
                <Camera size={24} color="#87CEEB" />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {nextStep && (
          <TouchableOpacity
            style={[
              styles.updateButton,
              (needsPhoto && !selectedPhoto) && styles.updateButtonDisabled,
            ]}
            onPress={() => handleUpdateStatus(nextStep)}
            disabled={updateStatusMutation.isPending || (needsPhoto && !selectedPhoto)}
          >
            <Text style={styles.updateButtonText}>
              {updateStatusMutation.isPending 
                ? 'Updating...' 
                : `Mark as ${stepLabels[nextStep as keyof typeof stepLabels]}`
              }
            </Text>
          </TouchableOpacity>
        )}

        {job.specialNotes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Special Notes</Text>
            <Text style={styles.notesText}>{job.specialNotes}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  jobInfo: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  rushBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  rushText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginLeft: 4,
  },
  timeline: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIconCompleted: {
    backgroundColor: '#87CEEB',
  },
  timelineIconCurrent: {
    backgroundColor: '#4682B4',
  },
  timelineIconEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  timelineLabelCompleted: {
    color: '#87CEEB',
  },
  timelineLabelCurrent: {
    color: '#4682B4',
  },
  timelineDescription: {
    fontSize: 12,
    color: '#999',
  },
  photoSection: {
    marginBottom: 24,
  },
  photoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#87CEEB',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 16,
    color: '#87CEEB',
    marginLeft: 8,
    fontWeight: '600',
  },
  photoPreview: {
    alignItems: 'center',
  },
  photoImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  retakeButtonText: {
    fontSize: 14,
    color: '#87CEEB',
    marginLeft: 4,
  },
  updateButton: {
    backgroundColor: '#87CEEB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  notesSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});