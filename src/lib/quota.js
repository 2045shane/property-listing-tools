(function(root){
'use strict';
const STORAGE_KEYS={quota:'pltQuota',license:'pltLicense'};
const CTA='今日免费额度已用完';
function localDateKey(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
function readQuota(stored,now=new Date(),unlocked=false){const date=localDateKey(now),count=stored?.date===date&&Number.isSafeInteger(stored.count)&&stored.count>=0?stored.count:0;return {date,count,unlocked,remaining:unlocked?null:Math.max(0,20-count)};}
function createQuotaStore(storage,now=()=>new Date()){
 let queue=Promise.resolve();
 async function status(){const data=await storage.get(Object.values(STORAGE_KEYS));return readQuota(data[STORAGE_KEYS.quota],now(),await root.PropertyTools.verifyLicense(data[STORAGE_KEYS.license]));}
 function consume(rows){const result=queue.then(async()=>{const current=await status();const requested=Number.isSafeInteger(rows)&&rows>0?rows:0;const granted=current.unlocked?requested:Math.min(requested,current.remaining);if(granted&&!current.unlocked)await storage.set({[STORAGE_KEYS.quota]:{date:current.date,count:current.count+granted}});return {...current,granted};});queue=result.catch(()=>{});return result;}
 return {status,consume};
}
const api={STORAGE_KEYS,CTA,localDateKey,readQuota,createQuotaStore};Object.assign(root.PropertyTools ||= {},api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
