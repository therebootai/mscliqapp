import React, { useEffect, useState } from 'react';
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
  Alert,
  Linking,
} from 'react-native';
import { router, Stack } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/config/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    try {
      const { data } = await axios.get(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && data.data) {
        setName(data.data.name || '');
        setEmail(data.data.email || '');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required.');
      return;
    }

    setSaving(true);
    const token = await SecureStore.getItemAsync('userToken');

    try {
      await axios.patch(
        `${BASE_URL}/users/me`,
        { name, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Profile updated successfully.');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendOtpForDeletion = async () => {
    setDeleting(true);
    const token = await SecureStore.getItemAsync('userToken');
    try {
      await axios.post(`${BASE_URL}/auth/delete-account/send-otp`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOtpSent(true);
      Alert.alert('OTP Sent', 'A verification code has been sent to your registered WhatsApp number.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setDeleting(false);
    }
  };

  const handleVerifyDeletion = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP.');
      return;
    }

    setDeleting(true);
    const token = await SecureStore.getItemAsync('userToken');
    try {
      await axios.post(`${BASE_URL}/auth/delete-account/verify`, { otp }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.', [
        {
          text: 'OK',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify OTP.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRequestDeletion = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          style: 'destructive',
          onPress: handleSendOtpForDeletion
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Edit Profile', headerShown: true }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            {!otpSent ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <IconSymbol name="person.fill" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your name"
                      placeholderTextColor="#374151"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <IconSymbol name="paperplane.fill" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      placeholderTextColor="#374151"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, (saving || deleting) && styles.disabledButton]}
                  onPress={handleSave}
                  disabled={saving || deleting}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={handleRequestDeletion}
                  disabled={saving || deleting}
                >
                  {deleting ? (
                    <ActivityIndicator color="#ef4444" />
                  ) : (
                    <Text style={styles.deleteBtnText}>Request Account Deletion</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.otpContainer}>
                <Text style={styles.otpTitle}>Verify Deletion</Text>
                <Text style={styles.otpSubtitle}>Enter the 6-digit code sent to your phone to confirm account deletion.</Text>
                
                <View style={styles.otpInputGroup}>
                  <View style={styles.otpBox}>
                    <IconSymbol name="shield.fill" size={20} color="#ef4444" style={styles.inputIcon} />
                    <TextInput
                      style={styles.otpTextInput}
                      value={otp}
                      onChangeText={(val) => setOtp(val.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      maxLength={6}
                      autoFocus
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.deleteConfirmButton, deleting && styles.disabledButton]}
                  onPress={handleVerifyDeletion}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Confirm Permanent Deletion</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                  disabled={deleting}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
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
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#111827',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteConfirmButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 18,
    padding:5,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: 'bold',
  },
  otpContainer: {
    gap: 16,
    alignItems: 'center',
    paddingVertical: 20,
  },
  otpTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  otpSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  cancelBtn: {
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  otpInputGroup: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  otpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    paddingHorizontal: 20,
    width: '90%', // Standard centered width
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  otpTextInput: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 10,
  },
});
