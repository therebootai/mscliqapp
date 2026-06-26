import React from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <IconSymbol name="checkmark" size={60} color="#fff" />
          </View>
        </View>

        <ThemedText style={styles.title}>Payment Successful!</ThemedText>
        <ThemedText style={styles.subtitle}>Thank you for your purchase.</ThemedText>
        
        <ThemedText style={styles.description}>
          Your order {orderId ? `(#${orderId.toString().slice(-8).toUpperCase()}) ` : ''}has been placed successfully. 
          We will process it shortly and notify you once it ships.
        </ThemedText>

        <View style={styles.buttonContainer}>
          {orderId && (
            <Pressable 
              style={styles.viewOrderBtn} 
              onPress={() => router.replace(`/profile/order/${orderId}`)}
            >
              <ThemedText style={styles.viewOrderBtnText}>View Order Details</ThemedText>
            </Pressable>
          )}

          <Pressable 
            style={styles.continueBtn} 
            onPress={() => router.replace('/')}
          >
            <ThemedText style={styles.continueBtnText}>Continue Shopping</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#34A853', // Google green for success
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#34A853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  viewOrderBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#EE0000',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  viewOrderBtnText: {
    color: '#EE0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueBtn: {
    backgroundColor: '#EE0000',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
