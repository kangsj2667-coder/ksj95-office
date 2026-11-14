/* 본 제품은 한글과컴퓨터의 한/글 문서 파일(.hwp) 공개 문서를 참고하여 개발하였습니다.
 * Preserve the supplied native HWP's storage topology and compression convention.
 * No source business text, preview image, account names or document paths are copied.
 */
(function(root){
'use strict';
const FREE=0xffffffff,EOC=0xfffffffe,FAT=0xfffffffd;
const view=b=>new DataView(b.buffer,b.byteOffset,b.byteLength);
const get=(b,p)=>view(b).getUint32(p,true);
const put=(b,p,n)=>view(b).setUint32(p,n>>>0,true);
const short=(b,p,n)=>view(b).setUint16(p,n,true);
const join=parts=>{const out=new Uint8Array(parts.reduce((n,b)=>n+b.length,0));let p=0;for(const b of parts){out.set(b,p);p+=b.length}return out};
const utf16=text=>{const out=new Uint8Array(text.length*2);for(let i=0;i<text.length;i++)short(out,i*2,text.charCodeAt(i));return out};
function readGenerated(bytes){
 const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
 if(b.length<512||get(b,0)!==0xe011cfd0||get(b,4)!==0xe11ab1a1)throw Error('유효한 한글 문서 컨테이너가 아닙니다.');
 if(view(b).getUint16(26,true)!==3||view(b).getUint16(30,true)!==9)throw Error('지원하지 않는 문서 저장 구조입니다.');
 const sector=n=>{if(n>=(b.length/512)-1)throw Error('문서 저장 영역이 손상되었습니다.');return b.subarray((n+1)*512,(n+2)*512)};
 const fat=[];const nf=get(b,44);if(nf>109)throw Error('문서가 너무 큽니다.');
 for(let i=0;i<nf;i++){const s=sector(get(b,76+4*i));for(let j=0;j<128;j++)fat.push(get(s,4*j))}
 function chain(start,table,block){const parts=[],seen=new Set();let n=start;while(n!==EOC){if(n>=table.length||seen.has(n))throw Error('문서 저장 연결이 손상되었습니다.');seen.add(n);parts.push(block(n));n=table[n]}return join(parts)}
 const directory=chain(get(b,48),fat,sector),entries=[];
 for(let p=0;p<directory.length;p+=128){const d=directory.subarray(p,p+128);const length=view(d).getUint16(64,true);entries.push({name:length?new TextDecoder('utf-16le').decode(d.subarray(0,length-2)):'',type:d[66],left:get(d,68),right:get(d,72),child:get(d,76),start:get(d,116),size:get(d,120)})}
 const rootEntry=entries[0];const mini=chain(rootEntry.start,fat,sector).subarray(0,rootEntry.size);
 const miniRaw=chain(get(b,60),fat,sector),miniFat=[];for(let p=0;p<miniRaw.length;p+=4)miniFat.push(get(miniRaw,p));
 const streams={},visited=new Set();
 function visit(id,parent){if(id===FREE)return;if(id>=entries.length||visited.has(id))throw Error('문서 목록이 손상되었습니다.');visited.add(id);const e=entries[id];visit(e.left,parent);const path=parent+e.name;if(e.type===1)visit(e.child,path+'/');else if(e.type===2){streams[path]=(e.size===0?new Uint8Array():e.size<4096?chain(e.start,miniFat,n=>mini.subarray(n*64,(n+1)*64)):chain(e.start,fat,sector)).slice(0,e.size)}visit(e.right,parent)}
 visit(rootEntry.child,'');return streams;
}
// Directory IDs and tree links from the original, valid source template.
// Storage start sectors are zero; unused directory pointers are NOSTREAM, not zero.
const topology=[
 ['Root Entry',5,0,FREE,FREE,1],['FileHeader',2,1,4,2,FREE],
 ['\u0005HwpSummaryInformation',2,0,FREE,FREE,FREE],['DocInfo',2,0,FREE,FREE,FREE],
 ['BodyText',1,1,6,5,12],['PrvImage',2,1,FREE,7,FREE],['PrvText',2,1,3,8,FREE],
 ['DocOptions',1,0,FREE,FREE,11],['Scripts',1,0,FREE,FREE,9],
 ['JScriptVersion',2,1,10,FREE,FREE],['DefaultJScript',2,0,FREE,FREE,FREE],
 ['_LinkDoc',2,1,FREE,FREE,FREE],['Section0',2,1,FREE,FREE,FREE]
];
const paths={1:'FileHeader',2:'\u0005HwpSummaryInformation',3:'DocInfo',5:'PrvImage',6:'PrvText',9:'Scripts/JScriptVersion',10:'Scripts/DefaultJScript',11:'DocOptions/_LinkDoc',12:'BodyText/Section0'};
function writeNative(streams){
 const entries=topology.map(([name,type,color,left,right,child],i)=>({name,type,color,left,right,child,data:paths[i]?streams[paths[i]]:null,start:type===1?0:EOC,size:0}));
 const miniParts=[],miniFat=[];
 for(const e of entries){if(e.type!==2)continue;if(!(e.data instanceof Uint8Array))throw Error('필수 한글 저장 영역이 없습니다.');e.size=e.data.length;if(e.size&&e.size<4096){e.start=miniFat.length;const count=Math.ceil(e.size/64),data=new Uint8Array(count*64);data.set(e.data);miniParts.push(data);for(let j=0;j<count;j++)miniFat.push(j===count-1?EOC:e.start+j+1)}}
 const sectors=[],fat=[];
 function allocate(data){if(!data.length)return EOC;const start=sectors.length,count=Math.ceil(data.length/512);for(let i=0;i<count;i++){const s=new Uint8Array(512);s.set(data.subarray(i*512,(i+1)*512));sectors.push(s);fat.push(i===count-1?EOC:start+i+1)}return start}
 for(const e of entries)if(e.type===2&&e.size>=4096)e.start=allocate(e.data);
 const mini=join(miniParts);entries[0].start=allocate(mini);entries[0].size=mini.length;
 const mf=new Uint8Array(Math.ceil(miniFat.length/128)*512).fill(255);miniFat.forEach((n,i)=>put(mf,4*i,n));const miniStart=allocate(mf);
 const directory=new Uint8Array(2048);
 for(let i=0;i<16;i++)for(const p of [68,72,76])put(directory,i*128+p,FREE);
 entries.forEach((e,i)=>{const d=directory.subarray(i*128,(i+1)*128),name=utf16(e.name+'\0');d.set(name);short(d,64,name.length);d[66]=e.type;d[67]=e.color;put(d,68,e.left);put(d,72,e.right);put(d,76,e.child);put(d,116,e.start);put(d,120,e.size)});
 const directoryStart=allocate(directory);let count=1;while(Math.ceil((sectors.length+count)/128)>count)count++;
 if(count>109)throw Error('문서가 너무 큽니다.');const ids=[];
 for(let i=0;i<count;i++){ids.push(sectors.length);sectors.push(new Uint8Array(512).fill(255));fat.push(FAT)}
 fat.forEach((n,i)=>put(sectors[ids[Math.floor(i/128)]],(i%128)*4,n));
 const header=new Uint8Array(512);header.set([208,207,17,224,161,177,26,225]);short(header,24,62);short(header,26,3);short(header,28,65534);short(header,30,9);short(header,32,6);put(header,44,count);put(header,48,directoryStart);put(header,56,4096);put(header,60,miniStart);put(header,64,mf.length/512);put(header,68,EOC);
 for(let i=0;i<109;i++)put(header,76+i*4,ids[i]??FREE);
 return join([header,...sectors]);
}
async function nativeCompress(data){
 if(typeof CompressionStream==='undefined')throw Error('현재 브라우저에 한글 압축 기능이 없습니다.');
 const gzip=new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
 if(gzip[0]!==31||gzip[1]!==139||gzip[2]!==8||gzip[3]!==0)throw Error('문서 압축 형식을 확인하지 못했습니다.');
 // Native template streams: raw DEFLATE followed by CRC32 and original size.
 return gzip.slice(10);
}
async function normalize(bytes){
 const s=readGenerated(bytes),header=s.FileHeader?.slice();
 if(!header||new TextDecoder().decode(header.subarray(0,17))!=='HWP Document File')throw Error('한글 파일 인식 정보가 없습니다.');
 if(get(header,36)&1)throw Error('이미 압축된 문서에는 중복 변환을 적용하지 않습니다.');
 if(!s.DocInfo||!s['BodyText/Section0']||!s['\u0005HwpSummaryInformation'])throw Error('한글 문서의 필수 정보가 누락되었습니다.');
 put(header,36,1);
 const preview=new Uint8Array(2046);preview.set((s.PrvText||new Uint8Array()).subarray(0,2046));
 const emptyScript=new Uint8Array(20);emptyScript.fill(255,16);const version=new Uint8Array(8);version[0]=1;
 const [doc,body,script,sv]=await Promise.all([s.DocInfo,s['BodyText/Section0'],emptyScript,version].map(nativeCompress));
 return writeNative({'FileHeader':header,'DocInfo':doc,'BodyText/Section0':body,'\u0005HwpSummaryInformation':s['\u0005HwpSummaryInformation'],'PrvText':preview,'PrvImage':Uint8Array.from(atob('R0lGODlhAQABAIAAAAD///8AACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='),c=>c.charCodeAt(0)),'DocOptions/_LinkDoc':new Uint8Array(524),'Scripts/DefaultJScript':script,'Scripts/JScriptVersion':sv});
}
if(typeof module==='object'&&module.exports)module.exports={normalize,readGenerated};
if(root.WeeklyHwp){const original=root.WeeklyHwp;const build=async input=>normalize(await original.build(input));root.WeeklyHwp={...original,build,compatibility:'native-storage-v2',download:async input=>{const data=await build(input),url=URL.createObjectURL(new Blob([data],{type:'application/x-hwp'})),a=document.createElement('a');a.href=url;a.download='미래채움_주간업무보고_'+input.start+'.hwp';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);return data}}}
})(typeof window!=='undefined'?window:globalThis);
