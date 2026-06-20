import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import ProductView from '@/components/product/ProductView';
import { ENDPOINTS } from '@/config/api';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Pressable } from 'react-native';
import { useCartStore } from '@/store/useCartStore';
import { useToastStore } from '@/store/useToastStore';

export default function ProductPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { showToast } = useToastStore();
  
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${ENDPOINTS.VARIANT_BY_SLUG}/${slug}`);
        const data = await res.json();
        
        if (data.success || data.data) {
          setProductData(data.data);
        } else {
          setError(data.message || 'Product not found');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <ActivityIndicator size="large" color="#EE0000" />
      </View>
    );
  }

  if (error || !productData) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Error' }} />
        <ThemedText style={styles.errorText}>{error || 'Product not found'}</ThemedText>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ThemedText style={styles.backBtnText}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  const handleAddToCart = () => {
    if (!productData?.currentVariant || !productData?.currentVariant?.productId) return;
    
    const variant = productData.currentVariant;
    const product = variant.productId;
    
    addItem({
      variantId: product._id,
      quantity: 1,
      title: variant.title,
      image: variant.coverImage?.url,
      price: variant.price,
      mrp: variant.mrp,
      stock: variant.stocks,
      effectiveTax: productData.effectiveTax,
    });
    showToast('Added to Cart', 'success');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: productData?.currentVariant?.title || 'Product Details',
        }} 
      />
      <ProductView 
        data={productData} 
        onAddToCart={handleAddToCart}
        onBuyNow={() => showToast('Proceeding to checkout', 'info')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EE0000',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
