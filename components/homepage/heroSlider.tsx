import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDER_DATA = [
  { id: "1", image: require("@/assets/images/slider1.avif") },
  { id: "2", image: require("@/assets/images/slider2.avif") },
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % SLIDER_DATA.length;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 5000); 

    return () => clearInterval(interval);
  }, [currentIndex]);

  const renderSliderItem = ({ item }: { item: (typeof SLIDER_DATA)[0] }) => (
    <Image
      source={item.image}
      style={styles.sliderImage}
      contentFit="cover"
      transition={1000}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView>
        <FlatList
          ref={flatListRef}
          data={SLIDER_DATA}
          renderItem={renderSliderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
            );
            setCurrentIndex(index);
          }}
          style={styles.slider}
        />
        <View style={styles.pagination}>
          {SLIDER_DATA.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slider: {
    height: 250,
    flexGrow: 0,
  },
  sliderImage: {
    width: SCREEN_WIDTH,
    height: 250,
  },
  content: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  pagination: {
    position: "absolute",
    bottom: -20,
    flexDirection: "row",
    alignSelf: "center",
    justifyContent: "center",
    width: "100%",
  },
  dot: {
    width: 10,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#EE0000",
    width: 20,
  },
  inactiveDot: {
    backgroundColor: "#A9A9A9",
  },
});
