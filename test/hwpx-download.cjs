const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),{webcrypto,createHash}=require("node:crypto");
const hash=x=>createHash("sha256").update(x).digest("hex");
const markdown="# 검증 보고서\n\n작성된 한글 문서입니다.\n",bytes=Buffer.from("PK"+"검증 파일 바이트".repeat(20));
const source="outputs/government/2026-11-13/05-report.md";
let record={sourcePath:source,sourceHash:hash(markdown),filePath:"outputs/government/documents/2026-11-13/05-report.hwpx",fileHash:hash(bytes),format:"hwpx",status:"ready"};
let downloaded=0,blob,mode="ready",requests=[];
const context={crypto:webcrypto,Uint8Array,TextEncoder,TextDecoder,Blob,atob,URL:{createObjectURL:b=>{blob=b;return "blob:test"},revokeObjectURL:()=>{}},setTimeout:()=>{},document:{body:{appendChild:()=>{}},createElement:()=>({click(){downloaded++},remove(){}})}};
vm.createContext(context);vm.runInContext(fs.readFileSync(new URL("../hwpx-download.js",`file://${__filename}`),"utf8"),context);
const request=async(token,path)=>{
  assert.equal(token,"private-test-token");assert(!path.includes(token));requests.push(path);
  if(path.endsWith("documents.json")){
    if(mode==="missing"){const e=new Error("404");e.status=404;throw e;}
    return {encoding:"base64",content:Buffer.from(JSON.stringify({records:[record]})).toString("base64")};
  }
  if(mode==="large"&&path.startsWith("/contents/"))return {encoding:"none",sha:"a".repeat(40)};
  return {encoding:"base64",content:bytes.toString("base64")};
};
(async()=>{
  const download=context.AIOfficeHwpx.download,doc={path:source,markdown,title:"검증 보고서",date:"2026-11-13"};
  await download("private-test-token",doc,request);assert.equal(downloaded,1);assert.deepEqual(Buffer.from(await blob.arrayBuffer()),bytes);
  await assert.rejects(download("private-test-token",{...doc,markdown:markdown+"수정"},request),/수정/);assert.equal(downloaded,1);
  record={...record,filePath:"outputs/documents/wrong.hwpx"};await assert.rejects(download("private-test-token",doc,request),/경로/);
  record={...record,filePath:"outputs/government/documents/2026-11-13/05-report.hwpx",status:"failed"};await assert.rejects(download("private-test-token",doc,request),/실패/);
  record={...record,status:"ready",fileHash:"bad"};await assert.rejects(download("private-test-token",doc,request),/검증/);
  record={...record,fileHash:hash(bytes)};mode="large";await download("private-test-token",doc,request);assert(requests.some(x=>x.startsWith("/git/blobs/")));assert.equal(downloaded,2);
  mode="missing";await assert.rejects(download("private-test-token",doc,request),/PC 연결/);
  await assert.rejects(download("private-test-token",{...doc,path:"outputs/government/tasks/../../secret.md"},request),/경로/);
  console.log("HWPX 실제 바이트 다운로드·원문/파일 무결성·실패/경로 차단·대용량 Blob 조회 통과");
})().catch(e=>{console.error(e);process.exitCode=1;});
