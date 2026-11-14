/* 본 제품은 한글과컴퓨터의 한/글 문서 파일(.hwp) 공개 문서를 참고하여 개발하였습니다.
 * Original template: 1111-혁신기술교육센터 주간업무보고.hwp, SW 미래채움 row only.
 * No DOCX/HTML renaming. This writes a native HWP 5.0 Compound File.
 * Original business text, summary metadata and scripts are not included. */
(function(root){
'use strict';
let cachedTemplate;
const templateData='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';
async function getTemplate(){if(!cachedTemplate)cachedTemplate=JSON.parse(new TextDecoder().decode(await inflate(bytes(templateData))));return cachedTemplate;}
const EOC=0xfffffffe, FREE=0xffffffff, FAT=0xfffffffd;
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const dv=b=>new DataView(b.buffer,b.byteOffset,b.byteLength);
const u32=(b,p,v)=>{dv(b).setUint32(p,v>>>0,true);return b};
const u16=(b,p,v)=>{dv(b).setUint16(p,v,true);return b};
const cat=xs=>{const b=new Uint8Array(xs.reduce((s,x)=>s+x.length,0));let p=0;for(const x of xs){b.set(x,p);p+=x.length}return b};
const utf16=s=>{const b=new Uint8Array(s.length*2);for(let i=0;i<s.length;i++)u16(b,i*2,s.charCodeAt(i));return b};
const from=r=>({tag:r[0],level:r[1],data:bytes(r[2])});
const record=(tag,level,data)=>({tag,level,data});
function pack(r){const b=new Uint8Array(r.data.length>=4095?8:4);u32(b,0,r.tag|(r.level<<10)|(Math.min(r.data.length,4095)<<20));if(b.length===8)u32(b,4,r.data.length);return cat([b,r.data])}
function sanitize(s){return String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').replace(/\r\n?/g,'\n').slice(0,16000)}
// CF directory ordering is by UTF-16 length, then case-insensitive code units.
function compare(a,b){return a.length-b.length||(a.toUpperCase()<b.toUpperCase()?-1:a.toUpperCase()>b.toUpperCase()?1:0)}
function compound(streams){
 const entries=[{name:'Root Entry',type:5,children:[]}];
 function add(path,data){let parent=0;const parts=path.split('/');parts.forEach((name,n)=>{let id=entries[parent].children.find(i=>entries[i].name===name);if(id===undefined){id=entries.length;entries.push({name,type:n===parts.length-1?2:1,children:[],data:n===parts.length-1?data:null});entries[parent].children.push(id)}parent=id})}
 Object.entries(streams).forEach(([k,v])=>add(k,v));
 for(const e of entries){e.left=FREE;e.right=FREE;e.child=FREE;e.color=1;e.start=EOC;e.size=e.data?.length||0}
 // A balanced red/black tree: deepest nodes red, root black.
 for(const e of entries){if(!e.children.length)continue;const ids=[...e.children].sort((a,b)=>compare(entries[a].name,entries[b].name));const maxDepth=Math.floor(Math.log2(ids.length));function build(xs,depth){if(!xs.length)return FREE;const mid=Math.floor(xs.length/2),id=xs[mid],n=entries[id];n.color=depth===maxDepth&&depth>0?0:1;n.left=build(xs.slice(0,mid),depth+1);n.right=build(xs.slice(mid+1),depth+1);return id}e.child=build(ids,0)}
 const mini=[],miniFat=[];let miniOffset=0;
 for(const e of entries){if(e.type!==2||!e.size||e.size>=4096)continue;e.start=miniOffset;const n=Math.ceil(e.size/64);let b=new Uint8Array(n*64);b.set(e.data);mini.push(b);for(let i=0;i<n;i++)miniFat.push(i===n-1?EOC:miniOffset+i+1);miniOffset+=n}
 const sectors=[],fat=[];
 function allocate(data){if(!data.length)return EOC;const start=sectors.length,n=Math.ceil(data.length/512);for(let i=0;i<n;i++){const b=new Uint8Array(512);b.set(data.subarray(i*512,(i+1)*512));sectors.push(b);fat.push(i===n-1?EOC:start+i+1)}return start}
 for(const e of entries)if(e.type===2&&e.size>=4096)e.start=allocate(e.data);
 const rootData=cat(mini);entries[0].start=allocate(rootData);entries[0].size=rootData.length;
 const miniBytes=new Uint8Array(Math.ceil(miniFat.length/128)*512);miniBytes.fill(255);miniFat.forEach((v,i)=>u32(miniBytes,i*4,v));const miniStart=allocate(miniBytes);
 const dir=new Uint8Array(Math.ceil(entries.length/4)*512);
 entries.forEach((e,i)=>{const b=dir.subarray(i*128,(i+1)*128),n=utf16(e.name+'\0');if(n.length>64)throw Error('잘못된 HWP 저장소 이름');b.set(n);u16(b,64,n.length);b[66]=e.type;b[67]=e.color;u32(b,68,e.left);u32(b,72,e.right);u32(b,76,e.child);u32(b,116,e.start);u32(b,120,e.size)});
 const dirStart=allocate(dir);let fatCount=1;while(Math.ceil((sectors.length+fatCount)/128)>fatCount)fatCount++;
 if(fatCount>109)throw Error('문서가 너무 큽니다.');
 const fatStarts=[];for(let i=0;i<fatCount;i++){fatStarts.push(sectors.length);sectors.push(new Uint8Array(512).fill(255));fat.push(FAT)}
 fat.forEach((v,i)=>u32(sectors[fatStarts[Math.floor(i/128)]],(i%128)*4,v));
 const header=new Uint8Array(512);header.set([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]);u16(header,24,0x3e);u16(header,26,3);u16(header,28,0xfffe);u16(header,30,9);u16(header,32,6);u32(header,44,fatCount);u32(header,48,dirStart);u32(header,56,4096);u32(header,60,miniStart);u32(header,64,miniBytes.length/512);u32(header,68,EOC);u32(header,72,0);for(let i=0;i<109;i++)u32(header,76+4*i,fatStarts[i]??FREE);
 return cat([header,...sectors]);
}
async function inflate(b){if(typeof DecompressionStream==='undefined')throw Error('한글 파일 생성에는 최신 Chrome 또는 Edge가 필요합니다.');return new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer())}
function paragraph(text,base,shape,{last=true,y=0,width=30280,level=2,center=false}={}){
 text=sanitize(text).replace(/\n/g,' ')+'\r';const h=bytes(base[2]);u32(h,0,text.length+(last?0x80000000:0));u32(h,4,0);h[11]=0;u16(h,12,1);u16(h,14,0);u32(h,18,0);u16(h,22,0);
 const chars=bytes(shape[2]).slice(0,8);u32(chars,0,0);
 const starts=[0];let lineWidth=0;
 for(let i=0;i<text.length-1;i++){const w=text.charCodeAt(i)>0xff?1000:500;if(lineWidth+w>width-400){starts.push(i);lineWidth=0}lineWidth+=w}
 u16(h,16,starts.length);const lineData=new Uint8Array(starts.length*36);
 starts.forEach((p,i)=>{const b=lineData.subarray(i*36,(i+1)*36);[p,y+i*1700,1000,1000,850,700,0,width,0x60000].forEach((v,k)=>u32(b,k*4,v))});
 return {records:[record(66,level,h),record(67,level+1,utf16(text)),record(68,level+1,chars),record(69,level+1,lineData)],height:starts.length*1700};
}
function dateLabel(start,end){const fmt=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))throw Error('보고 기간을 선택해 주세요.');return s.split('-').map(Number)};const a=fmt(start),b=fmt(end);return `${a[0]}. ${a[1]}. ${a[2]}.~${a[0]!==b[0]?b[0]+'. ':''}${b[1]}. ${b[2]}.`}
async function build(input){
 const TEMPLATE=await getTemplate();
 const actual=sanitize(input.actual),plan=sanitize(input.plan);
 if(!actual.trim()||!plan.trim())throw Error('주간실적과 주간계획을 모두 작성한 뒤 검토해 주세요.');
 if(actual.length>12000||plan.length>12000)throw Error('각 보고 항목은 12,000자 이내로 작성해 주세요.');
 const rs=TEMPLATE.prefix.map(from);
 // Main table has a header and a single SW 미래채움 row; no other projects are retained.
 const main=rs.findLast(r=>r.tag===77);const old=main.data;const table=new Uint8Array(old.length-4);table.set(old.subarray(0,18));u16(table,4,2);table.set(old.subarray(18,22),18);table.set(old.subarray(26),22);main.data=table;
 const labels=['구분','주간실적('+dateLabel(input.start,input.end)+')','주간계획('+dateLabel(input.nextStart,input.nextEnd)+')'];
 for(let i=0;i<3;i++){const cell=from(TEMPLATE.headerCells[i]);const para=paragraph(labels[i],TEMPLATE.headerParagraphs[i],TEMPLATE.headerShapes[i],{width:i===0?12210:30280});u32(cell.data,0,1);u32(cell.data,20,Math.max(1566,para.height));rs.push(cell,...para.records)}
 const label=paragraph('소프트웨어(SW) 미래채움사업',TEMPLATE.labelParagraph,TEMPLATE.labelShape,{width:12210});
 const sections=[];
 for(const [i,text] of [actual,plan].entries()){
  const body=[];let y=0;
  // Keep education tables as blank editable slots in Hangul, not editable fields in the web UI.
  const heading=paragraph(i===0?'- 찾아가는 AI·SW교육 및 센터 내 교육 운영 현황':'- 찾아가는 AI·SW교육 및 센터 내 교육 운영 계획',TEMPLATE.bodyParagraph,TEMPLATE.bodyShape,{last:false,y});body.push(...heading.records);y+=heading.height;
  const education=TEMPLATE[i===0?'educationActual':'educationPlan'].map(from);const ep=education[0];u32(ep.data,0,dv(ep.data).getUint32(0,true)&0x7fffffff);body.push(...education);y+=i===0?6900:6500;
  const lines=text.split('\n').filter(v=>v.trim());lines.forEach((line,j)=>{const p=paragraph(line,TEMPLATE.bodyParagraph,TEMPLATE.bodyShape,{last:j===lines.length-1,y});body.push(...p.records);y+=p.height});sections.push({records:body,height:y,count:2+lines.length});
 }
 const height=Math.max(17000,...sections.map(s=>s.height+700));
 [label,...sections].forEach((section,i)=>{const cell=from(TEMPLATE.dataCells[i]);u32(cell.data,0,i===0?1:section.count);u16(cell.data,10,1);u32(cell.data,20,height);rs.push(cell,...section.records)});
 const mainCtrl=rs[24];u32(mainCtrl.data,20,height+1900);u32(rs[23].data,8,height+1900);u32(rs[23].data,12,height+1900);u32(rs[23].data,16,Math.floor((height+1900)*.85));
 const header=bytes(TEMPLATE.fileHeader),info=await inflate(bytes(TEMPLATE.docInfoDeflate));
 const text=`혁신기술교육센터 주간업무보고\r\n소프트웨어(SW) 미래채움사업\r\n${labels[1]}\r\n${actual}\r\n${labels[2]}\r\n${plan}`;
 return compound({'\u0005HwpSummaryInformation':bytes('/v8AAAYCAgBgtqKfYRDUEbTGAGCXwJ2MAQAAAGC2op9hENQRtMYAYJfAnYwwAAAAgAAAAAUAAAAAAAAAMAAAAAIAAAA0AAAABAAAAFQAAAAOAAAAYAAAABIAAABoAAAAAAAAAB8AAAAMAAAA+LuYt0TMwMYgAPzIBKzFxTS79LzgrAAAHwAAAAEAAAAAAAAAAwAAAAEAAAAfAAAABwAAAEEASQAgAKzANLvkwgAAAAA='),'FileHeader':header,'DocInfo':info,'BodyText/Section0':cat(rs.map(pack)),'PrvText':utf16(text.slice(0,1800))});
}
async function download(input){const b=await build(input);const blob=new Blob([b],{type:'application/x-hwp'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`미래채움_주간업무보고_${input.start}.hwp`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);return b}
const api={build,download,template:'1111-혁신기술교육센터 주간업무보고.hwp / 소프트웨어(SW) 미래채움사업'};if(typeof module==='object'&&module.exports)module.exports=api;else root.WeeklyHwp=api;
})(typeof window!=='undefined'?window:globalThis);
