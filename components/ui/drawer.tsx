import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Animated, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

interface DrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
}

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const openDrawer = () => {
    setIsOpen(true);
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const menuItems = [
    { label: 'Home', icon: 'house.fill', route: '/' },
    { label: 'Explore', icon: 'paperplane.fill', route: '/explore' },
    { label: 'Account', icon: 'person.fill', route: '/account' },
    { label: 'Cart', icon: 'cart.fill', route: '/cart' },
    { label: 'Wishlist', icon: 'heart', route: '/wishlist' },
  ];

  return (
    <DrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer }}>
      <View style={styles.container}>
        {children}

        {isOpen && (
          <Pressable style={styles.overlayContainer} onPress={closeDrawer}>
            <Animated.View style={[styles.overlay, { opacity }]} />
          </Pressable>
        )}

        <Animated.View style={[styles.drawer, { transform: [{ translateX }], paddingTop: insets.top }]}>
          <ThemedView style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <ThemedText type="title">MSCLIQ</ThemedText>
              <ThemedText type="default">Premium Store</ThemedText>
            </View>

            <View style={styles.drawerItems}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.drawerItem}
                  onPress={() => {
                    closeDrawer();
                    router.push(item.route as any);
                  }}
                >
                  <IconSymbol name={item.icon as any} size={22} color="#333" />
                  <ThemedText style={styles.drawerItemText}>{item.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.drawerFooter}>
              <ThemedText type="default">v1.0.0</ThemedText>
            </View>
          </ThemedView>
        </Animated.View>
      </View>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  drawerContent: {
    flex: 1,
    padding: 20,
  },
  drawerHeader: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  drawerItems: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  drawerItemText: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  drawerFooter: {
    marginTop: 'auto',
    paddingTop: 10,
    alignItems: 'center',
  },
});
