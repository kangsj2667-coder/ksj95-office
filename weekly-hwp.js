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
 return compound({'FileHeader':header,'DocInfo':info,'BodyText/Section0':cat(rs.map(pack)),'PrvText':utf16(text.slice(0,1800))});
}
async function download(input){const b=await build(input);const blob=new Blob([b],{type:'application/x-hwp'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`미래채움_주간업무보고_${input.start}.hwp`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);return b}
const api={build,download,template:'1111-혁신기술교육센터 주간업무보고.hwp / 소프트웨어(SW) 미래채움사업'};if(typeof module==='object'&&module.exports)module.exports=api;else root.WeeklyHwp=api;
})(typeof window!=='undefined'?window:globalThis);
