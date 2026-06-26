import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import { BASE_URL } from '@/config/api';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [step, setStep] = useState<'WARNING' | 'OTP'>('WARNING');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');

  const requestDeletionOtp = async () => {
    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/users/me/delete-request`);
      setStep('OTP');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send OTP';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeletion = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/users/me/delete`, { data: { otp } });
      await logout();
      Alert.alert('Account Deleted', 'Your account has been successfully deleted.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to delete account. Please check your OTP.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color="#222" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Delete Account</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 'WARNING' ? (
          <>
            <View style={styles.warningBox}>
              <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#ef4444" />
              <ThemedText style={styles.warningTitle}>Warning!</ThemedText>
              <ThemedText style={styles.warningText}>
                Deleting your account is a permanent action. You will lose access to your order history, saved addresses, and active sessions. 
              </ThemedText>
              <ThemedText style={styles.warningText}>
                To proceed, we need to verify your identity by sending an OTP to your registered WhatsApp number (+91 {user?.phone}).
              </ThemedText>
            </View>

            <TouchableOpacity 
              style={[styles.dangerButton, loading && { opacity: 0.7 }]} 
              onPress={requestDeletionOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Request OTP via WhatsApp</ThemedText>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.otpBox}>
              <IconSymbol name="lock.fill" size={48} color="#3b82f6" />
              <ThemedText style={styles.otpTitle}>Verify Deletion</ThemedText>
              <ThemedText style={styles.otpText}>
                An OTP has been sent to +91 {user?.phone} via WhatsApp. Please enter it below to permanently delete your account.
              </ThemedText>
              <TextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                placeholder="Enter OTP"
                maxLength={6}
              />
            </View>

            <TouchableOpacity 
              style={[styles.dangerButton, loading && { opacity: 0.7 }]} 
              onPress={confirmDeletion}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Confirm Deletion</ThemedText>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  content: { padding: 20 },
  warningBox: {
    backgroundColor: '#fef2f2',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  warningTitle: { fontSize: 22, fontWeight: 'bold', color: '#ef4444', marginTop: 12, marginBottom: 8 },
  warningText: { fontSize: 15, color: '#991b1b', textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  otpBox: {
    backgroundColor: '#eff6ff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  otpTitle: { fontSize: 22, fontWeight: 'bold', color: '#1d4ed8', marginTop: 12, marginBottom: 8 },
  otpText: { fontSize: 15, color: '#1e3a8a', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  otpInput: {
    backgroundColor: '#fff',
    width: '100%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
