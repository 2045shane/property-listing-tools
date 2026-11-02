'use strict';
chrome.runtime.sendMessage({type:'quota-status'}).then(q=>{document.getElementById('status').textContent=q.error||(q.unlocked?'本地演示授权已启用':`今日剩余免费导出：${q.remaining} 行`);}).catch(()=>{document.getElementById('status').textContent='无法读取额度';});
document.getElementById('options').onclick=()=>chrome.runtime.openOptionsPage();
document.getElementById('run').onclick=async()=>{try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});await chrome.tabs.sendMessage(tab.id,{type:'run-tool'});window.close();}catch{document.getElementById('status').textContent='请打开 Rightmove 或 Zillow 房源页面；安装后需刷新页面。';}};
