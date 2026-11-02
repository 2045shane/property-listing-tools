(function(root){
'use strict';
function clean(value){return String(value??'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(x[0-9a-f]+|\d+);/gi,(m,n)=>{if(n){const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return code<=0x10ffff?String.fromCodePoint(code):'';}return {'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '}[m.toLowerCase()]||m;}).replace(/\s+/g,' ').trim();}
function normalizeListing(row){const out={};for(const k of ['price','address','bedrooms','bathrooms','propertyType','agent','url','addedReduced'])out[k]=clean(row[k]);try{const u=new URL(out.url,'https://www.rightmove.co.uk');out.url=u.protocol==='https:'&&u.hostname==='www.rightmove.co.uk'&&/^\/properties\/\d+/.test(u.pathname)?u.origin+u.pathname:'';}catch{out.url='';}return out;}
// Fixture adapter only: live pages use visible DOM extraction, never regex for visibility.
function parseRightmove(input){if(Array.isArray(input))return input.map(normalizeListing);
 const cards=String(input).match(/<(article|div)\b[^>]*class=["'][^"']*\bpropertyCard\b[^"']*["'][^>]*>[\s\S]*?(?=<\1\b[^>]*class=["'][^"']*\bpropertyCard\b|$)/g)||[];
 return cards.map(card=>{const read=(name)=>clean(card.match(new RegExp('<[^>]+(?:class=["\'][^"\']*'+name+'[^"\']*["\']|data-field=["\']'+name+'["\'])[^>]*>([\\s\\S]*?)<\\/[^>]+>','i'))?.[1]);return normalizeListing({price:read('propertyCard-priceValue'),address:read('propertyCard-address'),bedrooms:read('bedrooms'),bathrooms:read('bathrooms'),propertyType:read('propertyType'),agent:read('propertyCard-branchSummary'),url:card.match(/href=["']([^"']*\/properties\/\d+[^"']*)/i)?.[1],addedReduced:read('propertyCard-contactsAddedOrReduced')});});
}
const api={clean,normalizeListing,parseRightmove};Object.assign(root.PropertyTools ||= {},api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
