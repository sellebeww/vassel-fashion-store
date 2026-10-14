import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ScrollReveal } from '../common/ScrollReveal';

interface CategoryGatewaysProps {
  onNavigate: (path: string) => void;
}

export const CategoryGateways: React.FC<CategoryGatewaysProps> = ({ onNavigate }) => {
  const categories = [
    {
      title: 'Haute Maroquinerie',
      subtitle: 'Iconic Totes & Archival Handbags',
      image: '/images/catalog/861fcbcfafdf.jpg',
      link: '/shop?category=Handbags',
      span: 'md:col-span-2 md:row-span-2 aspect-4/5 md:aspect-auto',
    },
    {
      title: 'Ready-to-Wear',
      subtitle: 'Virgin Cashmere & Fluid Mulberry Silk',
      image: '/images/catalog/22e17ebaaceb.jpg',
      link: '/shop?category=Ready-to-Wear',
      span: 'aspect-4/5',
    },
    {
      title: 'Artisanal Footwear',
      subtitle: 'Hand-Burnished Blake-Rapid Soles',
      image: '/images/catalog/010002ca559c.jpg',
      link: '/shop?category=Footwear',
      span: 'aspect-4/5',
    },
    {
      title: 'Small Leather Goods & Bronzes',
      subtitle: 'Bespoke 24k Gold Foil Monograms & Cuffs',
      image: '/images/catalog/0256cc194e21.jpg',
      link: '/shop?category=Small Leather Goods',
      span: 'md:col-span-2 aspect-16/9 md:aspect-auto',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#F7F4EE] border-y border-[#E5DFD4] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="fade-up" className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.32em] text-[#8E8274] font-sans">
              Maison Gateways
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1815] font-normal tracking-[0.04em] mt-2">
              Form, Materiality & Sovereign Categories
            </h2>
          </div>
          <p className="mt-4 md:mt-0 text-xs text-[#635A50] max-w-md font-sans leading-relaxed">
            Every creation is produced in strictly limited runs by specialized master artisans, honoring our heritage of double saddle stitches and unadulterated hides.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 auto-rows-[340px]">
          {categories.map((cat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onNavigate(cat.link)}
              className={`group relative overflow-hidden bg-[#FAF8F5] cursor-pointer ${cat.span} border border-[#E5DFD4] shadow-xs`}
            >
              <motion.img
                src={cat.image}
                alt={cat.title}
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1815]/85 via-black/25 to-transparent transition-opacity duration-500 group-hover:from-[#1A1815]/95" />

              <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between text-white">
                <div className="transform transition-transform duration-500 group-hover:translate-x-1">
                  <span className="text-[9px] uppercase tracking-[0.25em] text-[#E5DFD4] font-sans block">
                    {cat.subtitle}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-[#FAF8F5] tracking-[0.05em] mt-1">
                    {cat.title}
                  </h3>
                </div>

                <motion.div
                  whileHover={{ scale: 1.15 }}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center transition-all duration-300 group-hover:bg-[#C5A880] group-hover:translate-x-1 group-hover:-translate-y-1 shadow-md"
                >
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
