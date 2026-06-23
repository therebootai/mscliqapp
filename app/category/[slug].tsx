import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Pressable, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ProductCard, { Product } from '@/components/product/productCard';
import SortModal from '@/components/category/SortModal';
import FilterModal from '@/components/category/FilterModal';
import { ENDPOINTS } from '@/config/api';

export default function CategoryPage() {
  const { slug, name } = useLocalSearchParams<{ slug: string; name?: string }>();
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
  const [filters, setFilters] = useState({
    brandIds: [] as string[],
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    subcategoryId: undefined as string | undefined,
    attributes: {} as Record<string, string>,
  });

  useEffect(() => {
    fetchProducts(1, true);
  }, [slug, sortBy, filters]);

  const fetchProducts = async (pageNum: number, reset = false) => {
    if (!slug) return;
    
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.append('page', String(pageNum));
      params.append('limit', '10');
      params.append('sortBy', sortBy);

      if (filters.brandIds.length > 0) {
        params.append('brandId', filters.brandIds.join(','));
      }
      if (filters.minPrice !== undefined) {
        params.append('minPrice', String(filters.minPrice));
      }
      if (filters.maxPrice !== undefined) {
        params.append('maxPrice', String(filters.maxPrice));
      }
      if (filters.subcategoryId) {
        params.append('subcategoryId', filters.subcategoryId);
      }
      Object.entries(filters.attributes).forEach(([key, value]) => {
        if (value) params.append(`attr_${key}`, value);
      });

      const res = await fetch(`${ENDPOINTS.PRODUCTS_BY_CATEGORY}/${slug}?${params.toString()}`);
      const json = await res.json();
      
      const newProducts = json.data?.products || [];
      const total = json.data?.totalPages || 1;

      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }
      
      setTotalPages(total);
      if (!reset) setPage(pageNum);

    } catch (err) {
      console.error('Error fetching category products:', err);
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

  const activeFiltersCount = 
    filters.brandIds.length + 
    (filters.minPrice || filters.maxPrice ? 1 : 0) + 
    (filters.subcategoryId ? 1 : 0) + 
    Object.keys(filters.attributes).length;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color="#222" />
        </Pressable>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {name || slug?.replace(/-/g, ' ').toUpperCase() || 'Category'}
        </ThemedText>
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
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <ThemedText style={styles.filterBadgeText}>{activeFiltersCount}</ThemedText>
            </View>
          )}
        </Pressable>
      </View>

      {/* Product Grid */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#EE0000" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <ThemedText style={styles.emptyText}>No products found.</ThemedText>
          <Pressable 
            style={styles.clearBtn}
            onPress={() => setFilters({
              brandIds: [], minPrice: undefined, maxPrice: undefined, subcategoryId: undefined, attributes: {}
            })}
          >
            <ThemedText style={styles.clearBtnText}>Clear Filters</ThemedText>
          </Pressable>
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
        categorySlug={slug || ''}
        initialFilters={filters}
        onApply={setFilters}
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
    height: 56,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    textTransform: 'capitalize',
    flex: 1,
    textAlign: 'center',
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
    marginVertical: 12,
  },
  filterBadge: {
    backgroundColor: '#EE0000',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#EE0000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#EE0000',
    fontWeight: 'bold',
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
