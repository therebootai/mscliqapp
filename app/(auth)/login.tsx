import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '@/config/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const { redirectTo } = useLocalSearchParams();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);
  
  const syncCart = useCartStore((state) => state.syncToBackend);
  const setTokens = useAuthStore((state) => state.setTokens);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  const normalizePhone = (val: string) => val.replace(/\D/g, '').slice(0, 10);

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.post(`${BASE_URL}/auth/login/send-otp`, { phone });
      setOtpSent(true);
      setTimer(60); // 60 seconds countdown
      setMessage('OTP sent on WhatsApp.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setError('Please enter a valid OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${BASE_URL}/auth/login/verify`, 
        {
          phone,
          otp: otp.trim(),
        }, 
        {
          headers: { 'x-client-type': 'mobile' }
        }
      );
      
      const { data } = response.data;
      const accessToken = response.data.accessToken || data.accessToken;
      const refreshToken = response.data.refreshToken || data.refreshToken;
      
      if (accessToken && refreshToken) {
        // Set both tokens in global store and SecureStore
        await setTokens(accessToken, refreshToken);
        
        // Fetch profile details
        await refreshProfile();
        
        // Sync local cart with backend after login
        try {
          await syncCart();
        } catch (syncErr) {
          console.error('Initial cart sync failed:', syncErr);
        }

        if (redirectTo) {
          router.replace(redirectTo as any);
        } else {
          router.replace('/(tabs)/account');
        }
      } else {
        throw new Error('Access or refresh token missing from response.');
      }
    } catch (err: any) {
      // Wait 10 seconds if OTP is wrong
      await new Promise((resolve) => setTimeout(resolve, 10000));
      setError(err.response?.data?.message || 'Wrong OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.brandTitle}>MSCLIQ</Text>
            <Text style={styles.subtitle}>Login or register with WhatsApp OTP</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <IconSymbol name="phone.fill" size={20} color="#9ca3af" />
              </View>
              <TextInput
                style={[styles.input, otpSent && styles.disabledInput]}
                placeholder="Mobile Number"
                placeholderTextColor="#374151"
                value={phone}
                onChangeText={(val) => setPhone(normalizePhone(val))}
                keyboardType="numeric"
                maxLength={10}
                editable={!otpSent && !loading}
              />
            </View>

            {otpSent && (
              <View style={[styles.inputWrapper, { marginTop: 16 }]}>
                <View style={styles.iconContainer}>
                  <IconSymbol name="shield.fill" size={20} color="#9ca3af" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  placeholderTextColor="#374151"
                  value={otp}
                  onChangeText={(val) => setOtp(val.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus
                  editable={!loading}
                />
              </View>
            )}

            {message ? <Text style={styles.messageText}>{message}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              style={[styles.button, loading && styles.disabledButton]}
              onPress={otpSent ? handleVerifyOtp : handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {otpSent ? 'Verify OTP' : 'Send OTP'}
                </Text>
              )}
            </TouchableOpacity>

            {otpSent && (
              <View style={{ marginTop: 20 }}>
                {timer > 0 ? (
                  <Text style={[styles.resendText, { textAlign: 'center' }]}>
                    Resend OTP in {timer} seconds
                  </Text>
                ) : (
                  <TouchableOpacity 
                    style={styles.resendButton}
                    onPress={handleSendOtp}
                    disabled={loading}
                  >
                    <Text style={[styles.resendText, { color: '#111827', fontWeight: '600' }]}>
                      Resend OTP
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.resendButton, { marginTop: 12 }]}
                  onPress={() => {
                    setOtpSent(false);
                    setOtp('');
                    setError('');
                    setMessage('');
                    setTimer(0);
                  }}
                >
                  <Text style={styles.resendText}>Change Phone Number</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  iconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: '#111827',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  messageText: {
    color: '#059669',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
