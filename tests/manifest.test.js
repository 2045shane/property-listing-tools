const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
test('MV3 scopes and all extension entry points exist',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 assert.equal(m.manifest_version,3);assert.deepEqual(m.permissions,['storage','activeTab']);
 assert.deepEqual(m.host_permissions,['https://www.rightmove.co.uk/*','https://www.zillow.com/homedetails/*']);
 const files=[m.action.default_popup,m.options_page,m.background.service_worker,...Object.values(m.icons),...Object.values(m.action.default_icon)];
 const covered=new Set();
 for(const s of m.content_scripts){
  for(const match of s.matches){assert.ok(m.host_permissions.includes(match),match);covered.add(match);}
  files.push(...s.js);
 }
 assert.deepEqual([...covered].sort(),[...m.host_permissions].sort());
 const rightmove=m.content_scripts.find(s=>s.matches.includes('https://www.rightmove.co.uk/*'));
 const zillow=m.content_scripts.find(s=>s.matches.includes('https://www.zillow.com/homedetails/*'));
 assert.deepEqual(rightmove.js,['src/lib/csv.js','src/lib/rightmove.js','src/content/extractors.js','src/content/content.js']);
 assert.ok(zillow.js.includes('src/lib/zillow.js')&&zillow.js.includes('src/lib/fmr.js')&&zillow.js.includes('src/data/hud-fy2027-safmr.js'));
 assert.equal(rightmove.js.some(file=>file.includes('hud-')),false);
 for(const f of files)assert.ok(fs.existsSync(path.join(root,f)),f);
 for(const html of [m.action.default_popup,m.options_page])for(const match of fs.readFileSync(path.join(root,html),'utf8').matchAll(/(?:src|href)="([^"]+)"/g))assert.ok(fs.existsSync(path.resolve(root,path.dirname(html),match[1])));
});
test('pure libraries run as browser globals without CommonJS',()=>{
 const context=vm.createContext({URL,TextEncoder,crypto:globalThis.crypto});
 for(const file of ['src/lib/csv.js','src/lib/rightmove.js','src/lib/zillow.js','src/lib/license.js','src/lib/quota.js','src/data/hud-fy2027-safmr.js','src/lib/fmr.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
 assert.equal(context.PropertyTools.summarizeComps([]).message,'无法判定：页面无成交数据');
 assert.equal(context.PropertyTools.readQuota().remaining,20);
 assert.ok(context.PropertyTools.toCSV([]).startsWith('\uFEFF'));
 assert.deepEqual([...context.PropertyTools.lookupHudFmr('10001',context.PropertyTools.HUD_FMR_PACK).rents],[3890,4100,4460,5640,6190]);
 assert.equal(context.PropertyTools.shouldInjectFmr('https://www.realtor.com/homedetails/1'),false);
});
test('sources do not call the network or name a paid rent API',()=>{
 const banned=/rentometer|mashvisor|attomdata|rentcast|realty.?mole|hudapi|sk_live|api[_-]?key\s*[:=]|rapidapi/i;
 const files=[];
 for(const dir of ['src','scripts']){
  const walk=directory=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const full=path.join(directory,entry.name);if(entry.isDirectory())walk(full);else files.push(full);}};
  walk(path.join(root,dir));
 }
 files.push(path.join(root,'manifest.json'),path.join(root,'package.json'));
 for(const file of files){
  const text=fs.readFileSync(file,'utf8');
  assert.equal(banned.test(text),false,file);
  assert.equal(/\bfetch\s*\(/.test(text),false,file);
  assert.equal(/XMLHttpRequest/.test(text),false,file);
 }
});
