import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import * as SecureStore from '@/utils/storage';
import { BASE_URL } from '@/config/api';
import { useCartStore } from './cartStore';

// Handles variantId that may be a string, an object { _id: string }, or { $oid: string }
function extractVariantId(vid: any): string {
  if (!vid) return '';
  if (typeof vid === 'string') return vid;
  if (typeof vid === 'object') {
    return String(vid._id || vid.$oid || vid.id || '');
  }
  return String(vid);
}

export interface WishlistItem {
  _id: string; // Product ID
  variantId: string;
  title: string;
  image: string;
  price: string;
  oldPrice?: string;
  discount?: string;
  categoryName?: string;
  rating?: number;
  isOutOfStock?: boolean;
  slug?: string;
}

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  isDirty: boolean;
  _hasHydrated: boolean;
  
  // Actions
  setHasHydrated: (state: boolean) => void;
  addItem: (item: WishlistItem) => void;
  removeItem: (variantId: string) => void;
  toggleItem: (item: WishlistItem) => Promise<void>;
  isInWishlist: (variantId: string) => boolean;
  clearWishlist: () => void;
  
  // Backend Sync
  fetchWishlist: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      isDirty: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      addItem: (item) => {
        const vidStr = extractVariantId(item.variantId);
        const { items } = get();
        if (!vidStr) return;
        
        if (!items.find((i) => extractVariantId(i.variantId) === vidStr)) {
          set({ items: [...items, { ...item, variantId: vidStr }], isDirty: true });
        }
      },

      removeItem: (variantId) => {
        const vidStr = extractVariantId(variantId);
        const { items } = get();
        set({ 
          items: items.filter((i) => extractVariantId(i.variantId) !== vidStr),
          isDirty: true 
        });
      },

      toggleItem: async (item) => {
        const vidStr = extractVariantId(item.variantId);
        const { items } = get();
        const existing = items.find((i) => extractVariantId(i.variantId) === vidStr);
        
        const token = await SecureStore.getItemAsync('userToken');
        
        // Optimistic update
        if (existing) {
          set({ 
            items: items.filter((i) => extractVariantId(i.variantId) !== vidStr),
            isDirty: true 
          });
          useCartStore.getState().showToast(`Removed from wishlist`);
        } else {
          set({ 
            items: [...items, { ...item, variantId: vidStr }], 
            isDirty: true 
          });
          useCartStore.getState().showToast(`Added ${item.title} to wishlist`);
        }

        // Sync to backend if authenticated
        if (token) {
          try {
            await axios.patch(`${BASE_URL}/wishlist/toggle/${vidStr}`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            set({ isDirty: false });
          } catch (error) {
            console.error('Wishlist toggle failed:', error);
          }
        }
      },

      isInWishlist: (variantId) => {
        const vidStr = extractVariantId(variantId);
        if (!vidStr) return false;
        return get().items.some((i) => extractVariantId(i.variantId) === vidStr);
      },

      clearWishlist: () => set({ items: [], isDirty: false }),

      fetchWishlist: async () => {
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) return;

        set({ loading: true });
        try {
          const { data } = await axios.get(`${BASE_URL}/wishlist`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (data && data.data && data.data.variantIds) {
            const backendItems = data.data.variantIds.map((v: any) => {
              const product = v.productId || {};
              const price = v.price || 0;
              const mrp = v.mrp || price;
              
              return {
                _id: product._id || '',
                variantId: extractVariantId(v),
                title: v.title || product.title || 'Product',
                image: v.coverImage?.url || product.coverImage?.url || '',
                price: `₹${price.toLocaleString()}`,
                oldPrice: mrp > price ? `₹${mrp.toLocaleString()}` : undefined,
                discount: mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}%` : undefined,
                categoryName: product.categoryId?.name || '',
                rating: product.rating || 0,
                isOutOfStock: v.stocks <= 0,
                slug: v.slug || product.slug || '',
              };
            });
            set({ items: backendItems, isDirty: false });
          }
        } catch (error) {
          console.error('Fetch wishlist failed:', error);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'mscliq-wishlist-storage-v3',
      storage: createJSONStorage(() => SecureStore.zustandStorage),
      partialize: (state) => ({ items: state.items, isDirty: state.isDirty }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
