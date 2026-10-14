import React, { useState } from 'react';
import { Search, X, ArrowUpRight } from 'lucide-react';
import { Product, Currency } from '../../types';
import { formatCurrency } from '../../lib/storage';
import { useDialog } from '../common/useDialog';
interface Props {isOpen:boolean;onClose:()=>void;products:Product[];currency:Currency;onNavigate:(path:string)=>void;}
export const SearchModal:React.FC<Props>=p=>{
 const [query,setQuery]=useState('');const ref=useDialog(p.isOpen,p.onClose);
 if(!p.isOpen)return null;
 const normalized=query.trim().toLowerCase();
 const results=normalized?p.products.filter(p=>p.status!=='ARCHIVED' && `${p.name} ${p.category} ${p.description} ${p.frenchTitle || ''} ${p.materialDetails}`.toLowerCase().includes(normalized)):[];
 return <div className="modal-backdrop search-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)p.onClose();}}><div ref={ref} className="search-panel" role="dialog" aria-modal="true" aria-label="Search Vassel"><form onSubmit={e=>e.preventDefault()} className="search-input"><Search size={20}/><input type="search" aria-label="Search creations" placeholder="Find your next signature…" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" className="icon-button" onClick={p.onClose} aria-label="Close search"><X size={20}/></button></form><div className="search-results">{!normalized?<><p className="eyebrow">A FEW PLACES TO BEGIN</p><div className="search-suggestions">{['Handbags','Silk','Cashmere','Leather','Jewelry'].map(tag=><button key={tag} onClick={()=>setQuery(tag)}>{tag}<ArrowUpRight size={15}/></button>)}</div></>:<><p className="eyebrow" role="status">{results.length} {results.length===1?'piece':'pieces'} found</p>{results.length===0?<p className="empty-search">No pieces found. Try a material, category, or shorter name.</p>:results.map(product=><a className="search-result" key={product.id} href={`/products/${product.slug}`} onClick={e=>{e.preventDefault();p.onNavigate(`/products/${product.slug}`);p.onClose();}}><img src={product.media[0]?.url} alt={product.name}/><div><span className="eyebrow">{product.category}</span><h3>{product.name}</h3><p>{formatCurrency(product.variants[0]?.priceUSD||0,p.currency)}</p></div><ArrowUpRight size={17}/></a>)}</>}</div></div></div>;
};
