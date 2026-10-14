export type Currency = 'USD' | 'EUR' | 'GBP' | 'IDR';
export type Language = 'en' | 'fr' | 'id';

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ATELIER_DIRECTOR' 
  | 'INVENTORY_MANAGER' 
  | 'MERCHANDISER' 
  | 'CLIENT_CONCIERGE' 
  | 'FINANCE' 
  | 'CLIENT';

export type LoyaltyTier = 'PATRON_SILVER' | 'GOLD_PATRON' | 'PLATINUM_CIRCLE';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  tier: LoyaltyTier;
  points: number;
  deliveryAddress?: {
    street: string;
    apartment?: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
  };
}

export interface ProductVariant {
  id: string;
  sku: string;
  colorName: string;
  colorHex: string;
  size: string;
  priceUSD: number; // Integer in USD (e.g. 1950)
  priceIDR?: number; // Integer in IDR
  compareAtPriceUSD?: number;
  weightGrams: number;
  stockOnHand: number;
  stockReserved: number;
  stockAvailable: number;
  isSoldOut?: boolean;
}

export interface ProductMedia {
  isConcept?: boolean;
  id: string;
  url: string;
  type: 'image' | 'video';
  altText?: string;
  variantColor?: string;
  isCover?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  frenchTitle?: string;
  category: 'Handbags' | 'Ready-to-Wear' | 'Footwear' | 'Small Leather Goods' | 'Fragrance & Jewelry';
  subCategory?: string;
  collectionSeason?: string;
  tagline: string;
  description: string;
  materialDetails: string;
  dimensions: string;
  careGuide: string;
  madeIn: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'PREORDER' | 'SOLD_OUT';
  isLimitedEdition?: boolean;
  isPersonalizable?: boolean;
  excludeFromDiscounts?: boolean;
  isFeaturedOnMainPage?: boolean;
  isSoldOut?: boolean;
  variants: ProductVariant[];
  media: ProductMedia[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface VideoHotspot {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  priceUSD: number;
  imageUrl: string;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  startSec: number;
  endSec: number;
  label?: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  seasonBadge: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  desktopVideoUrl: string;
  mobileVideoUrl: string;
  posterUrl: string;
  durationSec: number;
  sortOrder: number;
  isActive: boolean;
  licenseRights: string;
  hotspots: VideoHotspot[];
}

export interface CartItem {
  id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  customEngraving?: string; // e.g. "V.L."
  engravingFoil?: 'gold' | 'silver' | 'blind';
  isGiftWrapped?: boolean;
  giftCardMessage?: string;
}

export type OrderStatus = 
  | 'AWAITING_PAYMENT' 
  | 'CONFIRMED' 
  | 'ATELIER_INSPECTION' 
  | 'PACKED_WHITE_GLOVE' 
  | 'IN_TRANSIT' 
  | 'DELIVERED' 
  | 'COMPLETED';

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  items: CartItem[];
  subtotalUSD: number;
  discountUSD: number;
  shippingFeeUSD: number;
  shippingInsuranceUSD: number;
  taxAmountUSD: number;
  totalAmountUSD: number;
  shippingAddress: {
    receiverName: string;
    phone: string;
    street: string;
    apartment?: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
  };
  courier: {
    name: string;
    service: string;
    trackingNumber?: string;
  };
  paymentMethod: string;
  paymentDueDate: string;
  voucherCodeUsed?: string;
  isGiftWrapped?: boolean;
  giftMessage?: string;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  value: number; // percentage (e.g. 10) or nominal amount in USD
  minSpendUSD: number;
  maxDiscountUSD?: number;
  budgetLimitUSD?: number;
  budgetUsedUSD: number;
  usageCount: number;
  isMembersOnly?: boolean;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface Boutique {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  hours: string;
  imageUrl: string;
  appointmentAvailable: boolean;
  features: string[];
}

export interface Appointment {
  id: string;
  boutiqueId: string;
  boutiqueName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  timeSlot: string;
  serviceType: 'PRIVATE_STYLING' | 'BESPOKE_MONOGRAM' | 'ATELIER_INSPECTION' | 'HIGH_JEWELRY_CURATION';
  beveragePreference?: string;
  notes?: string;
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  coverImage: string;
  excerpt: string;
  content: string;
}

export interface AuthenticityRecord {
  serialCode: string;
  productName: string;
  edition: string;
  craftDate: string;
  masterArtisan: string;
  tanneryOrigin: string;
  materials: string;
  status: 'AUTHENTIC_VERIFIED' | 'DIGITAL_PASSPORT_ACTIVE' | 'REGISTERED_HEIRLOOM';
  registeredOwner?: string;
  warrantyValidUntil: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details: string;
}
