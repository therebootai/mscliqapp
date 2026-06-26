export const API_BASE_URL = "https://api.mscliq.com/api/v1";
export const BASE_URL = API_BASE_URL;

export const RAZORPAY_KEY_ID = "rzp_live_SrdEGPK0DCNVpv"; // Replace with your real live key when ready

export const ENDPOINTS = {
  PRODUCTS: `${API_BASE_URL}/products`,
  CATEGORIES: `${API_BASE_URL}/categories`,
  PRODUCTS_BY_CATEGORY: `${API_BASE_URL}/products/category`,
  VARIANT_BY_SLUG: `${API_BASE_URL}/variants/slug`,
  REVIEWS_BY_PRODUCT: `${API_BASE_URL}/review/product`,
  COURIER_SERVICEABILITY: `${API_BASE_URL}/courier/serviceability`,
  CATEGORY_FILTERS: `${API_BASE_URL}/products/category`, // Appended dynamically with /[slug]/filters
  SEARCH_FILTERS: `${API_BASE_URL}/products/search/filters`,
  // Add other endpoints here as needed
};
