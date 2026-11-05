(function(root){
'use strict';
const P=root.PropertyTools;
function visible(el){if(!el||el.closest('[hidden], [aria-hidden="true"]'))return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&s.visibility!=='collapse'&&s.opacity!=='0'&&el.getClientRects().length>0;}
function text(el,selectors){for(const s of selectors.split('|')){for(const node of el.querySelectorAll(s)){if(visible(node)&&node.innerText.trim())return node.innerText.trim();}}return '';}
function rightmoveListings(){
 let cards=[...document.querySelectorAll('.propertyCard, [data-testid="propertyCard"], [data-test="property-card"]')].filter(visible);
 if(!cards.length&&/^\/properties\/\d+/.test(location.pathname))cards=[document.querySelector('main')||document.body];
 const seen=new Set();return cards.map(card=>{
 const field=k=>text(card,`[data-field="${k}"]|[data-testid="${k}"]`);
 const detail=k=>{for(const dt of card.querySelectorAll('dt')){if(visible(dt)&&new RegExp(k,'i').test(dt.innerText)){const dd=dt.nextElementSibling;if(dd&&dd.tagName==='DD'&&visible(dd))return dd.innerText.trim();}}return '';};
 const label=k=>[...card.querySelectorAll(`[aria-label*="${k}" i], [title*="${k}" i]`)].filter(visible).map(e=>e.getAttribute('aria-label')||e.title).join(' ').match(/\d+/)?.[0]||'';
 const link=[...card.querySelectorAll('a[href*="/properties/"]')].find(visible);
 return P.normalizeListing({price:text(card,'.propertyCard-priceValue|[data-testid="price"]|[data-testid="property-price"]|[class*="propertyPrice"]'),address:text(card,'.propertyCard-address|[data-testid="address"]|h1'),bedrooms:field('bedrooms')||detail('bedroom')||label('bedroom'),bathrooms:field('bathrooms')||detail('bathroom')||label('bathroom'),propertyType:field('propertyType')||detail('property type')||text(card,'.propertyCard-propertyType'),agent:text(card,'.propertyCard-branchSummary|[data-testid="agent-name"]|[data-testid="agentName"]'),url:link?.href||(/^\/properties\/\d+/.test(location.pathname)?location.href:''),addedReduced:text(card,'.propertyCard-contactsAddedOrReduced|[data-testid="added-reduced"]')});
 }).filter(r=>{if(!r.url||(!r.price&&!r.address)||seen.has(r.url))return false;seen.add(r.url);return true;});
}
function zillowComps(){
 const rows=[];
 for(const heading of document.querySelectorAll('h2,h3,h4')){
 if(!visible(heading)||!/(nearby sold|recently sold|comparable|成交)/i.test(heading.innerText))continue;
 const section=heading.closest('section')||heading.parentElement;
 for(const card of section.querySelectorAll('article,[data-test="property-card"],[data-testid="property-card"]')){
 if(!visible(card))continue;const t=card.innerText;if(!/\bsold\b/i.test(t))continue;
 const a=[...card.querySelectorAll('a[href*="/homedetails/"]')].find(visible),url=a?.href||'';
 rows.push({status:'SOLD',price:t.match(/\$\s*([\d,]+(?:\.\d+)?)/)?.[1],sqft:t.match(/([\d,]+)\s*(sqft|sq ft|sq\. ft)/i)?.[1],url,zpid:url.match(/\/(\d+)_zpid/)?.[1]});
 }
 }
 // Pass only script elements already in the DOM; never fetch page state.
 const scripts=[...document.querySelectorAll('script[type="application/json"],script[type="application/ld+json"]')].map(s=>`<script type="application/json">${s.textContent}</script>`).join('');
 return P.parseZillow([...rows,...P.parseZillow(scripts).map(c=>({...c,status:'SOLD'}))]);
}
function zillowListingFacts(){
 const address=[document.title,location.href];
 for(const el of document.querySelectorAll('h1, address, [data-testid*="address" i]')) if(visible(el)) address.push(el.innerText);
 const price=[],beds=[];
 for(const el of document.querySelectorAll('[data-testid*="price" i], [data-test*="price" i]')){
  if(!visible(el)) continue;
  const label=(el.getAttribute('data-testid')||'')+' '+(el.getAttribute('data-test')||'')+' '+el.innerText;
  if(/zestimate|estimate|tax|\bsold\b|hoa|history/i.test(label)) continue;
  if(el.closest('article, [data-test="property-card"], [data-testid="property-card"]')) continue;
  price.push(el.innerText);
 }
 for(const el of document.querySelectorAll('[data-testid*="bed" i], [data-test*="bed" i]')){
  if(!visible(el)||el.closest('article, [data-test="property-card"], [data-testid="property-card"]')) continue;
  beds.push(el.innerText);
 }
 let header='';
 const h1=[...document.querySelectorAll('h1')].find(visible);
 if(h1){
  let node=h1;
  for(let i=0;i<4&&node.parentElement&&node.parentElement!==document.body&&node.parentElement!==document.documentElement;i++) node=node.parentElement;
  const clone=node.cloneNode(true);
  clone.querySelectorAll('article, script, style, [data-test="property-card"], [data-testid="property-card"]').forEach(el=>el.remove());
  header=clone.innerText||'';
 }
 return P.zillowFactsFromParts({addressText:address.join('\n'),priceText:price.join('\n'),bedText:beds.join('\n'),headerText:header});
}
Object.assign(P,{visible,rightmoveListings,zillowComps,zillowListingFacts});
})(globalThis);
