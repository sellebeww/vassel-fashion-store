import { useEffect, useRef } from 'react';
let locks = 0;
let previousOverflow = '';
export function useDialog(open:boolean, close:()=>void) {
  const ref = useRef<HTMLDivElement>(null);
  const onClose = useRef(close);
  onClose.current = close;
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (locks++ === 0) { previousOverflow=document.body.style.overflow; document.body.style.overflow='hidden'; }
    const focusable = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]') || []).filter(e=>e.getClientRects().length);
    const frame=requestAnimationFrame(()=>focusable()[0]?.focus());
    const handler=(e:KeyboardEvent)=>{
      if(e.key==='Escape') { e.preventDefault();onClose.current(); }
      if(e.key==='Tab') {const elements=focusable(); const first=elements[0], last=elements.at(-1); if(!first){e.preventDefault();return;} if(e.shiftKey && (document.activeElement===first || !ref.current?.contains(document.activeElement))) {e.preventDefault();last?.focus();} else if(!e.shiftKey && (document.activeElement===last || !ref.current?.contains(document.activeElement))) {e.preventDefault();first.focus();}}
    };
    document.addEventListener('keydown',handler);
    return ()=>{ cancelAnimationFrame(frame);document.removeEventListener('keydown',handler);if(--locks===0) document.body.style.overflow=previousOverflow; if(previouslyFocused?.isConnected) previouslyFocused.focus(); };
  },[open]);
  return ref;
}
