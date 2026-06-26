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
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/config/api';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  isActive: boolean;
  createdAt: string;
  productId: {
    _id: string;
    title: string;
    coverImage: { url: string };
  };
  images?: { url: string; publicId: string }[];
}

export default function MyReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    try {
      const { data } = await axios.get(`${BASE_URL}/reviews/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && data.data) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const token = await SecureStore.getItemAsync('userToken');
          try {
            await axios.delete(`${BASE_URL}/reviews/${reviewId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchReviews();
          } catch (error) {
            console.error('Error deleting review:', error);
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
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: 'My Reviews', headerShown: true }} />
      
      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.productInfo}>
              <Image 
                source={{ uri: item.productId?.coverImage?.url }} 
                style={styles.productThumb} 
              />
              <View style={styles.titleArea}>
                <Text style={styles.productTitle} numberOfLines={1}>{item.productId?.title}</Text>
                <View style={styles.statusRow}>
                   <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10b981' : '#f59e0b' }]} />
                   <Text style={styles.statusText}>{item.isActive ? 'Published' : 'Under Review'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <IconSymbol 
                  key={star} 
                  name="star.fill" 
                  size={14} 
                  color={star <= item.rating ? '#f59e0b' : '#e5e7eb'} 
                />
              ))}
              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <Text style={styles.commentText}>&quot;{item.comment}&quot;</Text>

            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => {
                  const pName = encodeURIComponent(item.productId?.title || '');
                  const comment = encodeURIComponent(item.comment || '');
                  const imgs = encodeURIComponent(JSON.stringify(item.images || []));
                  router.push(`/profile/review-form?reviewId=${item._id}&productName=${pName}&existingRating=${item.rating}&existingComment=${comment}&existingImages=${imgs}`);
                }}
              >
                <Text style={styles.editBtnText}>Edit Review</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteReview(item._id)}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="star.fill" size={60} color="#e5e7eb" />
            <Text style={styles.emptyText}>You haven&apos;t written any reviews yet.</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/profile/orders')}>
              <Text style={styles.shopBtnText}>Review Your Orders</Text>
            </TouchableOpacity>
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
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  titleArea: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 8,
    fontWeight: '500',
  },
  commentText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
    gap: 16,
  },
  actionBtn: {
    paddingVertical: 4,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444',
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
    textAlign: 'center',
  },
  shopBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
