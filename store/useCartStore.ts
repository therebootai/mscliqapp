import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TaxSlab {
  name: string;
  slab: number;
}

export interface CartItem {
  variantId: string;
  quantity: number;
  title?: string;
  image?: string;
  price?: number;
  mrp?: number;
  stock?: number;
  effectiveTax?: TaxSlab[] | null;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items;
        const existingItem = items.find(i => i.variantId === item.variantId);
        
        let newItems;
        if (existingItem) {
          newItems = items.map(i =>
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        } else {
          newItems = [...items, item];
        }
        set({ items: newItems });
      },
      removeItem: (variantId) => {
        set({
          items: get().items.filter(i => i.variantId !== variantId),
        });
      },
      updateQuantity: (variantId, quantity) => {
        const items = get().items;
        if (quantity <= 0) {
          set({ items: items.filter(i => i.variantId !== variantId) });
        } else {
          set({
            items: items.map(i =>
              i.variantId === variantId ? { ...i, quantity } : i
            )
          });
        }
      },
      clearCart: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'mscliq-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
