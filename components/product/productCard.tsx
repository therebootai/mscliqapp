import { StyleSheet, View, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useWishlist } from "@/context/WishlistContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 40) / 2; // (Screen - 2*15 padding - 10 gap) / 2

export interface Product {
  _id: string;
  title: string;
  brandId?: {
    name: string;
  };
  categoryId?: {
    name: string;
    slug: string;
  };
  coverImage?: {
    url: string;
  };
  displayPrice?: number;
  displayMrp?: number;
  displayDiscount?: number;
  price?: number;
  mrp?: number;
  discount?: number;
  ratings?: {
    average: number;
    count: number;
  };
  isNew?: boolean;
  default_slug: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const rating = product.ratings?.average || 0;
  const reviews = product.ratings?.count || 0;
  
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product._id);

  // Safely extract price, handling both 'displayPrice' and 'price' formats
  const price = product.displayPrice ?? product.price ?? 0;
  const mrp = product.displayMrp ?? product.mrp ?? price;
  
  // Safely extract or calculate discount
  let discount = product.displayDiscount ?? product.discount ?? 0;
  if (discount === 0 && mrp > price) {
    discount = Math.round(((mrp - price) / mrp) * 100);
  }

  return (
    <View style={styles.card}>
      {/* Image Area */}
      <View style={styles.imageArea}>
        <Image
          source={{ uri: product.coverImage?.url }}
          style={styles.image}
          contentFit="contain"
          transition={500}
        />
        {product.isNew && (
          <View style={styles.newBadge}>
            <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
          </View>
        )}
        <Pressable 
          style={styles.wishlistBtn}
          onPress={() => toggleWishlist(product)}
        >
          <IconSymbol 
            name={inWishlist ? "heart.fill" : "heart"} 
            size={18} 
            color={inWishlist ? "#EE0000" : "#222222"} 
          />
        </Pressable>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        <View>
          <ThemedText style={styles.brandText} numberOfLines={1}>
            {product.brandId?.name || "Brand"} {product.categoryId?.name && `· ${product.categoryId.name}`}
          </ThemedText>

          <ThemedText style={styles.title} numberOfLines={2}>
            {product.title}
          </ThemedText>
        </View>

        {/* Reviews */}
        <View style={styles.ratingRow}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <IconSymbol
                key={star}
                name={star <= Math.floor(rating) ? "star.fill" : "star"}
                size={12}
                color={star <= Math.floor(rating) ? "#FFB800" : "#BBBBBB"}
              />
            ))}
          </View>
          <ThemedText style={styles.reviewsText}>({reviews})</ThemedText>
        </View>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <View style={styles.priceLeft}>
            <ThemedText style={styles.price}>
              ₹{price.toLocaleString()}
            </ThemedText>
            {mrp > price && (
              <ThemedText style={styles.mrp}>
                ₹{mrp.toLocaleString()}
              </ThemedText>
            )}
          </View>
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <ThemedText style={styles.discount}>
                {discount}% OFF
              </ThemedText>
            </View>
          )}
        </View>

        {/* Cart Button */}
        <Pressable style={styles.cartBtn}>
          <ThemedText style={styles.cartBtnText}>ADD TO CART</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  imageArea: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  newBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#EE0000",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
    zIndex: 1,
  },
  contentArea: {
    padding: 10,
    gap: 2,
    flex: 1,
    justifyContent: "space-between",
  },
  brandText: {
    fontSize: 10,
    color: "#BBBBBB",
    textTransform: "uppercase",
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#222222",
    lineHeight: 16,
    height: 32,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stars: {
    flexDirection: "row",
    gap: 1,
  },
  reviewsText: {
    fontSize: 11,
    color: "#BBBBBB",
    fontWeight: "bold",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  priceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#EE0000",
  },
  mrp: {
    fontSize: 11,
    color: "#BBBBBB",
    textDecorationLine: "line-through",
  },
  discountBadge: {
  },
  discount: {
    fontSize: 10,
    color: "#00E379",
    fontWeight: "bold",
  },
  cartBtn: {
    width: "100%",
    height: 38,
    backgroundColor: "#D3D3D3",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  cartBtnText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 0.5,
  },
});
