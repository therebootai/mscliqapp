import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CartItem as CartItemType, useCartStore } from '@/store/cartStore';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCartStore();

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.variantId, item.quantity - 1);
    } else {
      removeFromCart(item.variantId);
    }
  };

  const handleIncrease = () => {
    updateQuantity(item.variantId, item.quantity + 1);
  };

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: item.product.image }} 
        style={styles.image} 
        contentFit="cover" 
      />
      
      <View style={styles.details}>
        <View style={styles.headerRow}>
          <ThemedText style={styles.title} numberOfLines={2}>{item.product.title}</ThemedText>
          <Pressable onPress={() => removeFromCart(item.variantId)} style={styles.removeBtn}>
            <IconSymbol name="xmark" size={20} color="#888" />
          </Pressable>
        </View>

        <View style={styles.priceRow}>
          <ThemedText style={styles.price}>₹{item.product.price}</ThemedText>
          {item.product.mrp && item.product.mrp > (item.product.price || 0) && (
            <ThemedText style={styles.mrp}>₹{item.product.mrp}</ThemedText>
          )}
        </View>

        <View style={styles.quantityContainer}>
          <Pressable style={styles.qtyBtn} onPress={handleDecrease}>
            <ThemedText style={styles.qtyBtnText}>-</ThemedText>
          </Pressable>
          <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
          <Pressable style={styles.qtyBtn} onPress={handleIncrease}>
            <ThemedText style={styles.qtyBtnText}>+</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 15,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#222',
  },
  removeBtn: {
    padding: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EE0000',
  },
  mrp: {
    fontSize: 12,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  qtyBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    color: '#444',
  },
  qtyText: {
    width: 30,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  }
});
