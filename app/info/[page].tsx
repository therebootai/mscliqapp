import React from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

const PAGE_CONTENT: Record<string, { title: string; content: string }> = {
  'help-center': {
    title: 'Help Center',
    content: `Welcome to the MSCLIQ Help Center.

We are committed to providing you with the best possible shopping experience. If you require assistance with your orders, tracking, products, or anything else, our dedicated support team is available to help.

Contact Information:
- Email: purchase.matrixsolutions@gmail.com
- Phone: +91 94763 83750, +91 98000 87233
- Address: Opposite Web Gallery, Pakurtala More, Ashram Para, Hakim Para, Siliguri, West Bengal – 734001, India

Operating Hours:
Monday to Saturday, 10:00 AM - 7:00 PM IST.

For technical support regarding assembled PCs or hardware defects, please keep your order invoice and a detailed description of the issue ready so our team can assist you efficiently. Note that brand warranties require you to contact the respective brand's authorized service centers.`
  },
  'returns-refunds': {
    title: 'Returns & Refunds',
    content: `Returns & Refunds Policy

At MSCliq, we want you to be completely satisfied with your purchase. However, because we deal primarily in sensitive electronic components, computer hardware, and sealed IT products, our return policy is strict to prevent fraud and tampering.

1. Dead on Arrival (DOA) & Defective Items:
If your product is defective out of the box, you must report the issue within 48 hours of delivery. Most brands require the customer to visit their Authorized Service Center to get a "DOA Certificate". Once the DOA certificate is obtained, we will arrange a return pickup and dispatch a replacement.

2. Mandatory Unboxing Video:
To claim a return for physical damage or receiving the wrong product, an unboxing video is COMPULSORY. The video must be continuous, show the shipping label, all sides of the sealed box, and the opening process. Without this, claims will be rejected.

3. Refunds:
Once a returned item is received, inspected, and approved, refunds for prepaid orders will be credited back to the original mode of payment within 5 to 7 business days. COD refunds will be transferred via NEFT/IMPS. Shipping charges are generally non-refundable.

4. Non-Returnable Items:
Opened software, digital keys, open printer cartridges, custom PC builds, and products with missing serial numbers or accessories cannot be returned.`
  },
  'shipping-info': {
    title: 'Shipping Information',
    content: `Shipping & Delivery Information

1. Order Processing:
Orders are typically processed within 1 to 2 business days after payment confirmation. Custom-built desktops and specialized setups require an additional 2 to 4 business days for assembly and stress testing.

2. Delivery Timelines:
- Local Deliveries (Siliguri & nearby): 1 to 2 business days.
- Metro Cities (Delhi, Mumbai, Bangalore, etc.): 3 to 5 business days.
- Tier 2 & Tier 3 Cities: 4 to 7 business days.
- Remote Regions: 7 to 10 business days.

3. Shipping Methods:
We partner with reputed couriers (BlueDart, Delhivery, Ecom Express). Items containing large batteries or heavy items (PC cabinets) must be shipped via Surface Transport, which may take longer than standard Air Shipping.

4. Tracking:
Once dispatched, you will receive an SMS/WhatsApp notification with your tracking number.

5. Damages During Transit:
Do not accept parcels that are severely crushed or tampered with. If accepted, you must record a continuous unboxing video to claim transit damages within 24 hours.`
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    content: `Privacy Policy for MSCliq

This Privacy Policy governs how Matrix Solutions (MSCliq) collects, uses, maintains, and discloses information collected from users of our app and website.

1. Information We Collect:
- Personal Details: Name, contact number, email, shipping/billing address.
- Payment Information: Processed securely via Razorpay/PhonePe. We do not store card details.
- Technical Data: Device info, IP address, and app usage stats.

2. How We Use Information:
- To process transactions and fulfill orders.
- To send periodic updates, order tracking, and delivery notifications via SMS/WhatsApp.
- To improve our customer service and app functionality.

3. Data Sharing:
We do not sell or trade your personal information. We share data only with trusted third parties necessary to fulfill your orders (e.g., Courier partners like Shiprocket) and securely process payments.

4. Security:
Sensitive and private data exchange happens over encrypted channels. We adopt robust security measures to protect against unauthorized access.

By using the app, you consent to our collection and use of your data as outlined in this policy.`
  },
  'terms': {
    title: 'Terms of Service',
    content: `Terms of Service

By accessing or using the MSCliq app, you agree to comply with and be bound by these Terms.

1. Products & Pricing:
All prices listed are in INR and include GST. Prices are subject to change without notice. We reserve the right to refuse or cancel orders due to pricing errors or suspected fraud.

2. Warranties:
Products sold are covered by their respective OEM warranties. MSCliq does not provide additional warranties. Physical damage, liquid spills, or unauthorized repairs generally void warranties.

3. User Responsibilities:
You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree not to misuse the platform or submit false information.

4. Limitation of Liability:
Matrix Solutions shall not be liable for any indirect, incidental, or consequential damages resulting from the use of our app, delivery delays, or manufacturer defects.

5. Governing Law:
These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Siliguri, West Bengal.`
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
    paddingBottom: 40,
  },
  contentText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
  }
});
