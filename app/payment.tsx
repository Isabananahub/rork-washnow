import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import {
  CreditCard,
  Lock,
  ArrowLeft,
  Check,
  MapPin,
  Clock,
  User,
  DollarSign,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { JobData } from '@/components/JobTimelineScreen';

interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  name: string;
  icon: React.ReactNode;
  lastFour?: string;
}

interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

export default function PaymentScreen() {
  const params = useLocalSearchParams();
  const [job, setJob] = useState<JobData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showCardForm, setShowCardForm] = useState<boolean>(true);

  useEffect(() => {
    if (params.jobData && typeof params.jobData === 'string') {
      try {
        const jobData = JSON.parse(params.jobData) as JobData;
        setJob(jobData);
      } catch (error) {
        console.error('Error parsing job data:', error);
        Alert.alert('Error', 'Invalid job data');
        router.back();
      }
    }
  }, [params.jobData]);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      type: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard size={24} color={Colors.light.primary} />,
    },
    {
      id: 'apple_pay',
      type: 'apple_pay',
      name: 'Apple Pay',
      icon: <DollarSign size={24} color={Colors.light.primary} />,
    },
    {
      id: 'google_pay',
      type: 'google_pay',
      name: 'Google Pay',
      icon: <DollarSign size={24} color={Colors.light.primary} />,
    },
  ];

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardDetails(prev => ({ ...prev, number: formatted }));
    }
  };

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiry(value);
    if (formatted.length <= 5) {
      setCardDetails(prev => ({ ...prev, expiry: formatted }));
    }
  };

  const handleCvvChange = (value: string) => {
    const v = value.replace(/[^0-9]/gi, '');
    if (v.length <= 4) {
      setCardDetails(prev => ({ ...prev, cvv: v }));
    }
  };

  const validateCardDetails = (): boolean => {
    if (selectedPaymentMethod !== 'card') return true;
    
    const { number, expiry, cvv, name } = cardDetails;
    const cleanNumber = number.replace(/\s/g, '');
    
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      Alert.alert('Invalid Card', 'Please enter a valid card number');
      return false;
    }
    
    if (expiry.length !== 5) {
      Alert.alert('Invalid Expiry', 'Please enter a valid expiry date (MM/YY)');
      return false;
    }
    
    if (cvv.length < 3 || cvv.length > 4) {
      Alert.alert('Invalid CVV', 'Please enter a valid CVV');
      return false;
    }
    
    if (name.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please enter the cardholder name');
      return false;
    }
    
    return true;
  };

  const handlePayment = async () => {
    if (!job) return;
    
    if (!validateCardDetails()) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Payment Successful! 🎉',
        `Your payment of $${job.amount} has been processed successfully. Your laundry order has been confirmed!`,
        [
          {
            text: 'View Order Status',
            onPress: () => {
              router.replace({
                pathname: '/job-timeline' as any,
                params: { jobData: JSON.stringify(job) }
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Failed', 'There was an error processing your payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setShowCardForm(methodId === 'card');
  };

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Loading payment details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Payment',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <User size={16} color={Colors.light.gray} />
              <Text style={styles.summaryLabel}>Customer</Text>
              <Text style={styles.summaryValue}>{job.customerName}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <MapPin size={16} color={Colors.light.gray} />
              <Text style={styles.summaryLabel}>Pickup</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>{job.pickupLocation}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <MapPin size={16} color={Colors.light.gray} />
              <Text style={styles.summaryLabel}>Drop-off</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>{job.dropoffLocation}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Clock size={16} color={Colors.light.gray} />
              <Text style={styles.summaryLabel}>Pickup Time</Text>
              <Text style={styles.summaryValue}>{job.pickupTime}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.packageLabel}>Package</Text>
              <Text style={styles.packageValue}>{job.packageType}</Text>
            </View>
            
            {job.isRush && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rush Service</Text>
                <Text style={styles.summaryValue}>+$10</Text>
              </View>
            )}
            
            {job.tip > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tip</Text>
                <Text style={styles.summaryValue}>+${job.tip}</Text>
              </View>
            )}
            
            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${job.amount}</Text>
            </View>
          </View>
        </View>
        
        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === method.id && styles.paymentMethodSelected
                ]}
                onPress={() => handlePaymentMethodSelect(method.id)}
              >
                <View style={styles.paymentMethodContent}>
                  {method.icon}
                  <Text style={styles.paymentMethodName}>{method.name}</Text>
                  {method.lastFour && (
                    <Text style={styles.paymentMethodDetails}>•••• {method.lastFour}</Text>
                  )}
                </View>
                {selectedPaymentMethod === method.id && (
                  <Check size={20} color={Colors.light.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Card Details Form */}
        {showCardForm && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Card Details</Text>
            
            <View style={styles.cardForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <View style={styles.inputContainer}>
                  <CreditCard size={20} color={Colors.light.gray} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChangeText={handleCardNumberChange}
                    keyboardType="numeric"
                    maxLength={19}
                    placeholderTextColor={Colors.light.gray}
                  />
                </View>
              </View>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChangeText={handleExpiryChange}
                      keyboardType="numeric"
                      maxLength={5}
                      placeholderTextColor={Colors.light.gray}
                    />
                  </View>
                </View>
                
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <View style={styles.inputContainer}>
                    <Lock size={16} color={Colors.light.gray} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChangeText={handleCvvChange}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      placeholderTextColor={Colors.light.gray}
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color={Colors.light.gray} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChangeText={(text) => setCardDetails(prev => ({ ...prev, name: text }))}
                    autoCapitalize="words"
                    placeholderTextColor={Colors.light.gray}
                  />
                </View>
              </View>
            </View>
          </View>
        )}
        
        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Lock size={16} color={Colors.light.primary} />
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure
          </Text>
        </View>
      </ScrollView>
      
      {/* Pay Button */}
      <View style={styles.payButtonContainer}>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          <Text style={styles.payButtonText}>
            {isProcessing ? 'Processing...' : `Pay $${job.amount}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.primaryBackground,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.error,
    textAlign: 'center',
    marginTop: 50,
  },
  
  // Order Summary
  orderSummary: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.light.gray,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  packageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  packageValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.lightGray,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  
  // Payment Methods
  paymentSection: {
    marginBottom: 32,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  paymentMethodSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryBackground,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  paymentMethodDetails: {
    fontSize: 14,
    color: Colors.light.gray,
  },
  
  // Card Form
  cardSection: {
    marginBottom: 32,
  },
  cardForm: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  
  // Security Notice
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  securityText: {
    fontSize: 14,
    color: Colors.light.gray,
    textAlign: 'center',
  },
  
  // Pay Button
  payButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  payButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  payButtonDisabled: {
    backgroundColor: Colors.light.gray,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});