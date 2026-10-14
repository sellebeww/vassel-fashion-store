import type { ProductMedia } from '../types';
/** Concept renders replace demonstrably unrelated stock references, not real product photography. */
export const CAMPAIGN_MEDIA:Record<string,ProductMedia[]> = Object.fromEntries([
  ['prod-cabas-32','vassel-signature','Cognac Ambré'],
  ['prod-arche-bag','vassel-arche','Noir Profond'],
  ['prod-sella-crossbody','vassel-sella','Natural Vachetta Cognac'],
  ['prod-riviera-raffia','vassel-raffia','Natural Straw & Cognac Leather'],
  ['prod-cashmere-trench','vassel-lookbook','Sable Doré'],
  ['prod-bronze-cuff','vassel-cuff',''],
].map(([id,file,color])=>[id,[{id:`concept-${id}`,url:`/images/${file}.webp`,type:'image',isCover:true,isConcept:true,variantColor:color,altText:'VASSEL design visualization — not a photograph of a manufactured product'}]]));
