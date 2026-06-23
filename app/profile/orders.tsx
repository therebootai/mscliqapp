import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { router, Stack } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/config/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

interface Order {
  _id: string;
  orderId: string;
  createdAt: string;
  orderStatus: string;
  totalAmount: number;
  items: any[];
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    try {
      const { data } = await axios.get(`${BASE_URL}/orders/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && data.data) {
        const orderList = Array.isArray(data.data) ? data.data : (data.data.orders || []);
        setOrders(orderList);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase();
    const orderIdMatch = (order.orderId || '').toLowerCase().includes(q);
    const itemMatch = (order.items || []).some(item => 
      (item.snapshot?.title || item.title || '').toLowerCase().includes(q)
    );
    return orderIdMatch || itemMatch;
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'My Orders', headerShown: true }} />
      
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Order ID or Product Name"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#374151"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
             <IconSymbol name="xmark.circle.fill" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const mainItemName = item.items[0]?.snapshot?.title || item.items[0]?.title || 'Order Item';
          const additionalCount = item.items.length > 1 ? ` +${item.items.length - 1} more` : '';
          
          return (
            <TouchableOpacity 
              style={styles.orderCard} 
              onPress={() => router.push(`/profile/order/${item._id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {mainItemName}{additionalCount}
                  </Text>
                  <Text style={styles.orderDate}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.orderStatus)}15` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>
                    {item.orderStatus.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.itemsPreview}>
                  {item.items.slice(0, 3).map((orderItem, idx) => (
                    <Image 
                      key={idx} 
                      source={{ uri: orderItem.snapshot?.coverImage || orderItem.coverImage }} 
                      style={styles.itemThumb} 
                    />
                  ))}
                  {item.items.length > 3 && (
                    <View style={styles.moreBadge}>
                      <Text style={styles.moreText}>+{item.items.length - 3}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalPrice}>₹{item.totalAmount.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.orderIdText}>ID: {item.orderId}</Text>
                <View style={styles.viewDetailsContainer}>
                  <Text style={styles.viewDetails}>View Details</Text>
                  <IconSymbol name="chevron.right" size={16} color="#3b82f6" />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="list.bullet.rectangle" size={60} color="#e5e7eb" />
            <Text style={styles.emptyText}>No orders found.</Text>
          </View>
        }
      />
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
    paddingTop: 8,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },
  orderDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f9fafb',
  },
  itemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginRight: -15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
  moreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  orderIdText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetails: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
});
