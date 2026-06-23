import React from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

const PAGE_CONTENT: Record<string, { title: string; content: string }> = {
  'help-center': {
    title: 'Help Center',
    content: 'Welcome to the MSCLIQ Help Center.\n\nIf you have any issues with your orders or need technical support with our electronics, please contact us at support@mscliq.com or call our 24/7 helpline.\n\nOur team is dedicated to providing you with the best service possible.'
  },
  'returns-refunds': {
    title: 'Returns & Refunds',
    content: 'Returns & Refunds Policy\n\nWe offer a 7-day return policy for all electronics items. The item must be in its original packaging with all accessories included.\n\nRefunds will be processed to your original payment method within 5-7 business days after we receive the returned item.'
  },
  'shipping-info': {
    title: 'Shipping Information',
    content: 'Shipping Information\n\nAll orders are dispatched within 24-48 hours. We use premium courier partners like BlueDart, Delhivery, and XpressBees to ensure safe and fast delivery of your electronics.\n\nStandard delivery takes 3-5 business days depending on your location.'
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    content: 'Privacy Policy\n\nYour privacy is important to us. MSCLIQ encrypts all payment information and will never share your personal data with third parties without your explicit consent.'
  },
  'terms': {
    title: 'Terms of Service',
    content: 'Terms of Service\n\nBy using the MSCLIQ app, you agree to our terms of service. All prices are inclusive of taxes where applicable. MSCLIQ reserves the right to cancel orders suspected of fraud.'
  }
};

export default function InfoPage() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const router = useRouter();

  const data = PAGE_CONTENT[page || 'help-center'] || {
    title: 'Information',
    content: 'Page content coming soon.'
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color="#222" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle}>{data.title}</ThemedText>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <ThemedText style={styles.contentText}>{data.content}</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
    zIndex: 1,
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  contentContainer: {
    padding: 20,
  },
  contentText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
  }
});
