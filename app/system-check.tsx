import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Play, CheckCircle, Settings, Database } from 'lucide-react-native';
import GoogleSystemCheck from '@/components/GoogleSystemCheck';
import { runFullSystemTest, mockTestOrders } from '@/lib/test-suite';
import Colors from '@/constants/colors';

export default function SystemCheckScreen() {
  const [isRunningFullTest, setIsRunningFullTest] = useState<boolean>(false);

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
        <GoogleSystemCheck />
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
});