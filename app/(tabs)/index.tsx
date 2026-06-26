import HeroSlider from "@/components/homepage/heroSlider";
import CategorySlider from "@/components/homepage/categorySlider";
import CategoryProductSection from "@/components/homepage/categoryProductSection";
import Footer from "@/components/homepage/footer";
import { StyleSheet, ScrollView, View, Dimensions, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { ENDPOINTS } from "@/config/api";
import { Image } from "expo-image";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Category {
  _id: string;
  name: string;
  slug: string;
  imageUrl: string;
}

export default function homepage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${ENDPOINTS.CATEGORIES}?parentCategoryId=null`)
      .then((res) => res.json())
      .then((data) => {
        const categoryData = data.data || data;
        if (Array.isArray(categoryData)) {
          setCategories(categoryData);
        }
      })
      .catch((err) => console.error("Error fetching categories for homepage:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EE0000" />
      </View>
    );
  }

  // Separate Monitors from the rest
  const monitorsCategory = categories.find((cat) => cat.name.toLowerCase() === "monitors");
  const otherCategories = categories.filter((cat) => cat.name.toLowerCase() !== "monitors");

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <HeroSlider />
      <CategorySlider />
      
      <View style={styles.sectionsContainer}>
        {/* Render Monitors first if it exists */}
        {monitorsCategory && (
          <CategoryProductSection category={monitorsCategory} />
        )}

        {/* Static Banner Image */}
        <View style={styles.bannerContainer}>
          <Image 
            source={require("@/assets/images/static1.avif")} 
            style={styles.banner1Image}
            contentFit="cover"
            transition={500}
          />
        </View>

        {/* Render the next 4 categories */}
        {otherCategories.slice(0, 4).map((category) => (
          <CategoryProductSection key={category._id} category={category} />
        ))}
      </View>

      <View style={styles.bannerContainer}>
          <Image 
            source={require("@/assets/images/static2.avif")} 
            style={styles.banner2Image}
            contentFit="cover"
            transition={500}
          />
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  sectionsContainer: {
    paddingBottom: 20,
  },
  bannerContainer: {
    width: "100%",
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  banner1Image: {
    width: "100%",
    height: SCREEN_WIDTH * 0.7, 
    borderRadius: 12,
  },
  banner2Image: {
    width: "100%",
    height: SCREEN_WIDTH * 0.6, 
    borderRadius: 12,
  }
});
