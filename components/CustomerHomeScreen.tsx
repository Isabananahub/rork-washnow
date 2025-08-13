import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { 
  MapPin, 
  Clock, 
  User,
  Settings,
  ShoppingBag,
  X,
  Zap,
  MessageSquare,
  Wrench,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { locationService, LocationData } from '@/lib/location-service';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import CustomDateTimePicker from '@/components/DateTimePicker';
import Colors from '@/constants/colors';
import JobTimelineScreen, { JobData } from '@/components/JobTimelineScreen';
import { testSuite, runGooglePlacesTest } from '@/lib/test-suite';
import { router } from 'expo-router';



interface JobDetails {
  selectedPackage: number;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  pickupDateTime?: Date;
  isRush: boolean;
  tip: number;
  specialNotes: string;
  firstName: string;
  lastName: string;
}

export default function CustomerHomeScreen() {
  const { user, logout, updateUserLocation } = useAuth();
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [showJobModal, setShowJobModal] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [showTimeline, setShowTimeline] = useState<boolean>(false);
  const [currentJob, setCurrentJob] = useState<JobData | null>(null);
  const [jobDetails, setJobDetails] = useState<JobDetails>({
    selectedPackage: 0,
    pickupLocation: '',
    dropoffLocation: '',
    pickupTime: '',
    pickupDateTime: undefined,
    isRush: false,
    tip: 0,
    specialNotes: '',
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
  });

  const getCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const location = await locationService.getLocationWithAddress();
      if (location) {
        setUserLocation(location);
        if (location.address) {
          await updateUserLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address
          });
        }
        setJobDetails(prev => ({ ...prev, pickupLocation: location.address || '' }));
      } else {
        Alert.alert(
          'Location Access',
          'Unable to get your location. Please enable location services.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: getCurrentLocation },
          ]
        );
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to access your location. Please check your location permissions in device settings and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: getCurrentLocation },
        ]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, [updateUserLocation]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Auto-fill pickup and drop-off locations with current location
  useEffect(() => {
    if (userLocation?.address && !jobDetails.pickupLocation && !jobDetails.dropoffLocation) {
      setJobDetails(prev => ({
        ...prev,
        pickupLocation: userLocation.address || '',
        dropoffLocation: userLocation.address || ''
      }));
    }
  }, [userLocation, jobDetails.pickupLocation, jobDetails.dropoffLocation]);



  const handlePackageSelect = (packageIndex: number) => {
    setSelectedPackage(packageIndex);
    setJobDetails(prev => ({ ...prev, selectedPackage: packageIndex }));
    setShowJobModal(true);
  };

  const handleJobSubmit = () => {
    if (!jobDetails.firstName || !jobDetails.lastName || !jobDetails.pickupLocation || !jobDetails.dropoffLocation || !jobDetails.pickupTime) {
      Alert.alert('Missing Information', 'Please fill in all required fields including first name, last name, pickup location, drop-off location, and pickup time.');
      return;
    }
    
    const packages = [15, 30, 50];
    const packageTypes = ['1-2 Baskets', '3-4 Baskets', '5-6 Baskets'];
    const totalAmount = packages[jobDetails.selectedPackage] + (jobDetails.isRush ? 10 : 0) + jobDetails.tip;
    
    const customerFullName = `${jobDetails.firstName} ${jobDetails.lastName}`.trim();
    
    const newJob: JobData = {
      id: Date.now().toString(),
      customerName: customerFullName,
      packageType: packageTypes[jobDetails.selectedPackage],
      amount: totalAmount,
      pickupLocation: jobDetails.pickupLocation,
      dropoffLocation: jobDetails.dropoffLocation,
      pickupTime: jobDetails.pickupTime,
      isRush: jobDetails.isRush,
      tip: jobDetails.tip,
      specialNotes: jobDetails.specialNotes,
      status: 'pending',
    };
    
    setCurrentJob(newJob);
    setShowJobModal(false);
    // Navigate to payment screen instead of timeline
    router.push({
      pathname: '/payment' as any,
      params: {
        jobData: JSON.stringify(newJob)
      }
    });
  };





  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.locationContainer}>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={getCurrentLocation}
          disabled={isLoadingLocation}
        >
          <MapPin size={20} color={Colors.light.primary} />
          <View style={styles.locationText}>
            <Text style={styles.deliverTo}>Deliver to</Text>
            <Text style={styles.address} numberOfLines={1}>
              {isLoadingLocation 
                ? 'Getting location...' 
                : userLocation?.address || 'Set your location'
              }
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.systemCheckButton} 
          onPress={() => router.push('/system-check')}
        >
          <Wrench size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
          <User size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );





  if (showTimeline && currentJob) {
    return (
      <JobTimelineScreen 
        job={currentJob} 
        onBack={() => {
          setShowTimeline(false);
          setCurrentJob(null);
        }} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Hello {user?.name}! 👋</Text>
          <Text style={styles.subGreeting}>What would you like to clean today?</Text>
        </View>

        <View style={styles.pricingContainer}>
          <Text style={styles.pricingTitle}>Choose Your Laundry Package</Text>
          <Text style={styles.pricingSubtitle}>Select based on your laundry basket size</Text>
          
          <View style={styles.pricingOptions}>
            <TouchableOpacity style={styles.pricingCard} onPress={() => handlePackageSelect(0)}>
              <View style={styles.pricingHeader}>
                <Text style={styles.pricingPrice}>$15</Text>
                <Text style={styles.pricingBaskets}>1-2 Baskets</Text>
              </View>
              <Text style={styles.pricingDescription}>Perfect for small loads</Text>
              <View style={styles.pricingFeatures}>
                <Text style={styles.featureText}>• Wash & Fold</Text>
                <Text style={styles.featureText}>• 24-48 hour delivery</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.pricingCard, styles.popularCard]} onPress={() => handlePackageSelect(1)}>
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
              <View style={styles.pricingHeader}>
                <Text style={styles.pricingPrice}>$30</Text>
                <Text style={styles.pricingBaskets}>3-4 Baskets</Text>
              </View>
              <Text style={styles.pricingDescription}>Great for families</Text>
              <View style={styles.pricingFeatures}>
                <Text style={styles.featureText}>• Wash & Fold</Text>
                <Text style={styles.featureText}>• Same day delivery</Text>
                <Text style={styles.featureText}>• Fabric softener included</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.pricingCard} onPress={() => handlePackageSelect(2)}>
              <View style={styles.pricingHeader}>
                <Text style={styles.pricingPrice}>$50</Text>
                <Text style={styles.pricingBaskets}>5-6 Baskets</Text>
              </View>
              <Text style={styles.pricingDescription}>For large households</Text>
              <View style={styles.pricingFeatures}>
                <Text style={styles.featureText}>• Wash & Fold</Text>
                <Text style={styles.featureText}>• Express delivery</Text>
                <Text style={styles.featureText}>• Premium detergent</Text>
                <Text style={styles.featureText}>• Stain treatment</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <ShoppingBag size={24} color={Colors.light.primary} />
            <Text style={styles.quickActionText}>Wash & Fold</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Settings size={24} color={Colors.light.primary} />
            <Text style={styles.quickActionText}>Dry Cleaning</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Clock size={24} color={Colors.light.primary} />
            <Text style={styles.quickActionText}>Express</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.testSection}>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={() => testSuite.runFullSystemTest()}
          >
            <Text style={styles.testButtonText}>🧪 Run Full System Test</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.googleTestButton} 
            onPress={runGooglePlacesTest}
          >
            <Text style={styles.testButtonText}>🗺️ Test Google Places API</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <Modal
        visible={showJobModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Job Details</Text>
            <TouchableOpacity onPress={() => setShowJobModal(false)}>
              <X size={24} color={Colors.light.gray} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.selectedPackageInfo}>
              <Text style={styles.packageTitle}>
                ${[15, 30, 50][selectedPackage || 0]} Package Selected
              </Text>
              <Text style={styles.packageSubtitle}>
                {['1-2 Baskets', '3-4 Baskets', '5-6 Baskets'][selectedPackage || 0]}
              </Text>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Pickup Location *</Text>
              <AddressAutocomplete
                placeholder="Enter pickup address"
                value={jobDetails.pickupLocation}
                onAddressSelect={(address, location) => {
                  setJobDetails(prev => ({ ...prev, pickupLocation: address }));
                  console.log('Pickup location selected:', { address, location });
                }}
                userLocation={userLocation || undefined}
                showCurrentLocationButton={true}
              />
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Drop-off Location *</Text>
              <AddressAutocomplete
                placeholder="Enter drop-off address"
                value={jobDetails.dropoffLocation}
                onAddressSelect={(address, location) => {
                  setJobDetails(prev => ({ ...prev, dropoffLocation: address }));
                  console.log('Drop-off location selected:', { address, location });
                }}
                userLocation={userLocation || undefined}
                showCurrentLocationButton={false}
              />
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Customer Name *</Text>
              <View style={styles.nameContainer}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="First Name"
                    value={jobDetails.firstName}
                    onChangeText={(text) => setJobDetails(prev => ({ ...prev, firstName: text }))}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Last Name"
                    value={jobDetails.lastName}
                    onChangeText={(text) => setJobDetails(prev => ({ ...prev, lastName: text }))}
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Pickup Time *</Text>
              <CustomDateTimePicker
                placeholder="Select pickup time"
                value={jobDetails.pickupDateTime}
                isRush={jobDetails.isRush}
                onDateTimeSelect={(dateTime: Date, formattedString: string) => {
                  setJobDetails(prev => ({ 
                    ...prev, 
                    pickupTime: formattedString,
                    pickupDateTime: dateTime 
                  }));
                }}
              />
            </View>
            
            <View style={styles.formSection}>
              <View style={styles.rushContainer}>
                <View style={styles.rushInfo}>
                  <Zap size={20} color={Colors.light.warning} />
                  <View>
                    <Text style={styles.rushTitle}>Rush Service (+$10)</Text>
                    <Text style={styles.rushSubtitle}>Immediate pickup</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.rushToggle, jobDetails.isRush && styles.rushToggleActive]}
                  onPress={() => setJobDetails(prev => ({ ...prev, isRush: !prev.isRush }))}
                >
                  <Text style={[styles.rushToggleText, jobDetails.isRush && styles.rushToggleTextActive]}>
                    {jobDetails.isRush ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Tip</Text>
              <View style={styles.tipContainer}>
                {[0, 2, 5, 10].map((tip) => (
                  <TouchableOpacity
                    key={tip}
                    style={[styles.tipButton, jobDetails.tip === tip && styles.tipButtonActive]}
                    onPress={() => setJobDetails(prev => ({ ...prev, tip }))}
                  >
                    <Text style={[styles.tipButtonText, jobDetails.tip === tip && styles.tipButtonTextActive]}>
                      ${tip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Special Notes</Text>
              <View style={styles.inputContainer}>
                <MessageSquare size={20} color={Colors.light.primary} />
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Any special instructions..."
                  value={jobDetails.specialNotes}
                  onChangeText={(text) => setJobDetails(prev => ({ ...prev, specialNotes: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
            
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>
                ${[15, 30, 50][selectedPackage || 0] + (jobDetails.isRush ? 10 : 0) + jobDetails.tip}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.submitButton} onPress={handleJobSubmit}>
              <Text style={styles.submitButtonText}>Submit Job</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationContainer: {
    flex: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    flex: 1,
  },
  deliverTo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  systemCheckButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },

  greetingContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
  },
  pricingContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  pricingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  pricingOptions: {
    gap: 16,
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  popularCard: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryBackground,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  pricingBaskets: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pricingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  pricingFeatures: {
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 16,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
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
  },
  selectedPackageInfo: {
    backgroundColor: Colors.light.primaryBackground,
    padding: 20,
    borderRadius: 16,
    marginVertical: 20,
    alignItems: 'center',
  },
  packageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  packageSubtitle: {
    fontSize: 16,
    color: Colors.light.gray,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 12,
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
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    ...Platform.select({
      web: {
        outlineWidth: 0,
      },
    }),
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rushContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  rushInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rushTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rushSubtitle: {
    fontSize: 14,
    color: Colors.light.gray,
  },
  rushToggle: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.lightGray,
  },
  rushToggleActive: {
    backgroundColor: Colors.light.warning,
    borderColor: Colors.light.warning,
  },
  rushToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.gray,
  },
  rushToggleTextActive: {
    color: '#fff',
  },
  tipContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tipButton: {
    flex: 1,
    backgroundColor: Colors.light.lightGray,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tipButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  tipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.gray,
  },
  tipButtonTextActive: {
    color: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.primaryBackground,
    padding: 20,
    borderRadius: 16,
    marginVertical: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  testSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  testButton: {
    backgroundColor: Colors.light.warning,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.warning,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleTestButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary,
    marginTop: 12,
  },
});