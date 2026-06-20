import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useToastStore } from '@/store/useToastStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Toast() {
  const { message, visible, type } = useToastStore();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: insets.top + 10,
          useNativeDriver: true,
          speed: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, insets.top]);

  if (!message && !visible) return null;

  const getIconName = () => {
    if (type === 'success') return 'checkmark.circle.fill';
    if (type === 'error') return 'xmark.circle.fill';
    return 'info.circle.fill';
  };

  const getColor = () => {
    if (type === 'success') return '#34A853';
    if (type === 'error') return '#EE0000';
    return '#0066cc';
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]} pointerEvents="none">
      <View style={[styles.toast, { borderLeftColor: getColor() }]}>
        <IconSymbol name={getIconName()} size={20} color={getColor()} />
        <ThemedText style={styles.message}>{message}</ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderLeftWidth: 4,
    gap: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    flex: 1,
  },
});
