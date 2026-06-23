import React from 'react';
import { StyleSheet, View, Modal, Pressable, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface SortOption {
  value: string;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Highest Discount' },
];

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  currentSort: string;
  onSortChange: (value: string) => void;
}

export default function SortModal({ visible, onClose, currentSort, onSortChange }: SortModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Sort By</ThemedText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={20} color="#222" />
            </Pressable>
          </View>

          <View style={styles.optionsList}>
            {SORT_OPTIONS.map((option) => {
              const isSelected = currentSort === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={styles.optionRow}
                  onPress={() => {
                    onSortChange(option.value);
                    onClose();
                  }}
                >
                  <ThemedText
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                  {isSelected && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#EE0000" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  closeBtn: {
    padding: 5,
  },
  optionsList: {
    gap: 5,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  optionLabel: {
    fontSize: 16,
    color: '#555',
  },
  optionLabelSelected: {
    fontWeight: 'bold',
    color: '#EE0000',
  },
});
