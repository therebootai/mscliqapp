import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import * as SecureStore from '@/utils/storage';
import * as FileSystem from 'expo-file-system';
import { BASE_URL } from '@/config/api';

const fsStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const uri = `${FileSystem.documentDirectory}${name}.json`;
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        return await FileSystem.readAsStringAsync(uri);
      }
      return null;
    } catch (e) {
      console.warn('Failed to read from fs storage:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const uri = `${FileSystem.documentDirectory}${name}.json`;
      await FileSystem.writeAsStringAsync(uri, value);
    } catch (e) {
      console.warn('Failed to write to fs storage:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const uri = `${FileSystem.documentDirectory}${name}.json`;
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (e) {
      console.warn('Failed to remove from fs storage:', e);
    }
  },
};

// Handles variantId that may be a string, an object { _id: string }, or { $oid: string }
function extractVariantId(vid: any): string {
  if (!vid) return '';
  if (typeof vid === 'string') return vid;
  if (typeof vid === 'object') {
    return String(vid._id || vid.$oid || vid.id || '');
  }
  return String(vid);
}

export interface TaxSlab {
  name: string;
  slab: number;
}

export interface AppliedCoupon {
  code: string;
  type: string;
  value: number;
  maxDiscount: number;
  minOrderValue: number;
  calculatedDiscount: number;
}

export interface CartItem {
  variantId: string;
  quantity: number;
  product: {
    _id: string;
    title: string;
    image: string;
    price: number;
    mrp?: number;
    discount?: number;
    categoryName?: string;
    stocks?: number;
    slug?: string;
    effectiveTax?: TaxSlab[] | null;
  };
}

interface CartState {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  loading: boolean;
  isDirty: boolean; // true if local changes are not yet synced to backend
  lastSyncedAt: number | null;
  _hasHydrated: boolean;
  
  // Toast State
  toast: {
    message: string;
    visible: boolean;
  };
  showToast: (message: string) => void;
  hideToast: () => void;
  
  // Actions
  setHasHydrated: (state: boolean) => void;
  addToCart: (variantId: string, product: CartItem['product']) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => Promise<void>;
  
  // Coupon Actions
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  removeCoupon: () => void;
  
  // Backend Sync
  syncToBackend: () => Promise<void>;
  fetchCart: () => Promise<void>;
  mergeCart: (backendItems: CartItem[]) => void;
  fetchAndMerge: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      loading: false,
      isDirty: false,
      lastSyncedAt: null,
      _hasHydrated: false,
      toast: {
        message: '',
        visible: false,
      },

      showToast: (message) => {
        set({ toast: { message, visible: true } });
        setTimeout(() => {
           if (get().toast.message === message) {
             set({ toast: { ...get().toast, visible: false } });
           }
        }, 3000);
      },

      hideToast: () => set({ toast: { ...get().toast, visible: false } }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      addToCart: (variantId, product) => {
        const vidStr = extractVariantId(variantId);
        const { items } = get();
        const existingItem = items.find((item) => extractVariantId(item.variantId) === vidStr);

        const currentQty = existingItem ? existingItem.quantity : 0;
        const availableStocks = product.stocks || 999;

        if (currentQty >= availableStocks) {
          get().showToast(`Maximum stock reached for ${product.title}`);
          return;
        }

        let newItems;
        if (existingItem) {
          newItems = items.map((item) =>
            extractVariantId(item.variantId) === vidStr
              ? { ...item, quantity: item.quantity + 1, product: { ...item.product, ...product } }
              : item
          );
        } else {
          newItems = [...items, { variantId: vidStr, quantity: 1, product }];
        }
        
        set({ items: newItems, isDirty: true, appliedCoupon: null });
        get().showToast(`Added ${product.title} to cart`);
        get().syncToBackend().catch((e) => console.error('Sync to backend failed:', e));
      },

      removeFromCart: (variantId) => {
        const vidStr = extractVariantId(variantId);
        const itemToRemove = get().items.find(i => extractVariantId(i.variantId) === vidStr);
        set({
          items: get().items.filter((item) => extractVariantId(item.variantId) !== vidStr),
          isDirty: true,
          appliedCoupon: null,
        });
        if (itemToRemove) {
          get().showToast(`Removed from cart`);
        }
        get().syncToBackend().catch((e) => console.error('Sync to backend failed:', e));
      },

      updateQuantity: (variantId, quantity) => {
        const vidStr = extractVariantId(variantId);
        if (quantity <= 0) {
          get().removeFromCart(vidStr);
          return;
        }

        const item = get().items.find((i) => extractVariantId(i.variantId) === vidStr);
        if (item && quantity > (item.product.stocks || 999)) {
          get().showToast(`Only ${item.product.stocks} units available`);
          return;
        }

        set({
          items: get().items.map((item) =>
            extractVariantId(item.variantId) === vidStr ? { ...item, quantity } : item
          ),
          isDirty: true,
          appliedCoupon: null,
        });
        get().syncToBackend().catch((e) => console.error('Sync to backend failed:', e));
      },

      clearCart: async () => {
        set({ items: [], isDirty: false, appliedCoupon: null });
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) return;

        try {
          await axios.delete(`${BASE_URL}/cart`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (error) {
          console.error('Failed to clear cart on backend:', error);
        }
      },

      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),

      syncToBackend: async () => {
        const token = await SecureStore.getItemAsync('userToken');
        if (!token || !get()._hasHydrated) return;

        const payload = get().items.map(i => ({
          variantId: extractVariantId(i.variantId),
          quantity: i.quantity,
        }));

        try {
          await axios.put(`${BASE_URL}/cart/sync`, { items: payload }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ lastSyncedAt: Date.now(), isDirty: false });
        } catch (error) {
          console.error('Cart sync failed:', error);
        }
      },

      fetchCart: async () => {
        if (get().isDirty) return; // Don't overwrite local changes

        const token = await SecureStore.getItemAsync('userToken');
        if (!token) return;

        set({ loading: true });
        try {
          const { data } = await axios.get(`${BASE_URL}/cart`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (data && data.data && data.data.items) {
            const localItems = get().items;
            const backendItems = data.data.items.map((item: any) => {
              const vidStr = extractVariantId(item.variantId);
              const localItem = localItems.find(i => extractVariantId(i.variantId) === vidStr);
              return {
                variantId: vidStr,
                quantity: item.quantity,
                product: {
                  _id: item.variantId?.productId?._id || item.variantId?.productId || localItem?.product?._id || '',
                  title: item.variantId?.title || localItem?.product?.title || 'Product',
                  image: item.variantId?.coverImage?.url || localItem?.product?.image || '',
                  price: item.variantId?.price || localItem?.product?.price || 0,
                  mrp: item.variantId?.mrp || localItem?.product?.mrp,
                  discount: item.variantId?.discount || localItem?.product?.discount,
                  categoryName: item.variantId?.productId?.categoryId?.name || localItem?.product?.categoryName || '',
                  stocks: item.variantId?.stocks || localItem?.product?.stocks,
                  slug: item.variantId?.slug || localItem?.product?.slug || '',
                  effectiveTax: item.effectiveTax || item.variantId?.effectiveTax || item.variantId?.productId?.effectiveTax || localItem?.product?.effectiveTax || null,
                },
              };
            });
            set({ items: backendItems, isDirty: false });

            // Self-heal missing effectiveTax
            const { items: updatedItems } = get();
            const needsHealing = updatedItems.filter(i => 
              (!i.product.effectiveTax || (Array.isArray(i.product.effectiveTax) && i.product.effectiveTax.length === 0)) 
              && i.product.slug
            );
            if (needsHealing.length > 0) {
              Promise.all(needsHealing.map(async (item) => {
                try {
                  const res = await axios.get(`${BASE_URL}/variants/slug/${item.product.slug}`);
                  if (res.data?.data?.effectiveTax) {
                    const latestItems = get().items;
                    set({
                      items: latestItems.map(i => 
                        extractVariantId(i.variantId) === extractVariantId(item.variantId)
                          ? { ...i, product: { ...i.product, effectiveTax: res.data.data.effectiveTax } }
                          : i
                      )
                    });
                  }
                } catch (e) {
                  // ignore
                }
              }));
            }
          }
        } catch (error) {
          console.error('Fetch cart failed:', error);
        } finally {
          set({ loading: false });
        }
      },

      mergeCart: (backendItems) => {
        const localItems = get().items;
        const mergedMap = new Map<string, CartItem>();

        backendItems.forEach(item => {
          mergedMap.set(item.variantId, { ...item });
        });

        localItems.forEach(item => {
          const vidStr = extractVariantId(item.variantId);
          const existing = mergedMap.get(vidStr);
          if (existing) {
            mergedMap.set(vidStr, {
              ...existing,
              quantity: Math.max(existing.quantity, item.quantity),
              // Prefer local product data if it's richer
              product: { ...existing.product, ...item.product }
            });
          } else {
            mergedMap.set(vidStr, item);
          }
        });

        set({ items: Array.from(mergedMap.values()), isDirty: true });
      },

      fetchAndMerge: async () => {
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) return;

        set({ loading: true });
        try {
          const { data } = await axios.get(`${BASE_URL}/cart`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (data && data.data && data.data.items) {
            const localItems = get().items;
            const backendItems = data.data.items.map((item: any) => {
              const vidStr = extractVariantId(item.variantId);
              const localItem = localItems.find(i => extractVariantId(i.variantId) === vidStr);
              return {
                variantId: vidStr,
                quantity: item.quantity,
                product: {
                  _id: item.variantId?.productId?._id || item.variantId?.productId || localItem?.product?._id || '',
                  title: item.variantId?.title || localItem?.product?.title || 'Product',
                  image: item.variantId?.coverImage?.url || localItem?.product?.image || '',
                  price: item.variantId?.price || localItem?.product?.price || 0,
                  mrp: item.variantId?.mrp || localItem?.product?.mrp,
                  discount: item.variantId?.discount || localItem?.product?.discount,
                  categoryName: item.variantId?.productId?.categoryId?.name || localItem?.product?.categoryName || '',
                  stocks: item.variantId?.stocks || localItem?.product?.stocks,
                  slug: item.variantId?.slug || localItem?.product?.slug || '',
                  effectiveTax: item.effectiveTax || item.variantId?.effectiveTax || item.variantId?.productId?.effectiveTax || localItem?.product?.effectiveTax || null,
                },
              };
            });
            get().mergeCart(backendItems);

            // Self-heal missing effectiveTax
            const { items: updatedItems } = get();
            const needsHealing = updatedItems.filter(i => 
              (!i.product.effectiveTax || (Array.isArray(i.product.effectiveTax) && i.product.effectiveTax.length === 0)) 
              && i.product.slug
            );
            if (needsHealing.length > 0) {
              Promise.all(needsHealing.map(async (item) => {
                try {
                  const res = await axios.get(`${BASE_URL}/variants/slug/${item.product.slug}`);
                  if (res.data?.data?.effectiveTax) {
                    const latestItems = get().items;
                    set({
                      items: latestItems.map(i => 
                        extractVariantId(i.variantId) === extractVariantId(item.variantId)
                          ? { ...i, product: { ...i.product, effectiveTax: res.data.data.effectiveTax } }
                          : i
                      )
                    });
                  }
                } catch (e) {
                  // ignore
                }
              }));
            }
          }
        } catch (error) {
          console.error('Fetch and merge failed:', error);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => fsStorage),
      partialize: (state) => ({ 
        items: state.items, 
        isDirty: state.isDirty,
        lastSyncedAt: state.lastSyncedAt,
        appliedCoupon: state.appliedCoupon
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
