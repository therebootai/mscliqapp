import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function setItemAsync(key: string, value: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getItemAsync(key: string) {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

export async function deleteItemAsync(key: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export const zustandStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await getItemAsync(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await deleteItemAsync(name);
  },
};
