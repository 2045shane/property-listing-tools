(function(root){
'use strict';
const STATES='AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|PR|GU|VI|AS|MP';
const ZIP_RE=new RegExp('\\b(?:'+STATES+')[\\s,\\-]+(\\d{5})(?:-\\d{4})?\\b','gi');
const BED_RE=/\b(\d{1,2})\s*(?:bd|bds|bed|beds|bedroom|bedrooms|brs?)\b/gi;
const BED_TEST=/\bstudio\b|\b\d{1,2}\s*(?:bd|bds|bed|beds|bedroom|bedrooms|brs?)\b/i;
const DISCLAIMER='Not investment advice. Fair Market Rent is not the rent a landlord will collect and is not a housing authority payment standard. The HUD USER publication controls.';

function parseZip(text){
 const found=new Set();
 for(const match of String(text??'').matchAll(ZIP_RE)) found.add(match[1]);
 if(!found.size) return {zip:null,error:'无法判定：页面未显示可识别的邮政编码'};
 if(found.size>1) return {zip:null,error:'无法判定：页面出现多个不同邮政编码（'+[...found].join('、')+'）'};
 return {zip:[...found][0],error:null};
}
function parsePrice(text){
 const found=[];
 const re=/\$\s*([\d,]+(?:\.\d{1,2})?)(\s*\/\s*(?:mo|month)\b)?/gi;
 for(const match of String(text??'').matchAll(re)){
  const amount=Number(match[1].replace(/,/g,''));
  if(!Number.isFinite(amount)||amount<=0) continue;
  const period=match[2]?'month':'sale';
  const key=amount+'|'+period;
  if(!found.some(row=>row.key===key)) found.push({key,amount,period});
 }
 return found.length===1?{amount:found[0].amount,period:found[0].period}:null;
}
function parseBedrooms(text){
 const src=String(text??'');
 if(!src.trim()) return null;
 const found=new Set();
 if(/\bstudio\b/i.test(src)) found.add(0);
 for(const match of src.matchAll(BED_RE)) found.add(Number(match[1]));
 return found.size===1?[...found][0]:null;
}
function stripNoise(text){
 return String(text??'').split(/\n+/).filter(line=>!/zestimate|rent zestimate|price history|\bsold\b|comparable|nearby sold/i.test(line)).join('\n');
}
function zillowFactsFromParts(parts){
 parts=parts||{};
 const zip=parseZip(parts.addressText||'');
 const priceText=String(parts.priceText||'');
 const bedText=String(parts.bedText||'');
 const header=stripNoise(parts.headerText||'');
 return {
  zip:zip.zip,
  zipError:zip.error,
  price:/\$/.test(priceText)?parsePrice(priceText):parsePrice(header),
  bedrooms:BED_TEST.test(bedText)?parseBedrooms(bedText):parseBedrooms(header)
 };
}
function tagText(chunk){return String(chunk??'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();}
function extractZillowFacts(html){
 const src=String(html??'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ');
 const title=(src.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'';
 const h1s=[...src.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match=>tagText(match[1]));
 const address=[tagText(title),...h1s];
 const price=[];
 const beds=[];
 for(const block of src.matchAll(/<([a-z0-9]+)\b[^>]*\bdata-testid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/\1>/gi)){
  const id=block[2], body=tagText(block[3]);
  if(/address/i.test(id)) address.push(body);
  else if(/price/i.test(id)&&!/zestimate|estimate|tax|sold|hoa|history/i.test(id+' '+body)) price.push(body);
  else if(/bed/i.test(id)) beds.push(body);
 }
 return zillowFactsFromParts({addressText:address.filter(Boolean).join('\n'),priceText:price.join('\n'),bedText:beds.join('\n')});
}
function lookupHudFmr(zip,pack){
 if(!pack||typeof pack.blob!=='string'||!/^\d{5}$/.test(String(zip||''))) return null;
 const width=pack.width,count=pack.count;
 if(!width||pack.blob.length!==count*width) return null;
 let lo=0,hi=count-1;
 while(lo<=hi){
  const mid=(lo+hi)>>1, start=mid*width, found=pack.blob.slice(start,start+5);
  if(found===zip){
   const rents=[];
   for(let i=0;i<5;i++) rents.push(Number(pack.blob.slice(start+5+i*4,start+9+i*4)));
   return {zip,rents,multiArea:pack.blob.charAt(start+25)==='1'};
  }
  if(found<zip) lo=mid+1; else hi=mid-1;
 }
 return null;
}
function money(amount){
 const value=Number(amount), negative=value<0;
 const body=Math.abs(value).toLocaleString('en-US',{maximumFractionDigits:2});
 return (negative?'-':'')+'$'+body;
}
function buildFmrView(facts,pack){
 const meta=pack&&pack.meta||{};
 const sourceUrl=meta.sourceUrl||'https://www.huduser.gov/portal/datasets/fmr/smallarea/index.html';
 const base={status:'undetermined',sourceUrl,fileUrl:meta.fileUrl||'',fy:meta.fy||null,compare:null,rows:null,multiArea:false,zip:null,updated:meta.fy?'FY '+meta.fy+' SAFMR · workbook dated '+(meta.fileLastModified||''):'',disclaimer:DISCLAIMER,message:'无法判定：页面未显示可识别的邮政编码'};
 if(!facts||facts.zipError||!facts.zip) return Object.assign(base,{message:(facts&&facts.zipError)||base.message});
 const row=lookupHudFmr(facts.zip,pack);
 if(!row) return Object.assign(base,{zip:facts.zip,message:'无法判定：FY '+(meta.fy||'')+' HUD SAFMR 公开表无此 ZIP '+facts.zip});
 let compare=null;
 if(facts.price){
  compare={label:facts.price.period==='month'?'Monthly rent':'List price',amount:facts.price.amount,period:facts.price.period,bedroom:null,fmr:null,delta:null,note:''};
  if(facts.bedrooms!=null&&facts.bedrooms>=0&&facts.bedrooms<=4){
   compare.bedroom=facts.bedrooms;
   compare.fmr=row.rents[facts.bedrooms];
   if(facts.price.period==='month') compare.delta=Math.round((facts.price.amount-compare.fmr)*100)/100;
  }else if(facts.bedrooms!=null){
   compare.bedroom=facts.bedrooms;
   compare.note='Bedroom count is outside the published 0–4 BR table.';
  }
 }
 return Object.assign(base,{status:'ok',message:'',zip:facts.zip,rows:row.rents.map((amount,br)=>({br,amount})),multiArea:row.multiArea,compare});
}
function fmrLines(view){
 if(!view||view.status!=='ok') return [view&&view.message||'无法判定：页面未显示可识别的邮政编码',view&&view.disclaimer||DISCLAIMER];
 const lines=['HUD Fair Market Rent (SAFMR)','ZIP '+view.zip+' · FY '+view.fy];
 for(const row of view.rows) lines.push(row.br+' BR  '+money(row.amount)+(view.compare&&view.compare.bedroom===row.br?'  ← listing':''));
 if(view.multiArea) lines.push('HUD lists this ZIP in more than one area. The published 0–4 BR SAFMR amounts match, so one set is shown.');
 if(view.compare){
  lines.push(view.compare.label+': '+money(view.compare.amount)+(view.compare.period==='month'?'/mo':''));
  if(view.compare.fmr!=null){
   lines.push(view.compare.bedroom+' BR FMR: '+money(view.compare.fmr)+'/mo');
   if(view.compare.delta!=null) lines.push('Rent − FMR: '+(view.compare.delta>0?'+':'')+money(view.compare.delta));
  }else if(view.compare.note) lines.push(view.compare.note);
 }
 lines.push(view.updated,view.disclaimer);
 return lines;
}
function shouldInjectFmr(href){
 try{const url=new URL(href);return url.hostname==='www.zillow.com'&&url.pathname.includes('/homedetails/');}
 catch{return false;}
}
function renderFmrInto(container,view){
 const doc=container.ownerDocument;
 container.replaceChildren();
 const paragraph=doc.createElement('p');
 paragraph.textContent=fmrLines(view).join('\n');
 container.append(paragraph);
 for(const link of [[view&&view.sourceUrl,'HUD USER Small Area FMRs'],[view&&view.fileUrl,'FY workbook']]){
  if(!link[0]) continue;
  const anchor=doc.createElement('a');
  anchor.href=link[0];
  anchor.target='_blank';
  anchor.rel='noopener noreferrer';
  anchor.textContent=link[1];
  container.append(anchor);
 }
}
const api={parseZip,parsePrice,parseBedrooms,zillowFactsFromParts,extractZillowFacts,lookupHudFmr,buildFmrView,fmrLines,shouldInjectFmr,renderFmrInto,money};
Object.assign(root.PropertyTools ||= {},api);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
