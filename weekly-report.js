/* 주간업무보고: 매주 월요일 AI가 저장소에 쓴 초안을 불러와 보여주고,
 * PC에서 코닥으로 만든 HWPX(실제 한글 2024에서 열기 확인)를 내려받는다.
 * 브라우저에서 HWP를 직접 조립하는 예전 방식은 쓰지 않는다.
 */
(function(){'use strict';
const $=id=>document.getElementById(id),fields=['actual','plan','start','end','nextStart','nextEnd'];
const people=[{name:'임윤지',done:false},{name:'강석정',done:false},{name:'김지연',done:false}];
const API='https://api.github.com/repos/kangsj2667-coder/ksj95';
const token=()=>{try{return localStorage.getItem('swmc_token')||''}catch{return ''}};
let revision=1,dirty=false,draft=null,edited=false;
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function setWeek(mondayIso){const m=new Date(mondayIso+'T12:00:00');const at=n=>{const d=new Date(m);d.setDate(d.getDate()+n);return iso(d)};['start','end','nextStart','nextEnd'].forEach((key,i)=>$(key).value=at([-7,-3,0,4][i]))}
{const m=new Date();m.setHours(12,0,0,0);m.setDate(m.getDate()-(m.getDay()+6)%7);setWeek(iso(m))}
function snapshot(){return Object.fromEntries(fields.map(key=>[key,$(key).value]))}
function error(message=''){$('error').textContent=message;$('error').hidden=!message}
function validate(data){if(!data.actual.trim()||!data.plan.trim())throw Error('주간실적과 주간계획을 모두 작성한 뒤 검토해 주세요.');for(const key of fields.slice(2)){if(!/^\d{4}-\d{2}-\d{2}$/.test(data[key]))throw Error('보고 기간을 입력해 주세요.')}if(data.start>data.end||data.nextStart>data.nextEnd)throw Error('보고 기간의 종료일이 시작일보다 빠릅니다.');if(data.nextStart<=data.end)throw Error('차주 주간계획은 금주 주간실적 종료일 이후로 설정해 주세요.')}
async function request(_token,path,options={}){const res=await fetch(API+path,{cache:options.cache||'no-store',headers:{Authorization:'Bearer '+token(),Accept:options.raw?'application/vnd.github.raw+json':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});if(!res.ok){const e=new Error('GitHub '+res.status);e.status=res.status;throw e}return options.raw?res.text():res.json()}
function section(markdown,name){const m=markdown.match(new RegExp('^##\\s*'+name+'[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))','m'));return m?m[1].trim():''}
function downloadState(){
 const d=$('download'),s=$('download-state');
 if(!token()){d.disabled=true;d.textContent='한글(HWPX) 내려받기';s.textContent='먼저 SW 미래체험 본부 화면에서 GitHub 연결을 해 주세요.';return}
 if(!draft){d.disabled=true;d.textContent='한글(HWPX) 내려받기';s.textContent='AI 초안을 불러오는 중입니다.';return}
 d.disabled=false;d.textContent='한글(HWPX) 내려받기';
 s.textContent=edited?'내려받는 한글 파일은 '+draft.date+' AI 초안 원본입니다. 이 화면에서 고친 내용은 파일에 들어가지 않습니다.':draft.date+' AI 초안 · 한글 파일로 받을 수 있습니다.';
}
function render(){
 $('reviewers').replaceChildren();people.forEach((p,i)=>{const row=document.createElement('div');row.className='reviewer';const name=document.createElement('strong');name.textContent=p.name;const button=document.createElement('button');button.type='button';button.textContent=p.done?'완료':'검토';button.className=p.done?'review-done':'primary';button.disabled=p.done;button.setAttribute('aria-label',p.name+' '+(p.done?'완료':'검토'));button.onclick=()=>review(i);row.append(name,button);$('reviewers').append(row)});
 const count=people.filter(p=>p.done).length;$('review-status').textContent=count===3?'전원 검토 완료 · 3/3':'검토 중 · '+count+'/3';$('revision').textContent=draft?draft.date+' 초안 · 수정본 '+revision:'수정본 '+revision;
 downloadState();
}
function review(index){if(people[index].done)return;error();try{validate(snapshot());people[index].done=true;dirty=true;render()}catch(e){error(e.message)}}
fields.forEach(key=>$(key).addEventListener('input',()=>{revision++;dirty=true;edited=true;people.forEach(p=>p.done=false);error();render()}));
$('download').onclick=async()=>{if(!draft)return;error();const b=$('download');b.disabled=true;b.textContent='파일 확인 중…';try{await window.AIOfficeHwpx.download(token(),draft,request)}catch(e){error(e.message)}finally{downloadState()}};
$('settings-toggle').onclick=()=>{const show=$('settings').hidden;$('settings').hidden=!show;$('settings-toggle').setAttribute('aria-expanded',String(show));if(show)$('settings').scrollIntoView({behavior:'smooth',block:'start'})};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
async function load(){
 if(!token()){$('draft-state').textContent='SW 미래체험 본부 화면에서 GitHub 연결을 먼저 해 주세요. 연결하면 이 화면에 AI 초안이 자동으로 들어옵니다.';render();return}
 try{
  const list=await request('','/contents/outputs/weekly');
  const name=list.filter(f=>/^\d{4}-\d{2}-\d{2}\.md$/.test(f.name)).map(f=>f.name).sort().pop();
  if(!name){$('draft-state').textContent='아직 AI 초안이 없습니다. 매주 월요일 오전 8시에 자동으로 작성됩니다.';render();return}
  const path='outputs/weekly/'+name,markdown=await request('','/contents/'+path,{raw:true});
  draft={path,markdown,title:'주간업무보고',date:name.slice(0,10)};
  $('actual').value=section(markdown,'주간실적');$('plan').value=section(markdown,'주간계획');setWeek(draft.date);
  const check=section(markdown,'확인 필요');$('check').textContent=check;$('check-box').hidden=!check;
  $('draft-state').textContent=draft.date+'(월) AI 초안을 불러왔습니다. 확인 필요 항목을 고친 뒤 검토해 주세요.';
 }catch(e){$('draft-state').textContent='AI 초안을 불러오지 못했습니다('+e.message+'). 새로고침해 주세요.'}
 render();
}
render();load();
})();
