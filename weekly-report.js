/* Device-only editor. Native HWP export is suspended after two confirmed reader failures.
 * A parser pass is not native-application compatibility validation.
 * Do not call the legacy binary builder or silently fall back to another format.
 */
(function(){'use strict';
const $=id=>document.getElementById(id),fields=['actual','plan','start','end','nextStart','nextEnd'];
const people=[{name:'임윤지',done:false},{name:'강석정',done:false},{name:'김지연',done:false}];
const exportBlocked='한글 파일 열기 오류로 다운로드를 일시 중지했습니다. 실제 한글에서 저장·재열기 검증을 마친 뒤 다시 제공해야 합니다.';
let revision=1,dirty=false;
const monday=new Date();monday.setHours(12,0,0,0);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
const date=n=>{const d=new Date(monday);d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
['start','end','nextStart','nextEnd'].forEach((key,i)=>$(key).value=date([0,4,7,11][i]));
function snapshot(){return Object.fromEntries(fields.map(key=>[key,$(key).value]))}
function error(message=''){$('error').textContent=message;$('error').hidden=!message}
function validate(data){if(!data.actual.trim()||!data.plan.trim())throw Error('주간실적과 주간계획을 모두 작성한 뒤 검토해 주세요.');for(const key of fields.slice(2)){if(!/^\d{4}-\d{2}-\d{2}$/.test(data[key]))throw Error('보고 기간을 입력해 주세요.')}if(data.start>data.end||data.nextStart>data.nextEnd)throw Error('보고 기간의 종료일이 시작일보다 빠릅니다.');if(data.nextStart<=data.end)throw Error('차주 주간계획은 금주 주간실적 종료일 이후로 설정해 주세요.')}
function render(){
 $('reviewers').replaceChildren();people.forEach((p,i)=>{const row=document.createElement('div');row.className='reviewer';const name=document.createElement('strong');name.textContent=p.name;const button=document.createElement('button');button.type='button';button.textContent=p.done?'완료':'검토';button.className=p.done?'review-done':'primary';button.disabled=p.done;button.setAttribute('aria-label',p.name+' '+(p.done?'완료':'검토'));button.onclick=()=>review(i);row.append(name,button);$('reviewers').append(row)});
 const count=people.filter(p=>p.done).length;$('review-status').textContent=count===3?'전원 검토 완료 · 3/3':'검토 중 · '+count+'/3';$('revision').textContent='수정본 '+revision;
 $('download').disabled=true;$('download').textContent='한글 출력 점검 중';$('download').title=exportBlocked;$('download-state').textContent=exportBlocked;
}
function review(index){if(people[index].done)return;error();try{validate(snapshot());people[index].done=true;dirty=true;render();if(index===0)$('download-state').textContent='임윤지 검토 완료. 한글 출력은 열기 오류로 중지되어 있으며, 파일이 생성되거나 내려받아진 상태는 아닙니다.'}catch(e){error(e.message)}}
fields.forEach(key=>$(key).addEventListener('input',()=>{revision++;dirty=true;people.forEach(p=>p.done=false);error();render()}));
// Also block programmatic invocation: no legacy HWP generation or fallback download.
$('download').onclick=()=>error(exportBlocked);
$('settings-toggle').onclick=()=>{const show=$('settings').hidden;$('settings').hidden=!show;$('settings-toggle').setAttribute('aria-expanded',String(show));if(show)$('settings').scrollIntoView({behavior:'smooth',block:'start'})};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});render();
})();
