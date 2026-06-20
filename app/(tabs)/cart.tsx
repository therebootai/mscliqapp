import React from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCartStore } from '@/store/useCartStore';
import CartItem from '@/components/cart/CartItem';

export default function CartScreen() {
  const router = useRouter();
  const { items } = useCartStore();

  const subtotal = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  
  // Basic tax calculation based on effectiveTax
  const totalTax = items.reduce((acc, item) => {
    let taxAmount = 0;
    if (item.effectiveTax && item.effectiveTax.length > 0) {
      const totalSlab = item.effectiveTax.reduce((sum, tax) => sum + tax.slab, 0);
      taxAmount = ((item.price || 0) * totalSlab / 100) * item.quantity;
    } else {
      // Fallback to standard 18% tax if backend didn't supply tax details
      taxAmount = ((item.price || 0) * 0.18) * item.quantity;
    }
    return acc + taxAmount;
  }, 0);

  const shipping = subtotal > 500 ? 0 : 50; // Free shipping over 500
  const grandTotal = subtotal + totalTax + (items.length > 0 ? shipping : 0);

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="cart.fill" size={80} color="#ddd" />
        <ThemedText style={styles.emptyTitle}>Your cart is empty!</ThemedText>
        <ThemedText style={styles.emptySub}>Add items to it now.</ThemedText>
        <Pressable style={styles.shopBtn} onPress={() => router.push('/')}>
          <ThemedText style={styles.shopBtnText}>Shop Now</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.itemsList}>
          {items.map(item => (
            <CartItem key={item.variantId} item={item} />
          ))}
        </View>

        <View style={styles.summaryContainer}>
          <ThemedText style={styles.summaryTitle}>Price Details</ThemedText>
          
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Price ({items.length} items)</ThemedText>
            <ThemedText style={styles.summaryValue}>₹{subtotal.toFixed(2)}</ThemedText>
          </View>
          
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Estimated Tax</ThemedText>
            <ThemedText style={styles.summaryValue}>₹{totalTax.toFixed(2)}</ThemedText>
          </View>

          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Delivery Charges</ThemedText>
            <ThemedText style={[styles.summaryValue, shipping === 0 && { color: '#34A853' }]}>
              {shipping === 0 ? 'FREE Delivery' : `₹${shipping}`}
            </ThemedText>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <ThemedText style={styles.totalLabel}>Total Amount</ThemedText>
            <ThemedText style={styles.totalValue}>₹{grandTotal.toFixed(2)}</ThemedText>
          </View>
        </View>

      </ScrollView>

      {/* Fixed Bottom Checkout Bar */}
      <View style={styles.bottomBar}>
        <View>
          <ThemedText style={styles.bottomTotal}>₹{grandTotal.toFixed(2)}</ThemedText>
          <ThemedText style={styles.bottomSub}>View price details</ThemedText>
        </View>
        <Pressable style={styles.checkoutBtn} onPress={() => {}}>
          <ThemedText style={styles.checkoutBtnText}>Proceed to Checkout</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom bar
  },
  itemsList: {
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#222',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
  },
  summaryValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 5,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EE0000',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  bottomTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  bottomSub: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '500',
  },
  checkoutBtn: {
    backgroundColor: '#EE0000',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkoutBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#222',
  },
  emptySub: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 25,
  },
  shopBtn: {
    backgroundColor: '#EE0000',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
