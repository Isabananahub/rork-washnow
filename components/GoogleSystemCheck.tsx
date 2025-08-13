import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react-native';
import { trpcClient } from '@/lib/trpc';
import Colors from '@/constants/colors';

interface SystemCheckResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: any;
}

export default function GoogleSystemCheck() {
  const [checks, setChecks] = useState<SystemCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const runSystemCheck = async () => {
    setIsRunning(true);
    const results: SystemCheckResult[] = [];

    // Test 1: API Key Configuration
    results.push({
      name: 'API Key Configuration',
      status: 'loading',
      message: 'Checking API key...'
    });
    setChecks([...results]);

    try {
      const apiKeyTest = await trpcClient.google.testApi.query({ testType: 'places' });
      
      if (apiKeyTest.success) {
        results[0] = {
          name: 'API Key Configuration',
          status: 'success',
          message: `✅ API key is valid and working (${apiKeyTest.resultsCount} test results)`,
          details: apiKeyTest
        };
      } else {
        results[0] = {
          name: 'API Key Configuration',
          status: 'error',
          message: `❌ ${apiKeyTest.error}: ${apiKeyTest.errorMessage || ''}`,
          details: apiKeyTest
        };
      }
    } catch (error) {
      results[0] = {
        name: 'API Key Configuration',
        status: 'error',
        message: `❌ Failed to test API key: ${error}`,
        details: error
      };
    }

    setChecks([...results]);

    // Test 2: Places Autocomplete API
    results.push({
      name: 'Places Autocomplete API',
      status: 'loading',
      message: 'Testing Places API...'
    });
    setChecks([...results]);

    try {
      const placesTest = await trpcClient.google.testApi.query({ testType: 'places' });
      
      if (placesTest.success) {
        results[1] = {
          name: 'Places Autocomplete API',
          status: 'success',
          message: `✅ Places API working (${placesTest.resultsCount} results)`,
          details: placesTest
        };
      } else {
        results[1] = {
          name: 'Places Autocomplete API',
          status: 'error',
          message: `❌ Places API failed: ${placesTest.errorMessage || placesTest.error}`,
          details: placesTest
        };
      }
    } catch (error) {
      results[1] = {
        name: 'Places Autocomplete API',
        status: 'error',
        message: `❌ Places API test failed: ${error}`,
        details: error
      };
    }

    setChecks([...results]);

    // Test 3: Geocoding API
    results.push({
      name: 'Geocoding API',
      status: 'loading',
      message: 'Testing Geocoding API...'
    });
    setChecks([...results]);

    try {
      const geocodingTest = await trpcClient.google.testApi.query({ testType: 'geocoding' });
      
      if (geocodingTest.success) {
        results[2] = {
          name: 'Geocoding API',
          status: 'success',
          message: `✅ Geocoding API working (${geocodingTest.resultsCount} results)`,
          details: geocodingTest
        };
      } else {
        results[2] = {
          name: 'Geocoding API',
          status: 'error',
          message: `❌ Geocoding API failed: ${geocodingTest.errorMessage || geocodingTest.error}`,
          details: geocodingTest
        };
      }
    } catch (error) {
      results[2] = {
        name: 'Geocoding API',
        status: 'error',
        message: `❌ Geocoding API test failed: ${error}`,
        details: error
      };
    }

    setChecks([...results]);

    // Test 4: Backend Proxy
    results.push({
      name: 'Backend Proxy',
      status: 'loading',
      message: 'Testing backend proxy...'
    });
    setChecks([...results]);

    try {
      const proxyTest = await trpcClient.google.placesProxy.query({ 
        input: 'New York' 
      });
      
      if (proxyTest.success) {
        results[3] = {
          name: 'Backend Proxy',
          status: 'success',
          message: `✅ Backend proxy working (${proxyTest.predictions.length} results)`,
          details: proxyTest
        };
      } else {
        results[3] = {
          name: 'Backend Proxy',
          status: 'error',
          message: `❌ Backend proxy failed: ${proxyTest.error}`,
          details: proxyTest
        };
      }
    } catch (error) {
      results[3] = {
        name: 'Backend Proxy',
        status: 'error',
        message: `❌ Backend proxy test failed: ${error}`,
        details: error
      };
    }

    setChecks([...results]);
    setIsRunning(false);
  };

  useEffect(() => {
    runSystemCheck();
  }, []);

  const getStatusIcon = (status: SystemCheckResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color={Colors.light.success} />;
      case 'error':
        return <XCircle size={20} color={Colors.light.error} />;
      case 'warning':
        return <AlertCircle size={20} color={Colors.light.warning} />;
      case 'loading':
        return <ActivityIndicator size="small" color={Colors.light.primary} />;
    }
  };

  const getStatusColor = (status: SystemCheckResult['status']) => {
    switch (status) {
      case 'success':
        return Colors.light.success;
      case 'error':
        return Colors.light.error;
      case 'warning':
        return Colors.light.warning;
      case 'loading':
        return Colors.light.gray;
    }
  };

  const showDetails = (check: SystemCheckResult) => {
    Alert.alert(
      check.name,
      JSON.stringify(check.details, null, 2),
      [{ text: 'OK' }]
    );
  };

  const getRecommendations = () => {
    const errorChecks = checks.filter(check => check.status === 'error');
    
    if (errorChecks.length === 0) {
      return '🎉 All systems are working correctly!';
    }

    let recommendations = '🔧 Recommendations to fix issues:\n\n';
    
    errorChecks.forEach(check => {
      switch (check.name) {
        case 'API Key Configuration':
          recommendations += '• Check your Google Cloud Console:\n';
          recommendations += '  - Verify API key is correct\n';
          recommendations += '  - Enable Places API, Geocoding API\n';
          recommendations += '  - Check billing is enabled\n';
          recommendations += '  - Verify API restrictions\n\n';
          break;
        case 'Places Autocomplete API':
          recommendations += '• Places API issues:\n';
          recommendations += '  - Enable Places API in Google Cloud Console\n';
          recommendations += '  - Check API quotas and limits\n';
          recommendations += '  - Verify billing account\n\n';
          break;
        case 'Geocoding API':
          recommendations += '• Geocoding API issues:\n';
          recommendations += '  - Enable Geocoding API in Google Cloud Console\n';
          recommendations += '  - Check API quotas and limits\n\n';
          break;
        case 'Backend Proxy':
          recommendations += '• Backend proxy issues:\n';
          recommendations += '  - Check server is running\n';
          recommendations += '  - Verify tRPC routes are configured\n';
          recommendations += '  - Check network connectivity\n\n';
          break;
      }
    });

    return recommendations;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Settings size={24} color={Colors.light.primary} />
        <Text style={styles.title}>Google API System Check</Text>
        <TouchableOpacity 
          onPress={runSystemCheck} 
          disabled={isRunning}
          style={styles.refreshButton}
        >
          <RefreshCw size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.checksContainer}>
        {checks.map((check, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.checkItem, { borderLeftColor: getStatusColor(check.status) }]}
            onPress={() => check.details && showDetails(check)}
          >
            <View style={styles.checkHeader}>
              {getStatusIcon(check.status)}
              <Text style={styles.checkName}>{check.name}</Text>
            </View>
            <Text style={[styles.checkMessage, { color: getStatusColor(check.status) }]}>
              {check.message}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {checks.length > 0 && !isRunning && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recommendations</Text>
          <Text style={styles.recommendationsText}>
            {getRecommendations()}
          </Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Current Configuration</Text>
        <Text style={styles.infoText}>
          • API Key: AIzaSyBvOkBwgGlbUiuS-oSiuvGpZVtEHXTBTBw{"\n"}
          • Backend Proxy: Enabled{"\n"}
          • Web Compatibility: Enabled{"\n"}
          • Rate Limiting: Enabled
        </Text>
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
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  refreshButton: {
    padding: 8,
  },
  checksContainer: {
    padding: 16,
    gap: 12,
  },
  checkItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  checkName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  checkMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationsContainer: {
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
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recommendationsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  infoContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    fontFamily: 'monospace',
  },
});