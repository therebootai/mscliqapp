import { useEffect, useState, useRef } from "react";
import { FlatList, StyleSheet, View, Dimensions } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";
import { ENDPOINTS } from "@/config/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = SCREEN_WIDTH / 3;

interface Category {
  _id: string;
  name: string;
  slug: string;
  imageUrl: string;
}

export default function CategorySlider() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetch(`${ENDPOINTS.CATEGORIES}?parentCategoryId=null`)
      .then((res) => res.json())
      .then((data) => {
        const categoryData = data.data || data;
        if (Array.isArray(categoryData)) {
          setCategories(categoryData);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % categories.length;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000); // Auto-scroll every 3 seconds

    return () => clearInterval(interval);
  }, [currentIndex, categories.length]);

  if (categories.length === 0) return null;

  // Calculate pages for dots (showing which group of 3 is mostly visible)
  const totalPages = Math.ceil(categories.length / 3);
  const activePage = Math.floor(currentIndex / 3);

  return (
    <View style={styles.categorySection}>
      <FlatList
        ref={flatListRef}
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.categoryList}
        decelerationRate="fast"
        snapToInterval={ITEM_WIDTH}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.categoryItem}>
            <View style={styles.imageShadowContainer}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.categoryImage}
                  contentFit="cover"
                />
              </View>
            </View>
            <View style={styles.textContainer}>
              <ThemedText style={styles.categoryText} numberOfLines={1}>
                {item.name}
              </ThemedText>
            </View>
          </View>
        )}
      />
      {totalPages > 1 && (
        <View style={styles.pagination}>
          {Array.from({ length: totalPages }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activePage === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  categorySection: {
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
  },
  categoryList: {
    paddingHorizontal: 0,
  },
  categoryItem: {
    alignItems: "center",
    width: ITEM_WIDTH,
  },
  imageShadowContainer: {
    width: 80,
    height: 80,
    marginTop: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: 100,
    height: 100,
    overflow: "hidden",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    width: ITEM_WIDTH - 10,
    alignItems: "center",
  },
  categoryText: {
    fontSize: 13,
    textAlign: "center",
    color: "#222222",
    fontWeight: "500",
    lineHeight: 18,
    letterSpacing: -0.3,
  },
  pagination: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 15,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: "#EE0000",
    width: 14,
  },
  inactiveDot: {
    backgroundColor: "#D3D3D3",
  },
});
