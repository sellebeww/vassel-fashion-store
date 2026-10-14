import type { CartItem, Product, Promotion } from '../types';
export function addCartItem(cart: CartItem[], item: CartItem): CartItem[] {
  if (item.product.isSoldOut || item.product.status === 'ARCHIVED' || item.variant.isSoldOut || item.variant.stockAvailable <= 0 || !Number.isFinite(item.quantity) || item.quantity < 1) return cart;
  const used = cart.filter(i => i.variant.id === item.variant.id).reduce((n,i) => n+i.quantity,0);
  const quantity = Math.min(Math.floor(item.quantity), Math.max(0,item.variant.stockAvailable-used));
  if (!quantity) return cart;
  const same = (i:CartItem) => i.variant.id === item.variant.id && (i.customEngraving || '') === (item.customEngraving || '') && i.engravingFoil === item.engravingFoil && !!i.isGiftWrapped === !!item.isGiftWrapped && (i.giftCardMessage || '') === (item.giftCardMessage || '');
  return cart.some(same) ? cart.map(i=>same(i) ? {...i, quantity:i.quantity+quantity} : i) : [...cart,{...item,quantity}];
}
export function updateCartQuantity(cart:CartItem[], id:string, quantity:number):CartItem[] {
  if (!Number.isFinite(quantity)) return cart;
  return cart.map(i=> {
    if(i.id !== id) return i;
    const others = cart.filter(x=>x.id!==id && x.variant.id===i.variant.id).reduce((n,x)=>n+x.quantity,0);
    return {...i,quantity:Math.max(0,Math.min(Math.floor(quantity),i.variant.stockAvailable-others))};
  }).filter(i=>i.quantity>0);
}
export function reconcileCart(cart:CartItem[], products:Product[]):CartItem[] {
  return cart.reduce<CartItem[]>((result,item)=>{
    const product=products.find(p=>p.id===item.product?.id && p.status !== 'ARCHIVED');
    const variant=product?.variants.find(v=>v.id===item.variant?.id);
    return product && variant ? addCartItem(result,{...item,product,variant}) : result;
  },[]);
}
export function promotionError(promo:Promotion | undefined, subtotal:number, member:boolean, now=new Date()):string | null {
  if(!promo || !promo.isActive) return 'This code is not available.';
  const day=now.toISOString().slice(0,10);
  if(day<promo.startDate || day>promo.endDate) return 'This code is outside its valid dates.';
  if(promo.isMembersOnly && !member) return 'Save your client profile to use this code.';
  if(subtotal<promo.minSpendUSD) return 'Your bag does not meet the minimum spend.';
  if(promo.budgetLimitUSD != null && promo.budgetUsedUSD>=promo.budgetLimitUSD) return 'This offer has reached its limit.';
  return null;
}
export function discountFor(promo:Promotion | undefined, subtotal:number, member:boolean):number {
  if(promotionError(promo,subtotal,member)) return 0;
  const discount=promo!.type==='PERCENTAGE' ? Math.round(subtotal*promo!.value/100) : promo!.type==='FIXED' ? promo!.value : 0;
  return Math.max(0,Math.min(subtotal,discount,promo!.maxDiscountUSD ?? Infinity,promo!.budgetLimitUSD == null ? Infinity : promo!.budgetLimitUSD-promo!.budgetUsedUSD));
}
