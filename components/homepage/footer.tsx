import { StyleSheet, View, Pressable, TextInput, Linking, Image } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useEffect, useState } from "react";
import { ENDPOINTS } from "@/config/api";
import { useRouter } from "expo-router";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [email, setEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch(`${ENDPOINTS.CATEGORIES}?parentCategoryId=null`)
      .then((res) => res.json())
      .then((data) => {
        const categoryData = data.data || data;
        if (Array.isArray(categoryData)) {
          setCategories(categoryData.slice(0, 5));
        }
      })
      .catch((err) => console.error("Error fetching footer categories:", err));
  }, []);

  const handleSubscribe = () => {
    if (email) {
      alert("Subscribed successfully!");
      setEmail("");
    }
  };

  const handleSocialLink = (url: string) => {
    Linking.openURL(url).catch(() => alert("Could not open link"));
  };

  return (
    <View style={styles.footerContainer}>

      {/* Value Propositions / USPs */}
      <View style={styles.uspContainer}>
        <View style={styles.uspItem}>
          <IconSymbol name="shippingbox.fill" size={24} color="#EE0000" />
          <ThemedText style={styles.uspText}>Free Shipping</ThemedText>
        </View>
        <View style={styles.uspItem}>
          <IconSymbol name="arrow.triangle.2.circlepath" size={24} color="#EE0000" />
          <ThemedText style={styles.uspText}>7-Day Returns</ThemedText>
        </View>
        <View style={styles.uspItem}>
          <IconSymbol name="lock.fill" size={24} color="#EE0000" />
          <ThemedText style={styles.uspText}>100% Secure</ThemedText>
        </View>
      </View>

      {/* We Accept Section */}
      <View style={styles.paymentContainer}>
        <ThemedText style={styles.paymentTitle}>We Accept</ThemedText>
        <View style={styles.paymentLogos}>
          <View style={styles.logoWrapper}>
            <Image source={require('@/assets/images/visa.png')} style={styles.paymentImage} resizeMode="contain" />
          </View>
          <View style={styles.logoWrapper}>
            <Image source={require('@/assets/images/master-card.png')} style={styles.paymentImage} resizeMode="contain" />
          </View>
          <View style={styles.logoWrapper}>
            <Image source={require('@/assets/images/rupay.png')} style={styles.paymentImage} resizeMode="contain" />
          </View>
          <View style={styles.logoWrapper}>
            <Image source={require('@/assets/images/upi.png')} style={styles.paymentImage} resizeMode="contain" />
          </View>
        </View>
      </View>

      <View style={styles.linksGrid}>
        {/* Customer Care */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Customer Care</ThemedText>
          <Pressable style={styles.linkRow} onPress={() => router.push('/info/help-center')}>
            <IconSymbol name="chevron.right" size={14} color="#888888" />
            <ThemedText style={styles.linkText}>Help Center</ThemedText>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/profile/orders')}>
            <IconSymbol name="chevron.right" size={14} color="#888888" />
            <ThemedText style={styles.linkText}>Track Order</ThemedText>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/info/returns-refunds')}>
            <IconSymbol name="chevron.right" size={14} color="#888888" />
            <ThemedText style={styles.linkText}>Returns & Refunds</ThemedText>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/info/shipping-info')}>
            <IconSymbol name="chevron.right" size={14} color="#888888" />
            <ThemedText style={styles.linkText}>Shipping Info</ThemedText>
          </Pressable>
        </View>

        {/* Top Categories */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Top Categories</ThemedText>
            {categories.map((cat) => (
              <Pressable key={cat._id} style={styles.linkRow} onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: cat.slug } })}>
                <IconSymbol name="chevron.right" size={14} color="#888888" />
                <ThemedText style={styles.linkText}>{cat.name}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.linksGrid}>
        {/* My Account */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>My Account</ThemedText>
          <Pressable style={styles.linkRow} onPress={() => router.push('/(auth)/login')}>
            <IconSymbol name="chevron.right" size={14} color="#888888" />
            <ThemedText style={styles.linkText}>Sign In / Register</ThemedText>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/wishlist')}>
            <IconSymbol name="chevron.right" size={14} color="#888888" />
            <ThemedText style={styles.linkText}>My Wishlist</ThemedText>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/profile/orders')}>
            <IconSymbol name="chevron.right" size={14} color="#888888" />
            <ThemedText style={styles.linkText}>My Orders</ThemedText>
          </Pressable>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Legal</ThemedText>
          <Pressable style={styles.linkRow} onPress={() => router.push('/info/privacy-policy')}>
            <IconSymbol name="chevron.right" size={14} color="#888888" />
            <ThemedText style={styles.linkText}>Privacy Policy</ThemedText>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/info/terms')}>
            <IconSymbol name="chevron.right" size={14} color="#888888" />
            <ThemedText style={styles.linkText}>Terms of Service</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Contact Us */}
      <View style={styles.contactSection}>
        <ThemedText style={styles.sectionTitle}>Contact Us</ThemedText>
        <View style={styles.contactRow}>
          <IconSymbol name="phone.fill" size={16} color="#EE0000" />
          <Pressable onPress={() => Linking.openURL('tel:+919476383750')}>
            <ThemedText style={styles.contactText}>+91 9476383750</ThemedText>
          </Pressable>
        </View>
        <View style={styles.contactRow}>
          <IconSymbol name="phone.fill" size={16} color="#EE0000" />
          <Pressable onPress={() => Linking.openURL('tel:+919800087233')}>
            <ThemedText style={styles.contactText}>+91 9800087233</ThemedText>
          </Pressable>
        </View>
        <View style={styles.contactRow}>
          <IconSymbol name="envelope.fill" size={16} color="#EE0000" />
          <Pressable onPress={() => Linking.openURL('mailto:support@mscliq.com')}>
            <ThemedText style={styles.contactText}>support@mscliq.com</ThemedText>
          </Pressable>
        </View>
        <View style={styles.contactRow}>
          <IconSymbol name="house.fill" size={16} color="#EE0000" />
          <ThemedText style={styles.contactText}>
            Dabgram Colony, P.O. Rabindra Sarani, Siliguri, Darjeeling, WB
            734006 Opposite Web Gallery, Pakurtala More, Ashram Para, Hakim
            Para, Siliguri, WB 734001
          </ThemedText>
        </View>
      </View>

      {/* Social Links */}
      <View style={styles.socialContainer}>
        <Pressable style={styles.socialIcon} onPress={() => handleSocialLink('https://facebook.com')}>
          <ThemedText style={styles.socialText}>f</ThemedText>
        </Pressable>
        <Pressable style={styles.socialIcon} onPress={() => handleSocialLink('https://instagram.com')}>
          <ThemedText style={styles.socialText}>ig</ThemedText>
        </Pressable>
        <Pressable style={styles.socialIcon} onPress={() => handleSocialLink('https://twitter.com')}>
          <ThemedText style={styles.socialText}>X</ThemedText>
        </Pressable>
        <Pressable style={styles.socialIcon} onPress={() => handleSocialLink('https://youtube.com')}>
          <ThemedText style={styles.socialText}>yt</ThemedText>
        </Pressable>
      </View>

      {/* Powered By */}
      <View style={styles.bottomBar}>
        <ThemedText style={styles.copyrightText}>
          © 2026 MSCLIQ. All Rights Reserved.
        </ThemedText>
        <View style={styles.poweredByContainer}>
          <ThemedText style={styles.poweredByText}>Powered by </ThemedText>
          <ThemedText style={styles.rebootText}>Reboot AI</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: "#1A1A1A",
    paddingTop: 30,
    marginTop: 20,
  },
  newsletterSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  newsletterTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  newsletterDesc: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 15,
  },
  newsletterInputContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 48,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
  },
  newsletterInput: {
    flex: 1,
    paddingHorizontal: 15,
    color: '#FFF',
    fontSize: 14,
  },
  subscribeBtn: {
    backgroundColor: '#EE0000',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  subscribeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  uspContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  uspItem: {
    alignItems: 'center',
    gap: 5,
  },
  uspText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  linksGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  section: {
    flex: 1,
    marginBottom: 25,
  },
  contactSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    color: "#AAA",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
    gap: 12,
    paddingRight: 20,
  },
  contactText: {
    fontSize: 14,
    color: "#AAA",
    flex: 1,
    lineHeight: 22,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 30,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  bottomBar: {
    backgroundColor: "#000",
    paddingVertical: 20,
    alignItems: "center",
    gap: 8,
  },
  copyrightText: {
    color: "#777",
    fontSize: 12,
  },
  poweredByContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  poweredByText: {
    color: "#AAA",
    fontSize: 16,
  },
  rebootText: {
    color: "#0080FE",
    fontWeight: "bold",
    fontSize: 20,
  },
  paymentContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  paymentTitle: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  paymentLogos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  logoWrapper: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 5,
    width: 50,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentImage: {
    width: '100%',
    height: '100%',
  },
});
