import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '@/config/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ReviewFormScreen() {
  const { productId, productName, reviewId, existingRating, existingComment, existingImages } = useLocalSearchParams();
  
  const [rating, setRating] = useState(Number(existingRating) || 5);
  const [comment, setComment] = useState((existingComment as string) || '');
  
  // Try to parse existing images if provided (usually a JSON string array of objects like {url, publicId})
  const initialImages = (() => {
    try {
      if (existingImages) {
        const parsed = JSON.parse(existingImages as string);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.log('Could not parse existing images', e);
    }
    return [];
  })();

  // We store both local URIs (strings) and server objects {url, publicId} in the same array for display
  const [images, setImages] = useState<any[]>(initialImages);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Limit Reached', 'You can only upload up to 3 photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment.');
      return;
    }

    setSubmitting(true);
    const token = await SecureStore.getItemAsync('userToken');

    try {
      let payload: any;
      let headers: any = { Authorization: `Bearer ${token}` };

      // Check if we have any NEW local images (strings)
      const hasNewLocalImages = images.some(img => typeof img === 'string');

      if (hasNewLocalImages) {
        payload = new FormData();
        payload.append('rating', rating.toString());
        payload.append('comment', comment);
        
        // Append existing server images back as JSON if we are editing
        const oldImagesToKeep = images.filter(img => typeof img === 'object');
        if (oldImagesToKeep.length > 0) {
           oldImagesToKeep.forEach((img, i) => {
               payload.append(`images[${i}][url]`, img.url);
               payload.append(`images[${i}][publicId]`, img.publicId);
           });
        }
        
        // Append new files
        images.forEach((img, index) => {
          if (typeof img === 'string') {
            const filename = img.split('/').pop() || `photo${index}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;
            
            payload.append('images', {
              uri: Platform.OS === 'ios' ? img.replace('file://', '') : img,
              name: filename,
              type,
            } as any);
          }
        });
        
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        // Only text/rating changes or deleting photos without adding new ones
        payload = { 
          rating, 
          comment, 
          images: images.filter(img => typeof img === 'object') 
        };
      }

      if (reviewId) {
        await axios.patch(
          `${BASE_URL}/reviews/${reviewId}`,
          payload,
          { headers }
        );
        Alert.alert('Success', 'Review updated successfully.');
      } else {
        await axios.post(
          `${BASE_URL}/reviews/product/${productId}`,
          payload,
          { headers }
        );
        Alert.alert('Success', 'Review submitted successfully.');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <Stack.Screen 
        options={{ 
          title: reviewId ? 'Edit Review' : 'Write Review', 
          headerShown: true 
        }} 
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.productHeader}>
            <Text style={styles.label}>Product</Text>
            <Text style={styles.productName}>{productName}</Text>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.label}>Rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <IconSymbol
                    name="star.fill"
                    size={40}
                    color={star <= rating ? '#f59e0b' : '#e5e7eb'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingText}>
              {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
            </Text>
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.label}>Review Comment</Text>
            <TextInput
              style={styles.textArea}
              value={comment}
              onChangeText={setComment}
              placeholder="Tell us what you think about the product..."
              placeholderTextColor="#374151"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.label}>Photos (Max 3)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {images.map((img, index) => {
                const uri = typeof img === 'string' ? img : img.url;
                return (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri }} style={styles.photoPreview} />
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removeImage(index)}>
                      <IconSymbol name="xmark.circle.fill" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
              
              {images.length < 3 && (
                <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                  <IconSymbol name="camera.fill" size={24} color="#9ca3af" />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {reviewId ? 'Update Review' : 'Submit Review'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    gap: 28,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  productHeader: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  ratingSection: {
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  commentSection: {
    gap: 8,
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    fontSize: 14,
    color: '#111827',
    minHeight: 120,
  },
  photoSection: {
    gap: 8,
  },
  photoScroll: {
    flexDirection: 'row',
    marginTop: 8,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  submitButton: {
    backgroundColor: '#111827',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
