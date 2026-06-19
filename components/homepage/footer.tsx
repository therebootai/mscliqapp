import { StyleSheet, View, Pressable } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useEffect, useState } from "react";
import { ENDPOINTS } from "@/config/api";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);

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

  return (
    <View style={styles.footerContainer}>
      {/* Customer Care */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Customer Care</ThemedText>
        <Pressable style={styles.linkRow}>
          <IconSymbol name="chevron.right" size={14} color="#666666" />
          <ThemedText style={styles.linkText}>Help Center</ThemedText>
        </Pressable>
        <Pressable style={styles.linkRow}>
          <IconSymbol name="chevron.right" size={14} color="#666666" />
          <ThemedText style={styles.linkText}>Track Order</ThemedText>
        </Pressable>
        <Pressable style={styles.linkRow}>
          <IconSymbol name="chevron.right" size={14} color="#666666" />
          <ThemedText style={styles.linkText}>Returns & Refunds</ThemedText>
        </Pressable>
        <Pressable style={styles.linkRow}>
          <IconSymbol name="chevron.right" size={14} color="#666666" />
          <ThemedText style={styles.linkText}>Shipping Info</ThemedText>
        </Pressable>
      </View>

      {/* Top Categories */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Top Categories</ThemedText>
          {categories.map((cat) => (
            <Pressable key={cat._id} style={styles.linkRow}>
              <IconSymbol name="chevron.right" size={14} color="#666666" />
              <ThemedText style={styles.linkText}>{cat.name}</ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      {/* My Account */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>My Account</ThemedText>
        <Pressable style={styles.linkRow}>
          <IconSymbol name="chevron.right" size={14} color="#666666" />
          <ThemedText style={styles.linkText}>Sign In / Register</ThemedText>
        </Pressable>
        <Pressable style={styles.linkRow}>
          <IconSymbol name="chevron.right" size={14} color="#666666" />
          <ThemedText style={styles.linkText}>My Wishlist</ThemedText>
        </Pressable>
        <Pressable style={styles.linkRow}>
          <IconSymbol name="chevron.right" size={14} color="#666666" />
          <ThemedText style={styles.linkText}>My Orders</ThemedText>
        </Pressable>
      </View>

      {/* Contact Us */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Contact Us</ThemedText>
        <View style={styles.contactRow}>
          <IconSymbol name="person.fill" size={16} color="#EE0000" />
          <ThemedText style={styles.contactText}>+91 9476383750</ThemedText>
        </View>
        <View style={styles.contactRow}>
          <IconSymbol name="person.fill" size={16} color="#EE0000" />
          <ThemedText style={styles.contactText}>+91 9800087233</ThemedText>
        </View>
        <View style={styles.contactRow}>
          <IconSymbol name="paperplane.fill" size={16} color="#EE0000" />
          <ThemedText style={styles.contactText}>support@mscliq.com</ThemedText>
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
    backgroundColor: "#F8F8F8",
    paddingTop: 30,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222222",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    color: "#666666",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 10,
    paddingRight: 20,
  },
  contactText: {
    fontSize: 14,
    color: "#666666",
    flex: 1,
    lineHeight: 20,
  },
  bottomBar: {
    backgroundColor: "#222222",
    paddingVertical: 20,
    alignItems: "center",
    gap: 4,
  },
  copyrightText: {
    color: "#AAAAAA",
    fontSize: 12,
  },
  poweredByContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  poweredByText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
  },
  rebootText: {
    color: "#0080FE",
    fontWeight: "bold",
    fontSize: 24,
  },
});
