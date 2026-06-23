import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Modal, Pressable, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ENDPOINTS } from '@/config/api';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  categorySlug?: string;
  isSearchMode?: boolean;
  initialFilters: {
    brandIds: string[];
    minPrice?: number;
    maxPrice?: number;
    subcategoryId?: string;
    attributes: Record<string, string>;
  };
  onApply: (filters: {
    brandIds: string[];
    minPrice?: number;
    maxPrice?: number;
    subcategoryId?: string;
    attributes: Record<string, string>;
  }) => void;
}

export default function FilterModal({ visible, onClose, categorySlug, isSearchMode, initialFilters, onApply }: FilterModalProps) {
  const [loading, setLoading] = useState(true);
  const [filterData, setFilterData] = useState<any>(null);
  
  // Local state for applying filters
  const [localBrands, setLocalBrands] = useState<string[]>(initialFilters.brandIds || []);
  const [localMinPrice, setLocalMinPrice] = useState<number | undefined>(initialFilters.minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState<number | undefined>(initialFilters.maxPrice);
  const [localSubcategory, setLocalSubcategory] = useState<string | undefined>(initialFilters.subcategoryId);
  const [localAttributes, setLocalAttributes] = useState<Record<string, string>>(initialFilters.attributes || {});

  const [activeTab, setActiveTab] = useState('Subcategories');

  useEffect(() => {
    if (visible && ((categorySlug && !filterData) || (isSearchMode && !filterData))) {
      fetchFilters();
    }
  }, [visible, categorySlug, isSearchMode]);

  useEffect(() => {
    if (visible) {
      setLocalBrands(initialFilters.brandIds || []);
      setLocalMinPrice(initialFilters.minPrice);
      setLocalMaxPrice(initialFilters.maxPrice);
      setLocalSubcategory(initialFilters.subcategoryId);
      setLocalAttributes(initialFilters.attributes || {});
    }
  }, [visible, initialFilters]);

  const fetchFilters = async () => {
    setLoading(true);
    try {
      const url = isSearchMode 
        ? ENDPOINTS.SEARCH_FILTERS 
        : `${ENDPOINTS.CATEGORY_FILTERS}/${categorySlug}/filters`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setFilterData(json.data);
        
        // Auto select first available tab if Subcategories is empty
        if (!json.data.subcategories || json.data.subcategories.length === 0) {
          if (json.data.filters?.brands?.length > 0) setActiveTab('Brands');
          else if (json.data.filters?.priceRange) setActiveTab('Price');
        }
      }
    } catch (err) {
      console.error('Error fetching filters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApply({
      brandIds: localBrands,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
      subcategoryId: localSubcategory,
      attributes: localAttributes,
    });
    onClose();
  };

  const handleClear = () => {
    setLocalBrands([]);
    setLocalMinPrice(undefined);
    setLocalMaxPrice(undefined);
    setLocalSubcategory(undefined);
    setLocalAttributes({});
  };

  const toggleBrand = (id: string) => {
    setLocalBrands(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const toggleAttribute = (key: string, value: string) => {
    setLocalAttributes(prev => {
      const next = { ...prev };
      if (next[key] === value) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  if (!visible) return null;

  const tabs = [];
  if (filterData?.subcategories?.length > 0) tabs.push('Subcategories');
  if (filterData?.filters?.brands?.length > 0) tabs.push('Brands');
  if (filterData?.filters?.priceRange?.max > 0) tabs.push('Price');
  filterData?.filters?.attributes?.forEach((attr: any) => tabs.push(attr.label));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Filters</ThemedText>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <IconSymbol name="xmark" size={24} color="#222" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#EE0000" />
          </View>
        ) : (
          <View style={styles.content}>
            {/* Left Sidebar (Tabs) */}
            <View style={styles.sidebar}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {tabs.map((tab) => (
                  <Pressable
                    key={tab}
                    style={[styles.tabItem, activeTab === tab && styles.tabItemSelected]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <ThemedText style={[styles.tabText, activeTab === tab && styles.tabTextSelected]}>
                      {tab}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Right Content */}
            <View style={styles.optionsArea}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.optionsContent}>
                
                {/* Subcategories */}
                {activeTab === 'Subcategories' && filterData?.subcategories?.map((sub: any) => (
                  <Pressable 
                    key={sub.id} 
                    style={styles.checkboxRow}
                    onPress={() => setLocalSubcategory(localSubcategory === sub.id ? undefined : sub.id)}
                  >
                    <View style={styles.checkbox}>
                      {localSubcategory === sub.id && <View style={styles.checkboxInner} />}
                    </View>
                    <ThemedText style={styles.checkboxLabel}>{sub.name}</ThemedText>
                  </Pressable>
                ))}

                {/* Brands */}
                {activeTab === 'Brands' && filterData?.filters?.brands?.map((brand: any) => (
                  <Pressable 
                    key={brand.id} 
                    style={styles.checkboxRow}
                    onPress={() => toggleBrand(brand.id)}
                  >
                    <View style={styles.checkbox}>
                      {localBrands.includes(brand.id) && <View style={styles.checkboxInner} />}
                    </View>
                    <ThemedText style={styles.checkboxLabel}>{brand.name}</ThemedText>
                  </Pressable>
                ))}

                {/* Price */}
                {activeTab === 'Price' && (
                  <View style={styles.priceContainer}>
                    <View style={styles.priceInputs}>
                      <View style={styles.inputWrapper}>
                        <ThemedText style={styles.inputLabel}>Min (₹)</ThemedText>
                        <TextInput
                          style={styles.priceInput}
                          keyboardType="numeric"
                          placeholder="0"
                          value={localMinPrice ? String(localMinPrice) : ''}
                          onChangeText={(v) => setLocalMinPrice(v ? parseInt(v, 10) : undefined)}
                        />
                      </View>
                      <ThemedText style={styles.priceDivider}>-</ThemedText>
                      <View style={styles.inputWrapper}>
                        <ThemedText style={styles.inputLabel}>Max (₹)</ThemedText>
                        <TextInput
                          style={styles.priceInput}
                          keyboardType="numeric"
                          placeholder={String(filterData.filters.priceRange.max)}
                          value={localMaxPrice ? String(localMaxPrice) : ''}
                          onChangeText={(v) => setLocalMaxPrice(v ? parseInt(v, 10) : undefined)}
                        />
                      </View>
                    </View>
                    
                    <View style={styles.pricePresets}>
                      {[
                        { label: 'Under 5K', min: undefined, max: 5000 },
                        { label: '5K-10K', min: 5000, max: 10000 },
                        { label: '10K-20K', min: 10000, max: 20000 },
                      ].map(preset => (
                        <Pressable 
                          key={preset.label} 
                          style={styles.presetBadge}
                          onPress={() => {
                            setLocalMinPrice(preset.min);
                            setLocalMaxPrice(preset.max);
                          }}
                        >
                          <ThemedText style={styles.presetText}>{preset.label}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Dynamic Attributes */}
                {filterData?.filters?.attributes?.find((a: any) => a.label === activeTab)?.values.map((val: any) => (
                  <Pressable 
                    key={val.value} 
                    style={styles.checkboxRow}
                    onPress={() => toggleAttribute(activeTab, val.value)}
                  >
                    <View style={styles.checkbox}>
                      {localAttributes[activeTab] === val.value && <View style={styles.checkboxInner} />}
                    </View>
                    <ThemedText style={styles.checkboxLabel}>{val.value}</ThemedText>
                  </Pressable>
                ))}

              </ScrollView>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.clearBtn} onPress={handleClear}>
            <ThemedText style={styles.clearBtnText}>CLEAR ALL</ThemedText>
          </Pressable>
          <Pressable style={styles.applyBtn} onPress={handleApply}>
            <ThemedText style={styles.applyBtnText}>APPLY</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  closeBtn: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: '35%',
    backgroundColor: '#F5F5F5',
    borderRightWidth: 1,
    borderRightColor: '#EEEEEE',
  },
  tabItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tabItemSelected: {
    backgroundColor: '#fff',
    borderLeftWidth: 3,
    borderLeftColor: '#EE0000',
  },
  tabText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  tabTextSelected: {
    color: '#EE0000',
    fontWeight: 'bold',
  },
  optionsArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  optionsContent: {
    padding: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: '#EE0000',
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#222',
  },
  priceContainer: {
    paddingTop: 10,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#222',
  },
  priceDivider: {
    color: '#888',
    marginTop: 15,
  },
  pricePresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  presetBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  presetText: {
    fontSize: 12,
    color: '#444',
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    gap: 15,
  },
  clearBtn: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EE0000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#EE0000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#EE0000',
    padding: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
