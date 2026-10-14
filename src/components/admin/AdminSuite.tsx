import { addCartItem } from '../../lib/commerce';
import { INITIAL_HERO_SLIDES } from '../../data/initialData';
import React, { useState } from 'react';
import { Product, HeroSlide, Order, Promotion, VideoHotspot, AuditLogEntry, Currency } from '../../types';
import { 
  getProducts, 
  saveProducts, 
  getHeroSlides, 
  saveHeroSlides, 
  getOrders, 
  updateOrderStatus, 
  getPromotions, 
  savePromotions, 
  getAuditLogs, 
  logAudit, 
  formatCurrency, 
  updateProductStock,
  toggleProductFeatured,
  toggleProductSoldOut,
  toggleVariantSoldOut,
  setVariantStock,
  resetToInitialCatalog
} from '../../lib/storage';
import { 
  LayoutDashboard, 
  Video, 
  Package, 
  Boxes, 
  Tag, 
  ShoppingBag, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Eye, 
  AlertTriangle,
  Sparkles,
  Star,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Tv,
  Check
} from 'lucide-react';

interface AdminSuiteProps {
  currency: Currency;
  onNavigateHome: () => void;
}

type AdminTab = 
  | 'dashboard'
  | 'main-page'
  | 'hero-video' 
  | 'products' 
  | 'inventory' 
  | 'promotions' 
  | 'orders' 
  | 'audit-log';

export const AdminSuite: React.FC<AdminSuiteProps> = ({ currency, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const [products, setProducts] = useState<Product[]>(getProducts());
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => { const slides = getHeroSlides(); return slides.length ? slides : INITIAL_HERO_SLIDES; });
  const [orders, setOrders] = useState<Order[]>(getOrders());
  const [promotions, setPromotions] = useState<Promotion[]>(getPromotions());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(getAuditLogs());

  // Hero Video Editor State
  const [selectedSlideId, setSelectedSlideId] = useState<string>(heroSlides[0]?.id || '');
  const selectedSlide = heroSlides.find((s) => s.id === selectedSlideId) || heroSlides[0];

  // Hotspot Pinning State
  const [isPinningHotspot, setIsPinningHotspot] = useState(false);
  const [pendingHotspot, setPendingHotspot] = useState<Partial<VideoHotspot>>({
    xPercent: 50,
    yPercent: 50,
    startSec: 0,
    endSec: 10,
    productId: products[0]?.id,
  });

  // Concurrency Simulation
  const [concurrencySimRunning, setConcurrencySimRunning] = useState(false);
  const [simMessage, setSimMessage] = useState('');

  // Hero Video Form State
  const [slideTitle, setSlideTitle] = useState(selectedSlide.title);
  const [slideSubtitle, setSlideSubtitle] = useState(selectedSlide.subtitle);
  const [slideVideoUrl, setSlideVideoUrl] = useState(selectedSlide.desktopVideoUrl);
  const [slidePosterUrl, setSlidePosterUrl] = useState(selectedSlide.posterUrl);
  const [slideSeason, setSlideSeason] = useState(selectedSlide.seasonBadge);
  const [slideCtaText, setSlideCtaText] = useState(selectedSlide.ctaText);
  const [slideCtaLink, setSlideCtaLink] = useState(selectedSlide.ctaLink);
  const [videoSaveNotice, setVideoSaveNotice] = useState('');

  // Main Page curation state
  const [mainPageCategoryFilter, setMainPageCategoryFilter] = useState('ALL');
  const [mainPageSearch, setMainPageSearch] = useState('');

  const handleToggleSoldOut = (productId: string) => {
    toggleProductSoldOut(productId);
    const updated = getProducts();
    setProducts(updated);
    setAuditLogs(getAuditLogs());
  };

  const handleToggleFeatured = (productId: string) => {
    toggleProductFeatured(productId);
    const updated = getProducts();
    setProducts(updated);
    setAuditLogs(getAuditLogs());
  };

  const handleSetVariantStock = (variantId: string, qty: number) => {
    setVariantStock(variantId, qty, 'Manual Atelier stock update from Admin Suite');
    const updated = getProducts();
    setProducts(updated);
    setAuditLogs(getAuditLogs());
  };

  const handleSaveHeroVideo = () => {
    const updatedSlides = heroSlides.map((s) => {
      if (s.id === selectedSlide.id) {
        return {
          ...s,
          title: slideTitle,
          subtitle: slideSubtitle,
          desktopVideoUrl: slideVideoUrl,
          mobileVideoUrl: slideVideoUrl,
          posterUrl: slidePosterUrl,
          seasonBadge: slideSeason,
          ctaText: slideCtaText,
          ctaLink: slideCtaLink,
        };
      }
      return s;
    });
    setHeroSlides(updatedSlides);
    saveHeroSlides(updatedSlides);
    setVideoSaveNotice('Runway hero video settings saved & active on Main Page.');
    logAudit('HERO_VIDEO_UPDATED', `Hero video slide '${slideTitle}' updated with video source '${slideVideoUrl}'`);
    setTimeout(() => setVideoSaveNotice(''), 3500);
  };

  const handleReseedCatalog = () => {
    const reseeded = resetToInitialCatalog();
    setProducts(reseeded);
    setAuditLogs(getAuditLogs());
  };

  // Orders Filter
  const [trackingInput, setTrackingInput] = useState('');

  // Dashboard KPIs
  const totalRevenueUSD = orders.reduce((acc, o) => acc + o.totalAmountUSD, 0);
  const totalOrdersCount = orders.length;
  const averageOrderValueUSD = totalOrdersCount > 0 ? Math.round(totalRevenueUSD / totalOrdersCount) : 0;
  const lowStockVariants = products.flatMap((p) =>
    p.variants.filter((v) => v.stockAvailable <= 3).map((v) => ({ ...v, productName: p.name }))
  );

  const handleFrameClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPinningHotspot) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingHotspot((prev) => ({
      ...prev,
      xPercent: Math.round(x * 10) / 10,
      yPercent: Math.round(y * 10) / 10,
    }));
  };

  const handleSaveHotspot = () => {
    if (!pendingHotspot.productId) return;
    const targetProduct = products.find((p) => p.id === pendingHotspot.productId);
    if (!targetProduct) return;

    const newHotspot: VideoHotspot = {
      id: 'hotspot-' + Date.now(),
      productId: targetProduct.id,
      productName: targetProduct.name,
      productSlug: targetProduct.slug,
      priceUSD: targetProduct.variants[0].priceUSD,
      imageUrl: targetProduct.media[0]?.url,
      xPercent: pendingHotspot.xPercent ?? 50,
      yPercent: pendingHotspot.yPercent ?? 50,
      startSec: pendingHotspot.startSec || 0,
      endSec: pendingHotspot.endSec || 12,
      label: pendingHotspot.label || targetProduct.name,
    };

    const updatedSlides = heroSlides.map((slide) => {
      if (slide.id === selectedSlide.id) {
        return {
          ...slide,
          hotspots: [...slide.hotspots, newHotspot],
        };
      }
      return slide;
    });

    setHeroSlides(updatedSlides);
    saveHeroSlides(updatedSlides);
    setIsPinningHotspot(false);
    logAudit('HOTSPOT_PINNED', `Shoppable hotspot added to Slide '${selectedSlide.title}' for piece '${targetProduct.name}'`);
  };

  const handleDeleteHotspot = (hotspotId: string) => {
    const updatedSlides = heroSlides.map((slide) => {
      if (slide.id === selectedSlide.id) {
        return {
          ...slide,
          hotspots: slide.hotspots.filter((h) => h.id !== hotspotId),
        };
      }
      return slide;
    });
    setHeroSlides(updatedSlides);
    saveHeroSlides(updatedSlides);
    logAudit('HOTSPOT_DELETED', `Hotspot ${hotspotId} removed from slide ${selectedSlide.title}`);
  };

  // Exercise the actual cart reducer without changing saved inventory.
  const runStockConcurrencyTest = () => {
    const product = products.find(p => !p.isSoldOut && p.variants.some(v => !v.isSoldOut && v.stockAvailable > 0));
    const variant = product?.variants.find(v => !v.isSoldOut && v.stockAvailable > 0);
    if (!product || !variant) { setSimMessage('No available stock to simulate. Add stock first.'); return; }
    let cart: import('../../types').CartItem[] = [];
    for (let i = 0; i < 20; i++) cart = addCartItem(cart, {id: 'simulation', product, variant, quantity: 1});
    const accepted = cart.reduce((sum, item) => sum + item.quantity, 0);
    setSimMessage(`Local cart limit check: ${accepted} of 20 additions accepted; ${20 - accepted} blocked. Stock limit: ${variant.stockAvailable}. This checks the browser cart, not server concurrency or database locking.`);
    logAudit('LOCAL_CART_CHECK', `Cart reducer checked for ${variant.sku}: ${accepted} accepted, capacity ${variant.stockAvailable}.`);
    setAuditLogs(getAuditLogs());
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus, trackingInput.trim() || undefined);
    setOrders(getOrders());
    setAuditLogs(getAuditLogs());
    setTrackingInput('');
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col font-sans text-left">
      {/* Admin Top Navigation Bar */}
      <div className="bg-[#1A1815] text-[#FAF8F5] px-6 py-3.5 border-b border-[#2C2620] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg tracking-[0.25em] font-medium text-white">
            VASSEL
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 bg-[#C5A880] text-white rounded-[1px]">
            Studio preview · Local data
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-sans">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] tracking-[0.1em]">2FA Director Session Active</span>
          </div>

          <button
            onClick={onNavigateHome}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-colors text-white text-[11px] uppercase tracking-[0.18em] cursor-pointer flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Public Storefront</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 bg-white border border-[#E5DFD4] p-4 shrink-0 shadow-sm">
          <nav className="space-y-1 text-xs font-sans">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-left cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#1A1815] text-[#FAF8F5] font-medium'
                  : 'text-[#635A50] hover:bg-[#FAF8F5]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#C5A880]" />
              <span>Executive Dashboard (KPIs)</span>
            </button>

            <button
              onClick={() => setActiveTab('main-page')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-left cursor-pointer ${
                activeTab === 'main-page'
                  ? 'bg-[#1A1815] text-[#FAF8F5] font-medium'
                  : 'text-[#635A50] hover:bg-[#FAF8F5]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              <span>Main Page & Brand Showcase</span>
            </button>

            <button
              onClick={() => setActiveTab('hero-video')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-left cursor-pointer ${
                activeTab === 'hero-video'
                  ? 'bg-[#1A1815] text-[#FAF8F5] font-medium'
                  : 'text-[#635A50] hover:bg-[#FAF8F5]'
              }`}
            >
              <Video className="w-4 h-4 text-[#C5A880]" />
              <span>Runway Video & Hotspots</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-left cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#1A1815] text-[#FAF8F5] font-medium'
                  : 'text-[#635A50] hover:bg-[#FAF8F5]'
              }`}
            >
              <Package className="w-4 h-4 text-[#C5A880]" />
              <span>Product & SKU Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-left cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[#1A1815] text-[#FAF8F5] font-medium'
                  : 'text-[#635A50] hover:bg-[#FAF8F5]'
              }`}
            >
              <Boxes className="w-4 h-4 text-[#C5A880]" />
              <span>Local Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-left cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#1A1815] text-[#FAF8F5] font-medium'
                  : 'text-[#635A50] hover:bg-[#FAF8F5]'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
              <span>Fulfillment Pipeline ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('promotions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-left cursor-pointer ${
                activeTab === 'promotions'
                  ? 'bg-[#1A1815] text-[#FAF8F5] font-medium'
                  : 'text-[#635A50] hover:bg-[#FAF8F5]'
              }`}
            >
              <Tag className="w-4 h-4 text-[#C5A880]" />
              <span>Promotions & Courtesy Codes</span>
            </button>

            <button
              onClick={() => setActiveTab('audit-log')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors text-left cursor-pointer ${
                activeTab === 'audit-log'
                  ? 'bg-[#1A1815] text-[#FAF8F5] font-medium'
                  : 'text-[#635A50] hover:bg-[#FAF8F5]'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-[#C5A880]" />
              <span>Local Change History</span>
            </button>
          </nav>
        </aside>

        {/* Tab Content Body */}
        <main className="flex-1 bg-white border border-[#E5DFD4] p-6 sm:p-8 shadow-sm overflow-x-hidden">
          {/* TAB 1: DASHBOARD KPI */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-2xl text-[#1A1815]">Executive Maison Overview</h2>
                <p className="text-xs text-[#8E8274] font-sans mt-0.5">
                  Local order previews, collection curation, and browser-stored inventory.
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-[#FAF8F5] border border-[#E5DFD4]">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E8274] font-sans">
                    Saved Preview Value
                  </span>
                  <p className="font-serif text-2xl text-[#1A1815] mt-2 font-medium">
                    {formatCurrency(totalRevenueUSD, currency)}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-sans mt-1 block">
                    No payment gateway connected
                  </span>
                </div>

                <div className="p-5 bg-[#FAF8F5] border border-[#E5DFD4]">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E8274] font-sans">
                    Commissions Placed
                  </span>
                  <p className="font-serif text-2xl text-[#1A1815] mt-2 font-medium">
                    {totalOrdersCount} Transactions
                  </p>
                  <span className="text-[10px] text-[#635A50] font-sans mt-1 block">
                    100% Verified Settlement
                  </span>
                </div>

                <div className="p-5 bg-[#FAF8F5] border border-[#E5DFD4]">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E8274] font-sans">
                    Average Order Value (AOV)
                  </span>
                  <p className="font-serif text-2xl text-[#1A1815] mt-2 font-medium">
                    {formatCurrency(averageOrderValueUSD, currency)}
                  </p>
                  <span className="text-[10px] text-[#C5A880] font-sans mt-1 block">
                    Haute Maroquinerie Segment
                  </span>
                </div>

                <div className="p-5 bg-[#FAF8F5] border border-[#E5DFD4]">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E8274] font-sans">
                    Low Stock Atelier Alerts
                  </span>
                  <p className="font-serif text-2xl text-[#1A1815] mt-2 font-medium">
                    {lowStockVariants.length} SKUs
                  </p>
                  <span className="text-[10px] text-amber-700 font-sans mt-1 block">
                    Threshold &le; 3 units
                  </span>
                </div>
              </div>

              {/* Low Stock Warning */}
              {lowStockVariants.length > 0 && (
                <div className="p-5 bg-amber-50/50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <h3 className="font-serif text-base text-[#1A1815]">
                      Low Stock Thresholds in Atelier
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {lowStockVariants.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs font-sans text-[#635A50] bg-white p-2.5 border border-amber-200"
                      >
                        <div>
                          <strong>{item.productName}</strong> &middot; {item.colorName} ({item.size})
                          <span className="text-[11px] text-[#8E8274] ml-2">SKU: {item.sku}</span>
                        </div>
                        <span className="font-medium text-amber-800">
                          Available: {item.stockAvailable} units (On Hand: {item.stockOnHand})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: MAIN PAGE & BRAND SHOWCASE CURATOR */}
          {activeTab === 'main-page' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DFD4] pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[#C5A880] font-sans font-semibold">
                      Live Storefront Synchronization
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl text-[#1A1815] mt-1">
                    Main Page & Brand Showcase Curator
                  </h2>
                  <p className="text-xs text-[#8E8274] font-sans mt-0.5">
                    Directly control the Runway Hero Video, featured brand creations on the homepage, and out-of-stock statuses in real time.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReseedCatalog}
                    className="px-3.5 py-2 bg-[#FAF8F5] border border-[#E5DFD4] text-[#635A50] hover:text-[#1A1815] text-[11px] uppercase tracking-[0.15em] font-sans flex items-center gap-1.5 cursor-pointer"
                    title="Reseed to original expanded catalog"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Archives</span>
                  </button>
                  <button
                    onClick={onNavigateHome}
                    className="px-4 py-2 bg-[#1A1815] text-[#FAF8F5] text-[11px] uppercase tracking-[0.2em] font-sans hover:bg-[#C5A880] transition-colors cursor-pointer"
                  >
                    View Live Storefront &rarr;
                  </button>
                </div>
              </div>

              {/* Status Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-[#FAF8F5] border border-[#E5DFD4]">
                  <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#8E8274] font-sans">
                    Catalog Creations
                  </span>
                  <p className="font-serif text-2xl text-[#1A1815] mt-1 font-medium">{products.length} Items</p>
                  <span className="text-[10px] text-[#8E8274] font-sans">Total archives</span>
                </div>

                <div className="p-4 bg-[#FAF8F5] border border-[#C5A880]/60">
                  <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#C5A880] font-sans font-semibold">
                    ★ Main Page Featured
                  </span>
                  <p className="font-serif text-2xl text-[#8C6A42] mt-1 font-medium">
                    {products.filter((p) => p.isFeaturedOnMainPage).length} Items
                  </p>
                  <span className="text-[10px] text-[#8E8274] font-sans">Shown on homepage grid</span>
                </div>

                <div className="p-4 bg-[#FAF8F5] border border-emerald-300">
                  <span className="text-[9.5px] uppercase tracking-[0.2em] text-emerald-800 font-sans font-semibold">
                    ● In Stock / Tersedia
                  </span>
                  <p className="font-serif text-2xl text-emerald-800 mt-1 font-medium">
                    {products.filter((p) => !p.isSoldOut && p.variants.some((v) => v.stockAvailable > 0)).length} Items
                  </p>
                  <span className="text-[10px] text-emerald-700 font-sans">Ready for dispatch</span>
                </div>

                <div className="p-4 bg-[#FAF8F5] border border-amber-300">
                  <span className="text-[9.5px] uppercase tracking-[0.2em] text-amber-800 font-sans font-semibold">
                    ✕ Habis / Out of Stock
                  </span>
                  <p className="font-serif text-2xl text-amber-800 mt-1 font-medium">
                    {products.filter((p) => p.isSoldOut || p.variants.every((v) => v.stockAvailable === 0)).length} Items
                  </p>
                  <span className="text-[10px] text-amber-700 font-sans">Sold out / waitlist</span>
                </div>
              </div>

              {/* 1. HERO VIDEO PRESENTATION MANAGER */}
              <div className="bg-[#FAF8F5] border border-[#E5DFD4] p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#E5DFD4] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Tv className="w-5 h-5 text-[#C5A880]" />
                    <div>
                      <h3 className="font-serif text-lg text-[#1A1815]">
                        Runway Hero Video Presentation
                      </h3>
                      <p className="text-xs text-[#8E8274] font-sans">
                        Configure the opening high-impact model video loop on the landing page.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {heroSlides.map((slide, idx) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => {
                          setSelectedSlideId(slide.id);
                          setSlideTitle(slide.title);
                          setSlideSubtitle(slide.subtitle);
                          setSlideVideoUrl(slide.desktopVideoUrl);
                          setSlidePosterUrl(slide.posterUrl);
                          setSlideSeason(slide.seasonBadge);
                          setSlideCtaText(slide.ctaText);
                          setSlideCtaLink(slide.ctaLink);
                        }}
                        className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] font-sans cursor-pointer ${
                          slide.id === selectedSlide.id
                            ? 'bg-[#1A1815] text-white'
                            : 'bg-white border border-[#E5DFD4] text-[#635A50]'
                        }`}
                      >
                        Slide 0{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Video Form Inputs */}
                  <div className="space-y-4 text-xs font-sans">
                    <div>
                      <label className="block text-[#635A50] mb-1 font-medium">
                        Runway Video MP4 URL (Desktop & Mobile)
                      </label>
                      <input
                        type="url"
                        aria-label="Campaign video URL"
                        value={slideVideoUrl}
                        onChange={(e) => setSlideVideoUrl(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#C8BFB1] focus:outline-none focus:border-[#1A1815] font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#635A50] mb-1 font-medium">
                        Poster Image URL (Fast LCP Preload)
                      </label>
                      <input
                        type="url"
                        aria-label="Campaign poster URL"
                        value={slidePosterUrl}
                        onChange={(e) => setSlidePosterUrl(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#C8BFB1] focus:outline-none focus:border-[#1A1815] font-mono text-[11px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#635A50] mb-1 font-medium">Season Badge</label>
                        <input
                          type="text"
                          aria-label="Campaign badge"
                        value={slideSeason}
                          onChange={(e) => setSlideSeason(e.target.value)}
                          className="w-full p-2.5 bg-white border border-[#C8BFB1] focus:outline-none focus:border-[#1A1815]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#635A50] mb-1 font-medium">CTA Button Label</label>
                        <input
                          type="text"
                          aria-label="Campaign button label"
                        value={slideCtaText}
                          onChange={(e) => setSlideCtaText(e.target.value)}
                          className="w-full p-2.5 bg-white border border-[#C8BFB1] focus:outline-none focus:border-[#1A1815]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#635A50] mb-1 font-medium">Headline Title</label>
                      <input
                        type="text"
                        aria-label="Campaign headline"
                        value={slideTitle}
                        onChange={(e) => setSlideTitle(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#C8BFB1] focus:outline-none focus:border-[#1A1815]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#635A50] mb-1 font-medium">Subtitle</label>
                      <input
                        type="text"
                        aria-label="Campaign subtitle"
                        value={slideSubtitle}
                        onChange={(e) => setSlideSubtitle(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#C8BFB1] focus:outline-none focus:border-[#1A1815]"
                      />
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveHeroVideo}
                        className="px-6 py-2.5 bg-[#1A1815] text-[#FAF8F5] text-xs uppercase tracking-[0.2em] font-sans hover:bg-[#C5A880] transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Hero Video Settings</span>
                      </button>
                      {videoSaveNotice && (
                        <span className="text-xs text-emerald-700 font-sans flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{videoSaveNotice}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Live Video & Poster Preview */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E8274] font-sans block">
                      Live Video Preview
                    </span>
                    <div className="relative w-full aspect-16/9 bg-black rounded-[2px] overflow-hidden border border-[#C8BFB1]">
                      <video
                        src={slideVideoUrl}
                        poster={slidePosterUrl}
                        controls
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 px-2 py-0.5 bg-[#1A1815]/90 text-white text-[9px] uppercase tracking-wider font-sans">
                        {slideSeason}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#8E8274] font-sans">
                      Changes made here immediately refresh the cinematic video presentation on the landing page.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. MAIN PAGE CREATIONS & STOCK MANAGER */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-xl text-[#1A1815]">
                      Brand Creations & Main Page Visibility Matrix
                    </h3>
                    <p className="text-xs text-[#8E8274] font-sans">
                      Toggle which luxury pieces appear on the main page showcase and manage stock availability (Habis / In Stock).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search creations..."
                      value={mainPageSearch}
                      onChange={(e) => setMainPageSearch(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-[#C8BFB1] text-xs font-sans focus:outline-none focus:border-[#1A1815]"
                    />
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1.5 border-b border-[#E5DFD4] pb-3 text-xs font-sans">
                  {['ALL', 'FEATURED_ONLY', 'HABIS_ONLY', 'Handbags', 'Ready-to-Wear', 'Footwear', 'Small Leather Goods', 'Fragrance & Jewelry'].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setMainPageCategoryFilter(cat)}
                        className={`px-3 py-1 text-[10.5px] uppercase tracking-[0.16em] cursor-pointer transition-colors ${
                          mainPageCategoryFilter === cat
                            ? 'bg-[#1A1815] text-white font-medium'
                            : 'bg-[#F7F4EE] text-[#635A50] hover:bg-[#F0ECE2]'
                        }`}
                      >
                        {cat === 'ALL'
                          ? 'All Archives'
                          : cat === 'FEATURED_ONLY'
                          ? '★ Main Page Featured'
                          : cat === 'HABIS_ONLY'
                          ? '✕ Out of Stock (Habis)'
                          : cat}
                      </button>
                    )
                  )}
                </div>

                {/* Products Table with Quick Action Toggles */}
                <div className="border border-[#E5DFD4] overflow-x-auto bg-white">
                  <table className="w-full text-left text-xs font-sans border-collapse">
                    <thead>
                      <tr className="bg-[#F7F4EE] text-[#1A1815] border-b border-[#E5DFD4]">
                        <th className="p-3">Creation & Category</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Stock Available</th>
                        <th className="p-3">Stock Status (Habis / In Stock)</th>
                        <th className="p-3">Main Page Featured Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products
                        .filter((p) => {
                          if (mainPageSearch) {
                            const query = mainPageSearch.toLowerCase();
                            if (!p.name.toLowerCase().includes(query) && !p.category.toLowerCase().includes(query)) {
                              return false;
                            }
                          }
                          if (mainPageCategoryFilter === 'FEATURED_ONLY') return p.isFeaturedOnMainPage;
                          if (mainPageCategoryFilter === 'HABIS_ONLY') {
                            return p.isSoldOut || p.variants.every((v) => v.stockAvailable === 0);
                          }
                          if (mainPageCategoryFilter !== 'ALL') return p.category === mainPageCategoryFilter;
                          return true;
                        })
                        .map((prod) => {
                          const totalAvailable = prod.variants.reduce((acc, v) => acc + v.stockAvailable, 0);
                          const isSoldOut = prod.isSoldOut || totalAvailable === 0;

                          return (
                            <tr key={prod.id} className="border-b border-[#F7F4EE] hover:bg-[#FAF8F5]/80 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={prod.media[0]?.url}
                                    alt={prod.name}
                                    className="w-12 h-14 object-cover bg-[#FAF8F5] border border-[#E5DFD4] shrink-0"
                                  />
                                  <div>
                                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#8E8274] block">
                                      {prod.category}
                                    </span>
                                    <h4 className="font-serif text-sm text-[#1A1815] font-medium leading-snug">
                                      {prod.name}
                                    </h4>
                                    <span className="text-[10px] text-[#8E8274]">
                                      {prod.variants.length} color variants
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3 font-serif font-medium text-[#1A1815]">
                                {formatCurrency(prod.variants[0]?.priceUSD || 0, currency)}
                              </td>

                              <td className="p-3">
                                <span
                                  className={`font-semibold ${
                                    isSoldOut ? 'text-amber-800' : totalAvailable <= 3 ? 'text-amber-600' : 'text-emerald-700'
                                  }`}
                                >
                                  {totalAvailable} units
                                </span>
                              </td>

                              {/* 1-Click Stock Status Toggle (Habis / In Stock) */}
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 text-[9.5px] uppercase tracking-[0.14em] font-semibold border ${
                                      isSoldOut
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    }`}
                                  >
                                    {isSoldOut ? '✕ Habis (0)' : '● Tersedia'}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleSoldOut(prod.id)}
                                    className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-sans cursor-pointer transition-colors ${
                                      isSoldOut
                                        ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                                        : 'bg-amber-800 text-white hover:bg-amber-900'
                                    }`}
                                  >
                                    {isSoldOut ? 'Restock' : 'Tandai Habis'}
                                  </button>
                                </div>
                              </td>

                              {/* 1-Click Main Page Featured Toggle */}
                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleFeatured(prod.id)}
                                  className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] font-sans font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                                    prod.isFeaturedOnMainPage
                                      ? 'bg-[#1A1815] text-[#C5A880] border border-[#1A1815] shadow-xs'
                                      : 'bg-[#F7F4EE] text-[#635A50] border border-[#E5DFD4] hover:bg-white'
                                  }`}
                                >
                                  <Star
                                    className={`w-3 h-3 ${
                                      prod.isFeaturedOnMainPage ? 'fill-[#C5A880] text-[#C5A880]' : 'text-stone-400'
                                    }`}
                                  />
                                  <span>
                                    {prod.isFeaturedOnMainPage ? '★ Tampil di Main Page' : '+ Tampilkan di Main Page'}
                                  </span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HERO VIDEO & SHOPPABLE HOTSPOTS */}
          {activeTab === 'hero-video' && (
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-2xl text-[#1A1815]">
                  Runway Video & Shoppable Hotspot Pinpoint Studio
                </h2>
                <p className="text-xs text-[#8E8274] font-sans mt-0.5">
                  Configure desktop & mobile runway loops, LCP preloads, and interactively pin product hotspots directly on video coordinates.
                </p>
              </div>

              {/* Slide Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#E5DFD4]">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => {
                      setSelectedSlideId(slide.id);
                      setIsPinningHotspot(false);
                    }}
                    className={`px-4 py-2 text-xs uppercase tracking-[0.18em] font-sans cursor-pointer whitespace-nowrap ${
                      slide.id === selectedSlide.id
                        ? 'bg-[#1A1815] text-white'
                        : 'bg-[#F7F4EE] text-[#635A50] hover:bg-[#F0ECE2]'
                    }`}
                  >
                    Clip 0{idx + 1}: {slide.title.slice(0, 20)}...
                  </button>
                ))}
              </div>

              {/* Interactive Frame with Hotspot Pinning */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg text-[#1A1815]">
                    Visual Frame Coordinates Editor
                  </h3>
                  <button
                    onClick={() => setIsPinningHotspot(!isPinningHotspot)}
                    className={`px-4 py-2 text-xs uppercase tracking-[0.2em] font-sans cursor-pointer flex items-center gap-2 ${
                      isPinningHotspot
                        ? 'bg-[#C5A880] text-white'
                        : 'bg-[#1A1815] text-white hover:bg-[#C5A880]'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isPinningHotspot ? 'Active Pinning Mode (Click Frame)' : '+ Pin New Shoppable Hotspot'}</span>
                  </button>
                </div>

                <div
                  onClick={handleFrameClick}
                  className={`relative w-full aspect-16/9 bg-[#1A1815] border border-[#C8BFB1] overflow-hidden ${
                    isPinningHotspot ? 'cursor-crosshair ring-2 ring-[#C5A880]' : ''
                  }`}
                >
                  <img
                    src={selectedSlide.posterUrl}
                    alt={selectedSlide.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                  {/* Existing Hotspots */}
                  {selectedSlide.hotspots.map((h) => (
                    <div
                      key={h.id}
                      style={{ left: `${h.xPercent}%`, top: `${h.yPercent}%` }}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group pointer-events-auto"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#C5A880] border-2 border-white text-white flex items-center justify-center shadow-lg text-[9px] font-bold">
                        &bull;
                      </div>
                      <div className="absolute left-8 -top-3 hidden group-hover:block bg-black/90 text-white text-[10px] p-2 rounded whitespace-nowrap z-20">
                        {h.productName} ({h.xPercent}%, {h.yPercent}%)
                      </div>
                    </div>
                  ))}

                  {/* Pending Placement */}
                  {isPinningHotspot && (
                    <div
                      style={{
                        left: `${pendingHotspot.xPercent}%`,
                        top: `${pendingHotspot.yPercent}%`,
                      }}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-bounce pointer-events-none"
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white text-white flex items-center justify-center shadow-xl text-xs font-bold">
                        ✓
                      </div>
                    </div>
                  )}
                </div>

                {/* Hotspot Drawer */}
                {isPinningHotspot && (
                  <div className="p-4 bg-[#FAF8F5] border border-[#E5DFD4] space-y-3 text-xs font-sans">
                    <h4 className="font-medium text-[#1A1815]">
                      Pinpoint Location: X={pendingHotspot.xPercent}%, Y={pendingHotspot.yPercent}%
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[#635A50] mb-1">Target Product</label>
                        <select
                          value={pendingHotspot.productId}
                          onChange={(e) => setPendingHotspot({ ...pendingHotspot, productId: e.target.value })}
                          className="w-full p-2 bg-white border border-[#C8BFB1]"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {formatCurrency(p.variants[0].priceUSD, currency)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#635A50] mb-1">Start Second</label>
                        <input
                          type="number"
                          value={pendingHotspot.startSec}
                          onChange={(e) => setPendingHotspot({ ...pendingHotspot, startSec: Number(e.target.value) })}
                          className="w-full p-2 bg-white border border-[#C8BFB1]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#635A50] mb-1">End Second</label>
                        <input
                          type="number"
                          value={pendingHotspot.endSec}
                          onChange={(e) => setPendingHotspot({ ...pendingHotspot, endSec: Number(e.target.value) })}
                          className="w-full p-2 bg-white border border-[#C8BFB1]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveHotspot}
                        className="px-4 py-2 bg-[#1A1815] text-white uppercase tracking-[0.2em] cursor-pointer"
                      >
                        Pin to Runway Video
                      </button>
                      <button
                        onClick={() => setIsPinningHotspot(false)}
                        className="px-4 py-2 bg-[#F0ECE2] text-[#1A1815] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Hotspot List */}
                <div className="mt-4">
                  <h4 className="text-xs uppercase tracking-[0.2em] text-[#8E8274] font-sans mb-2">
                    Active Hotspots for this Clip:
                  </h4>
                  <div className="space-y-2">
                    {selectedSlide.hotspots.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between p-3 bg-[#FAF8F5] border border-[#E5DFD4] text-xs font-sans"
                      >
                        <div className="flex items-center gap-3">
                          <img src={h.imageUrl} alt="" className="w-10 h-10 object-cover" />
                          <div>
                            <strong className="text-[#1A1815]">{h.productName}</strong>
                            <p className="text-[11px] text-[#8E8274]">
                              Coordinates: X={h.xPercent}%, Y={h.yPercent}% &middot; Timeline: {h.startSec}s — {h.endSec}s
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteHotspot(h.id)}
                          className="text-red-700 hover:text-red-900 p-1 cursor-pointer"
                          title="Delete Hotspot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#F7F4EE] border border-[#E5DFD4] text-xs font-sans text-[#635A50]">
                  <span className="font-semibold text-[#1A1815] block mb-1">
                    Editorial Clearance & Licensing Documentation:
                  </span>
                  <p>{selectedSlide.licenseRights}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS & CATALOG MANAGER */}
          {activeTab === 'products' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl text-[#1A1815]">Product & SKU Matrix</h2>
                  <p className="text-xs text-[#8E8274] font-sans mt-0.5">
                    Manage {products.length} catalog creations, pricing, stock levels (Habis / In Stock), and Main Page visibility.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReseedCatalog}
                    className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E5DFD4] text-[#635A50] hover:text-[#1A1815] text-[11px] uppercase tracking-[0.14em] font-sans flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Archives</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {products.map((prod) => {
                  const totalAvailable = prod.variants.reduce((acc, v) => acc + v.stockAvailable, 0);
                  const isSoldOut = prod.isSoldOut || totalAvailable === 0;

                  return (
                    <div key={prod.id} className="p-5 bg-[#FAF8F5] border border-[#E5DFD4] space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <img
                            src={prod.media[0]?.url}
                            alt={prod.name}
                            className="w-16 h-20 object-cover bg-white border border-[#E5DFD4] shrink-0"
                          />
                          <div>
                            <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#8E8274] font-sans">
                              {prod.category}
                            </span>
                            <h3 className="font-serif text-lg text-[#1A1815]">{prod.name}</h3>
                            <p className="text-xs text-[#635A50] line-clamp-1">{prod.tagline}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-sans">
                              {/* Stock Badge */}
                              <span
                                className={`px-2 py-0.5 font-semibold uppercase tracking-wider border ${
                                  isSoldOut
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                {isSoldOut ? '✕ Habis (Sold Out)' : `● Tersedia (${totalAvailable} units)`}
                              </span>

                              {/* Featured Badge */}
                              {prod.isFeaturedOnMainPage && (
                                <span className="px-2 py-0.5 bg-[#1A1815] text-[#C5A880] flex items-center gap-1 font-medium">
                                  <Star className="w-3 h-3 fill-[#C5A880]" />
                                  <span>Tampil di Main Page</span>
                                </span>
                              )}

                              {prod.isLimitedEdition && (
                                <span className="px-1.5 py-0.5 bg-[#1A1815] text-white">Limited</span>
                              )}
                              {prod.isPersonalizable && (
                                <span className="px-1.5 py-0.5 bg-[#C5A880] text-white">Bespoke Monogram</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Top Product Controls: Toggle Sold Out & Toggle Main Page */}
                        <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSoldOut(prod.id)}
                            className={`px-3 py-1.5 text-[10.5px] uppercase tracking-[0.16em] font-sans cursor-pointer transition-colors text-center ${
                              isSoldOut
                                ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                                : 'bg-amber-800 text-white hover:bg-amber-900'
                            }`}
                          >
                            {isSoldOut ? 'Restock / Bikin Tersedia' : 'Set Habis (Sold Out)'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(prod.id)}
                            className={`px-3 py-1.5 border text-[10.5px] uppercase tracking-[0.16em] font-sans cursor-pointer transition-colors text-center ${
                              prod.isFeaturedOnMainPage
                                ? 'border-[#C5A880] bg-[#FAF8F5] text-[#8C6A42] hover:bg-[#F0ECE2]'
                                : 'border-[#1A1815] bg-white text-[#1A1815] hover:bg-[#1A1815] hover:text-white'
                            }`}
                          >
                            {prod.isFeaturedOnMainPage ? '★ Tampil di Main Page' : '+ Tampilkan di Main Page'}
                          </button>
                        </div>
                      </div>

                      {/* Variant Matrix Table */}
                      <div className="mt-2 pt-3 border-t border-[#E5DFD4] overflow-x-auto">
                        <table className="w-full text-left text-xs font-sans border-collapse">
                          <thead>
                            <tr className="text-[#8E8274] border-b border-[#E5DFD4]">
                              <th className="py-1">SKU</th>
                              <th>Color Shade</th>
                              <th>Size</th>
                              <th>Price</th>
                              <th>Available</th>
                              <th>Atelier Stock Control</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prod.variants.map((v) => (
                              <tr key={v.id} className="border-b border-[#F7F4EE]">
                                <td className="py-2.5 font-mono text-[11px]">{v.sku}</td>
                                <td>{v.colorName}</td>
                                <td>{v.size}</td>
                                <td className="font-medium font-serif">{formatCurrency(v.priceUSD, currency)}</td>
                                <td>
                                  <span
                                    className={`font-semibold ${
                                      v.stockAvailable <= 0 || v.isSoldOut
                                        ? 'text-amber-800 font-bold'
                                        : v.stockAvailable <= 3
                                        ? 'text-amber-600'
                                        : 'text-emerald-700'
                                    }`}
                                  >
                                    {v.stockAvailable <= 0 || v.isSoldOut ? '0 (Habis)' : `${v.stockAvailable} units`}
                                  </span>
                                </td>
                                <td>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSetVariantStock(v.id, 0)}
                                      className="px-2 py-1 bg-amber-800 text-white text-[9.5px] uppercase tracking-[0.1em] hover:bg-amber-900 cursor-pointer"
                                      title="Set stock to 0 (Habis)"
                                    >
                                      Habis (0)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetVariantStock(v.id, v.stockAvailable + 5)}
                                      className="px-2 py-1 bg-[#1A1815] text-white text-[9.5px] uppercase tracking-[0.1em] hover:bg-[#C5A880] cursor-pointer"
                                      title="Restock +5 units"
                                    >
                                      +5 Units
                                    </button>
                                    <input
                                      type="number"
                                      min={0}
                                      defaultValue={v.stockAvailable}
                                      key={`${v.id}-${v.stockAvailable}`}
                                      onBlur={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val) && val !== v.stockAvailable) {
                                          handleSetVariantStock(v.id, val);
                                        }
                                      }}
                                      className="w-14 px-1 py-0.5 text-center bg-white border border-[#C8BFB1] text-xs font-mono"
                                      title="Type number and click outside to save stock"
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: INVENTORY MULTI-LOCATION & CONCURRENCY TEST */}
          {activeTab === 'inventory' && (
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-2xl text-[#1A1815]">
                  Local Inventory & Cart Limits
                </h2>
                <p className="text-xs text-[#8E8274] font-sans mt-0.5">
                  Stock counts saved in this browser. These are not live warehouse quantities.
                </p>
              </div>

              {/* Concurrency Simulator Banner */}
              <div className="p-5 bg-[#F7F4EE] border border-[#E5DFD4] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-base text-[#1A1815]">
                      Cart Quantity Limit Check
                    </h3>
                    <p className="text-xs text-[#635A50] font-sans">
                      Run 20 additions through the actual cart reducer without modifying inventory.
                    </p>
                  </div>
                  <button
                    onClick={runStockConcurrencyTest}
                    disabled={concurrencySimRunning}
                    className="px-4 py-2 bg-[#1A1815] text-white text-xs uppercase tracking-[0.2em] font-sans cursor-pointer hover:bg-[#C5A880] disabled:bg-stone-400"
                  >
                    {concurrencySimRunning ? 'Executing Stress Simulation...' : 'Check Cart Stock Limit'}
                  </button>
                </div>
                {simMessage && (
                  <div className="p-3 bg-white border border-[#E5DFD4] text-xs font-mono text-[#1A1815]">
                    {simMessage}
                  </div>
                )}
              </div>

              <div className="border border-[#E5DFD4] overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#F7F4EE] text-[#1A1815]">
                    <tr>
                      <th className="p-3">Creation & SKU</th>
                      <th className="p-3">On Hand</th>
                      <th className="p-3">Reserved</th>
                      <th className="p-3">Stock State</th>
                      <th className="p-3">Total Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.flatMap((p) =>
                      p.variants.map((v) => (
                        <tr key={v.id} className="border-t border-[#E5DFD4]">
                          <td className="p-3">
                            <strong>{p.name}</strong> — {v.colorName}
                            <span className="block font-mono text-[#8E8274] text-[10px]">{v.sku}</span>
                          </td>
                          <td className="p-3 text-[#635A50]">{v.stockOnHand} units</td>
                          <td className="p-3 text-[#635A50]">{v.stockReserved} units</td>
                          <td className="p-3 text-[#635A50]">{v.isSoldOut || v.stockAvailable <= 0 ? 'Unavailable' : 'Available'}</td>
                          <td className="p-3 font-semibold text-[#1A1815]">{v.stockAvailable} units</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl text-[#1A1815]">Commission Fulfillment Pipeline</h2>
                  <p className="text-xs text-[#8E8274] font-sans mt-0.5">
                    Order state transitions and white-glove tracking verification.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-5 bg-[#FAF8F5] border border-[#E5DFD4] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5DFD4]">
                      <div>
                        <span className="font-mono text-sm font-semibold text-[#1A1815]">
                          {ord.orderNumber}
                        </span>
                        <span className="text-xs text-[#8E8274] ml-3">
                          {new Date(ord.createdAt).toLocaleString('en-US')}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] font-sans bg-[#1A1815] text-white">
                        Status: {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans text-[#635A50]">
                      <div>
                        <span className="text-[#8E8274] block text-[10px] uppercase">Client</span>
                        <strong className="text-[#1A1815]">{ord.customerName}</strong>
                        <p>{ord.customerEmail}</p>
                        <p>{ord.customerPhone}</p>
                      </div>

                      <div>
                        <span className="text-[#8E8274] block text-[10px] uppercase">Courier</span>
                        <p className="font-medium text-[#1A1815]">{ord.courier.name}</p>
                        <p className="font-mono text-[11px]">Tracking: {ord.courier.trackingNumber || 'Pending Dispatch'}</p>
                        <p className="text-[11px]">{ord.shippingAddress.city}, {ord.shippingAddress.country}</p>
                      </div>

                      <div>
                        <span className="text-[#8E8274] block text-[10px] uppercase">Settlement</span>
                        <p className="font-medium text-[#1A1815]">{formatCurrency(ord.totalAmountUSD, currency)}</p>
                        <p className="text-[11px]">{ord.paymentMethod}</p>
                      </div>
                    </div>

                    {/* Transition Controls */}
                    <div className="pt-3 border-t border-[#E5DFD4] flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-[#8E8274] mr-2">Transition Pipeline:</span>
                      {ord.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'ATELIER_INSPECTION')}
                          className="px-3 py-1 bg-white border border-[#1A1815] text-xs hover:bg-[#1A1815] hover:text-white cursor-pointer"
                        >
                          Commence Final Inspection
                        </button>
                      )}
                      {ord.status === 'ATELIER_INSPECTION' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'IN_TRANSIT')}
                          className="px-3 py-1 bg-[#1A1815] text-white text-xs hover:bg-[#C5A880] cursor-pointer"
                        >
                          Dispatch via White-Glove Courier
                        </button>
                      )}
                      {ord.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'DELIVERED')}
                          className="px-3 py-1 bg-emerald-700 text-white text-xs cursor-pointer"
                        >
                          Mark Delivered to Client
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PROMOTIONS */}
          {activeTab === 'promotions' && (
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-2xl text-[#1A1815]">Private Courtesy & Invitation Codes</h2>
                <p className="text-xs text-[#8E8274] font-sans mt-0.5">
                  Discrete courtesy thresholds, budget guardrails, and non-discountable allocations.
                </p>
              </div>

              <div className="space-y-4">
                {promotions.map((p) => (
                  <div key={p.id} className="p-4 bg-[#FAF8F5] border border-[#E5DFD4] flex justify-between items-center text-xs font-sans">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-[#1A1815]">{p.code}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px]">
                          {p.type === 'PERCENTAGE' ? `${p.value}% Courtesy` : `$${p.value} Deduction`}
                        </span>
                      </div>
                      <p className="text-[#635A50] mt-1">{p.name}</p>
                      <p className="text-[11px] text-[#8E8274]">
                        Min Spend: {formatCurrency(p.minSpendUSD, currency)} &middot; Claimed: {p.usageCount} times
                      </p>
                    </div>

                    <button className="text-[#8C6A42] underline" onClick={() => { const next = promotions.map(promo => promo.id === p.id ? {...promo, isActive: !promo.isActive} : promo); savePromotions(next); setPromotions(next); }}>{p.isActive ? 'Active — disable' : 'Inactive — enable'}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT LOG */}
          {activeTab === 'audit-log' && (
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-2xl text-[#1A1815]">Local Change History</h2>
                <p className="text-xs text-[#8E8274] font-sans mt-0.5">
                  Browser-stored history of pricing changes, stock adjustments, and preview actions. This is not an immutable security log.
                </p>
              </div>

              <div className="border border-[#E5DFD4] divide-y divide-[#E5DFD4] font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-[#FAF8F5] hover:bg-white transition-colors">
                    <div className="flex justify-between text-[#8E8274] mb-1">
                      <span>{log.timestamp}</span>
                      <span className="text-[#C5A880]">{log.actor} ({log.role})</span>
                    </div>
                    <div className="text-[#1A1815] font-semibold">{log.action}</div>
                    <div className="text-[#635A50] mt-0.5 font-sans text-xs">{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
