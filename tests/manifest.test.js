const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
test('MV3 scopes and all extension entry points exist',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 assert.equal(m.manifest_version,3);assert.deepEqual(m.permissions,['storage','activeTab']);
 assert.deepEqual(m.host_permissions,['https://www.rightmove.co.uk/*','https://www.zillow.com/homedetails/*']);
 const files=[m.action.default_popup,m.options_page,m.background.service_worker,...Object.values(m.icons),...Object.values(m.action.default_icon)];
 for(const s of m.content_scripts){assert.deepEqual(s.matches,m.host_permissions);files.push(...s.js);}
 for(const f of files)assert.ok(fs.existsSync(path.join(root,f)),f);
 for(const html of [m.action.default_popup,m.options_page])for(const match of fs.readFileSync(path.join(root,html),'utf8').matchAll(/(?:src|href)="([^"]+)"/g))assert.ok(fs.existsSync(path.resolve(root,path.dirname(html),match[1])));
});
test('pure libraries run as browser globals without CommonJS',()=>{
 const context=vm.createContext({URL,TextEncoder,crypto:globalThis.crypto});
 for(const name of ['csv','rightmove','zillow','license','quota'])vm.runInContext(fs.readFileSync(path.join(root,'src/lib/'+name+'.js'),'utf8'),context);
 assert.equal(context.PropertyTools.summarizeComps([]).message,'无法判定：页面无成交数据');
 assert.equal(context.PropertyTools.readQuota().remaining,20);
 assert.ok(context.PropertyTools.toCSV([]).startsWith('\uFEFF'));
});
