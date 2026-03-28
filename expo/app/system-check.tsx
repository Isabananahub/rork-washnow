import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Play, CheckCircle, Settings, Database, Search, Building, MapPin, RefreshCw } from 'lucide-react-native';
import GoogleSystemCheck from '@/components/GoogleSystemCheck';
import { runFullSystemTest, mockTestOrders } from '@/lib/test-suite';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function SystemCheckScreen() {
  const [isRunningFullTest, setIsRunningFullTest] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testType, setTestType] = useState<'places' | 'geocoding' | 'directions' | 'laundry-search'>('places');
  
  // Test Google API
  const googleApiTest = trpc.google.testApi.useQuery(
    { testType },
    { enabled: false }
  );
  
  // Test laundry business search
  const laundryBusinessTest = trpc.google.findLaundryBusinesses.useQuery(
    {},
    { enabled: false }
  );

  const handleRunFullSystemTest = async () => {
    setIsRunningFullTest(true);
    try {
      console.log('🚀 Starting comprehensive system test...');
      await runFullSystemTest();
    } catch (error) {
      console.error('❌ System test failed:', error);
      Alert.alert(
        'System Test Error',
        `Failed to run system test: ${error}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsRunningFullTest(false);
    }
  };
  
  const runGoogleTest = async (type: 'places' | 'geocoding' | 'directions' | 'laundry-search') => {
    try {
      setIsRefreshing(true);
      setTestType(type);
      await googleApiTest.refetch();
    } catch (error) {
      Alert.alert('Test Failed', 'Failed to run Google API test');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const runLaundrySearch = async () => {
    try {
      setIsRefreshing(true);
      await laundryBusinessTest.refetch();
    } catch (error) {
      Alert.alert('Search Failed', 'Failed to search for laundry businesses');
    } finally {
      setIsRefreshing(false);
    }
  };

  const showTestOrdersInfo = () => {
    const rushOrders = mockTestOrders.filter(order => order.isRush).length;
    const totalTips = mockTestOrders.reduce((sum, order) => sum + order.tip, 0);
    const totalRevenue = mockTestOrders.reduce((sum, order) => sum + order.amount, 0);
    const statusCounts = mockTestOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Alert.alert(
      '📦 Test Orders Summary',
      `Total Orders: ${mockTestOrders.length}\n` +
      `Rush Orders: ${rushOrders} (${((rushOrders / mockTestOrders.length) * 100).toFixed(1)}%)\n` +
      `Total Tips: ${totalTips}\n` +
      `Total Revenue: ${totalRevenue}\n\n` +
      `Status Breakdown:\n` +
      `• Pending: ${statusCounts.pending || 0}\n` +
      `• Accepted: ${statusCounts.accepted || 0}\n` +
      `• In Progress: ${statusCounts.in_progress || 0}\n` +
      `• Completed: ${statusCounts.completed || 0}\n\n` +
      `Orders span up to 2 weeks in advance with realistic pickup times during service hours (5 AM - 8 PM).`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'LaundryHub System Check',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { color: '#333' }
        }} 
      />
      
      <View style={styles.header}>
        <Settings size={32} color={Colors.light.primary} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>LaundryHub System Check</Text>
          <Text style={styles.headerSubtitle}>Comprehensive testing & diagnostics</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Full System Test</Text>
        <Text style={styles.sectionDescription}>
          Run comprehensive tests including {mockTestOrders.length} test orders, Google API integration, 
          date/time picker validation, order management, and error handling.
        </Text>
        
        <TouchableOpacity 
          style={[styles.testButton, styles.primaryButton]} 
          onPress={handleRunFullSystemTest}
          disabled={isRunningFullTest}
        >
          <Play size={20} color="white" />
          <Text style={styles.testButtonText}>
            {isRunningFullTest ? 'Running Full System Test...' : 'Run Full System Test'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.testButton, styles.secondaryButton]} 
          onPress={showTestOrdersInfo}
        >
          <Database size={20} color={Colors.light.primary} />
          <Text style={[styles.testButtonText, { color: Colors.light.primary }]}>
            View Test Orders ({mockTestOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗺️ Google API Tests</Text>
        <Text style={styles.sectionDescription}>
          Test Google Places API, Geocoding API, and backend proxy functionality.
        </Text>
        
        <View style={styles.testButtonsRow}>
          <TouchableOpacity 
            style={[styles.smallTestButton, { opacity: isRefreshing ? 0.5 : 1 }]}
            onPress={() => runGoogleTest('places')}
            disabled={isRefreshing}
          >
            <Search size={14} color="#FFFFFF" />
            <Text style={styles.smallButtonText}>Places</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.smallTestButton, { opacity: isRefreshing ? 0.5 : 1 }]}
            onPress={() => runGoogleTest('geocoding')}
            disabled={isRefreshing}
          >
            <MapPin size={14} color="#FFFFFF" />
            <Text style={styles.smallButtonText}>Geocoding</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.smallTestButton, { opacity: isRefreshing ? 0.5 : 1 }]}
            onPress={() => runGoogleTest('directions')}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} color="#FFFFFF" />
            <Text style={styles.smallButtonText}>Directions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.smallTestButton, { backgroundColor: '#10B981', opacity: isRefreshing ? 0.5 : 1 }]}
            onPress={() => runGoogleTest('laundry-search')}
            disabled={isRefreshing}
          >
            <Building size={14} color="#FFFFFF" />
            <Text style={styles.smallButtonText}>Laundry</Text>
          </TouchableOpacity>
        </View>
        
        {googleApiTest.data && (
          <View style={styles.testResults}>
            <Text style={[styles.resultText, { 
              color: googleApiTest.data.success ? '#10B981' : '#EF4444' 
            }]}>
              {googleApiTest.data.success ? '✅ ' : '❌ '}
              {googleApiTest.data.message || googleApiTest.data.error}
            </Text>
            
            {googleApiTest.data.success && (
              <View style={styles.resultDetails}>
                <Text style={styles.detailText}>Status: {googleApiTest.data.status}</Text>
                <Text style={styles.detailText}>Results: {googleApiTest.data.resultsCount}</Text>
                <Text style={styles.detailText}>HTTP: {googleApiTest.data.httpStatus}</Text>
                
                {googleApiTest.data.businessDetails && (
                  <View style={styles.businessList}>
                    <Text style={styles.businessHeader}>🏪 Found Businesses:</Text>
                    {googleApiTest.data.businessDetails.slice(0, 3).map((business: any, index: number) => (
                      <View key={index} style={styles.businessItem}>
                        <Text style={styles.businessName}>{business.name}</Text>
                        <Text style={styles.businessAddress}>{business.address}</Text>
                        {business.rating && (
                          <Text style={styles.businessRating}>⭐ {business.rating}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
        
        <GoogleSystemCheck />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏪 San Diego Laundry Search</Text>
        <Text style={styles.sectionDescription}>
          Comprehensive search for laundry businesses in San Diego, CA 92123 area using multiple Google APIs.
        </Text>
        
        <TouchableOpacity 
          style={[styles.testButton, styles.primaryButton, { opacity: isRefreshing ? 0.5 : 1 }]}
          onPress={runLaundrySearch}
          disabled={isRefreshing}
        >
          <Building size={20} color="white" />
          <Text style={styles.testButtonText}>
            {isRefreshing ? 'Searching...' : 'Search Laundry Businesses'}
          </Text>
        </TouchableOpacity>
        
        {laundryBusinessTest.data && (
          <View style={styles.testResults}>
            <Text style={[styles.resultText, { 
              color: laundryBusinessTest.data.success ? '#10B981' : '#EF4444' 
            }]}>
              {laundryBusinessTest.data.success ? '✅ ' : '❌ '}
              {laundryBusinessTest.data.success 
                ? `Found ${laundryBusinessTest.data.totalFound} laundry businesses in San Diego 92123`
                : laundryBusinessTest.data.error
              }
            </Text>
            
            {laundryBusinessTest.data.success && laundryBusinessTest.data.businesses && (
              <View style={styles.resultDetails}>
                <Text style={styles.detailText}>Total Found: {laundryBusinessTest.data.totalFound}</Text>
                {laundryBusinessTest.data.searchStats && (
                  <Text style={styles.detailText}>
                    Success Rate: {laundryBusinessTest.data.searchStats.successfulRequests}/{laundryBusinessTest.data.searchStats.totalRequests}
                  </Text>
                )}
                
                <View style={styles.businessList}>
                  <Text style={styles.businessHeader}>🏪 Top Laundry Businesses:</Text>
                  {laundryBusinessTest.data.businesses.slice(0, 5).map((business: any, index: number) => (
                    <View key={business.place_id} style={styles.businessItem}>
                      <Text style={styles.businessName}>{business.name}</Text>
                      <Text style={styles.businessAddress}>{business.address}</Text>
                      <View style={styles.businessMeta}>
                        {business.rating && (
                          <Text style={styles.businessRating}>⭐ {business.rating}</Text>
                        )}
                        {business.user_ratings_total && (
                          <Text style={styles.businessReviews}>({business.user_ratings_total} reviews)</Text>
                        )}
                        {business.business_status && (
                          <Text style={[styles.businessStatus, { 
                            color: business.business_status === 'OPERATIONAL' ? '#10B981' : '#EF4444' 
                          }]}>
                            {business.business_status}
                          </Text>
                        )}
                      </View>
                      {business.types && (
                        <Text style={styles.businessTypes}>
                          {business.types.slice(0, 3).join(', ')}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>✅ System Features</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={Colors.light.success} />
            <Text style={styles.featureText}>📅 Calendar picker (up to 2 weeks advance)</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={Colors.light.success} />
            <Text style={styles.featureText}>🕐 Time picker (5 AM - 8 PM service hours)</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={Colors.light.success} />
            <Text style={styles.featureText}>🗺️ Google Places API integration</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={Colors.light.success} />
            <Text style={styles.featureText}>📍 Location services & geocoding</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={Colors.light.success} />
            <Text style={styles.featureText}>⚡ Rush order handling (+$10 fee)</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={Colors.light.success} />
            <Text style={styles.featureText}>💰 Tip system integration</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={Colors.light.success} />
            <Text style={styles.featureText}>👥 Customer & Laundry Master dashboards</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={Colors.light.success} />
            <Text style={styles.featureText}>📱 Mobile-responsive design</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={Colors.light.success} />
            <Text style={styles.featureText}>🔄 Order timeline tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={16} color={Colors.light.success} />
            <Text style={styles.featureText}>💳 Dynamic pricing (1-2: $15, 3-4: $30, 5-6: $50)</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  featuresSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  testButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  smallTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 12,
  },
  testResults: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  resultDetails: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  businessList: {
    marginTop: 12,
  },
  businessHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  businessItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  businessMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  businessRating: {
    fontSize: 14,
    color: '#FFA500',
    fontWeight: '500',
  },
  businessReviews: {
    fontSize: 12,
    color: '#666',
  },
  businessStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  businessTypes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});