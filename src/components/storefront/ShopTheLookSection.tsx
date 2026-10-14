import React, { useState } from 'react';
import { Product, Currency } from '../../types';
import { formatCurrency } from '../../lib/storage';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ScrollReveal } from '../common/ScrollReveal';

interface ShopTheLookSectionProps {
  products: Product[];
  currency: Currency;
  onNavigate: (path: string) => void;
  onAddLookToBag: (products: Product[]) => void;
}

export const ShopTheLookSection: React.FC<ShopTheLookSectionProps> = ({
  products,
  currency,
  onNavigate,
  onAddLookToBag,
}) => {
  const [added, setAdded] = useState(false);
  // Pick curated ensemble items: Coat, Bag, Loafer
  const lookItems = [
    products.find((p) => p.slug === 'letoile-cashmere-blend-trench') || products[2],
    products.find((p) => p.slug === 'le-vassel-cabas-32') || products[0],
    products.find((p) => p.slug === 'the-vassel-equestrian-loafer') || products[3],
  ].filter(Boolean) as Product[];

  const totalLookPrice = lookItems.reduce((acc, p) => acc + p.variants[0].priceUSD, 0);

  const handleAdd = () => {
    onAddLookToBag(lookItems);
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <section className="py-24 sm:py-32 bg-[#FAF8F5] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="fade-up" className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] uppercase tracking-[0.32em] text-[#C5A880] font-sans font-semibold">
            Runway Styling Suite
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#1A1815] font-normal tracking-[0.05em] mt-2">
            Shop the Look: The Monochromatic Silhouette
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-[#635A50] font-sans leading-relaxed">
            The harmonious interplay of double-faced sand cashmere, full-grain Tuscan Togo leather, and hand-burnished equestrian footwear.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Large Editorial Lifestyle Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 relative aspect-4/5 sm:aspect-16/10 lg:aspect-4/5 overflow-hidden bg-[#F7F4EE] border border-[#E5DFD4] shadow-md group"
          >
            <motion.img
              src="/images/catalog/585391cd2b73.jpg"
              alt="VASSEL Runway Look"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1815]/70 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-6 left-6 text-white">
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#E5DFD4] font-sans block">
                Look 04 &middot; Spring/Summer 2026
              </span>
              <h4 className="font-serif text-xl sm:text-2xl mt-1 text-[#FAF8F5]">
                The Solitary Connoisseur
              </h4>
            </div>
          </motion.div>

          {/* Right: Ensemble Items Cards */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col justify-between h-full bg-[#FFFFFF] p-6 sm:p-8 border border-[#E5DFD4] shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD4] mb-6">
                <span className="text-xs uppercase tracking-[0.22em] text-[#1A1815] font-medium font-sans">
                  The Ensemble Curated Pieces
                </span>
                <span className="text-xs text-[#8E8274] font-sans">
                  3 Handcrafted Masterpieces
                </span>
              </div>

              <div className="space-y-4">
                {lookItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 4, backgroundColor: '#FAF8F5' }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onNavigate(`/products/${item.slug}`)}
                    className="flex items-center gap-4 p-3 border border-transparent hover:border-[#E5DFD4] cursor-pointer rounded-[2px] transition-colors"
                  >
                    <img
                      src={item.media[0]?.url}
                      alt={item.name}
                      className="w-16 h-16 object-cover bg-[#F7F4EE] border border-[#E5DFD4] shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#8E8274] font-sans block">
                        {item.category}
                      </span>
                      <h5 className="font-serif text-sm text-[#1A1815] truncate">
                        {item.name}
                      </h5>
                      <p className="text-xs font-sans text-[#1A1815] font-medium mt-0.5">
                        {formatCurrency(item.variants[0].priceUSD, currency)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8E8274] shrink-0" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Total and 1-Click Ensemble Add */}
            <div className="mt-8 pt-6 border-t border-[#E5DFD4]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-[0.2em] text-[#635A50] font-sans">
                  Total Ensemble Value
                </span>
                <span className="font-serif text-lg sm:text-xl text-[#1A1815] font-medium">
                  {formatCurrency(totalLookPrice, currency)}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd}
                className="w-full py-4 bg-[#1A1815] text-[#FAF8F5] text-xs uppercase tracking-[0.26em] font-sans font-medium hover:bg-[#C5A880] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Entire Ensemble Reserved & Added to Bag</span>
                  </>
                ) : (
                  <>
                    <span>Add Complete Ensemble to Bag</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
              <p className="text-[10px] text-center text-[#8E8274] mt-2.5 font-sans">
                Includes complimentary personalized calligraphy card & white-glove boxed delivery
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
