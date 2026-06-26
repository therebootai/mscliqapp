import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { DrawerProvider } from '@/components/ui/drawer';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import Toast from '@/components/ui/Toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function RootLayout() {
  usePushNotifications();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const _hasHydrated = useCartStore((state) => state._hasHydrated);

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  useEffect(() => {
    if (isInitialized && isAuthenticated && _hasHydrated) {
      useCartStore.getState().fetchCart().catch((e) => console.error('Fetch cart failed on init:', e));
      useWishlistStore.getState().fetchWishlist().catch((e) => console.error('Fetch wishlist failed on init:', e));
    }
  }, [isInitialized, isAuthenticated, _hasHydrated]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <DrawerProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ title: 'Login' }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="wishlist" options={{ title: 'Wishlist', headerBackTitle: 'Back' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <Toast />
        <StatusBar style="light" />
      </DrawerProvider>
    </ThemeProvider>
  );
}
