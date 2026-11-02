(function(root){
'use strict';
const number=v=>{const n=Number(String(v??'').replace(/[$,\s]/g,''));return Number.isFinite(n)&&n>0?n:null;};
function normalizeComp(row){if(!/^(sold|recently_sold)$/i.test(row.status||row.homeStatus||''))return null;const price=number(row.soldPrice??row.price);if(!price)return null;return {id:String(row.zpid||row.id||''),url:row.url||row.hdpUrl||'',address:row.address||'',price,sqft:number(row.livingArea??row.sqft)};}
function parseZillow(input){const found=[];
 const add=r=>{const c=normalizeComp(r);if(c)found.push(c);};
 if(Array.isArray(input))input.forEach(add);
 else {
 const html=String(input);
 for(const m of html.matchAll(/<script\b[^>]*type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi)){
 try{const walk=(v,context=false)=>{if(!v||typeof v!=='object')return;if(context&&!Array.isArray(v))add(v);for(const [k,child]of Object.entries(v))walk(child,context||/^(comps|comparables|comparableHomes|nearbySoldHomes|recentlySoldHomes)$/i.test(k));};walk(JSON.parse(m[1]));}catch{/* Malformed page JSON is not evidence. */}
 }
 // Only sold cards within an explicitly sold/comparables section count.
 for(const section of html.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/gi)){
 if(!/(?:nearby sold|recently sold|comparable|成交)/i.test(section[1]))continue;
 for(const card of section[1].matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)){
 const t=card[1].replace(/<[^>]*>/g,' ');if(!/\bsold\b/i.test(t))continue;
 const url=card[1].match(/href=["']([^"']+)/)?.[1]||'';
 add({status:'SOLD',price:t.match(/\$\s*([\d,]+(?:\.\d+)?)/)?.[1],sqft:t.match(/([\d,]+)\s*(?:sqft|sq ft|sq\. ft)/i)?.[1],url,zpid:url.match(/\/(\d+)_zpid/)?.[1]});
 }
 }
 }
 const seen=new Set();return found.filter(c=>{const key=c.id||c.url||(c.address?JSON.stringify([c.address,c.price,c.sqft]):JSON.stringify([c.price,c.sqft]));if(seen.has(key))return false;seen.add(key);return true;});
}
function median(values){if(!values.length)return null;const a=[...values].sort((a,b)=>a-b),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function summarizeComps(comps){const prices=comps.map(c=>c.price);return {count:comps.length,medianPrice:median(prices),minPrice:prices.length?Math.min(...prices):null,maxPrice:prices.length?Math.max(...prices):null,medianPricePerSqft:median(comps.filter(c=>c.sqft>0).map(c=>c.price/c.sqft)),message:prices.length?'':'无法判定：页面无成交数据'};}
const api={parseZillow,summarizeComps};Object.assign(root.PropertyTools ||= {},api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
