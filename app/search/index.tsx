import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ProductCard, { Product } from '@/components/product/productCard';
import SortModal from '@/components/category/SortModal';
import FilterModal from '@/components/category/FilterModal';
import { ENDPOINTS } from '@/config/api';

export default function SearchPage() {
  const { q } = useLocalSearchParams<{ q: string }>();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modals
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filters State
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState<{
    brandIds: string[];
    minPrice?: number;
    maxPrice?: number;
    subcategoryId?: string;
    attributes: Record<string, string>;
  }>({
    brandIds: [],
    attributes: {},
  });

  useEffect(() => {
    fetchProducts(1, true);
  }, [q, sortBy, filters]);

  const fetchProducts = async (pageNum: number, reset = false) => {
    if (!q) return;
    
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.append('search', q);
      params.append('page', String(pageNum));
      params.append('limit', '10');
      params.append('sortBy', sortBy);
      params.append('isActive', 'true');
      params.append('isPublished', 'true');

      if (filters.brandIds.length > 0) {
        params.append('brandIds', filters.brandIds.join(','));
      }
      if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
      if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));
      if (filters.subcategoryId) params.append('categoryId', filters.subcategoryId);

      Object.entries(filters.attributes).forEach(([key, value]) => {
        params.append(`attributes[${key}]`, value);
      });

      const res = await fetch(`${ENDPOINTS.PRODUCTS}?${params.toString()}`);
      const json = await res.json();
      
      const newProducts = json.data?.products || [];
      const totalDocs = json.data?.total || 0;
      const total = Math.max(Math.ceil(totalDocs / 10), 1);

      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }
      
      setTotalPages(total);
      if (!reset) setPage(pageNum);

    } catch (err) {
      console.error('Error fetching search products:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleEndReached = () => {
    if (!loading && !loadingMore && page < totalPages) {
      fetchProducts(page + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color="#222" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            Search Results
          </ThemedText>
          <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
            "{q}"
          </ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Sort & Filter Bar */}
      <View style={styles.actionBar}>
        <Pressable style={styles.actionBtn} onPress={() => setSortModalVisible(true)}>
          <IconSymbol name="arrow.up.arrow.down" size={16} color="#555" />
          <ThemedText style={styles.actionText}>Sort</ThemedText>
        </Pressable>
        <View style={styles.actionDivider} />
        <Pressable style={styles.actionBtn} onPress={() => setFilterModalVisible(true)}>
          <IconSymbol name="line.3.horizontal.decrease" size={16} color="#555" />
          <ThemedText style={styles.actionText}>Filter</ThemedText>
        </Pressable>
      </View>

      {/* Product Grid */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#EE0000" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <ThemedText style={styles.emptyText}>No products found for "{q}".</ThemedText>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) => `${item._id}-${index}`}
          numColumns={2}
          renderItem={({ item }) => <ProductCard product={item} />}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => 
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#EE0000" />
              </View>
            ) : null
          }
        />
      )}

      <SortModal 
        visible={sortModalVisible} 
        onClose={() => setSortModalVisible(false)}
        currentSort={sortBy}
        onSortChange={setSortBy}
      />

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        isSearchMode={true}
        initialFilters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    display: 'flex',
    flexDirection:'row',
    gap:2,
    justifyContent:"center",
    alignItems:"center",
  },
  headerTitle: {
    fontSize: 14,
    color: '#666',
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    height: 48,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    textTransform: 'uppercase',
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  listContainer: {
    padding: 15,
  },
  row: {
    justifyContent: 'space-between',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
