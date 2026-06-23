import React from 'react';
import { Modal, StyleSheet, View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Address } from '@/store/addressStore';
import { useRouter } from 'expo-router';

interface AddressSelectionModalProps {
  visible: boolean;
  addresses: Address[];
  selectedAddressId: string | null;
  onClose: () => void;
  onSelectAddress: (id: string) => void;
}

export default function AddressSelectionModal({
  visible,
  addresses,
  selectedAddressId,
  onClose,
  onSelectAddress
}: AddressSelectionModalProps) {
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>Select Delivery Address</ThemedText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={24} color="#222" />
            </Pressable>
          </View>

          <ScrollView style={styles.list}>
            {addresses.map((address) => (
              <Pressable
                key={address._id}
                style={[
                  styles.addressCard,
                  address._id === selectedAddressId && styles.selectedCard
                ]}
                onPress={() => {
                  onSelectAddress(address._id);
                  onClose();
                }}
              >
                <View style={styles.radioContainer}>
                  <View style={[styles.radio, address._id === selectedAddressId && styles.radioSelected]} />
                </View>
                <View style={styles.addressInfo}>
                  <View style={styles.nameRow}>
                    <ThemedText style={styles.name}>{address.fullName}</ThemedText>
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <ThemedText style={styles.defaultText}>Default</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={styles.addressText}>
                    {address.addressLine1}, {address.city}, {address.state} - {address.postalCode}
                  </ThemedText>
                  <ThemedText style={styles.phone}>{address.phone}</ThemedText>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.addNewBtn} onPress={() => {
            onClose();
            router.push('/profile/addresses');
          }}>
            <IconSymbol name="plus" size={20} color="#EE0000" />
            <ThemedText style={styles.addNewText}>Add New Address</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  closeBtn: {
    padding: 5,
  },
  list: {
    padding: 20,
  },
  addressCard: {
    flexDirection: 'row',
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  selectedCard: {
    borderColor: '#EE0000',
    backgroundColor: '#fff5f5',
  },
  radioContainer: {
    justifyContent: 'center',
    marginRight: 15,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  radioSelected: {
    borderColor: '#EE0000',
    borderWidth: 6,
  },
  addressInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#eee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  phone: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222',
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addNewText: {
    color: '#EE0000',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  }
});
