import { CAMPAIGN_MEDIA } from '../data/campaignMedia';
import assetMap from '../data/assetMap.json';
import { 
  Product, 
  HeroSlide, 
  CartItem, 
  Order, 
  Boutique, 
  Appointment, 
  Promotion, 
  AuditLogEntry, 
  AuthenticityRecord, 
  Currency,
  UserProfile
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_HERO_SLIDES, 
  INITIAL_BOUTIQUES, 
  INITIAL_JOURNAL, 
  INITIAL_AUTHENTICITY_RECORDS, 
  INITIAL_PROMOTIONS 
} from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'vassel_products_v4',
  HERO_SLIDES: 'vassel_hero_slides_v4',
  CART: 'vassel_cart_v3',
  ORDERS: 'vassel_orders_v3',
  APPOINTMENTS: 'vassel_appointments_v3',
  PROMOTIONS: 'vassel_promotions_v3',
  AUDIT_LOGS: 'vassel_audit_logs_v3',
  WISHLIST: 'vassel_wishlist_v3',
  STOCK_RESERVATION: 'vassel_stock_reservation_v3',
  AUTH_USER: 'vassel_auth_user_v3',
};

// Rates relative to USD (1 USD = base)
const EXCHANGE_RATES: Record<Currency, { rate: number; symbol: string; locale: string }> = {
  USD: { rate: 1.0, symbol: '$', locale: 'en-US' },
  EUR: { rate: 0.92, symbol: '€', locale: 'fr-FR' },
  GBP: { rate: 0.79, symbol: '£', locale: 'en-GB' },
  IDR: { rate: 15800, symbol: 'Rp ', locale: 'id-ID' },
};

export function formatCurrency(amountUSD: number, currency: Currency = 'USD'): string {
  const config = EXCHANGE_RATES[currency] || EXCHANGE_RATES.USD;
  const converted = amountUSD * config.rate;

  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(converted);
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(converted);
}

function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    const value = item ? JSON.parse(item) : fallback;
    return (Array.isArray(fallback) && !Array.isArray(value)) || (value === null && fallback !== null) ? fallback : value;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    window.dispatchEvent(new Event('vassel-storage-unavailable'));
    return false;
  }
}

// ==========================================
// --- USER AUTHENTICATION & VIP MEMBERSHIP ---
// ==========================================
export function getCurrentUser(): UserProfile | null {
  const user = getLocal<UserProfile | null>(STORAGE_KEYS.AUTH_USER, null);
  return user && typeof user.fullName === 'string' && typeof user.email === 'string' && typeof user.id === 'string' ? user : null;
}

export function setCurrentUser(user: UserProfile | null): boolean {
  if (!setLocal(STORAGE_KEYS.AUTH_USER, user)) return false;
  window.dispatchEvent(new Event('vassel-user'));
  return true;
}

export function loginUser(email: string, fullName: string = 'Vassel Client', phone?: string): UserProfile {
  const existing = getCurrentUser();
  if (existing && existing.email.toLowerCase() === email.toLowerCase()) {
    return existing;
  }

  const newUser: UserProfile = {
    id: 'usr-' + Date.now(),
    fullName: fullName || 'VIP Patron',
    email: email.trim(),
    phone: phone || '',
    role: 'CLIENT',
    tier: 'PATRON_SILVER',
    points: 0,

  };

  if (!setCurrentUser(newUser)) throw new Error('Browser storage is unavailable. Your profile was not saved.');
  logAudit('CLIENT_LOGIN', `Client ${newUser.fullName} (${newUser.email}) authenticated as Gold Patron.`);
  return newUser;
}

export function logoutUser(): boolean {
  const current = getCurrentUser();
  if (current) {
    logAudit('CLIENT_LOGOUT', `Client ${current.email} logged out.`);
  }
  return setCurrentUser(null);
}

// ==========================================
// --- AUDIT LOGGER ---
// ==========================================
export function logAudit(
  action: string, 
  details: string, 
  actor: string = 'Atelier Director', 
  role: string = 'SUPER_ADMIN'
) {
  const currentLogs = getLocal<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  const newEntry: AuditLogEntry = {
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    actor,
    role,
    action,
    details,
  };
  setLocal(STORAGE_KEYS.AUDIT_LOGS, [newEntry, ...currentLogs].slice(0, 200));
}

export function getAuditLogs(): AuditLogEntry[] {
  return getLocal<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, [
    {
      id: 'log-bootstrap',
      timestamp: new Date().toISOString(),
      actor: 'Genesis Atelier Protocol',
      role: 'SYSTEM',
      action: 'ATELIER_INITIALIZED',
      details: 'Maison VASSEL architecture loaded with quiet luxury design tokens & verified runway video catalog.',
    },
  ]);
}

// ==========================================
// --- PRODUCTS & INVENTORY ---
// ==========================================
function withCampaignMedia(product: Product): Product {
  const media = CAMPAIGN_MEDIA[product.id];
  // Keep administrator-uploaded imagery intact; upgrade the original stock references only.
  const isReference = product.media.every(m => m.url.includes('images.unsplash.com') || m.url.startsWith('/images/catalog/') || m.id.startsWith('concept-') || m.url === '/images/vassel-cuff.webp');
  return media && isReference ? {...product, media} : product;
}

export function getProducts(): Product[] {
  const stored = getLocal<Product[] | null>(STORAGE_KEYS.PRODUCTS, null);
  if (!Array.isArray(stored)) {
    setLocal(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS.map(withCampaignMedia);
  }

  return stored.filter(p => p && typeof p.id === 'string' && typeof p.slug === 'string' && typeof p.name === 'string' && typeof p.category === 'string' && Array.isArray(p.variants) && p.variants.length && p.variants.every(v => v && typeof v.id === 'string' && Number.isFinite(v.priceUSD) && Number.isFinite(v.stockAvailable)) && Array.isArray(p.media) && p.media.every(m => m && typeof m.url === 'string')).map(p => ({...p, media: p.media.map(m => ({...m, url: (assetMap as Record<string, string>)[m.url] || m.url}))})).map(withCampaignMedia);
}

export function resetToInitialCatalog(): Product[] {
  setLocal(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  logAudit('CATALOG_RESET', 'Atelier Director re-seeded catalogue to pristine initial archives.');
  return INITIAL_PRODUCTS.map(withCampaignMedia);
}

export function saveProducts(products: Product[]): void {
  setLocal(STORAGE_KEYS.PRODUCTS, products);
}

export function addProduct(product: Product): void {
  const products = getProducts();
  const updated = [product, ...products];
  saveProducts(updated);
  logAudit('PRODUCT_ADDED', `New creation '${product.name}' added to atelier catalog.`);
}

export function updateProduct(updatedProd: Product): void {
  const products = getProducts();
  const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
  saveProducts(updated);
  logAudit('PRODUCT_UPDATED', `Creation '${updatedProd.name}' details modified by Atelier Director.`);
}

export function deleteProduct(productId: string): void {
  const products = getProducts();
  const target = products.find((p) => p.id === productId);
  const updated = products.filter((p) => p.id !== productId);
  saveProducts(updated);
  logAudit('PRODUCT_DELETED', `Creation '${target?.name || productId}' removed from catalog.`);
}

export function toggleProductFeatured(productId: string): void {
  const products = getProducts();
  const updated = products.map((p) => {
    if (p.id === productId) {
      const nextFeatured = !p.isFeaturedOnMainPage;
      logAudit(
        'FEATURED_TOGGLED',
        `Product '${p.name}' main page featured status set to: ${nextFeatured ? 'YES' : 'NO'}`
      );
      return { ...p, isFeaturedOnMainPage: nextFeatured };
    }
    return p;
  });
  saveProducts(updated);
}

export function toggleProductSoldOut(productId: string): void {
  const products = getProducts();
  const updated = products.map((p) => {
    if (p.id === productId) {
      const willBeSoldOut = !p.isSoldOut;
      const updatedStatus = willBeSoldOut ? 'SOLD_OUT' : 'ACTIVE';
      const updatedVariants = p.variants.map((v) => ({
        ...v,
        isSoldOut: willBeSoldOut,
        stockAvailable: willBeSoldOut ? 0 : Math.max(0, v.stockOnHand - v.stockReserved),
      }));
      logAudit(
        'STOCK_STATUS_TOGGLED',
        `Product '${p.name}' toggled to: ${willBeSoldOut ? 'SOLD OUT / HABIS' : 'AVAILABLE / TERSEDIA'}`
      );
      return {
        ...p,
        isSoldOut: willBeSoldOut,
        status: updatedStatus as any,
        variants: updatedVariants,
      };
    }
    return p;
  });
  saveProducts(updated);
}

export function toggleVariantSoldOut(productId: string, variantId: string): void {
  const products = getProducts();
  const updated = products.map((p) => {
    if (p.id === productId) {
      const updatedVariants = p.variants.map((v) => {
        if (v.id === variantId) {
          const nextSoldOut = !v.isSoldOut;
          logAudit(
            'VARIANT_STOCK_TOGGLED',
            `SKU ${v.sku} (${v.colorName}) set to ${nextSoldOut ? 'SOLD OUT' : 'AVAILABLE'}`
          );
          return {
            ...v,
            isSoldOut: nextSoldOut,
            stockAvailable: nextSoldOut ? 0 : Math.max(0, v.stockOnHand - v.stockReserved),
          };
        }
        return v;
      });
      const allVariantsSoldOut = updatedVariants.every((v) => v.isSoldOut || v.stockAvailable === 0);
      return {
        ...p,
        isSoldOut: allVariantsSoldOut,
        variants: updatedVariants,
      };
    }
    return p;
  });
  saveProducts(updated);
}

export function setVariantStock(variantId: string, newStockQty: number, reason: string): void {
  const products = getProducts();
  if (!Number.isFinite(newStockQty)) return;
  const safeQty = Math.max(0, Math.floor(newStockQty));
  let found = false;

  const updated = products.map((p) => {
    let anyVariantUpdated = false;
    const newVariants = p.variants.map((v) => {
      if (v.id === variantId) {
        found = true;
        anyVariantUpdated = true;
        return {
          ...v,
          stockOnHand: safeQty,
          stockAvailable: Math.max(0, safeQty - v.stockReserved),
          isSoldOut: safeQty <= v.stockReserved,
        };
      }
      return v;
    });

    if (anyVariantUpdated) {
      const allSoldOut = newVariants.every((v) => v.stockAvailable === 0 || v.isSoldOut);
      return {
        ...p,
        isSoldOut: allSoldOut,
        status: (p.status === 'ARCHIVED' ? 'ARCHIVED' : allSoldOut ? 'SOLD_OUT' : 'ACTIVE') as Product['status'],
        variants: newVariants,
      };
    }
    return p;
  });

  if (found) {
    saveProducts(updated);
    logAudit('MANUAL_STOCK_SET', `Variant ${variantId} stock directly set to ${safeQty}. Note: ${reason}`);
  }
}

export function updateProductStock(variantId: string, delta: number, reason: string): void {
  const products = getProducts();
  let found = false;
  const updated = products.map((p) => {
    const newVariants = p.variants.map((v) => {
      if (v.id === variantId) {
        found = true;
        const newAvailable = Math.max(0, v.stockAvailable + delta);
        const newOnHand = Math.max(0, v.stockOnHand + delta);
        return {
          ...v,
          stockAvailable: newAvailable,
          stockOnHand: newOnHand,
          isSoldOut: newAvailable === 0,
        };
      }
      return v;
    });
    return { ...p, variants: newVariants };
  });

  if (found) {
    saveProducts(updated);
    logAudit('STOCK_ADJUSTMENT', `SKU ${variantId} stock adjusted by ${delta}. Reason: ${reason}`);
  }
}

// ==========================================
// --- HERO SLIDES ---
// ==========================================
export function getHeroSlides(): HeroSlide[] {
  return getLocal<HeroSlide[]>(STORAGE_KEYS.HERO_SLIDES, INITIAL_HERO_SLIDES).filter(s => s && s.id).map(s => s.desktopVideoUrl?.includes('assets.mixkit.co') ? {...s, desktopVideoUrl: INITIAL_HERO_SLIDES[0].desktopVideoUrl, mobileVideoUrl: INITIAL_HERO_SLIDES[0].mobileVideoUrl, posterUrl: INITIAL_HERO_SLIDES[0].posterUrl, licenseRights: INITIAL_HERO_SLIDES[0].licenseRights, hotspots: []} : s);
}

export function saveHeroSlides(slides: HeroSlide[]): void {
  setLocal(STORAGE_KEYS.HERO_SLIDES, slides);
  logAudit('HERO_SLIDES_UPDATED', `Editorial campaign playlist updated. Active clips: ${slides.filter(s => s.isActive).length}`);
}

// ==========================================
// --- CART & 15-MINUTE STOCK LOCK ---
// ==========================================
export interface StockReservationState {
  cartToken: string;
  expiresAt: number;
  active: boolean;
}

export function getStockReservation(): StockReservationState | null {
  return getLocal<StockReservationState | null>(STORAGE_KEYS.STOCK_RESERVATION, null);
}

export function startStockReservation(durationMinutes: number = 15): StockReservationState {
  const state: StockReservationState = {
    cartToken: 'cart-' + Math.random().toString(36).substring(2, 9),
    expiresAt: Date.now() + durationMinutes * 60 * 1000,
    active: true,
  };
  setLocal(STORAGE_KEYS.STOCK_RESERVATION, state);
  return state;
}

export function getCart(): CartItem[] {
  return getLocal<CartItem[]>(STORAGE_KEYS.CART, []).filter(i => i && i.product && i.variant && Number.isFinite(i.quantity));
}

export function saveCart(items: CartItem[]): void {
  setLocal(STORAGE_KEYS.CART, items);
  if (items.length > 0 && !getStockReservation()) {
    startStockReservation(15);
  }
}

// ==========================================
// --- ORDERS ---
// ==========================================
export function getOrders(): Order[] {
  return getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
}

export function saveOrders(orders: Order[]): void {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

export function addOrder(order: Order): void {
  const orders = getOrders();
  saveOrders([order, ...orders]);
  logAudit('ORDER_CREATED', `New order placed: ${order.orderNumber} for ${order.customerName} - Total: $${order.totalAmountUSD.toLocaleString()}`);
}

export function updateOrderStatus(orderId: string, newStatus: Order['status'], trackingNumber?: string): void {
  const orders = getOrders();
  const updated = orders.map((o) => {
    if (o.id === orderId) {
      const updatedCourier = trackingNumber
        ? { ...o.courier, trackingNumber }
        : o.courier;
      return { ...o, status: newStatus, courier: updatedCourier };
    }
    return o;
  });
  saveOrders(updated);
  logAudit('ORDER_STATUS_CHANGED', `Order ${orderId} transitioned to ${newStatus}${trackingNumber ? ` (Tracking: ${trackingNumber})` : ''}`);
}

// ==========================================
// --- APPOINTMENTS ---
// ==========================================
export function getAppointments(): Appointment[] {
  return getLocal<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
}

export function addAppointment(appointment: Appointment): void {
  const appointments = getAppointments();
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify([appointment, ...appointments]));
  logAudit('APPOINTMENT_RESERVED', `Private Salon booked by ${appointment.clientName} at ${appointment.boutiqueName}`);
}

// ==========================================
// --- AUTHENTICITY RECORDS ---
// ==========================================
export function verifySerialNumber(code: string): AuthenticityRecord | null {
  const normalized = code.trim().toUpperCase();
  const found = INITIAL_AUTHENTICITY_RECORDS.find((r) => r.serialCode.toUpperCase() === normalized);
  return found || null;
}

// ==========================================
// --- PROMOTIONS ---
// ==========================================
export function getPromotions(): Promotion[] {
  return getLocal<Promotion[]>(STORAGE_KEYS.PROMOTIONS, INITIAL_PROMOTIONS);
}

export function savePromotions(promos: Promotion[]): void {
  setLocal(STORAGE_KEYS.PROMOTIONS, promos);
}

export function getWishlist(): string[] { return getLocal<string[]>(STORAGE_KEYS.WISHLIST, []).filter(id => typeof id === 'string'); }
export function saveWishlist(ids: string[]): void { setLocal(STORAGE_KEYS.WISHLIST, ids); }

export function saveDraft(kind: string, data: Record<string, unknown>): void {
  const key = `vassel_${kind}_drafts_v1`;
  const drafts = getLocal<Record<string, unknown>[]>(key, []);
  localStorage.setItem(key, JSON.stringify([{...data, id: crypto.randomUUID(), createdAt: new Date().toISOString()}, ...drafts]));
}

export function getPreferredCurrency(): Currency {
  const value = getLocal<Currency>('vassel_currency', 'USD');
  return ['USD', 'EUR', 'GBP', 'IDR'].includes(value) ? value : 'USD';
}
export function savePreferredCurrency(currency: Currency): void { setLocal('vassel_currency', currency); }
