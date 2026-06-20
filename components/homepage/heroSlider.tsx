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

const EXTENDED_SLIDER_DATA = Array(100).fill(SLIDER_DATA).flat();

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = currentIndex + 1;
      
      if (nextIndex >= EXTENDED_SLIDER_DATA.length) {
        setCurrentIndex(0);
        flatListRef.current?.scrollToIndex({
          index: 0,
          animated: false,
        });
      } else {
        setCurrentIndex(nextIndex);
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
    }, 5000); 

    return () => clearInterval(interval);
  }, [currentIndex]);

  const renderSliderItem = ({ item }: { item: (typeof SLIDER_DATA)[0] }) => (
    <Image
      source={item.image}
      style={styles.sliderImage}
      contentFit="cover"
    />
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView>
        <FlatList
          ref={flatListRef}
          data={EXTENDED_SLIDER_DATA}
          renderItem={renderSliderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
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
          {SLIDER_DATA.map((_, index) => {
            const activeIndex = currentIndex % SLIDER_DATA.length;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeIndex === index ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            );
          })}
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
