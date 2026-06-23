import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCartStore } from '@/store/cartStore';
import { useAddressStore } from '@/store/addressStore';
import { useToastStore } from '@/store/useToastStore';
import { useAuthStore } from '@/store/authStore';
import { calculateCartTotals } from '@/utils/taxCalculation';
import { BASE_URL } from '@/config/api';
import axios from 'axios';
import AddressSelectionModal from '@/components/checkout/AddressSelectionModal';
import CartItem from '@/components/cart/CartItem';

export default function CheckoutScreen() {
  const router = useRouter();
  const { buyNowVariantId } = useLocalSearchParams<{ buyNowVariantId?: string }>();
  const insets = useSafeAreaInsets();
  const { items: cartItems, appliedCoupon, setAppliedCoupon, removeCoupon } = useCartStore();
  
  const items = buyNowVariantId 
    ? cartItems.filter(item => item.variantId === buyNowVariantId) 
    : cartItems;
  const { addresses, fetchAddresses } = useAddressStore();
  const { showToast } = useToastStore();
  const { isAuthenticated } = useAuthStore();
  
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || '');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        showToast('Please login to continue to checkout', 'info');
        router.replace('/(auth)/login');
        return;
      }
      fetchAddresses();
      fetchCoupons();
    }, [])
  );

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/coupons/available`, {
        params: { maxOrderValue: 99999999 }
      });
      setAvailableCoupons(res.data.data?.coupons || []);
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    }
  };

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr._id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses.find(a => a._id === selectedAddressId);

  // Cart Totals
  const mappedItems = items.map(item => ({
    price: item.product.price || 0,
    quantity: item.quantity,
    effectiveTax: item.product.effectiveTax
  }));
  const { subtotal, totalTax, grandTotal } = calculateCartTotals(mappedItems, appliedCoupon?.calculatedDiscount || 0);

  const totalMRP = items.reduce((acc, item) => acc + (item.product.mrp || item.product.price || 0) * item.quantity, 0);
  const totalDiscount = totalMRP - subtotal;
  const shipping = subtotal > 500 ? 0 : 50;
  const finalAmount = grandTotal + (items.length > 0 ? shipping : 0);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = codeToApply || couponCode;
    if (!code.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const res = await axios.get(`${BASE_URL}/coupons/validate`, {
        params: {
          code: code.toUpperCase(),
          subtotal: subtotal
        }
      });
      const data = res.data.data;
      if (data.valid && data.coupon) {
        setAppliedCoupon({
          ...data.coupon,
          calculatedDiscount: data.calculatedDiscount
        });
        setCouponCode(data.coupon.code);
        showToast(`Coupon applied! ₹${data.calculatedDiscount} off`, 'success');
      } else {
        removeCoupon();
        showToast(data.error || 'Invalid coupon', 'error');
      }
    } catch (err: any) {
      removeCoupon();
      showToast(err.response?.data?.message || 'Failed to apply coupon', 'error');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handlePayment = () => {
    if (!selectedAddress) {
      showToast('Please select an address first', 'error');
      return;
    }
    // Razorpay flow will be added here
    showToast('Payment integration coming next', 'info');
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={24} color="#222" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Checkout</ThemedText>
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol name="cart.fill" size={80} color="#ddd" />
          <ThemedText style={styles.emptyTitle}>Nothing to checkout</ThemedText>
          <Pressable style={styles.shopBtn} onPress={() => router.push('/')}>
            <ThemedText style={styles.shopBtnText}>Go to Shop</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color="#222" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Checkout</ThemedText>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        
        {/* Products Section */}
        <View style={styles.itemsList}>
          {items.map(item => (
            <CartItem key={item.variantId} item={item} />
          ))}
        </View>
        
        {/* Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Delivery Address</ThemedText>
            <Pressable onPress={() => setShowAddressModal(true)}>
              <ThemedText style={styles.changeText}>Change</ThemedText>
            </Pressable>
          </View>
          {selectedAddress ? (
            <View style={styles.addressBox}>
              <View style={styles.addressRow}>
                <IconSymbol name="house.fill" size={18} color="#EE0000" />
                <ThemedText style={styles.addressName}>{selectedAddress.fullName}</ThemedText>
              </View>
              <ThemedText style={styles.addressText}>
                {selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}
              </ThemedText>
              <ThemedText style={styles.addressPhone}>{selectedAddress.phone}</ThemedText>
            </View>
          ) : (
            <Pressable style={styles.addAddressBox} onPress={() => router.push('/profile/addresses?returnTo=checkout')}>
              <IconSymbol name="plus" size={20} color="#EE0000" />
              <ThemedText style={styles.addAddressText}>Add Delivery Address</ThemedText>
            </Pressable>
          )}
        </View>

        {/* Coupon Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Offers & Coupons</ThemedText>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter Coupon Code"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              editable={!appliedCoupon && !isApplyingCoupon}
            />
            {appliedCoupon ? (
              <Pressable style={styles.removeCouponBtn} onPress={() => {
                removeCoupon();
                setCouponCode('');
              }}>
                <ThemedText style={styles.removeCouponText}>Remove</ThemedText>
              </Pressable>
            ) : (
              <Pressable style={styles.applyBtn} onPress={() => handleApplyCoupon()} disabled={!couponCode || isApplyingCoupon}>
                {isApplyingCoupon ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.applyBtnText}>Apply</ThemedText>
                )}
              </Pressable>
            )}
          </View>

          {availableCoupons.length > 0 && !appliedCoupon && (
            <View style={styles.availableCouponsContainer}>
              <ThemedText style={styles.availableCouponsTitle}>Available ({availableCoupons.length})</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.couponsScroll}>
                {availableCoupons.map((c) => {
                  const isEligible = subtotal >= c.minOrderValue;
                  return (
                    <Pressable
                      key={c._id}
                      style={[styles.couponCard, !isEligible && styles.couponCardDisabled]}
                      onPress={() => isEligible && handleApplyCoupon(c.code)}
                      disabled={!isEligible || isApplyingCoupon}
                    >
                      <View style={styles.couponTagRow}>
                        <View style={[styles.couponTag, !isEligible && styles.couponTagDisabled]}>
                          <ThemedText style={styles.couponTagText}>
                            {c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.couponCodeText, !isEligible && styles.couponCodeTextDisabled]}>
                          {c.code}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.couponDescText}>
                        {c.type === 'percentage'
                          ? `off ${c.maxDiscount > 0 ? `upto ₹${c.maxDiscount}` : ''} | min ₹${c.minOrderValue}`
                          : `off | min ₹${c.minOrderValue}`}
                      </ThemedText>
                      {!isEligible && (
                        <ThemedText style={styles.notApplicableText}>Not applicable</ThemedText>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Price Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Price Details ({items.length} items)</ThemedText>
          
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
          {appliedCoupon && (
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Coupon Discount</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: '#34A853' }]}>-₹{(appliedCoupon.calculatedDiscount || 0).toFixed(2)}</ThemedText>
            </View>
          )}
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
            <ThemedText style={styles.summaryValue}>₹{(subtotal - (appliedCoupon?.calculatedDiscount || 0)).toFixed(2)}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Estimated Tax</ThemedText>
            <ThemedText style={styles.summaryValue}>₹{totalTax.toFixed(2)}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Delivery Charges</ThemedText>
            <ThemedText style={[styles.summaryValue, shipping === 0 && { color: '#34A853' }]}>
              {shipping === 0 ? 'FREE' : `₹${shipping}`}
            </ThemedText>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <ThemedText style={styles.totalLabel}>Total Amount</ThemedText>
            <ThemedText style={styles.totalValue}>₹{finalAmount.toFixed(2)}</ThemedText>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Payment Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(15, insets.bottom) }]}>
        <View>
          <ThemedText style={styles.bottomTotal}>₹{finalAmount.toFixed(2)}</ThemedText>
          <ThemedText style={styles.bottomSub}>View price details</ThemedText>
        </View>
        <Pressable style={styles.payBtn} onPress={handlePayment}>
          <ThemedText style={styles.payBtnText}>Proceed to Pay</ThemedText>
        </Pressable>
      </View>

      {/* Address Selection Modal */}
      <AddressSelectionModal
        visible={showAddressModal}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onClose={() => setShowAddressModal(false)}
        onSelectAddress={setSelectedAddressId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  changeText: {
    fontSize: 13,
    color: '#EE0000',
    fontWeight: 'bold',
  },
  addressBox: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 5,
  },
  addressPhone: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222',
  },
  addAddressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#EE0000',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#fff5f5',
  },
  addAddressText: {
    color: '#EE0000',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  couponRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 44,
    backgroundColor: '#f9f9f9',
    marginRight: 10,
    fontWeight: 'bold',
  },
  applyBtn: {
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  removeCouponBtn: {
    backgroundColor: '#EE0000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  removeCouponText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  availableCouponsContainer: {
    marginTop: 15,
  },
  availableCouponsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  couponsScroll: {
    paddingBottom: 5,
  },
  couponCard: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    minWidth: 160,
    justifyContent: 'center',
  },
  couponCardDisabled: {
    backgroundColor: '#f1f1f1',
    borderColor: '#e5e5e5',
    opacity: 0.7,
  },
  couponTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  couponTag: {
    backgroundColor: '#EE0000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  couponTagDisabled: {
    backgroundColor: '#aaa',
  },
  couponTagText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 10,
  },
  couponCodeText: {
    fontWeight: '900',
    fontSize: 12,
    color: '#222',
  },
  couponCodeTextDisabled: {
    color: '#888',
  },
  couponDescText: {
    fontSize: 10,
    color: '#666',
  },
  notApplicableText: {
    fontSize: 10,
    color: '#EE0000',
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#555',
  },
  summaryValue: {
    fontSize: 13,
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
  payBtn: {
    backgroundColor: '#EE0000',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  payBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
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
  shopBtn: {
    backgroundColor: '#EE0000',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  itemsList: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
