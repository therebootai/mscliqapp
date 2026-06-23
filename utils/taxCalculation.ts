import { TaxSlab } from '@/store/cartStore';

/**
 * Calculate total tax amount and per-slab breakdown for a given price and tax slabs.
 *
 * @param price - The base price (should be effective price after discount)
 * @param taxSlabs - Array of tax slabs e.g., [{name: "CGST", slab: 9}, {name: "SGST", slab: 9}]
 * @returns Tax calculation breakdown
 */
export function calculateTax(
  price: number,
  rawTaxSlabs: any
): {
  taxDetails: { name: string; slab: number; amount: number }[];
  totalTax: number;
  totalTaxRate: number;
} {
  if (!rawTaxSlabs) {
    return { taxDetails: [], totalTax: 0, totalTaxRate: 0 };
  }

  // Ensure taxSlabs is an array
  const taxSlabs = Array.isArray(rawTaxSlabs) ? rawTaxSlabs : [rawTaxSlabs];

  if (taxSlabs.length === 0) {
    return { taxDetails: [], totalTax: 0, totalTaxRate: 0 };
  }

  const taxDetails = taxSlabs.map((t) => {
    const slabVal = (t && typeof t === 'object' && t.slab !== undefined) ? t.slab : t;
    const numericSlab = Number(slabVal) || 0;
    const name = (t && typeof t === 'object' && t.name) ? t.name : 'Tax';
    
    return {
      name,
      slab: numericSlab,
      amount: Math.round(price * (numericSlab / 100)),
    };
  });

  const totalTax = taxDetails.reduce((sum, td) => sum + td.amount, 0);
  const totalTaxRate = taxDetails.reduce((sum, td) => sum + td.slab, 0);

  return { taxDetails, totalTax, totalTaxRate };
}

/**
 * Calculate price breakdown including tax.
 *
 * @param price - Base price (before tax)
 * @param isTaxInclude - Whether the displayed price includes tax
 * @param taxSlabs - Tax slabs to apply
 * @returns Breakdown of taxable amount, tax amount, and total
 */
export function getPriceBreakdown(
  price: number,
  isTaxInclude: boolean,
  taxSlabs: TaxSlab[] | null | undefined
): {
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxDetails: { name: string; slab: number; amount: number }[];
} {
  const { taxDetails, totalTax, totalTaxRate } = calculateTax(price, taxSlabs);

  let taxableAmount: number;
  let taxAmount: number;

  if (isTaxInclude && totalTaxRate > 0) {
    // Price already includes tax - extract the taxable portion
    const rateDecimal = totalTaxRate / 100;
    taxableAmount = Math.round(price / (1 + rateDecimal));
    taxAmount = price - taxableAmount;
  } else {
    // Price is ex-tax
    taxableAmount = price;
    taxAmount = totalTax;
  }

  return {
    taxableAmount,
    taxAmount,
    totalAmount: taxableAmount + taxAmount,
    taxDetails,
  };
}

/**
 * Format currency for display (Indian Rupees)
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get human-readable tax rate string (e.g., "18% GST (CGST 9% + SGST 9%)")
 */
export function getTaxRateString(taxSlabs: TaxSlab[] | null | undefined): string {
  if (!taxSlabs || taxSlabs.length === 0) return '';

  const totalRate = taxSlabs.reduce((sum, t) => sum + t.slab, 0);
  const slabsStr = taxSlabs.map((t) => `${t.name} ${t.slab}%`).join(' + ');

  return `${totalRate}% GST (${slabsStr})`;
}

/**
 * Calculate total tax for a cart item (price * quantity * tax rate)
 */
export function calculateItemTax(price: number, quantity: number, taxSlabs: TaxSlab[] | null | undefined): number {
  if (!taxSlabs || taxSlabs.length === 0) return 0;

  const subtotal = price * quantity;
  const { totalTax } = calculateTax(subtotal, taxSlabs);
  return totalTax;
}

/**
 * Calculate totals for a list of cart items
 */
export function calculateCartTotals(
  items: Array<{ price?: number; quantity: number; effectiveTax?: TaxSlab[] | null }>,
  couponDiscount: number = 0
): {
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  itemTaxBreakdown: Array<{
    taxDetails: { name: string; slab: number; amount: number }[];
    totalTax: number;
  }>;
} {
  let subtotal = 0;
  
  items.forEach((item) => {
    subtotal += (item.price || 0) * item.quantity;
  });

  const itemDiscounts = items.map(item => {
    if (couponDiscount <= 0 || subtotal === 0) return 0;
    const itemSubtotal = (item.price || 0) * item.quantity;
    const weight = itemSubtotal / subtotal;
    return Math.round(couponDiscount * weight);
  });

  let totalTax = 0;
  const itemTaxBreakdown: Array<{
    taxDetails: { name: string; slab: number; amount: number }[];
    totalTax: number;
  }> = [];

  items.forEach((item, index) => {
    const itemSubtotal = (item.price || 0) * item.quantity;
    const effectiveSubtotal = Math.max(0, itemSubtotal - (itemDiscounts[index] || 0));

    const { taxDetails, totalTax: itemTax } = calculateTax(effectiveSubtotal, item.effectiveTax);
    totalTax += itemTax;

    itemTaxBreakdown.push({ taxDetails, totalTax: itemTax });
  });

  return {
    subtotal,
    totalTax,
    grandTotal: subtotal - couponDiscount + totalTax,
    itemTaxBreakdown,
  };
}