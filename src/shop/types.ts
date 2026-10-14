export interface Variant {
  id: string;
  sku: string;
  color: string;
  hex: string;
  size: string;
  stock: number;
  productId?: string;
}
export interface Product {
  version?: number;
  id: string;
  slug: string;
  name: string;
  sku: string;
  category: string;
  collection: string;
  description: string;
  translations?: { fr?: { description?: string } };
  material: string;
  care: string;
  sizeGuide: string;
  price: number;
  comparePrice: number;
  visible: boolean;
  featured: boolean;
  sortOrder: number;
  labels: string[];
  images: string[];
  imageNote: string;
  createdAt: string;
  variants: Variant[];
}
export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "buyer";
  createdAt: string;
}
export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
}
export interface CartLine {
  variantId: string;
  quantity: number;
}
export interface Home {
  title: string;
  subtitle: string;
  description: string;
  translations?: {
    fr?: Partial<
      Record<
        | "title"
        | "subtitle"
        | "description"
        | "cta"
        | "announcement"
        | "promoTitle"
        | "promoText",
        string
      >
    >;
  };
  poster: string;
  cta: string;
  ctaLink: string;
  announcement: string;
  promoTitle: string;
  promoText: string;
  promoImage: string;
  sections: string[];
  hiddenSections: string[];
  featuredIds: string[];
  testimonials: { name: string; text: string }[];
}
export interface Bootstrap {
  products: Product[];
  categories: Category[];
  home: Home;
  me: User | null;
  demo: boolean;
}
export interface OrderLine {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
}
export interface Quote {
  items: OrderLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingMethod: string;
  coupon: string;
}
export interface Order extends Quote {
  id: string;
  userId: string;
  customerName: string;
  email: string;
  address: Address;
  paymentMethod: string;
  status: string;
  tracking: string;
  createdAt: string;
  history: { status: string; at: string; note: string }[];
}
export interface Coupon {
  id: string;
  name: string;
  code: string;
  type: string;
  value: number;
  minSpend: number;
  maxDiscount: number;
  limit: number;
  used: number;
  active: boolean;
  start: string;
  end: string;
}
export interface Review {
  id: string;
  productId: string;
  userId: string;
  name: string;
  rating: number;
  text: string;
  status: string;
  createdAt: string;
}
export interface AdminData {
  products: Product[];
  categories: Category[];
  home: Home;
  coupons: Coupon[];
  orders: Order[];
  customers: User[];
  engagement: { kind: string; owner: string; data: any; updatedAt: string }[];
  reviews: Review[];
  stockLog: {
    id: string;
    variantId: string;
    delta: number;
    balance: number;
    reason: string;
    actor: string;
    createdAt: string;
  }[];
  events: { productId: string; kind: string; count: number }[];
  visitors: number;
}
