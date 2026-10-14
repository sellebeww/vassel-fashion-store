import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Pause, Play, Plus } from 'lucide-react';
import { HeroSlide, Currency } from '../../types';
interface Props { slides: HeroSlide[]; onNavigate: (path: string) => void; currency: Currency; onQuickAdd: (id: string) => void; }
export const HeroVideoSection: React.FC<Props> = ({ slides, onNavigate }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const [failed, setFailed] = useState(false);
  const [time, setTime] = useState(0);
  const [index,setIndex]=useState(0);
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [mobile,setMobile]=useState(()=>window.matchMedia('(max-width: 600px)').matches);
  const active=slides.filter(s=>s.isActive).sort((a,b)=>a.sortOrder-b.sortOrder);
  const slide=active[index]||active[0];
  const source=slide ? (mobile ? slide.mobileVideoUrl || slide.desktopVideoUrl : slide.desktopVideoUrl) : '';
  const poster=slide?.posterUrl||'/images/vassel-campaign.webp';
  useEffect(()=>{
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');const size=window.matchMedia('(max-width: 600px)');
    const change=()=>{setReduced(motion.matches);setMobile(size.matches);};
    motion.addEventListener('change',change);size.addEventListener('change',change);
    return ()=>{motion.removeEventListener('change',change);size.removeEventListener('change',change);};
  },[]);
  useEffect(()=>{setFailed(false);setTime(0);},[source]);
  useEffect(()=>{if(reduced)video.current?.pause();else video.current?.play().catch(()=>setPaused(true));},[reduced,source]);
  const toggle=()=>{if(!video.current||failed)return;if(video.current.paused)video.current.play().catch(()=>setPaused(true));else video.current.pause();};
  const navigate=(path:string)=>onNavigate(path.startsWith('/')&&!path.startsWith('//')?path:'/shop');
  const title=slide?.title||'Presence, without a word.';
  return <section className="campaign-hero" aria-label="Vassel signature campaign">
    <img className="campaign-media" src={poster} onError={e=>{if(e.currentTarget.getAttribute('src')!=='/images/vassel-campaign.webp')e.currentTarget.src='/images/vassel-campaign.webp';}} alt="Vassel campaign: ivory silk, cognac leather and warm architectural light" fetchPriority="high" />
    {!failed&&source&&<video key={source} ref={video} className="campaign-media" src={source} poster={poster} autoPlay={!reduced} muted loop playsInline preload={reduced?'none':'metadata'} aria-hidden="true" onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onPlay={()=>setPaused(false)} onPause={()=>setPaused(true)} onError={()=>{setFailed(true);setPaused(true);}} />}
    <div className="campaign-shade"/>
    <div className="campaign-topline"><span>{slide?.seasonBadge||'THE VASSEL SIGNATURE'}</span>{active.length>1?<div className="campaign-pagination">{active.map((s,i)=><button key={s.id} aria-label={`Show campaign ${i+1}`} aria-pressed={index===i} onClick={()=>setIndex(i)}>{String(i+1).padStart(2,'0')}</button>)}</div>:<span>COLLECTION / 01</span>}</div>
    <div className="campaign-copy" key={slide?.id}><p className="eyebrow">{slide?.subtitle||'A study in quiet elegance'}</p><h1>{title==='Presence, without a word.'?<>Presence,<br/><em>without a word.</em></>:title}</h1><p className="campaign-description">Sculptural silhouettes. A softer point of view.<br/>Discover the world of Vassel.</p><button className="button-ivory" onClick={()=>navigate(slide?.ctaLink||'/shop')}>{slide?.ctaText||'Explore the collection'} <ArrowUpRight size={16}/></button>{slide?.secondaryCtaText&&slide.secondaryCtaLink&&<button className="hero-secondary" onClick={()=>navigate(slide.secondaryCtaLink!)}>{slide.secondaryCtaText}<ArrowUpRight size={14}/></button>}</div>
    {!mobile&&slide?.hotspots?.filter(h=>time>=h.startSec&&time<=h.endSec).map(h=><button key={h.id} className="campaign-hotspot" style={{left:`${Math.max(5,Math.min(95,h.xPercent))}%`,top:`${Math.max(8,Math.min(88,h.yPercent))}%`}} onClick={()=>onNavigate(`/products/${h.productSlug}`)} aria-label={`Explore ${h.productName}`}><Plus size={15}/><span>{h.label||h.productName}</span></button>)}
    <div className="campaign-bottom"><button onClick={()=>document.getElementById('signature-edit')?.scrollIntoView({behavior:reduced?'auto':'smooth'})}><ArrowDown size={15}/> Discover Vassel</button><span className="hero-caption">FORM. TEXTURE. CHARACTER.</span>{!failed&&source&&<button className="film-toggle" onClick={toggle} aria-label={paused?'Play campaign film':'Pause campaign film'}>{paused?<Play size={13}/>:<Pause size={13}/>}<span>{paused?'Play film':'Pause film'}</span></button>}</div>
  </section>;
};
