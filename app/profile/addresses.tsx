import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASE_URL } from '@/config/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Address {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export default function AddressesScreen() {
  const { returnTo } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [pincodeSuccess, setPincodeSuccess] = useState('');

  const fetchAddresses = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    try {
      const { data } = await axios.get(`${BASE_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && data.data) {
        setAddresses(data.data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPinCode('');
    setEditingAddressId(null);
    setPincodeError('');
    setPincodeSuccess('');
    setPincodeLoading(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleOpenEdit = (address: Address) => {
    setEditingAddressId(address._id);
    setFullName(address.fullName);
    setPhone(address.phone);
    setAddressLine1(address.addressLine1);
    setAddressLine2(address.addressLine2 || '');
    setCity(address.city);
    setState(address.state);
    setPinCode(address.postalCode);
    setModalVisible(true);
    setPincodeError('');
    setPincodeSuccess('');
    setPincodeLoading(false);
  };

  useEffect(() => {
    const validatePincode = async () => {
      if (postalCode.length !== 6) {
        setPincodeError('');
        setPincodeSuccess('');
        return;
      }

      setPincodeLoading(true);
      setPincodeError('');
      setPincodeSuccess('');

      try {
        // 1. Fetch City & State from public API
        const pinResponse = await axios.get(`https://api.postalpincode.in/pincode/${postalCode}`);
        const pinData = pinResponse.data[0];
        
        if (pinData.Status === 'Success' && pinData.PostOffice && pinData.PostOffice.length > 0) {
          const postOffice = pinData.PostOffice[0];
          setCity(postOffice.District || postOffice.Block || '');
          setState(postOffice.State || '');
        }

        // 2. Check Serviceability via Shiprocket
        const { data } = await axios.get(`${BASE_URL}/courier/serviceability`, {
          params: {
            pickup_postcode: '110001', // Default pickup pincode
            delivery_postcode: postalCode,
            weight: '0.5',
            cod: '1',
          },
        });

        if (data.success && data.data?.status === 200) {
          const etd = data.data.data?.available_courier_companies?.[0]?.etd;
          setPincodeSuccess(`Delivery available${etd ? `. Expected by: ${etd}` : ''}`);
        } else {
          setPincodeError('Delivery not available for this pincode');
        }
      } catch (error) {
        console.error('Pincode validation error:', error);
        setPincodeError('Delivery not available for this pincode');
      } finally {
        setPincodeLoading(false);
      }
    };

    if (postalCode.length === 6) {
      validatePincode();
    } else {
      setPincodeError('');
      setPincodeSuccess('');
    }
  }, [postalCode]);

  const handleSaveAddress = async () => {
    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }

    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
      return;
    }

    if (postalCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode.');
      return;
    }

    setSaving(true);
    const token = await SecureStore.getItemAsync('userToken');
    try {
      const payload = { 
        fullName, 
        phone, 
        addressLine1, 
        addressLine2, 
        city, 
        state, 
        postalCode 
      };
      
      if (editingAddressId) {
        await axios.patch(
          `${BASE_URL}/addresses/${editingAddressId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${BASE_URL}/addresses`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      setModalVisible(false);
      fetchAddresses();
      resetForm();

      if (returnTo === 'checkout') {
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    const token = await SecureStore.getItemAsync('userToken');
    try {
      await axios.patch(`${BASE_URL}/addresses/${id}/default`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const token = await SecureStore.getItemAsync('userToken');
          try {
            await axios.delete(`${BASE_URL}/addresses/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchAddresses();
          } catch (error) {
            console.error('Error deleting address:', error);
          }
        },
      },
    ]);
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
      <Stack.Screen options={{ title: 'Saved Addresses', headerShown: true }} />
      
      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.addressCard, item.isDefault && styles.defaultCard]}>
            <View style={styles.cardHeader}>
              {item.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>DEFAULT</Text>
                </View>
              ) : (
                <View />
              )}
            </View>
            
            <Text style={styles.name}>{item.fullName}</Text>
            
            <View style={styles.addressRow}>
              <IconSymbol name="mappin.and.ellipse" size={14} color="#6b7280" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressText}>{item.addressLine1}</Text>
                {item.addressLine2 && <Text style={styles.addressText}>{item.addressLine2}</Text>}
                <Text style={styles.addressText}>{`${item.city}, ${item.state} - ${item.postalCode}`}</Text>
              </View>
            </View>
            
            <Text style={styles.phoneText}>Phone: {item.phone}</Text>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEdit(item)}>
                <IconSymbol name="pencil" size={16} color="#3b82f6" />
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
              
              {!item.isDefault && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(item._id)}>
                  <Text style={[styles.actionBtnText, { color: '#6b7280' }]}>Set Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item._id)}>
                <IconSymbol name="trash.fill" size={16} color="#ef4444" />
                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="mappin.and.ellipse" size={60} color="#e5e7eb" />
            <Text style={styles.emptyText}>No addresses saved yet.</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={[styles.addButton, { bottom: Math.max(20, insets.bottom + 10) }]} 
        onPress={handleOpenAdd}
      >
        <IconSymbol name="plus" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Add New Address</Text>
      </TouchableOpacity>

      {/* Address Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddressId ? 'Edit Address' : 'New Address'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Full Name</Text>
                <TextInput style={styles.modalInput} value={fullName} onChangeText={setFullName} placeholder="John Doe" placeholderTextColor="#374151" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Phone Number</Text>
                <TextInput style={styles.modalInput} value={phone} onChangeText={setPhone} placeholder="10-digit mobile" placeholderTextColor="#374151" keyboardType="numeric" maxLength={10} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Address Line 1</Text>
                <TextInput style={styles.modalInput} value={addressLine1} onChangeText={setAddressLine1} placeholder="House no, Street..." placeholderTextColor="#374151" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Address Line 2</Text>
                <TextInput style={styles.modalInput} value={addressLine2} onChangeText={setAddressLine2} placeholder="Landmark, Area..." placeholderTextColor="#374151" />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>City</Text>
                  <TextInput style={styles.modalInput} value={city} onChangeText={setCity} placeholder="Mumbai" placeholderTextColor="#374151" />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>Pincode</Text>
                  <TextInput style={styles.modalInput} value={postalCode} onChangeText={setPinCode} placeholder="400001" placeholderTextColor="#374151" keyboardType="numeric" maxLength={6} />
                  {pincodeLoading && <Text style={styles.pincodeLoading}>Checking...</Text>}
                  {pincodeError ? <Text style={styles.pincodeError}>{pincodeError}</Text> : null}
                  {pincodeSuccess ? <Text style={styles.pincodeSuccess}>{pincodeSuccess}</Text> : null}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>State</Text>
                <TextInput style={styles.modalInput} value={state} onChangeText={setState} placeholder="Maharashtra" placeholderTextColor="#374151" />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, (saving || pincodeLoading || !!pincodeError) && styles.disabledButton]} 
                onPress={handleSaveAddress}
                disabled={saving || pincodeLoading || !!pincodeError}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Address</Text>}
              </TouchableOpacity>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  defaultCard: {
    borderColor: '#111827',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  labelBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  defaultBadge: {
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  phoneText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginTop: 8,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 100,
    gap: 16,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#111827',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalForm: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
    marginLeft: 4,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  submitBtn: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pincodeLoading: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    marginLeft: 4,
  },
  pincodeError: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: 'bold',
    marginTop: 4,
    marginLeft: 4,
  },
  pincodeSuccess: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: 'bold',
    marginTop: 4,
    marginLeft: 4,
  },
});
