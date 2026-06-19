import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SecureStore from '@/utils/storage';
import { BASE_URL } from '@/config/api';

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
            const backendItems = data.data.items.map((item: any) => ({
              variantId: extractVariantId(item.variantId),
              quantity: item.quantity,
              product: {
                _id: item.variantId?.productId?._id || '',
                title: item.variantId?.title || 'Product',
                image: item.variantId?.coverImage?.url || '',
                price: item.variantId?.price || 0,
                mrp: item.variantId?.mrp,
                discount: item.variantId?.discount,
                categoryName: item.variantId?.productId?.categoryId?.name || '',
                stocks: item.variantId?.stocks,
                slug: item.variantId?.slug || '',
                effectiveTax: item.effectiveTax || item.variantId?.effectiveTax || null,
              },
            }));
            set({ items: backendItems, isDirty: false });
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
            const backendItems = data.data.items.map((item: any) => ({
              variantId: extractVariantId(item.variantId),
              quantity: item.quantity,
              product: {
                _id: item.variantId?.productId?._id || '',
                title: item.variantId?.title || 'Product',
                image: item.variantId?.coverImage?.url || '',
                price: item.variantId?.price || 0,
                mrp: item.variantId?.mrp,
                discount: item.variantId?.discount,
                categoryName: item.variantId?.productId?.categoryId?.name || '',
                stocks: item.variantId?.stocks,
                slug: item.variantId?.slug || '',
                effectiveTax: item.effectiveTax || item.variantId?.effectiveTax || null,
              },
            }));
            get().mergeCart(backendItems);
          }
        } catch (error) {
          console.error('Fetch and merge failed:', error);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'pahadi-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
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
