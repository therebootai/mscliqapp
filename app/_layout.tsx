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
import { WishlistProvider } from '@/context/WishlistContext';

export default function RootLayout() {

  return (
    <ThemeProvider value={DefaultTheme}>
      <WishlistProvider>
        <DrawerProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="wishlist" options={{ title: 'Wishlist', headerBackTitle: 'Back' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="light" />
        </DrawerProvider>
      </WishlistProvider>
    </ThemeProvider>
  );
}
