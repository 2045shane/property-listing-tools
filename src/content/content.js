(function(){
'use strict';
if(document.getElementById('plt-panel'))return;
const P=PropertyTools,host=document.createElement('div');host.id='plt-panel';
host.style.cssText='position:fixed;right:18px;bottom:18px;z-index:2147483647';
const shadow=host.attachShadow({mode:'open'});
shadow.innerHTML=`<style>:host{all:initial}section{width:280px;padding:16px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#172033;box-shadow:0 6px 28px #0003;font:14px/1.6 system-ui}h2{font-size:17px;margin:0 0 8px}button{background:#12665d;color:white;border:0;border-radius:6px;padding:8px 12px;cursor:pointer}button:disabled{opacity:.5}p{white-space:pre-line;margin:8px 0}small{color:#555}</style><section><h2>房产工具</h2><button id="run"></button><p id="result" role="status" aria-live="polite"></p><button id="license" hidden>本地授权演示</button><p><small>仅使用页面已有数据，未经真实网站验证。</small></p></section>`;
document.documentElement.append(host);
const run=shadow.querySelector('#run'),result=shadow.querySelector('#result'),license=shadow.querySelector('#license');
license.onclick=()=>chrome.runtime.sendMessage({type:'open-options'}).catch(()=>{result.textContent='无法打开设置，请从扩展菜单打开选项';});
const isRightmove=location.hostname==='www.rightmove.co.uk';
run.textContent=isRightmove?'导出 CSV':'刷新成交汇总';
function showComps(){const s=P.summarizeComps(P.zillowComps()),money=n=>'$'+n.toLocaleString('en-US',{maximumFractionDigits:2});result.textContent=s.message||`成交样本：${s.count} 套\n成交价中位数：${money(s.medianPrice)}\n价格范围：${money(s.minPrice)} – ${money(s.maxPrice)}\n每平方英尺中位数：${s.medianPricePerSqft===null?'无法判定（缺少面积）':money(s.medianPricePerSqft)+'/sqft'}`;}
run.onclick=async()=>{
 run.disabled=true;
 try{
 if(!isRightmove){showComps();return;}
 const rows=P.rightmoveListings();if(!rows.length){result.textContent='未找到可见房源，请加载房源后重试';return;}
 const csv=P.toCSV(rows); // Build before reserving quota; no charge for empty extraction.
 const q=await chrome.runtime.sendMessage({type:'export-quota',rows:rows.length});
 if(q.error)throw new Error(q.error);
 if(!q.granted){result.textContent='今日免费额度已用完';license.hidden=false;return;}
 const blob=new Blob([q.granted===rows.length?csv:P.toCSV(rows.slice(0,q.granted))],{type:'text/csv;charset=utf-8;'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='rightmove-listings.csv';a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 result.textContent=`已发起导出 ${q.granted} 行`+(q.granted<rows.length?'；今日免费额度已用完':'');license.hidden=q.unlocked||q.granted<q.remaining;
 }catch(e){result.textContent=e.message||'操作失败，请刷新页面重试';}finally{run.disabled=false;}
};
chrome.runtime.onMessage.addListener((m,_s,reply)=>{if(m.type==='run-tool'){run.click();reply({ok:true});}});
if(!isRightmove)showComps();
})();
