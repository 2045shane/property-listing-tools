const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const P = Object.assign({}, ...['csv','rightmove','zillow','license','quota'].map(n => require('../src/lib/'+n)));
const fixture = n => fs.readFileSync(__dirname+'/fixtures/'+n+'.html','utf8');
test('CSV field order, quotes, commas, newline, BOM and spreadsheet formula protection', () => {
 assert.deepEqual(P.buildRow({price:'£1',address:'A',url:'u'}),['£1','A','','','','','u','']);
 assert.equal(P.escapeCSV('a,"b"\nc'),'"a,""b""\nc"');
 assert.equal(P.escapeCSV('=1+1'),"'=1+1");
 assert.ok(P.toCSV([{address:'A,B'}]).startsWith('\uFEFF价格,地址,'));
 assert.ok(P.toCSV([{address:'A,B'}]).includes('"A,B"'));
});
test('Rightmove fixture cards and extracted objects preserve missing fields', () => {
 const rows=P.parseRightmove(fixture('rightmove'));
 assert.equal(rows.length,2); assert.deepEqual(rows[0],{price:'£450,000',address:'12 Test Road, London',bedrooms:'3',bathrooms:'2',propertyType:'Terraced',agent:'Example & Co',url:'https://www.rightmove.co.uk/properties/123',addedReduced:'Reduced yesterday'});
 assert.equal(rows[1].bathrooms,'');
 assert.equal(P.parseRightmove([{price:'£1',url:'/properties/1'}])[0].url,'https://www.rightmove.co.uk/properties/1');
 assert.deepEqual(P.parseRightmove('<html></html>'),[]);
});
function memory(){const data={};return {data,async get(){return {...data};},async set(v){Object.assign(data,v);}};}
test('quota caps concurrent row exports at 20 and resets on local next day',async()=>{
 let date=new Date(2026,10,1); const s=memory();const q=P.createQuotaStore(s,()=>date);
 const r=await Promise.all([q.consume(15),q.consume(15),q.consume(1)]);
 assert.deepEqual(r.map(x=>x.granted),[15,5,0]);assert.equal((await q.status()).remaining,0);
 date=new Date(2026,10,2); assert.equal((await q.status()).remaining,20);
 assert.equal((await q.consume(0)).granted,0);assert.equal((await q.status()).count,0);
});
test('local license stub validates and unlocks quota',async()=>{
 const token=await P.issueLicense();assert.equal(await P.verifyLicense(token),true);assert.equal(await P.verifyLicense('bad'),false);
 const s=memory();s.data[P.STORAGE_KEYS.license]=token;assert.equal((await P.createQuotaStore(s).consume(30)).granted,30);
});
test('Zillow DOM cards and embedded comps deduplicate and summarize sold evidence only',()=>{
 const comps=P.parseZillow(fixture('zillow'));assert.equal(comps.length,2);
 assert.deepEqual(P.summarizeComps(comps),{count:2,medianPrice:500000,minPrice:400000,maxPrice:600000,medianPricePerSqft:250,message:''});
 assert.equal(P.parseZillow('<script type="application/json">{"price":12}</script>').length,0);
 const embedded='<script type="application/json">{"comps":[{"zpid":"8","homeStatus":"SOLD","price":200000,"livingArea":0}]}</script>';
 assert.equal(P.summarizeComps(P.parseZillow(embedded)).medianPricePerSqft,null);
 assert.equal(P.parseZillow([{status:'FOR_SALE',price:12}]).length,0);
});
test('empty or malformed data returns explicit uncertainty',()=>{
 for(const html of ['', '<html>For sale $1</html>','<script type="application/json">oops</script>']) assert.equal(P.summarizeComps(P.parseZillow(html)).message,'无法判定：页面无成交数据');
});
