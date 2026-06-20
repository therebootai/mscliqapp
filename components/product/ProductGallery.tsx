import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Pressable, Platform, Share, Modal, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';

const { width } = Dimensions.get('window');

interface ProductGalleryProps {
  images: string[];
  isWishlisted: boolean;
  onWishlist: () => void;
  isOutOfStock?: boolean;
}

export default function ProductGallery({
  images,
  isWishlisted,
  onWishlist,
  isOutOfStock
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fullScreenScrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  const handleFullScreenScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  // Sync scroll positions
  useEffect(() => {
    if (isFullScreen && fullScreenScrollViewRef.current) {
      setTimeout(() => {
        fullScreenScrollViewRef.current?.scrollTo({ x: width * activeIndex, animated: false });
      }, 50);
    } else if (!isFullScreen && scrollViewRef.current) {
      scrollViewRef.current?.scrollTo({ x: width * activeIndex, animated: false });
    }
  }, [isFullScreen]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out this product!',
        url: 'https://mscliq.com',
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      <View style={styles.topActions}>
        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <ThemedText style={styles.outOfStockText}>Out of Stock</ThemedText>
          </View>
        )}
        <View style={styles.rightActions}>
          <Pressable style={styles.actionBtn} onPress={onWishlist}>
            <IconSymbol name={isWishlisted ? "heart.fill" : "heart"} size={20} color={isWishlisted ? "#EE0000" : "#222222"} />
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={handleShare}>
            <IconSymbol name="share" size={20} color="#222222" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {images.map((img, index) => (
          <Pressable key={index} style={styles.slide} onPress={() => setIsFullScreen(true)}>
            <Image
              source={{ uri: img }}
              style={styles.image}
              contentFit="contain"
              transition={500}
            />
          </Pressable>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === activeIndex ? '#EE0000' : '#CCCCCC' }
            ]}
          />
        ))}
      </View>

      {/* Full Screen Modal */}
      <Modal visible={isFullScreen} animationType="fade" transparent={true} onRequestClose={() => setIsFullScreen(false)}>
        <View style={styles.modalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Pressable style={styles.closeBtn} onPress={() => setIsFullScreen(false)}>
                <IconSymbol name="xmark" size={24} color="#fff" />
              </Pressable>
            </View>
            <ScrollView
              ref={fullScreenScrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleFullScreenScroll}
              style={{ flex: 1 }}
            >
              {images.map((img, index) => (
                <View key={index} style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Image
                    source={{ uri: img }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                    transition={500}
                  />
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
    position: 'relative',
  },
  scrollView: {
    width: '100%',
    aspectRatio: 1,
  },
  slide: {
    width: width,
    aspectRatio: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topActions: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  outOfStockBadge: {
    backgroundColor: '#EE0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 'auto',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalHeader: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
