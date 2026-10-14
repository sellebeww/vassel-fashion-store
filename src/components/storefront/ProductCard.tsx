import React from 'react';
import { Heart } from 'lucide-react';
import { Product, Currency } from '../../types';
import { formatCurrency } from '../../lib/storage';
interface Props { product: Product; currency: Currency; onNavigate:(path:string)=>void; onQuickAdd?:(product:Product)=>void; isWishlisted?:boolean; onToggleWishlist?:(id:string)=>void; }
export const ProductCard: React.FC<Props> = ({product, currency, onNavigate, onQuickAdd, isWishlisted, onToggleWishlist}) => {
  const variant = product.variants.find(v => !v.isSoldOut && v.stockAvailable > 0) || product.variants[0];
  const soldOut = product.isSoldOut || !variant || variant.isSoldOut || variant.stockAvailable <= 0;
  const href = `/products/${product.slug}`;
  return <article className="product-card"><div className="product-image"><a href={href} onClick={e=>{e.preventDefault();onNavigate(href);}}><img src={product.media.find(m=>m.isCover)?.url || product.media[0]?.url || '/images/vassel-signature.webp'} alt={product.name} loading="lazy"/></a><span className="product-label">{soldOut ? 'Sold out' : product.isLimitedEdition ? 'Limited edition' : 'The signature edit'}</span>{onToggleWishlist && <button className="product-heart" aria-label={`${isWishlisted ? 'Remove' : 'Save'} ${product.name} ${isWishlisted ? 'from' : 'to'} wishlist`} aria-pressed={!!isWishlisted} onClick={()=>onToggleWishlist(product.id)}><Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={1.4}/></button>}</div><div className="product-info"><p className="eyebrow">{product.category}{product.media[0]?.isConcept ? ' · Design concept' : ''}</p><h3><a href={href} onClick={e=>{e.preventDefault();onNavigate(href);}}>{product.name}</a></h3><div className="product-bottom"><span>{formatCurrency(variant?.priceUSD || 0,currency)}</span><button disabled={!!soldOut} onClick={()=>product.variants.length > 1 ? onNavigate(href) : onQuickAdd?.(product)}>{soldOut ? 'Unavailable' : product.variants.length > 1 ? 'Choose options' : 'Add to bag'}</button></div></div></article>;
};
