import { useEffect, useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { ThemedText } from "@/components/themed-text";
import ProductCard, { Product } from "@/components/product/productCard";
import { ENDPOINTS } from "@/config/api";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface CategoryProductSectionProps {
  category: {
    _id: string;
    name: string;
    slug: string;
  };
}

export default function CategoryProductSection({ category }: CategoryProductSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${ENDPOINTS.PRODUCTS_BY_CATEGORY}/${category.slug}?limit=6`) // Showing top 6 in grid
      .then((res) => res.json())
      .then((data) => {
        const responseData = data.data || data;
        const productList = responseData.products || (Array.isArray(responseData) ? responseData : []);
        setProducts(productList);
      })
      .catch((err) => console.error(`Error fetching products for ${category.slug}:`, err))
      .finally(() => setLoading(false));
  }, [category.slug]);

  if (!loading && products.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{category.name}</ThemedText>
        <Pressable style={styles.seeAllBtn}>
          <ThemedText style={styles.seeAllText}>See All</ThemedText>
          <IconSymbol name="chevron.right" size={14} color="#EE0000" />
        </Pressable>
      </View>

      <View style={styles.productGrid}>
        {products.map((item) => (
          <ProductCard key={item._id} product={item} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 15,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222222",
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    color: "#EE0000",
    fontWeight: "bold",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    justifyContent: "space-between",
  },
});
