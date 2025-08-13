import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MapPin, 
  Clock, 
  Star, 
  DollarSign,
  User,
  Package,
  X,
  Zap,
  CheckCircle,
  Navigation,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { locationService, LocationData } from '@/lib/location-service';
import GoogleMapView from '@/components/GoogleMapView';
import Colors from '@/constants/colors';

interface Order {
  id: string;
  customerName: string;
  service: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed';
  amount: number;
  distance: string;
  estimatedTime: string;
  items: number;
  isRush: boolean;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  specialNotes?: string;
  tip: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timeline?: {
    pickup: string;
    cleaning: string;
    dropoff: string;
  };
}

const mockOrders: Order[] = [
  {
    id: '1',
    customerName: 'Sarah Johnson',
    service: 'Wash & Fold',
    status: 'pending',
    amount: 25.50,
    distance: '0.3 km',
    estimatedTime: '30 min',
    items: 8,
    isRush: true,
    pickupLocation: '123 Main St, Downtown',
    dropoffLocation: '456 Oak Ave, Uptown',
    pickupTime: 'ASAP',
    specialNotes: 'Please handle delicate items with care',
    tip: 5,
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    timeline: {
      pickup: 'Within 30 mins',
      cleaning: '2-3 hours',
      dropoff: 'Same day'
    }
  },
  {
    id: '2',
    customerName: 'Mike Chen',
    service: 'Dry Cleaning',
    status: 'accepted',
    amount: 45.00,
    distance: '0.8 km',
    estimatedTime: '45 min',
    items: 3,
    isRush: false,
    pickupLocation: '789 Pine St, Midtown',
    dropoffLocation: '321 Elm St, Westside',
    pickupTime: '2:00 PM',
    tip: 10,
    coordinates: { latitude: 37.7849, longitude: -122.4094 },
    timeline: {
      pickup: '2:00 PM today',
      cleaning: '24-48 hours',
      dropoff: 'Tomorrow evening'
    }
  },
  {
    id: '3',
    customerName: 'Emma Davis',
    service: 'Express Wash',
    status: 'in_progress',
    amount: 35.75,
    distance: '0.5 km',
    estimatedTime: '25 min',
    items: 12,
    isRush: false,
    pickupLocation: '654 Cedar Rd, Eastside',
    dropoffLocation: '987 Maple Dr, Northside',
    pickupTime: '10:00 AM',
    tip: 2,
    coordinates: { latitude: 37.7649, longitude: -122.4294 },
    timeline: {
      pickup: 'Completed',
      cleaning: 'In progress',
      dropoff: 'Tonight 6 PM'
    }
  },
];

export default function LaundryMasterHomeScreen() {
  const { user, logout, updateUserLocation } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [todayEarnings, setTodayEarnings] = useState<number>(156.25);
  const [completedOrders, setCompletedOrders] = useState<number>(8);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);

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
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [updateUserLocation]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);



  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleOrderAction = (orderId: string, action: 'accept' | 'decline' | 'complete') => {
    const order = orders.find(o => o.id === orderId);
    
    if (action === 'accept' && order) {
      Alert.alert(
        'Job Accepted!',
        `Timeline provided to customer:\n\nPickup: ${order.timeline?.pickup}\nCleaning: ${order.timeline?.cleaning}\nDrop-off: ${order.timeline?.dropoff}`,
        [{ text: 'OK' }]
      );
    }
    
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          switch (action) {
            case 'accept':
              return { ...order, status: 'accepted' as const };
            case 'complete':
              setTodayEarnings(prev => prev + order.amount);
              setCompletedOrders(prev => prev + 1);
              return { ...order, status: 'completed' as const };
            case 'decline':
              return order;
            default:
              return order;
          }
        }
        return order;
      })
    );
    
    if (showOrderModal) {
      setShowOrderModal(false);
    }
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

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'accepted': return '#007AFF';
      case 'in_progress': return '#34C759';
      case 'completed': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'New Order';
      case 'accepted': return 'Accepted';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.locationContainer}>
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={getCurrentLocation}
            disabled={isLoadingLocation}
          >
            <MapPin size={20} color={Colors.light.primary} />
            <View style={styles.locationText}>
              <Text style={styles.serviceArea}>Service Area</Text>
              <Text style={styles.address} numberOfLines={1}>
                {isLoadingLocation 
                  ? 'Getting location...' 
                  : userLocation?.address || 'Set your location'
                }
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.onlineToggle}>
          <Text style={[styles.onlineText, { color: isOnline ? Colors.light.primary : '#8E8E93' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#E5E5EA', true: Colors.light.primary }}
            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : isOnline ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>
      </View>
      
      <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
        <User size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsCard}>
        <DollarSign size={24} color={Colors.light.primary} />
        <Text style={styles.statsValue}>${todayEarnings.toFixed(2)}</Text>
        <Text style={styles.statsLabel}>Today Earnings</Text>
      </View>
      
      <View style={styles.statsCard}>
        <Package size={24} color={Colors.light.primary} />
        <Text style={styles.statsValue}>{completedOrders}</Text>
        <Text style={styles.statsLabel}>Orders Completed</Text>
      </View>
      
      <View style={styles.statsCard}>
        <Star size={24} color="#FFD700" />
        <Text style={styles.statsValue}>4.9</Text>
        <Text style={styles.statsLabel}>Rating</Text>
      </View>
    </View>
  );

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity 
      key={order.id} 
      style={[styles.orderCard, order.isRush && styles.rushOrderCard]}
      onPress={() => handleOrderPress(order)}
    >
      {order.isRush && (
        <View style={styles.rushBadge}>
          <Zap size={12} color="#fff" />
          <Text style={styles.rushBadgeText}>RUSH</Text>
        </View>
      )}
      
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <View style={styles.orderMeta}>
            <MapPin size={12} color="#666" />
            <Text style={styles.metaText}>{order.distance}</Text>
            <Clock size={12} color="#666" />
            <Text style={styles.metaText}>{order.estimatedTime}</Text>
            {order.tip > 0 && (
              <>
                <DollarSign size={12} color={Colors.light.success} />
                <Text style={[styles.metaText, { color: Colors.light.success }]}>${order.tip} tip</Text>
              </>
            )}
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.serviceType}>{order.service}</Text>
        <Text style={styles.itemCount}>{order.items} items</Text>
        <Text style={styles.orderAmount}>${order.amount.toFixed(2)}</Text>
      </View>
      
      <View style={styles.orderPreview}>
        <Text style={styles.previewText} numberOfLines={1}>
          📍 {order.pickupLocation}
        </Text>
        <Text style={styles.previewText} numberOfLines={1}>
          🕐 {order.pickupTime}
        </Text>
      </View>
      
      {order.status === 'pending' && (
        <View style={styles.orderActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.declineButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleOrderAction(order.id, 'decline');
            }}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleOrderAction(order.id, 'accept');
            }}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {order.status === 'in_progress' && (
        <TouchableOpacity 
          style={[styles.actionButton, styles.completeButton]}
          onPress={(e) => {
            e.stopPropagation();
            handleOrderAction(order.id, 'complete');
          }}
        >
          <Text style={styles.completeButtonText}>Mark Complete</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const pendingOrders = orders
    .filter(order => order.status === 'pending')
    .sort((a, b) => (b.isRush ? 1 : 0) - (a.isRush ? 1 : 0));
  const activeOrders = orders.filter(order => ['accepted', 'in_progress'].includes(order.status));

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Hello {user?.name}! 👋</Text>
          <Text style={styles.subGreeting}>
            {isOnline ? 'You are online and ready for orders' : 'You are currently offline'}
          </Text>
        </View>

        {renderStatsCards()}
        
        {pendingOrders.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Orders</Text>
              <View style={styles.badgeContainer}>
                {pendingOrders.filter(o => o.isRush).length > 0 && (
                  <View style={styles.rushBadgeSmall}>
                    <Zap size={12} color="#fff" />
                    <Text style={styles.rushBadgeSmallText}>{pendingOrders.filter(o => o.isRush).length}</Text>
                  </View>
                )}
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{pendingOrders.length}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.ordersList}>
              {pendingOrders.map(renderOrderCard)}
            </View>
          </>
        )}
        
        {activeOrders.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Orders</Text>
            </View>
            
            <View style={styles.ordersList}>
              {activeOrders.map(renderOrderCard)}
            </View>
          </>
        )}
        
        {!isOnline && (
          <View style={styles.offlineMessage}>
            <Text style={styles.offlineText}>
              You are offline. Turn on availability to receive new orders.
            </Text>
          </View>
        )}
      </ScrollView>
      
      <Modal
        visible={showOrderModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Job Details</Text>
            <TouchableOpacity onPress={() => setShowOrderModal(false)}>
              <X size={24} color={Colors.light.gray} />
            </TouchableOpacity>
          </View>
          
          {selectedOrder && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.customerInfo}>
                <View style={styles.customerHeader}>
                  <Text style={styles.customerNameLarge}>{selectedOrder.customerName}</Text>
                  {selectedOrder.isRush && (
                    <View style={styles.rushBadgeLarge}>
                      <Zap size={16} color="#fff" />
                      <Text style={styles.rushBadgeLargeText}>RUSH ORDER</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.serviceTypeLarge}>{selectedOrder.service}</Text>
                <Text style={styles.itemCountLarge}>{selectedOrder.items} items • ${selectedOrder.amount.toFixed(2)}</Text>
                {selectedOrder.tip > 0 && (
                  <Text style={styles.tipAmount}>💰 ${selectedOrder.tip} tip included</Text>
                )}
              </View>
              
              <View style={styles.locationSection}>
                <Text style={styles.sectionTitleModal}>Locations</Text>
                <View style={styles.locationItem}>
                  <MapPin size={20} color={Colors.light.primary} />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationLabel}>Pickup</Text>
                    <Text style={styles.locationAddress}>{selectedOrder.pickupLocation}</Text>
                  </View>
                </View>
                <View style={styles.locationItem}>
                  <Navigation size={20} color={Colors.light.success} />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationLabel}>Drop-off</Text>
                    <Text style={styles.locationAddress}>{selectedOrder.dropoffLocation}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.mapContainer}>
                <GoogleMapView
                  center={{
                    latitude: selectedOrder.coordinates.latitude,
                    longitude: selectedOrder.coordinates.longitude,
                    address: selectedOrder.pickupLocation,
                  }}
                  markers={[
                    {
                      location: {
                        latitude: selectedOrder.coordinates.latitude,
                        longitude: selectedOrder.coordinates.longitude,
                        address: selectedOrder.pickupLocation,
                      },
                      title: 'Pickup Location',
                      description: selectedOrder.pickupLocation,
                      color: 'blue',
                      label: 'P',
                    },
                  ]}
                  height={200}
                  showDirectionsButton={true}
                  zoom={15}
                />
              </View>
              
              <View style={styles.timelineSection}>
                <Text style={styles.sectionTitleModal}>Timeline</Text>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineIcon}>
                    <Clock size={16} color={Colors.light.primary} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Pickup</Text>
                    <Text style={styles.timelineValue}>{selectedOrder.timeline?.pickup}</Text>
                  </View>
                </View>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineIcon}>
                    <Package size={16} color={Colors.light.warning} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Cleaning</Text>
                    <Text style={styles.timelineValue}>{selectedOrder.timeline?.cleaning}</Text>
                  </View>
                </View>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineIcon}>
                    <CheckCircle size={16} color={Colors.light.success} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Drop-off</Text>
                    <Text style={styles.timelineValue}>{selectedOrder.timeline?.dropoff}</Text>
                  </View>
                </View>
              </View>
              
              {selectedOrder.specialNotes && (
                <View style={styles.notesSection}>
                  <Text style={styles.sectionTitleModal}>Special Notes</Text>
                  <Text style={styles.notesText}>{selectedOrder.specialNotes}</Text>
                </View>
              )}
              
              {selectedOrder.status === 'pending' && (
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalActionButton, styles.declineButtonModal]}
                    onPress={() => handleOrderAction(selectedOrder.id, 'decline')}
                  >
                    <Text style={styles.declineButtonTextModal}>Decline</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalActionButton, styles.acceptButtonModal]}
                    onPress={() => handleOrderAction(selectedOrder.id, 'accept')}
                  >
                    <Text style={styles.acceptButtonTextModal}>Accept Job</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
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
  headerLeft: {
    flex: 1,
    gap: 12,
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
  serviceArea: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineText: {
    fontSize: 14,
    fontWeight: '600',
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
    paddingVertical: 16,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ordersList: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  acceptButton: {
    backgroundColor: Colors.light.primary,
  },
  completeButton: {
    backgroundColor: Colors.light.primary,
  },
  declineButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  completeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  offlineMessage: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  rushOrderCard: {
    borderColor: Colors.light.warning,
    borderWidth: 2,
  },
  rushBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.light.warning,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  rushBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rushBadgeSmall: {
    backgroundColor: Colors.light.warning,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  rushBadgeSmallText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderPreview: {
    marginBottom: 12,
    gap: 4,
  },
  previewText: {
    fontSize: 12,
    color: '#666',
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
  customerInfo: {
    backgroundColor: Colors.light.primaryBackground,
    padding: 20,
    borderRadius: 16,
    marginVertical: 20,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerNameLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  rushBadgeLarge: {
    backgroundColor: Colors.light.warning,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  rushBadgeLargeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  serviceTypeLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  itemCountLarge: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  tipAmount: {
    fontSize: 16,
    color: Colors.light.success,
    fontWeight: '600',
  },
  locationSection: {
    marginBottom: 24,
  },
  sectionTitleModal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.lightGray,
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: Colors.light.gray,
    textAlign: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    color: Colors.light.gray,
    textAlign: 'center',
  },
  timelineSection: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    color: '#666',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    backgroundColor: Colors.light.lightGray,
    padding: 16,
    borderRadius: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineButtonModal: {
    backgroundColor: Colors.light.lightGray,
  },
  acceptButtonModal: {
    backgroundColor: Colors.light.primary,
  },
  declineButtonTextModal: {
    color: Colors.light.gray,
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButtonTextModal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});