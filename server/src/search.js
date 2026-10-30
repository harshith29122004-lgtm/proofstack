import { randomUUID } from 'node:crypto';
const STOP = new Set('the a an and or but if then is are was were be been being to of in on for from by with as at into about this that these those it its we you your our their they them he she his her what which when where who why how can could should would may might will do does did not no yes'.split(' '));
export function terms(s) { return (s.toLowerCase().match(/[a-z0-9]+(?:[._-][a-z0-9]+)*/g) || []).filter(t => t.length > 1 && !STOP.has(t)); }
export function score(query, content) {
  const q=terms(query), d=terms(content); if(!q.length||!d.length)return 0;
  const freq=new Map(); d.forEach(t=>freq.set(t,(freq.get(t)||0)+1));
  let value=0; for(const t of new Set(q)){const count=freq.get(t)||0;if(count)value+=count*(1+Math.log(1+d.length/(1+count)));}
  if(content.toLowerCase().includes(query.toLowerCase()))value+=8;
  return value/Math.sqrt(d.length);
}
export function splitChunks(text, source, max=900) {
  const paras=text.replace(/\r/g,'').split(/\n{2,}|(?<=\.)\s+(?=[A-Z])/).map(x=>x.trim()).filter(Boolean);
  const out=[];let current='',part=1;
  function make(content,n){return{id:randomUUID(),documentId:source.documentId,documentName:source.name,location:source.locationPrefix?(source.locationPrefix.toLowerCase().includes('row')?source.locationPrefix+' '+n:source.locationPrefix):'Section '+n,content};}
  for(const para of paras){if((current+' '+para).length>max&&current){out.push(make(current,part++));current='';}
    if(para.length>max){for(let i=0;i<para.length;i+=max)out.push(make(para.slice(i,i+max),part++));}
    else current+=(current?'\n':'')+para;
  }
  if(current)out.push(make(current,part));return out;
}