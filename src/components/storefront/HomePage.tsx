import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Product, Currency, HeroSlide } from '../../types';
import { HeroVideoSection } from './HeroVideoSection';
import { VasselLogo } from '../brand/Logo';
import { ProductCard } from './ProductCard';
import { ScrollReveal } from '../common/ScrollReveal';
interface Props { products: Product[]; slides: HeroSlide[]; currency: Currency; wishlist: string[]; onNavigate: (path:string)=>void; onQuickAdd: (id:string)=>void; onToggleWishlist: (id:string)=>void; }
export function HomePage(p: Props) {
  return <>
    <HeroVideoSection slides={p.slides} onNavigate={p.onNavigate} currency={p.currency} onQuickAdd={p.onQuickAdd}/>
    <section className="maison-intro" id="signature-edit"><ScrollReveal><p className="eyebrow">THE ESSENCE OF VASSEL</p><h2>Less, but <em>exceptional.</em></h2><p>A dialogue between strength and softness. Pieces with a distinctive point of view,<br className="hide-small"/> made to become part of yours.</p><button className="text-link" onClick={()=>p.onNavigate('/maison')}>Meet the maison <ArrowUpRight size={14}/></button></ScrollReveal></section>
    <section className="signature-section"><div className="section-heading"><div><p className="eyebrow">OBJECTS OF DESIRE</p><h2>The signature edit</h2></div><button className="text-link" onClick={()=>p.onNavigate('/shop')}>View the collection <ArrowUpRight size={15}/></button></div><div className="signature-grid">{p.products.filter(x=>x.status!=='ARCHIVED' && x.isFeaturedOnMainPage).slice(0,4).map(product=><ProductCard key={product.id} product={product} currency={p.currency} onNavigate={p.onNavigate} onQuickAdd={()=>p.onQuickAdd(product.id)} isWishlisted={p.wishlist.includes(product.id)} onToggleWishlist={p.onToggleWishlist}/>)}</div></section>
    <section className="editorial-pair"><button className="editorial-card" onClick={()=>p.onNavigate('/shop?category=Handbags')}><img src="/images/vassel-signature.webp" alt="Vassel cognac leather signature handbag on travertine" loading="lazy"/><div><span className="eyebrow">THE ART OF CARRYING</span><h2>A signature in every detail.</h2><span className="text-link">Discover handbags <ArrowUpRight size={15}/></span></div></button><button className="editorial-card fashion-card" onClick={()=>p.onNavigate('/collections/signature')}><img src="/images/vassel-lookbook.webp" alt="Vassel ivory silk and tailored espresso ready-to-wear campaign" loading="lazy"/><div><span className="eyebrow">THE EVERYDAY, RECONSIDERED</span><h2>Dress with intention.</h2><span className="text-link">Discover the lookbook <ArrowUpRight size={15}/></span></div></button></section>
    <section className="atelier-story"><img src="/images/vassel-atelier.webp" alt="Hands carefully stitching the edge of cognac leather" loading="lazy"/><div><VasselLogo variant="monogram" size="md"/><p className="eyebrow">THE BEAUTY IS IN THE MAKING</p><h2>Considered.<br/>Down to the<br/><em>last stitch.</em></h2><p>From the curve of a handle to the rhythm of a seam, our design language finds its expression in the smallest details.</p><button className="text-link" onClick={()=>p.onNavigate('/atelier')}>Inside the atelier <ArrowUpRight size={15}/></button></div></section>
    <section className="brand-closing"><span className="eyebrow">YOUR WORLD, WITH VASSEL</span><h2>Find your own signature.</h2><button className="button-dark" onClick={()=>p.onNavigate('/shop')}>Discover the collection <ArrowUpRight size={16}/></button></section>
  </>;
}
