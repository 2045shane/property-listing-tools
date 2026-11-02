(function(root){
'use strict';
const FIELDS=['price','address','bedrooms','bathrooms','propertyType','agent','url','addedReduced'];
const HEADERS=['价格','地址','卧室','浴室','房产类型','中介','链接','新增/降价'];
function buildRow(row){return FIELDS.map(k=>String(row[k]??''));}
function escapeCSV(value){let s=String(value??'');if(/^\s*[=+@-]/.test(s))s="'"+s;return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function toCSV(rows){return '\uFEFF'+[HEADERS,...rows.map(buildRow)].map(r=>r.map(escapeCSV).join(',')).join('\r\n');}
const api={FIELDS,buildRow,escapeCSV,toCSV};Object.assign(root.PropertyTools ||= {},api);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
