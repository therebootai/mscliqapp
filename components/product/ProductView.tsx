import React, { useState, useEffect } from "react";
import { 
  StyleSheet, View, ScrollView, Dimensions, 
  Pressable, TextInput, ActivityIndicator, useWindowDimensions
} from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import ProductGallery from "./ProductGallery";
import RenderHtml from 'react-native-render-html';
import { ENDPOINTS } from '@/config/api';
import { useWishlistStore } from "@/store/wishlistStore";
export interface ProductViewProps {
  data: any;
  onAddToCart?: () => void;
  onBuyNow?: () => void;
}

const TrustIcon = ({ icon, label }: { icon: any, label: string }) => (
  <View style={styles.trustItem}>
    <View style={styles.trustIconWrapper}>
      <IconSymbol name={icon} size={24} color="#EE0000" />
    </View>
    <ThemedText style={styles.trustLabel}>{label}</ThemedText>
  </View>
);

export default function ProductView({ data, onAddToCart, onBuyNow }: ProductViewProps) {
  const { width } = useWindowDimensions();
  const { currentVariant, siblingOptions, effectiveTax } = data;
  const product = currentVariant.productId;

  const isInWishlist = useWishlistStore((state) => state.isInWishlist);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const inWishlist = isInWishlist(currentVariant._id);

  const [pincode, setPincode] = useState("");
  const [checkingPin, setCheckingPin] = useState(false);
  const [pinResult, setPinResult] = useState<string | null>(null);
  const [specsExpanded, setSpecsExpanded] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if (!product?._id) return;
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const res = await fetch(`${ENDPOINTS.REVIEWS_BY_PRODUCT}/${product._id}`);
        const result = await res.json();
        if (result.success || result.data) {
          setReviews(result.data || []);
        }
      } catch (err) {
        console.log("Error fetching reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [product?._id]);

  const avgRating = reviews.length > 0 
    ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
    : 0;

  const images = [
    currentVariant.coverImage.url,
    ...(currentVariant.imagesArray?.map((img: any) => img.url) || [])
  ];

  const stockStatus = 
    !currentVariant.stocks || Number(currentVariant.stocks) <= 0
      ? "out" : Number(currentVariant.stocks) <= 10 ? "low" : "available";

  const handleCheckPincode = async () => {
    if (pincode.length !== 6) return;
    setCheckingPin(true);
    setPinResult(null);
    try {
      const url = `${ENDPOINTS.COURIER_SERVICEABILITY}?pickup_postcode=734001&delivery_postcode=${pincode}&weight=0.5`;
      const res = await fetch(url);
      const data = await res.json();
      const couriers = data?.data?.data?.available_courier_companies;

      if ((data?.success || data?.statusCode === 200) && couriers && couriers.length > 0) {
        const courier = couriers[0];
        setPinResult(`Delivery by ${courier.etd || '3-5 days'}`);
      } else {
        setPinResult("Delivery not available for this pincode");
      }
    } catch (err: any) {
      setPinResult("Delivery not available for this pincode");
    } finally {
      setCheckingPin(false);
    }
  };

  const discount = currentVariant.mrp && currentVariant.mrp > currentVariant.price 
    ? Math.round(((currentVariant.mrp - currentVariant.price) / currentVariant.mrp) * 100)
    : 0;

  const handleWishlist = () => {
    toggleWishlist({
      _id: product._id,
      variantId: currentVariant._id, // use variant's _id as variantId
      title: currentVariant.title,
      image: currentVariant.coverImage?.url || '',
      price: currentVariant.price.toString(),
      oldPrice: currentVariant.mrp?.toString(),
      discount: discount.toString(),
      categoryName: product.categoryId?.name,
      slug: currentVariant.slug,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Gallery */}
        <ProductGallery 
          images={images}
          isWishlisted={inWishlist}
          onWishlist={handleWishlist}
          isOutOfStock={stockStatus === 'out'}
        />

        <View style={styles.detailsContainer}>

          {/* Title */}
          <ThemedText style={styles.title}>{currentVariant.title}</ThemedText>
          {effectiveTax && effectiveTax.length > 0 && (
            <ThemedText style={styles.taxInfo}>(excl. of all taxes)</ThemedText>
          )}

          {/* Ratings Summary */}
          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <IconSymbol 
                  key={star} 
                  name={star <= Math.round(avgRating) ? "star.fill" : "star"} 
                  size={14} 
                  color={star <= Math.round(avgRating) ? "#FFB800" : "#BBBBBB"} 
                />
              ))}
            </View>
            <ThemedText style={styles.reviewCount}>
              {avgRating.toFixed(1)} ({reviews.length} Reviews)
            </ThemedText>
          </View>

          {/* Brand */}
          <View style={styles.brandRow}>
            {product.brandId?.logoUrl ? (
              <Image source={{ uri: product.brandId.logoUrl }} style={{ width: 80, height: 24 }} contentFit="contain" />
            ) : (
              <ThemedText style={styles.brandText}>{product.brandId?.name || "Generic"}</ThemedText>
            )}
          </View>

          {/* Pincode Check */}
          <View style={styles.pincodeSection}>
            <View style={styles.pincodeInputRow}>
              <View style={styles.inputWrapper}>
                <IconSymbol name="location" size={16} color="#555" style={styles.pinIcon} />
                <TextInput 
                  style={styles.pinInput}
                  placeholder="Pin code"
                  keyboardType="numeric"
                  maxLength={6}
                  value={pincode}
                  onChangeText={(val) => setPincode(val.replace(/\D/g, ''))}
                />
              </View>
              <Pressable 
                style={[styles.pinBtn, (pincode.length !== 6 || checkingPin) && styles.pinBtnDisabled]} 
                onPress={handleCheckPincode}
                disabled={pincode.length !== 6 || checkingPin}
              >
                {checkingPin ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText style={styles.pinBtnText}>Check</ThemedText>}
              </Pressable>
            </View>
            <ThemedText style={styles.pinResultText}>
              {pinResult ? pinResult : "Check delivery"}
            </ThemedText>
          </View>

          {/* Price & Stock */}
          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.priceWrap}>
                <ThemedText style={styles.price}>₹{currentVariant.price.toLocaleString()}</ThemedText>
                {discount > 0 && (
                  <>
                    <ThemedText style={styles.mrp}>₹{currentVariant.mrp.toLocaleString()}</ThemedText>
                    <ThemedText style={styles.discountBadge}>{discount}% Off</ThemedText>
                  </>
                )}
              </View>
              {effectiveTax && effectiveTax.length > 0 && (
                <ThemedText style={styles.taxNote}>
                  {effectiveTax.map((t: any) => `${t.slab}% ${t.name}`).join(' + ')} will be applied at checkout
                </ThemedText>
              )}
            </View>

            <View style={styles.stockWrap}>
              <ThemedText style={styles.stockCount}>{currentVariant.stocks}</ThemedText>
              <View style={styles.stockDot} />
              <ThemedText style={[
                styles.stockStatus,
                stockStatus === 'out' ? { color: '#EE0000' } : stockStatus === 'low' ? { color: '#FF9800' } : { color: '#4CAF50' }
              ]}>
                {stockStatus === 'out' ? 'Out of Stock' : stockStatus === 'low' ? 'Low Stock' : 'In-Stock'}
              </ThemedText>
            </View>
          </View>

          {/* Trust Icons */}
          <View style={styles.trustGrid}>
            <TrustIcon icon="headphones" label="24x7 Support" />
            <TrustIcon icon="return" label="Easy Return" />
            <TrustIcon icon="shield" label="100% Original" />
            <TrustIcon icon="award" label="Make In India" />
          </View>

          {/* Specs */}
          {product.specs && product.specs.length > 0 && (
            <View style={styles.specsSection}>
              <ThemedText style={styles.sectionTitle}>Specifications</ThemedText>
              <View style={styles.specsTable}>
                {(specsExpanded ? product.specs : product.specs.slice(0, 3)).map((spec: any, i: number) => (
                  <View key={i} style={[styles.specRow, i % 2 === 0 && styles.specRowAlt]}>
                    <ThemedText style={styles.specKey}>{spec.key}</ThemedText>
                    <ThemedText style={styles.specValue}>{spec.value}</ThemedText>
                  </View>
                ))}
              </View>
              {product.specs.length > 3 && (
                <Pressable onPress={() => setSpecsExpanded(!specsExpanded)}>
                  <ThemedText style={styles.readMoreBtn}>{specsExpanded ? "Read Less" : "Read More"}</ThemedText>
                </Pressable>
              )}
            </View>
          )}

          {/* Description */}
          {product.desc && (
            <View style={styles.descSection}>
              <ThemedText style={styles.sectionTitle}>Product Details</ThemedText>
              <RenderHtml
                contentWidth={width - 30}
                source={{ html: product.desc }}
                baseStyle={{ fontSize: 13, color: '#555555', lineHeight: 20 }}
              />
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <ThemedText style={styles.sectionTitle}>Ratings & Reviews</ThemedText>
            {reviewsLoading ? (
              <ActivityIndicator size="small" color="#EE0000" style={{ marginTop: 10 }} />
            ) : reviews.length === 0 ? (
              <ThemedText style={styles.noReviewsText}>No reviews yet. Be the first to review!</ThemedText>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map((review, idx) => (
                  <View key={review._id || idx} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewRatingBadge}>
                        <IconSymbol name="star.fill" size={10} color="#fff" />
                        <ThemedText style={styles.reviewRatingText}>{review.rating}</ThemedText>
                      </View>
                      <ThemedText style={styles.reviewerName}>User</ThemedText>
                    </View>
                    <ThemedText style={styles.reviewComment}>{review.comment}</ThemedText>
                    {review.createdAt && (
                      <ThemedText style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </ThemedText>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.cartBtn} onPress={onAddToCart}>
          <IconSymbol name="cart.fill" size={18} color="#222" />
          <ThemedText style={styles.cartBtnText}>Add to Cart</ThemedText>
        </Pressable>
        <Pressable 
          style={[styles.buyBtn, stockStatus === 'out' && styles.buyBtnDisabled]} 
          onPress={onBuyNow}
          disabled={stockStatus === 'out'}
        >
          <IconSymbol name="bag" size={18} color="#fff" />
          <ThemedText style={styles.buyBtnText}>Buy Now</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom bar
  },
  detailsContainer: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    lineHeight: 24,
  },
  taxInfo: {
    fontSize: 11,
    color: '#555',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewCount: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  brandRow: {
    marginTop: 12,
    marginBottom: 8,
  },
  brandText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    textTransform: 'uppercase',
  },
  pincodeSection: {
    marginVertical: 15,
    width: '100%',
  },
  pincodeInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  pinIcon: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    height: 40,
    paddingLeft: 35,
    paddingRight: 10,
    fontSize: 14,
    color: '#222',
  },
  pinBtn: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinBtnDisabled: {
    opacity: 0.5,
  },
  pinBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pinResultText: {
    fontSize: 12,
    color: '#555',
    marginTop: 5,
    fontStyle: 'italic',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 15,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EE0000',
  },
  mrp: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    color: '#00E379',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taxNote: {
    fontSize: 10,
    color: '#555',
    marginTop: 2,
  },
  stockWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
  },
  stockDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
  },
  stockStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    marginVertical: 15,
  },
  trustItem: {
    alignItems: 'center',
    width: '24%',
    gap: 5,
  },
  trustIconWrapper: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF0F0',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustLabel: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    fontWeight: '600',
  },
  specsSection: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },
  specsTable: {
    borderWidth: 1,
    borderColor: '#CACACA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#CACACA',
  },
  specRowAlt: {
    backgroundColor: '#F9F9F9',
  },
  specKey: {
    width: '40%',
    padding: 10,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222',
    borderRightWidth: 1,
    borderRightColor: '#CACACA',
  },
  specValue: {
    width: '60%',
    padding: 10,
    fontSize: 12,
    color: '#555',
  },
  readMoreBtn: {
    color: '#EE0000',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
  },
  descSection: {
    marginVertical: 15,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 15,
    paddingBottom: 25, // For safe area on iOS
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  cartBtn: {
    flex: 1,
    backgroundColor: '#FFD700',
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cartBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
  },
  buyBtn: {
    flex: 1,
    backgroundColor: '#EE0000',
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buyBtnDisabled: {
    backgroundColor: '#ccc',
  },
  buyBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  reviewsSection: {
    marginVertical: 15,
  },
  noReviewsText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  reviewsList: {
    marginTop: 10,
    gap: 15,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  reviewRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34A853',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  reviewRatingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#222',
  },
  reviewComment: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
  reviewDate: {
    fontSize: 10,
    color: '#888',
    marginTop: 6,
  }
});
