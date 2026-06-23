import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCartStore } from '@/store/cartStore';
import CartItem from '@/components/cart/CartItem';
import { calculateCartTotals, calculateItemTax } from '@/utils/taxCalculation';

export default function CartScreen() {
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const router = useRouter();
  const { items } = useCartStore();

  // Use frontend tax calculation utility
  const mappedItems = items.map(item => ({
    price: item.product.price || 0,
    quantity: item.quantity,
    effectiveTax: item.product.effectiveTax
  }));
  const { subtotal, totalTax } = calculateCartTotals(mappedItems);

  const totalMRP = items.reduce((acc, item) => acc + (item.product.mrp || item.product.price || 0) * item.quantity, 0);
  const totalDiscount = totalMRP - subtotal;

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
            <ThemedText style={styles.summaryLabel}>Total MRP</ThemedText>
            <ThemedText style={styles.summaryValue}>₹{totalMRP.toFixed(2)}</ThemedText>
          </View>

          {totalDiscount > 0 && (
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Discount on MRP</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: '#34A853' }]}>-₹{totalDiscount.toFixed(2)}</ThemedText>
            </View>
          )}

          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subtotal ({items.length} items)</ThemedText>
            <ThemedText style={styles.summaryValue}>₹{subtotal.toFixed(2)}</ThemedText>
          </View>
          
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Total Tax</ThemedText>
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
          <Pressable onPress={() => setShowPriceDetails(true)}>
            <ThemedText style={styles.bottomSub}>View price details</ThemedText>
          </Pressable>
        </View>
        <Pressable style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
          <ThemedText style={styles.checkoutBtnText}>Proceed to Checkout</ThemedText>
        </Pressable>
      </View>

      {/* Price Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showPriceDetails}
        onRequestClose={() => setShowPriceDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPriceDetails(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.summaryTitle}>Price Details</ThemedText>
              <Pressable onPress={() => setShowPriceDetails(false)}>
                <IconSymbol name="xmark" size={24} color="#222" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 250, marginBottom: 15 }} showsVerticalScrollIndicator={true}>
              {items.map(item => {
                const itemTax = calculateItemTax(item.product.price || 0, item.quantity, item.product.effectiveTax);
                const itemTotal = ((item.product.price || 0) * item.quantity);

                return (
                  <View key={item.variantId} style={{ marginBottom: 15 }}>
                    <ThemedText style={{ fontSize: 13, fontWeight: 'bold', color: '#222' }} numberOfLines={2}>
                      {item.product.title} (x{item.quantity})
                    </ThemedText>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <ThemedText style={{ fontSize: 12, color: '#666' }}>Item Price</ThemedText>
                      <ThemedText style={{ fontSize: 12, color: '#222', fontWeight: '500' }}>₹{itemTotal.toFixed(2)}</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                      <ThemedText style={{ fontSize: 12, color: '#666' }}>Tax (GST)</ThemedText>
                      <ThemedText style={{ fontSize: 12, color: '#222', fontWeight: '500' }}>+ ₹{itemTax.toFixed(2)}</ThemedText>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={{ height: 1, backgroundColor: '#eee', marginBottom: 15 }} />

            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Total MRP</ThemedText>
              <ThemedText style={styles.summaryValue}>₹{totalMRP.toFixed(2)}</ThemedText>
            </View>

            {totalDiscount > 0 && (
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Discount on MRP</ThemedText>
                <ThemedText style={[styles.summaryValue, { color: '#34A853' }]}>-₹{totalDiscount.toFixed(2)}</ThemedText>
              </View>
            )}

            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Subtotal ({items.length} items)</ThemedText>
              <ThemedText style={styles.summaryValue}>₹{subtotal.toFixed(2)}</ThemedText>
            </View>
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Total Tax</ThemedText>
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
        </View>
      </Modal>
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  }
});
