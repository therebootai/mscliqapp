import { create } from 'zustand';
import axios from 'axios';
import { BASE_URL } from '@/config/api';
import * as SecureStore from '@/utils/storage';

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressState {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  fetchAddresses: () => Promise<void>;
  createAddress: (data: Omit<Address, '_id' | 'isDefault'> & { isDefault?: boolean }) => Promise<void>;
  updateAddress: (id: string, data: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  isLoading: false,
  error: null,

  fetchAddresses: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await axios.get(`${BASE_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ addresses: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch addresses', 
        isLoading: false 
      });
    }
  },

  createAddress: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await axios.post(`${BASE_URL}/addresses`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({ 
        addresses: [...state.addresses, response.data.data],
        isLoading: false 
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create address';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  updateAddress: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await axios.patch(`${BASE_URL}/addresses/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        addresses: state.addresses.map((addr) => 
          addr._id === id ? { ...addr, ...response.data.data } : addr
        ),
        isLoading: false
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update address';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  deleteAddress: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const token = await SecureStore.getItemAsync('userToken');
      await axios.delete(`${BASE_URL}/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        addresses: state.addresses.filter((addr) => addr._id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete address';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  setDefaultAddress: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await axios.patch(`${BASE_URL}/addresses/${id}/default`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ addresses: response.data.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to set default address';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  }
}));
