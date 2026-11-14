const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const zlib = require('node:zlib');
const base = require('../weekly-hwp.js');
const compat = require('../weekly-hwp-compat.js');

function swIsolation() {
  const context = {window:{}};
  vm.runInNewContext(fs.readFileSync('sw-office.js','utf8'),context);
  for (const tab of ['home','documents']) for (const selected of ['report','weekly','weeklyDraft']) {
    const selectedAfter=[];
    const React={createElement:(type,props,...children)=>({type:typeof type==='function'?type.name:type,props,children}),useState:()=>[tab,()=>{}],useEffect:fn=>fn()};
    const components={};for(const name of ['Header','Nav','Panel','Downloads','LinkButton'])components[name]=name;
    const api={docTabs:[['report','일일 리포트'],['weeklyDraft','주간업무보고'],['weekly','제출본']],docTypes:[],teams:[],Markdown:'Markdown'};
    const Office=context.window.createSwOffice(React,components,api);
    const files={report:{title:'Daily',markdown:'DAILY_VISIBLE'},weekly:{title:'SECRET_WEEKLY_SUBMITTED',markdown:'HIDDEN_WEEKLY'},weeklyDraft:{title:'SECRET_WEEKLY_DRAFT',markdown:'HIDDEN_DRAFT'}};
    const props={files,documentKey:selected,chooseDocument:k=>selectedAfter.push(k),status:{top:[]},request:'',reference:'',revision:'',docType:''};
    const rendered=JSON.stringify(Office(props));
    assert(!rendered.includes('HIDDEN_WEEKLY'));
    assert(!rendered.includes('HIDDEN_DRAFT'));
    assert(!rendered.includes('SECRET_WEEKLY'));
    assert(!rendered.includes('제출본'));
    if(selected!=='report')assert.deepEqual(selectedAfter,['report']);
    assert.equal(files.weekly.markdown,'HIDDEN_WEEKLY');
  }
}
(async()=>{
 swIsolation();
 const input={actual:'- 한글 파일 생성 기능 점검\n- 미래채움 보고서 서식 확인',plan:'- 검토 의견 반영\n- 다음 주 업무계획 검토',start:'2026-11-09',end:'2026-11-13',nextStart:'2026-11-16',nextEnd:'2026-11-20'};
 const original=await base.build(input),rebuilt=await compat.normalize(original);
 const before=compat.readGenerated(original),after=compat.readGenerated(rebuilt);
 assert.equal(new DataView(after.FileHeader.buffer).getUint32(36,true),1);
 for(const path of ['DocInfo','BodyText/Section0'])assert.deepEqual(new Uint8Array(zlib.inflateRawSync(after[path])),before[path]);
 assert.equal(after.PrvText.length,2046);
 assert.equal(after['DocOptions/_LinkDoc'].length,524);
 assert.equal(zlib.inflateRawSync(after['Scripts/DefaultJScript']).length,20);
 fs.mkdirSync('test-output',{recursive:true});
 fs.writeFileSync('test-output/weekly.hwp',rebuilt);
 fs.writeFileSync('test-output/uncompressed-baseline.hwp',original);
 const html=fs.readFileSync('weekly-report.html','utf8');
 assert(html.includes('weekly-hwp-compat.js'));
 assert(html.indexOf('weekly-hwp-compat.js')<html.indexOf('weekly-report.js'));
 console.log('SW division isolation and native compressed HWP regression checks passed.');
})().catch(error=>{console.error(error);process.exit(1)});
