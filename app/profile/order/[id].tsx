import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/config/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

interface OrderDetail {
  _id: string;
  orderId: string;
  createdAt: string;
  orderStatus: string;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  couponDiscount: number;
  itemTax: number;
  shippingAddress: any;
  items: any[];
  statusHistory: any[];
  shipments?: any[];
  paymentMethod?: string;
  paymentStatus?: string;
  paidAmount?: number;
  remainingPaidAmount?: number;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Completed',
  cancelled: 'Cancelled',
  returned: 'Returned',
  payment_failed: 'Payment Failed',
  payment_expired: 'Payment Expired',
};

const getItemPolicyInfo = (item: any, orderCreatedAt: string, statusHistory: any[]) => {
  const productObj = typeof item.productId === 'object' ? item.productId : null;
  const returnPolicyType = (productObj?.returnPolicyType || item.snapshot?.returnPolicyType || item.returnPolicyType || 'none').toLowerCase();
  const returnWindowDays = Number(productObj?.returnWindowDays || item.snapshot?.returnWindowDays || item.returnWindowDays || 0);

  const deliveredEntry = statusHistory?.find(h => h.status === 'delivered');
  const deliveredDate = deliveredEntry ? new Date(deliveredEntry.createdAt || deliveredEntry.date || deliveredEntry.timestamp) : new Date(orderCreatedAt);
  
  const diffTime = Math.max(0, Date.now() - deliveredDate.getTime());
  const daysSinceDelivery = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysSinceDelivery > returnWindowDays;
  
  const expiryDate = new Date(deliveredDate.getTime() + returnWindowDays * 24 * 60 * 60 * 1000);

  const canReturn = !isExpired && (returnPolicyType === 'return' || returnPolicyType === 'both');
  const canReplace = !isExpired && (returnPolicyType === 'replacement' || returnPolicyType === 'replace' || returnPolicyType === 'both');
  const canRequest = (canReturn || canReplace) && !isExpired && returnPolicyType !== 'none';

  return {
    returnPolicyType,
    returnWindowDays,
    daysSinceDelivery,
    isExpired,
    expiryDate,
    canReturn,
    canReplace,
    canRequest
  };
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelItemModal, setShowCancelItemModal] = useState(false);
  const [selectedCancelItem, setSelectedCancelItem] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [invoicing, setInvoicing] = useState(false);

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [returning, setReturning] = useState(false);
  const [returnType, setReturnType] = useState<'return' | 'replace'>('return');
  const [returnReason, setReturnReason] = useState('');
  const [returnComment, setReturnComment] = useState('');

  const selectedItemPolicy = selectedItem && order
    ? getItemPolicyInfo(selectedItem, order.createdAt, order.statusHistory)
    : null;

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    try {
      const { data } = await axios.get(`${BASE_URL}/orders/me/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && data.data) {
        setOrder(data.data.order || data.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation');
      return;
    }
    setCancelling(true);
    const token = await SecureStore.getItemAsync('userToken');
    try {
      await axios.patch(`${BASE_URL}/orders/me/${id}/cancel`, 
        { reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Order cancelled successfully');
      setShowCancelModal(false);
      fetchOrderDetails();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelItem = async () => {
    if (!selectedCancelItem) return;
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation');
      return;
    }
    setCancelling(true);
    const token = await SecureStore.getItemAsync('userToken');
    try {
      await axios.patch(`${BASE_URL}/orders/me/${id}/cancel-item/${selectedCancelItem._id}`, 
        { reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Item cancelled successfully');
      setShowCancelItemModal(false);
      setSelectedCancelItem(null);
      setCancelReason('');
      fetchOrderDetails();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel item');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setInvoicing(true);
    const token = await SecureStore.getItemAsync('userToken');
    try {
      const { data } = await axios.get(`${BASE_URL}/shiprocket/orders/${id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && data.data?.invoiceUrl) {
        Linking.openURL(data.data.invoiceUrl);
      } else {
        Alert.alert('Info', 'Invoice not available yet.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch invoice. It may still be generating.');
    } finally {
      setInvoicing(false);
    }
  };

  const handleReturnSubmit = async () => {
    if (!returnReason) {
      Alert.alert('Error', 'Please select a reason.');
      return;
    }
    setReturning(true);
    const token = await SecureStore.getItemAsync('userToken');
    try {
      await axios.post(`${BASE_URL}/returns`, {
        orderId: order!._id,
        itemId: selectedItem._id,
        type: returnType,
        reason: returnReason,
        customerComment: returnComment,
        pickupAddress: order!.shippingAddress
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      Alert.alert('Success', `${returnType === 'return' ? 'Return' : 'Replacement'} request submitted!`);
      setShowReturnModal(false);
      fetchOrderDetails();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit request');
    } finally {
      setReturning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered': return '#10b981';
      case 'processing': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      case 'shipped': return '#6366f1';
      default: return '#f59e0b';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!order) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Order Details', 
          headerShown: true,
          headerRight: () => (
            order.orderStatus === 'delivered' ? (
              <TouchableOpacity onPress={handleDownloadInvoice} disabled={invoicing}>
                {invoicing ? <ActivityIndicator size="small" color="#111827" /> : <IconSymbol name="list.bullet.rectangle" size={24} color="#111827" />}
              </TouchableOpacity>
            ) : null
          )
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HEADER SECTION */}
        <View style={styles.headerCard}>
          <View style={styles.headerInfo}>
             <Text style={styles.orderIdHeader}>Order #{order.orderId}</Text>
             <Text style={styles.dateText}>Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.orderStatus)}15`, borderColor: `${getStatusColor(order.orderStatus)}30` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.orderStatus) }]}>
              {ORDER_STATUS_LABELS[order.orderStatus] || (order.orderStatus || '').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* CANCEL BUTTON */}
        {(order.orderStatus === 'processing' || order.orderStatus === 'pending_payment') && (!order.shipments || order.shipments.length === 0) && (
          <TouchableOpacity style={styles.cancelOrderBtn} onPress={() => setShowCancelModal(true)}>
             <IconSymbol name="xmark.circle.fill" size={16} color="#ef4444" />
             <Text style={styles.cancelOrderText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {/* TRACKING SECTION */}
        {order.shipments && order.shipments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <IconSymbol name="paperplane.fill" size={16} color="#6b7280" />
               <Text style={styles.sectionTitle}>SHIPPING & TRACKING</Text>
            </View>
            <View style={styles.whiteCard}>
              {order.shipments.map((s: any, idx: number) => (
                <View key={idx} style={[styles.shipmentBlock, idx > 0 && { borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}>
                  <View style={styles.shipmentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.metaLabel}>Tracking Number</Text>
                      <Text style={styles.metaValue}>{s.trackingNumber || 'Assigning Soon...'}</Text>
                      {s.provider && <Text style={styles.metaSubValue}>{s.provider}</Text>}
                    </View>
                    {s.trackUrl && (
                      <TouchableOpacity 
                        style={styles.trackBtn} 
                        onPress={() => Linking.openURL(s.trackUrl)}
                      >
                        <Text style={styles.trackBtnText}>Track Online</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* REAL-TIME TRACKING TIMELINE */}
                  {s.currentStatus && (
                    <View style={styles.trackingTimelineContainer}>
                      <View style={styles.statusBanner}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.currentStatusLabel}>Current Status</Text>
                          <Text style={styles.currentStatusValue}>{s.currentStatus}</Text>
                        </View>
                        {s.estimatedDelivery && (
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.currentStatusLabel}>Est. Delivery</Text>
                            <Text style={styles.currentStatusValue}>{s.estimatedDelivery}</Text>
                          </View>
                        )}
                      </View>

                      {s.timeline && s.timeline.length > 0 && (
                        <View style={styles.timelineList}>
                          {s.timeline.map((step: any, stepIdx: number) => (
                            <View key={stepIdx} style={styles.timelineItem}>
                              <View style={styles.timelineLeft}>
                                <View style={[
                                  styles.timelineDot, 
                                  stepIdx === 0 ? styles.timelineDotActive : styles.timelineDotInactive
                                ]} />
                                {stepIdx < s.timeline.length - 1 && <View style={styles.timelineLine} />}
                              </View>
                              <View style={styles.timelineRight}>
                                <Text style={[
                                  styles.timelineActivity,
                                  stepIdx === 0 ? styles.timelineActivityActive : styles.timelineActivityInactive
                                ]}>{step.activity}</Text>
                                <Text style={styles.timelineMeta}>
                                  {step.location && step.location !== 'Unknown' ? `${step.location} | ` : ''}
                                  {step.date} {step.time}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ITEMS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
             <IconSymbol name="cart.fill" size={16} color="#6b7280" />
             <Text style={styles.sectionTitle}>ORDER ITEMS</Text>
          </View>
          <View style={styles.whiteCard}>
            {order.items.map((item, index) => (
              <View key={index} style={[styles.itemRow, index === 0 && { borderTopWidth: 0 }]}>
                <Image 
                  source={{ uri: item.snapshot?.coverImage || item.coverImage }} 
                  style={styles.itemImage} 
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{item.snapshot?.title || item.title}</Text>
                  <View style={styles.itemMetaRow}>
                    <Text style={styles.itemMeta}>Qty: {item.quantity}</Text>
                    {Object.entries(item.attributes || item.snapshot?.attributes || {})
                      .filter(([k]) => !['discounttype', 'type-single', 'discountType', 'type'].includes(k.toLowerCase()))
                      .map(([k, v]: any) => (
                      <Text key={k} style={styles.itemAttrBadge}>{k}: {v}</Text>
                    ))}
                  </View>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>₹{item.price.toLocaleString()}</Text>
                    
                    {order.orderStatus === 'delivered' && item.itemStatus === 'active' && (() => {
                      const policy = getItemPolicyInfo(item, order.createdAt, order.statusHistory);
                      return (
                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                          <TouchableOpacity 
                            onPress={() => {
                              const pName = encodeURIComponent(item.snapshot?.title || item.title);
                              const pId = typeof item.productId === 'object' && item.productId ? item.productId._id : item.productId;
                              router.push(`/profile/review-form?productId=${pId}&productName=${pName}`);
                            }}
                          >
                            <Text style={[styles.returnLink, { color: '#f59e0b' }]}>Write Review</Text>
                          </TouchableOpacity>

                          {policy.canRequest ? (
                            <TouchableOpacity 
                              onPress={() => {
                                setSelectedItem(item);
                                if (policy.canReturn) {
                                  setReturnType('return');
                                } else if (policy.canReplace) {
                                  setReturnType('replace');
                                }
                                setShowReturnModal(true);
                              }}
                            >
                              <Text style={styles.returnLink}>Return/Replace</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.policyClosedText}>
                              {policy.returnPolicyType === 'none' 
                                ? 'Non-returnable' 
                                : 'Return expired'}
                            </Text>
                          )}
                        </View>
                      );
                    })()}
                    {item.itemStatus !== 'active' && (
                      <View style={{ gap: 4 }}>
                        <View style={styles.itemStatusBadge}>
                          <Text style={styles.itemStatusText}>{item.itemStatus.replace(/_/g, ' ').toUpperCase()}</Text>
                        </View>
                        {(item.itemStatus === 'cancelled' || item.itemStatus === 'returned' || order.paymentStatus === 'refunded') && (item.refundStatus === 'processed' || order.paymentStatus === 'refunded') && (
                          <View style={styles.refundCompleteBadge}>
                            <IconSymbol name="checkmark.circle.fill" size={10} color="#fff" />
                            <Text style={styles.refundCompleteText}>REFUND COMPLETE</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* CANCEL ITEM ACTION */}
                    {(order.orderStatus === 'processing' || order.orderStatus === 'pending_payment') && item.itemStatus === 'active' && (!order.shipments || order.shipments.length === 0) && (
                      <TouchableOpacity 
                        style={styles.itemCancelBtn}
                        onPress={() => {
                          setSelectedCancelItem(item);
                          setShowCancelItemModal(true);
                        }}
                      >
                        <IconSymbol name="xmark.circle" size={12} color="#ef4444" />
                        <Text style={styles.itemCancelBtnText}>Cancel Item</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ADDRESS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
             <IconSymbol name="mappin.and.ellipse" size={16} color="#6b7280" />
             <Text style={styles.sectionTitle}>DELIVERY ADDRESS</Text>
          </View>
          <View style={styles.whiteCard}>
            <Text style={styles.addressName}>{order.shippingAddress.fullName}</Text>
            <Text style={styles.addressText}>{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}</Text>
            <Text style={styles.addressText}>{`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`}</Text>
            <Text style={styles.addressPhone}>Phone: {order.shippingAddress.phone}</Text>
          </View>
        </View>

        {/* SUMMARY SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
             <IconSymbol name="list.bullet.rectangle" size={16} color="#6b7280" />
             <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
          </View>
          <View style={styles.whiteCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{order.subtotal.toLocaleString()}</Text>
            </View>
            {order.couponDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: '#10b981' }]}>- ₹{order.couponDiscount.toLocaleString()}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (GST)</Text>
              <Text style={styles.summaryValue}>₹{order.itemTax.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={[styles.summaryValue, { color: '#10b981' }]}>{order.shippingCost > 0 ? `₹${order.shippingCost}` : 'FREE'}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>₹{order.totalAmount.toLocaleString()}</Text>
            </View>
            
            <View style={styles.paymentInfo}>
              <Text style={styles.metaLabel}>Payment Method</Text>
              <Text style={styles.metaValue}>{order.paymentMethod || 'Online Payment'}</Text>
              <View style={styles.paymentStatusRow}>
                <Text style={styles.metaLabel}>Status: </Text>
                <Text style={[styles.paymentStatusText, { color: order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b' }]}>
                  {(order.paymentStatus || 'Success').toUpperCase()}
                </Text>
              </View>
              {order.paymentStatus === 'refunded' && (
                <View style={[styles.refundCompleteBadge, { marginTop: 8, alignSelf: 'flex-start' }]}>
                  <IconSymbol name="checkmark.circle.fill" size={12} color="#fff" />
                  <Text style={[styles.refundCompleteText, { fontSize: 10 }]}>REFUND PROCESSED</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* CANCEL MODAL */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Order</Text>
            <Text style={styles.modalDesc}>Are you sure you want to cancel this order? This action cannot be undone.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for cancellation (required)"
              placeholderTextColor="#374151"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowCancelModal(false)}>
                <Text style={styles.modalBtnCancelText}>Keep Order</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnConfirm} 
                onPress={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnConfirmText}>Cancel Order</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </Modal>

        {/* CANCEL ITEM MODAL */}
        <Modal visible={showCancelItemModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Item</Text>
            {selectedCancelItem && (
              <View style={[styles.returnItemPreview, { width: '100%', marginBottom: 15 }]}>
                <Image 
                  source={{ uri: selectedCancelItem.snapshot?.coverImage || selectedCancelItem.coverImage }} 
                  style={styles.returnItemImage} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.returnItemTitle} numberOfLines={1}>{selectedCancelItem.snapshot?.title || selectedCancelItem.title}</Text>
                  <Text style={styles.returnItemMeta}>Qty: {selectedCancelItem.quantity}</Text>
                </View>
              </View>
            )}
            <Text style={styles.modalDesc}>Are you sure you want to cancel this product? This action cannot be undone.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for cancellation (required)"
              placeholderTextColor="#374151"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setShowCancelItemModal(false); setSelectedCancelItem(null); }}>
                <Text style={styles.modalBtnCancelText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnConfirm} 
                onPress={handleCancelItem}
                disabled={cancelling}
              >
                {cancelling ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnConfirmText}>Cancel Item</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </Modal>

        {/* RETURN MODAL */}
      <Modal visible={showReturnModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.returnModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Return/Replace</Text>
              <TouchableOpacity onPress={() => setShowReturnModal(false)}>
                <IconSymbol name="xmark" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <View style={styles.returnItemPreview}>
                  <Image source={{ uri: selectedItem.coverImage || selectedItem.snapshot?.coverImage }} style={styles.returnItemImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.returnItemTitle} numberOfLines={1}>{selectedItem.title || selectedItem.snapshot?.title}</Text>
                    <Text style={styles.returnItemMeta}>Qty: {selectedItem.quantity}</Text>
                  </View>
                </View>
              )}

              {selectedItemPolicy && (
                <>
                  <Text style={styles.inputLabel}>What do you want?</Text>
                  <View style={styles.typeSelector}>
                    {selectedItemPolicy.canReturn && (
                      <TouchableOpacity 
                        style={[styles.typeBtn, returnType === 'return' && styles.typeBtnActive]} 
                        onPress={() => setReturnType('return')}
                      >
                        <Text style={[styles.typeBtnText, returnType === 'return' && styles.typeBtnTextActive]}>Return & Refund</Text>
                      </TouchableOpacity>
                    )}
                    {selectedItemPolicy.canReplace && (
                      <TouchableOpacity 
                        style={[styles.typeBtn, returnType === 'replace' && styles.typeBtnActive]} 
                        onPress={() => setReturnType('replace')}
                      >
                        <Text style={[styles.typeBtnText, returnType === 'replace' && styles.typeBtnTextActive]}>Replacement</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              <Text style={styles.inputLabel}>Reason for Request</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Damaged product, Wrong item, etc."
                placeholderTextColor="#374151"
                value={returnReason}
                onChangeText={setReturnReason}
              />

              <Text style={styles.inputLabel}>Additional Details (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="Tell us more about the issue..."
                placeholderTextColor="#374151"
                value={returnComment}
                onChangeText={setReturnComment}
                multiline
              />

              <TouchableOpacity 
                style={[styles.submitReturnBtn, (!returnReason || returning) && { opacity: 0.5 }]} 
                onPress={handleReturnSubmit}
                disabled={!returnReason || returning}
              >
                {returning ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitReturnBtnText}>Submit Request</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerInfo: {
    flex: 1,
  },
  orderIdHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    fontFamily: Fonts.rounded,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cancelOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginBottom: 20,
  },
  cancelOrderText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1.2,
  },
  whiteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  shipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  trackBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    lineHeight: 18,
  },
  itemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemMeta: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  itemAttrBadge: {
    fontSize: 10,
    color: '#b45309',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#b45309',
  },
  returnLink: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b45309',
    textDecorationLine: 'underline',
  },
  policyClosedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  itemStatusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemStatusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  },
  addressName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  addressPhone: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#b45309',
  },
  paymentInfo: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 1,
  },
  metaSubValue: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: '#64748b',
    fontWeight: 'bold',
  },
  modalBtnConfirm: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  returnModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    marginTop: 'auto',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  returnItemPreview: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  returnItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  returnItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  returnItemMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    alignItems: 'center',
  },
  typeBtnActive: {
    borderColor: '#b45309',
    backgroundColor: '#fffbeb',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  typeBtnTextActive: {
    color: '#b45309',
  },
  submitReturnBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitReturnBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  itemCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginTop: 4,
  },
  itemCancelBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: 'bold',
  },
  refundCompleteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  refundCompleteText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },
  // TRACKING TIMELINE STYLES
  shipmentBlock: {
    paddingBottom: 16,
  },
  trackingTimelineContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statusBanner: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  currentStatusLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentStatusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 2,
  },
  timelineList: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
    minHeight: 50,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  timelineDotActive: {
    backgroundColor: '#f59e0b',
    transform: [{ scale: 1.2 }],
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineDotInactive: {
    backgroundColor: '#cbd5e1',
  },
  timelineLine: {
    position: 'absolute',
    top: 12,
    bottom: 0,
    width: 2,
    backgroundColor: '#f1f5f9',
    left: 9,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineActivity: {
    fontSize: 13,
    lineHeight: 18,
  },
  timelineActivityActive: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  timelineActivityInactive: {
    fontWeight: '600',
    color: '#64748b',
  },
  timelineMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
});
