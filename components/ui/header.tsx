import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useDrawer } from '@/components/ui/drawer';
import { useRouter } from 'expo-router';
import { useWishlist } from '@/context/WishlistContext';

export function Header() {
  const navigation = useNavigation();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const insets = useSafeAreaInsets();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist.length;

  const themeColors = Colors.light;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: themeColors.background }]}>
      {/* Main Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.leftSection}>
          <TouchableOpacity 
            onPress={openDrawer}
            style={styles.iconButton}
          >
            <IconSymbol name="line.3.horizontal" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>
        
        <ThemedText type="subtitle" style={styles.title}>MSCLIQ</ThemedText>
        
        <View style={styles.rightSection}>
          <TouchableOpacity 
            onPress={() => setIsSearchVisible(!isSearchVisible)}
            style={styles.iconButton}
          >
            <IconSymbol name="magnifyingglass" size={24} color={themeColors.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/wishlist')}
            style={styles.iconButton}
          >
            <IconSymbol name="heart" size={24} color={themeColors.text} />
            {wishlistCount > 0 && (
              <View style={styles.badgeContainer}>
                <ThemedText style={styles.badgeText}>
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar Row (Conditional) */}
      {isSearchVisible && (
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: '#f0f0f0' }]}>
            <View style={styles.searchIconInside}>
              <IconSymbol name="magnifyingglass" size={18} color={themeColors.icon} />
            </View>
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search products..."
              placeholderTextColor={themeColors.icon}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            <TouchableOpacity 
              onPress={() => {
                setIsSearchVisible(false);
                setSearchText('');
              }}
              style={styles.closeSearchButton}
            >
              <IconSymbol name="xmark" size={18} color={themeColors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  headerRow: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  leftSection: {
    width: 80, // Same as rightSection to keep title centered
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    width: 80, // Same as leftSection to keep title centered
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EE0000',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    zIndex: 1,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 10,
    ...Platform.select({
      ios: {
        marginTop: 1,
      },
    }),
  },
  searchRow: {
    paddingHorizontal: 15,
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 10,
  },
  searchIconInside: {
    marginRight: 0,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  closeSearchButton: {
    padding: 8,
    marginLeft: 5,
  },
});
