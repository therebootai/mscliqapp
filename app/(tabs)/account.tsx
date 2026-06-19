import React, { useCallback } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const { user, isAuthenticated, isInitialized, logout, refreshProfile } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      if (isInitialized && isAuthenticated) {
        refreshProfile();
      }
    }, [isInitialized, isAuthenticated])
  );

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    {
      title: 'My Orders',
      icon: 'list.bullet.rectangle',
      route: '/profile/orders' as const,
      color: '#3b82f6',
    },
    {
      title: 'My Reviews',
      icon: 'star.fill',
      route: '/profile/reviews' as const,
      color: '#f59e0b',
    },
    {
      title: 'Saved Addresses',
      icon: 'house.fill',
      route: '/profile/addresses' as const,
      color: '#10b981',
    },
    {
      title: 'Edit Profile',
      icon: 'person.fill',
      route: '/profile/edit' as const,
      color: '#6366f1',
    },
  ];

  if (!isInitialized) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthContainer}>
          <IconSymbol name="person.fill" size={80} color="#e5e7eb" />
          <Text style={styles.unauthTitle}>Welcome to MSCLIQ</Text>
          <Text style={styles.unauthSubtitle}>Sign in to manage your orders, saved items, and personal details.</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.loginButtonText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userPhone}>+91 {user?.phone}</Text>
          {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <IconSymbol name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
              <IconSymbol name="chevron.right" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol name="xmark.circle.fill" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: Fonts.rounded,
  },
  userPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  menuContainer: {
    padding: 20,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  logoutButton: {
    margin: 20,
    marginTop: 10,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  unauthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unauthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
  },
  unauthSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#EE0000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#EE0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
