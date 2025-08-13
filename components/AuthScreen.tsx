import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Truck } from 'lucide-react-native';
import { useAuth, UserRole } from '@/lib/auth-context';
import { router } from 'expo-router';

type AuthMode = 'welcome' | 'role-select' | 'login' | 'signup' | 'customer-login' | 'master-login';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const { login, signup, isLoading } = useAuth();

  const handleAuth = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (mode === 'signup' && (!formData.firstName || !formData.lastName)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    let result;
    if (mode === 'signup') {
      result = await signup(formData.email, formData.password, formData.firstName, formData.lastName, selectedRole);
    } else if (mode === 'customer-login') {
      result = await login(formData.email, formData.password, 'customer');
    } else if (mode === 'master-login') {
      result = await login(formData.email, formData.password, 'laundry_master');
    } else {
      result = await login(formData.email, formData.password);
    }

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error', result.error || 'Authentication failed');
    }
  };

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <LinearGradient
        colors={['#87CEEB', '#4682B4']}
        style={styles.gradient}
      >
        <View style={styles.welcomeContent}>
          <Text style={styles.appTitle}>LaundryHub</Text>
          <Text style={styles.subtitle}>On-demand laundry service</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => setMode('role-select')}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setMode('customer-login')}
            >
              <Text style={styles.secondaryButtonText}>Customer Login</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setMode('master-login')}
            >
              <Text style={styles.secondaryButtonText}>Laundry Master Login</Text>
            </TouchableOpacity>
            

          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderRoleSelect = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Role</Text>
      <Text style={styles.description}>How would you like to use LaundryHub?</Text>
      
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'customer' && styles.selectedRole
          ]}
          onPress={() => setSelectedRole('customer')}
        >
          <User size={48} color={selectedRole === 'customer' ? '#87CEEB' : '#666'} />
          <Text style={[
            styles.roleTitle,
            selectedRole === 'customer' && styles.selectedRoleText
          ]}>
            Customer
          </Text>
          <Text style={styles.roleDescription}>
            Get your laundry picked up and delivered
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'laundry_master' && styles.selectedRole
          ]}
          onPress={() => setSelectedRole('laundry_master')}
        >
          <Truck size={48} color={selectedRole === 'laundry_master' ? '#87CEEB' : '#666'} />
          <Text style={[
            styles.roleTitle,
            selectedRole === 'laundry_master' && styles.selectedRoleText
          ]}>
            Laundry Master
          </Text>
          <Text style={styles.roleDescription}>
            Provide laundry services and earn money
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={() => setMode('signup')}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setMode('welcome')}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAuthForm = () => {
    const isLogin = ['login', 'customer-login', 'master-login'].includes(mode);
    const getTitle = () => {
      if (mode === 'customer-login') return 'Customer Login';
      if (mode === 'master-login') return 'Laundry Master Login';
      return isLogin ? 'Welcome Back' : 'Create Account';
    };
    
    return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.title}>
          {getTitle()}
        </Text>
        
        {mode === 'signup' && (
          <View style={styles.roleIndicator}>
            <Text style={styles.roleIndicatorText}>
              Signing up as {selectedRole === 'customer' ? 'Customer' : selectedRole === 'laundry_master' ? 'Laundry Master' : 'Admin'}
            </Text>
          </View>
        )}

        {!isLogin && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                value={formData.firstName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                value={formData.lastName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                autoCapitalize="words"
              />
            </View>
          </>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder={isLogin ? 'Enter your password' : 'Create a secure password'}
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleAuth}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchModeButton}
          onPress={() => setMode(isLogin ? 'signup' : 'login')}
        >
          <Text style={styles.switchModeText}>
            {isLogin 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'
            }
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setMode('welcome')}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    );
  };

  switch (mode) {
    case 'welcome':
      return renderWelcome();
    case 'role-select':
      return renderRoleSelect();
    case 'login':
    case 'signup':
    case 'customer-login':
    case 'master-login':
      return renderAuthForm();
    default:
      return renderWelcome();
  }
}

const styles = StyleSheet.create({
  welcomeContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 60,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    gap: 16,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRole: {
    borderColor: '#87CEEB',
    backgroundColor: '#F0F8FF',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  selectedRoleText: {
    color: '#87CEEB',
  },
  roleDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
  roleIndicator: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  roleIndicatorText: {
    textAlign: 'center',
    color: '#87CEEB',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#87CEEB',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#87CEEB',
    fontSize: 16,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
});