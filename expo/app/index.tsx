import React from 'react';
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from '@/lib/auth-context';
import AuthScreen from '@/components/AuthScreen';
import CustomerHomeScreen from '@/components/CustomerHomeScreen';
import LaundryMasterHomeScreen from '@/components/LaundryMasterHomeScreen';

export default function HomeScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (user?.role === 'customer') {
    return <CustomerHomeScreen />;
  }

  if (user?.role === 'laundry_master') {
    return <LaundryMasterHomeScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to LaundryHub</Text>
      <Text style={styles.text}>Something went wrong. Please restart the app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});