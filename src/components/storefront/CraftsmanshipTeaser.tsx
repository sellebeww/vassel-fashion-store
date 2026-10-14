import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ScrollReveal } from '../common/ScrollReveal';

interface CraftsmanshipTeaserProps {
  onNavigate: (path: string) => void;
}

export const CraftsmanshipTeaser: React.FC<CraftsmanshipTeaserProps> = ({ onNavigate }) => {
  return (
    <section className="py-24 sm:py-32 bg-[#F7F4EE] border-t border-[#E5DFD4] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Story & Stats */}
          <ScrollReveal variant="fade-up" className="max-w-xl text-left">
            <span className="text-[10px] uppercase tracking-[0.32em] text-[#C5A880] font-semibold font-sans">
              L'Artisanat d'Excellence
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#1A1815] font-normal tracking-[0.05em] mt-3 leading-tight">
              38 Hours of Artisanal Devotion for a Single Iconic Piece
            </h2>

            <div className="space-y-4 my-6 text-xs sm:text-sm text-[#635A50] font-sans font-light leading-relaxed">
              <p>
                At Maison VASSEL, there are no soul-less industrial assembly belts. Every bag is hand-cut, skived, and saddle-stitched by the very same master artisan from start to completion, ensuring microscopic consistency of thread tension (<span className="italic">point sellier</span>).
              </p>
              <p>
                The perimeter edges are gently beveled with hot irons, hand-sanded with fine olive pumice, and coated in seven successive layers of natural organic wax resin to achieve a finish as smooth as polished marble.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 py-6 border-y border-[#E5DFD4] mb-8">
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <span className="font-serif text-2xl sm:text-3xl text-[#1A1815] block">
                  100%
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E8274] font-sans">
                  Tuscan Vegetable Hide
                </span>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <span className="font-serif text-2xl sm:text-3xl text-[#1A1815] block">
                  7x
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E8274] font-sans">
                  Beeswax Edge Coats
                </span>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <span className="font-serif text-2xl sm:text-3xl text-[#1A1815] block">
                  5 Yrs
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E8274] font-sans">
                  Heirloom Warranty
                </span>
              </motion.div>
            </div>

            <motion.button
              whileHover={{ scale: 1.025, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('/atelier')}
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#1A1815] text-[#FAF8F5] text-xs uppercase tracking-[0.26em] font-sans font-medium hover:bg-[#C5A880] transition-colors cursor-pointer shadow-sm group"
            >
              <span>Explore The Atelier</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
          </ScrollReveal>

          {/* Visual Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-4/3 sm:aspect-16/10 rounded-[2px] overflow-hidden bg-[#FAF8F5] border border-[#E5DFD4] shadow-xl group"
          >
            <motion.img
              src="/images/catalog/37a5b46df66b.jpg"
              alt="Master artisan stitching leather in atelier"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
              <div>
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#E5DFD4] font-sans block">
                  Santa Croce sull'Arno & Florence Workshop
                </span>
                <h4 className="font-serif text-lg mt-0.5 text-[#FAF8F5]">
                  Master Tanner & Leather Guild at Work
                </h4>
              </div>

              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
