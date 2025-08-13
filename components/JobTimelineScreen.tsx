import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  Package, 
  ArrowLeft,
  MapPin,
  User,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

export interface JobData {
  id: string;
  customerName: string;
  packageType: string;
  amount: number;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  isRush: boolean;
  tip: number;
  specialNotes: string;
  status: 'pending' | 'accepted' | 'picked_up' | 'cleaning' | 'ready' | 'delivering' | 'completed';
  laundryMasterName?: string;
  estimatedCompletion?: string;
  actualPickupTime?: string;
  actualDropoffTime?: string;
}

interface JobTimelineScreenProps {
  job: JobData;
  onBack: () => void;
}

const timelineSteps = [
  {
    key: 'pending',
    title: 'Job Posted',
    description: 'Waiting for a laundry master to accept',
    icon: Clock,
  },
  {
    key: 'accepted',
    title: 'Job Accepted',
    description: 'A laundry master has accepted your job',
    icon: CheckCircle,
  },
  {
    key: 'picked_up',
    title: 'Picked Up',
    description: 'Your laundry has been collected',
    icon: Truck,
  },
  {
    key: 'cleaning',
    title: 'Cleaning in Progress',
    description: 'Your laundry is being cleaned',
    icon: Package,
  },
  {
    key: 'ready',
    title: 'Ready for Delivery',
    description: 'Your laundry is clean and ready',
    icon: CheckCircle,
  },
  {
    key: 'delivering',
    title: 'Out for Delivery',
    description: 'Your laundry is on the way',
    icon: Truck,
  },
  {
    key: 'completed',
    title: 'Delivered',
    description: 'Your laundry has been delivered',
    icon: CheckCircle,
  },
];

export default function JobTimelineScreen({ job, onBack }: JobTimelineScreenProps) {
  
  const getStepStatus = (stepKey: string) => {
    const stepIndex = timelineSteps.findIndex(step => step.key === stepKey);
    const currentIndex = timelineSteps.findIndex(step => step.key === job.status);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getEstimatedTime = () => {
    switch (job.status) {
      case 'pending':
        return 'Waiting for acceptance';
      case 'accepted':
        return `Pickup scheduled for ${job.pickupTime}`;
      case 'picked_up':
        return job.isRush ? '2-4 hours' : '24-48 hours';
      case 'cleaning':
        return job.isRush ? '1-2 hours remaining' : '12-24 hours remaining';
      case 'ready':
        return 'Ready for pickup';
      case 'delivering':
        return '30-60 minutes';
      case 'completed':
        return 'Completed';
      default:
        return '';
    }
  };

  const renderTimelineStep = (step: typeof timelineSteps[0], index: number) => {
    const status = getStepStatus(step.key);
    const Icon = step.icon;
    const isLast = index === timelineSteps.length - 1;

    return (
      <View key={step.key} style={styles.timelineStep}>
        <View style={styles.timelineLeft}>
          <View style={[
            styles.timelineIcon,
            status === 'completed' && styles.timelineIconCompleted,
            status === 'current' && styles.timelineIconCurrent,
          ]}>
            <Icon 
              size={20} 
              color={status === 'pending' ? Colors.light.gray : '#fff'} 
            />
          </View>
          {!isLast && (
            <View style={[
              styles.timelineLine,
              status === 'completed' && styles.timelineLineCompleted,
            ]} />
          )}
        </View>
        
        <View style={styles.timelineContent}>
          <Text style={[
            styles.timelineTitle,
            status === 'current' && styles.timelineTitleCurrent,
          ]}>
            {step.title}
          </Text>
          <Text style={styles.timelineDescription}>
            {step.description}
          </Text>
          {status === 'current' && (
            <Text style={styles.timelineEstimate}>
              {getEstimatedTime()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Timeline</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.jobSummary}>
          <View style={styles.jobHeader}>
            <Text style={styles.jobId}>Job #{job.id}</Text>
            <View style={[
              styles.statusBadge,
              job.status === 'completed' && styles.statusBadgeCompleted,
              job.status === 'pending' && styles.statusBadgePending,
            ]}>
              <Text style={[
                styles.statusText,
                job.status === 'completed' && styles.statusTextCompleted,
                job.status === 'pending' && styles.statusTextPending,
              ]}>
                {job.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.jobDetails}>
            <View style={styles.jobDetailRow}>
              <User size={16} color={Colors.light.gray} />
              <Text style={styles.jobDetailText}>Customer: {job.customerName}</Text>
            </View>
            
            <View style={styles.jobDetailRow}>
              <Package size={16} color={Colors.light.gray} />
              <Text style={styles.jobDetailText}>{job.packageType} - ${job.amount}</Text>
            </View>
            
            <View style={styles.jobDetailRow}>
              <MapPin size={16} color={Colors.light.gray} />
              <Text style={styles.jobDetailText} numberOfLines={1}>
                From: {job.pickupLocation}
              </Text>
            </View>
            
            <View style={styles.jobDetailRow}>
              <MapPin size={16} color={Colors.light.gray} />
              <Text style={styles.jobDetailText} numberOfLines={1}>
                To: {job.dropoffLocation}
              </Text>
            </View>
            
            {job.isRush && (
              <View style={styles.rushBadge}>
                <Text style={styles.rushText}>RUSH ORDER</Text>
              </View>
            )}
            
            {job.laundryMasterName && (
              <View style={styles.masterInfo}>
                <Text style={styles.masterLabel}>Laundry Master:</Text>
                <Text style={styles.masterName}>{job.laundryMasterName}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.timelineContainer}>
          <Text style={styles.timelineHeader}>Progress Timeline</Text>
          {timelineSteps.map(renderTimelineStep)}
        </View>

        {job.specialNotes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesHeader}>Special Notes</Text>
            <Text style={styles.notesText}>{job.specialNotes}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.primaryBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  jobSummary: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  jobId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
  },
  statusBadgeCompleted: {
    backgroundColor: Colors.light.success,
  },
  statusBadgePending: {
    backgroundColor: Colors.light.warning,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusTextCompleted: {
    color: '#fff',
  },
  statusTextPending: {
    color: '#fff',
  },
  jobDetails: {
    gap: 12,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobDetailText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  rushBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  rushText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  masterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.light.primaryBackground,
    borderRadius: 12,
  },
  masterLabel: {
    fontSize: 14,
    color: Colors.light.gray,
  },
  masterName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  timelineContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  timelineHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconCompleted: {
    backgroundColor: Colors.light.success,
  },
  timelineIconCurrent: {
    backgroundColor: Colors.light.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.light.lightGray,
    marginTop: 8,
  },
  timelineLineCompleted: {
    backgroundColor: Colors.light.success,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  timelineTitleCurrent: {
    color: Colors.light.primary,
  },
  timelineDescription: {
    fontSize: 14,
    color: Colors.light.gray,
    lineHeight: 20,
  },
  timelineEstimate: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  notesContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  notesHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: Colors.light.gray,
    lineHeight: 20,
  },
});