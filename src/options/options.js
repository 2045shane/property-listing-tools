'use strict';
async function change(enable){try{if(enable)await chrome.storage.local.set({pltLicense:await PropertyTools.issueLicense()});else await chrome.storage.local.remove('pltLicense');document.getElementById('status').textContent=enable?'演示授权已启用':'演示授权已清除';}catch{document.getElementById('status').textContent='本地存储操作失败';}}
document.getElementById('enable').onclick=()=>change(true);
document.getElementById('disable').onclick=()=>change(false);
