/* Device-only editor. Never pretend that local names are authenticated identities. */
(function(){'use strict';
const $=id=>document.getElementById(id),fields=['actual','plan','start','end','nextStart','nextEnd'];
const people=[{name:'임윤지',done:false},{name:'강석정',done:false},{name:'김지연',done:false}];
let revision=1,busy=false,dirty=false;
const monday=new Date();monday.setHours(12,0,0,0);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
const date=n=>{const d=new Date(monday);d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
['start','end','nextStart','nextEnd'].forEach((key,i)=>$(key).value=date([0,4,7,11][i]));
function snapshot(){return Object.fromEntries(fields.map(key=>[key,$(key).value]))}
function error(message=''){$('error').textContent=message;$('error').hidden=!message}
function validate(data){if(!data.actual.trim()||!data.plan.trim())throw Error('주간실적과 주간계획을 모두 작성한 뒤 검토해 주세요.');for(const key of fields.slice(2)){if(!/^\d{4}-\d{2}-\d{2}$/.test(data[key]))throw Error('보고 기간을 입력해 주세요.')}if(data.start>data.end||data.nextStart>data.nextEnd)throw Error('보고 기간의 종료일이 시작일보다 빠릅니다.');if(data.nextStart<=data.end)throw Error('차주 주간계획은 금주 주간실적 종료일 이후로 설정해 주세요.')}
function render(){
 $('reviewers').replaceChildren();people.forEach((p,i)=>{const row=document.createElement('div');row.className='reviewer';const name=document.createElement('strong');name.textContent=p.name;const button=document.createElement('button');button.type='button';button.textContent=p.done?'완료':busy&&i===0?'생성 중':'검토';button.className=p.done?'review-done':'primary';button.disabled=busy||p.done;button.setAttribute('aria-label',p.name+' '+(p.done?'완료':'검토'));button.onclick=()=>review(i);row.append(name,button);$('reviewers').append(row)});
 const count=people.filter(p=>p.done).length;$('review-status').textContent=count===3?'전원 검토 완료 · 3/3':'검토 중 · '+count+'/3';$('revision').textContent='수정본 '+revision;$('download').disabled=busy||!people[0].done;
}
async function exportHwp(){const data=snapshot();validate(data);if(!window.WeeklyHwp)throw Error('한글 생성 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도하세요.');const expected=revision;const bytes=await window.WeeklyHwp.build(data);if(revision!==expected)throw Error('파일 생성 중 내용이 변경되었습니다. 변경 내용을 다시 검토해 주세요.');const url=URL.createObjectURL(new Blob([bytes],{type:'application/x-hwp'}));const a=document.createElement('a');a.href=url;a.download='미래채움_주간업무보고_'+data.start+'.hwp';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);$('download-state').textContent='현재 수정본으로 한글(.hwp) 파일을 생성했습니다.'}
async function review(index){if(busy||people[index].done)return;error();try{validate(snapshot());busy=true;render();if(index===0)await exportHwp();people[index].done=true;dirty=true}catch(e){error(e.message)}finally{busy=false;render()}}
fields.forEach(key=>$(key).addEventListener('input',()=>{revision++;dirty=true;people.forEach(p=>p.done=false);$('download-state').textContent='내용이 변경되어 다시 검토해야 합니다.';error();render()}));
$('download').onclick=async()=>{if(busy||!people[0].done)return;error();busy=true;render();try{await exportHwp()}catch(e){error(e.message)}finally{busy=false;render()}};
$('settings-toggle').onclick=()=>{const show=$('settings').hidden;$('settings').hidden=!show;$('settings-toggle').setAttribute('aria-expanded',String(show));if(show)$('settings').scrollIntoView({behavior:'smooth',block:'start'})};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});render();
})();
