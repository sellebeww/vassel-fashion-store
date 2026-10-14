import React, { useState, useEffect } from 'react';
import { VasselLogo } from '../brand/Logo';
import { Currency, Language, UserProfile } from '../../types';
import { ShoppingBag, Search, User, Menu, X, Heart, ArrowUpRight } from 'lucide-react';
interface HeaderProps {
  currentPath: string; onNavigate: (path: string) => void; cartCount: number;
  onOpenCart: () => void; onOpenSearch: () => void; onOpenAuth: () => void;
  wishlistCount: number; currency: Currency; onSelectCurrency: (c: Currency) => void;
  language: Language; onToggleLanguage: () => void; isAdminMode: boolean;
  onToggleAdmin: () => void; currentUser?: UserProfile | null;
}
export const Header: React.FC<HeaderProps> = (p) => {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [p.currentPath]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const go = (path: string) => { setOpen(false); p.onNavigate(path); };
  const links = [['The collection', '/shop'], ['Handbags', '/shop?category=Handbags'], ['Ready-to-wear', '/shop?category=Ready-to-Wear'], ['The maison', '/maison'], ['The atelier', '/atelier'], ['Lookbook', '/collections/signature']];
  return <>
    <div className="announcement"><span>A considered wardrobe. An enduring signature.</span><span className="announcement-right">VASSEL · THE SIGNATURE EDIT</span></div>
    <header className="site-header">
      <div className="header-main">
        <div className="header-left"><button className="icon-button" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="main-navigation">{open ? <X size={20}/> : <Menu size={20}/>}</button><button className="header-text" onClick={() => go('/shop')}>Explore</button></div>
        <button className="header-logo" aria-label="Vassel home" onClick={() => go('/')}><VasselLogo variant="wordmark" size="lg"/></button>
        <div className="header-actions"><button className="icon-button" onClick={p.onOpenSearch} aria-label="Search"><Search size={19}/></button><button className="icon-button hide-small" onClick={() => go('/wishlist')} aria-label={`Wishlist (${p.wishlistCount})`}><Heart size={19}/></button><button className="icon-button hide-small" onClick={p.onOpenAuth} aria-label="Account"><User size={19}/></button><button className="icon-button bag-button" onClick={p.onOpenCart} aria-label={`Shopping bag (${p.cartCount} items)`}><ShoppingBag size={19}/>{p.cartCount > 0 && <span className="bag-count">{p.cartCount}</span>}</button></div>
      </div>
      <nav className="desktop-navigation" aria-label="Collections">{links.map(([label,path])=><a key={path} href={path} onClick={e=>{e.preventDefault();go(path);}} aria-current={p.currentPath === path ? 'page' : undefined}>{label}</a>)}</nav>
      {open && <nav className="expanded-navigation" id="main-navigation" aria-label="Main navigation">
        <div>{[...links, ['Footwear','/shop?category=Footwear'], ['Leather accessories','/shop?category=Small%20Leather%20Goods'], ['Fragrance & jewelry','/shop?category=Fragrance%20%26%20Jewelry']].map(([label,path])=><a key={path} href={path} onClick={e=>{e.preventDefault();go(path);}}>{label}<ArrowUpRight size={18}/></a>)}</div>
        <div className="menu-secondary">{[['Saved pieces','/wishlist'],['Client services','/client-services'],['Boutiques & appointments','/boutiques'],['Track an order','/track-order'],['Authenticity','/authenticity']].map(([label,path])=><button key={path} onClick={()=>go(path)}>{label}</button>)}<button onClick={()=>{setOpen(false);p.onOpenAuth();}}>My account</button><label>Display currency <select aria-label="Display currency" value={p.currency} onChange={e=>p.onSelectCurrency(e.target.value as Currency)}>{['USD','EUR','GBP','IDR'].map(c=><option key={c}>{c}</option>)}</select></label><small className="text-[#897a65]">Currency conversions use fixed preview rates.</small>{import.meta.env.DEV && <button onClick={p.onToggleAdmin}>Studio preview administration</button>}</div>
      </nav>}
    </header>
  </>;
};
