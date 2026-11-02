'use strict';
importScripts('../lib/license.js','../lib/quota.js');
const quota=PropertyTools.createQuotaStore(chrome.storage.local);
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 const fromRightmove=(()=>{try{return new URL(sender.url).origin==='https://www.rightmove.co.uk';}catch{return false;}})();
 let task;
 if(message.type==='quota-status')task=quota.status();
 if(message.type==='export-quota'&&fromRightmove)task=quota.consume(message.rows);
 if(message.type==='open-options')task=chrome.runtime.openOptionsPage().then(()=>({ok:true}));
 if(!task)return;
 task.then(reply,()=>reply({error:'本地存储操作失败，请重试'}));return true;
});
