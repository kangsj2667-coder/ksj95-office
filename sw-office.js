window.createSwOffice = function (React, layout, api) {
  const el = React.createElement;
  const { Header, Nav, Panel, Downloads, LinkButton } = layout;
  const tabs = [["home","업무 홈"], ["approval","검토·승인"], ["documents","보고·문서"], ["request","업무 지시"]];
  const reports = [["report","일일 리포트","매일 18시"], ["weeklyDraft","주간업무보고","월요일 09시"]];

  return function SwOffice(props) {
    const { status, files, documentKey, chooseDocument, selectedPlan, choosePlan, docType, changeType, submitted,
      approve, request, changeRequest, reference, changeReference, sendRequest, revision, changeRevision, sendRevision } = props;
    const [tab, setTab] = React.useState("home");
    const doc = files[documentKey];
    const needsReview = status?.approval && !submitted;
    const plans = status?.top || [];
    const planOptions = plans.filter(plan => [1, 2].includes(plan.n));
    const reviewOpen = () => setTab("approval");
    function openDoc(key) { chooseDocument(key); setTab("documents"); }
    function downloads(document, compact = false) {
      return el(Downloads, { doc: document, compact, onHwpx: props.downloadHwpx, onError: props.onError });
    }
    const read = document => document && el("div", { className: "office-reading" }, el(api.Markdown, { text: document.markdown }));
    const link = (text, action) => el(LinkButton, { onClick: action }, text);
    const reviewTitle = !status ? "안건 확인 중" : submitted ? "문서 작성 요청을 보냈어요" : needsReview ? "검토할 기획안 " + plans.length + "건" : "승인 대기 안건이 없습니다";
    const reviewSummary = el("section", { className: "decision-panel" },
      el("div", { className: "decision-label" }, "기획안 검토", status?.date && el("span", null, status.date)),
      el("h2", null, reviewTitle),
      needsReview && el("ul", { className: "short-list" }, ...plans.map(item => el("li", { key: item.n }, item.title))),
      (needsReview || files.plan) && el("button", { className: "decision-action", onClick: reviewOpen }, needsReview ? "기획안 검토하기" : "최근 기획안 보기"));
    const reportShelf = el(Panel, { title: "정기 보고서" },
      ...reports.map(([key,label,time]) => el("div", { className: "report-line", key },
        el("div", null, el("h3", null, label), el("small", null, files[key]?.date || time + " 자동 작성")),
        files[key] ? link("열기", () => openDoc(key)) : el("span", { className: "neutral-tag" }, status ? "작성 전" : "확인 중"))),
      el("div", { className: "report-download" }, el("small", null, "일일 리포트"), downloads(files.report, true)));
    const requestPanel = el(Panel, { title: "새 업무 지시" },
      el("label", { className: "office-field" }, "업무 내용", el("textarea", { rows: 4, value: request, placeholder: "예: 다음 주 교육 운영 체크리스트를 작성해줘", onChange: e => changeRequest(e.target.value) })),
      el("div", { className: "chips" }, ...["이번 주 일정 점검","조합 강사 모집 안내문 초안","페스티벌 운영 체크리스트"].map(text => el("button", { key: text, className: "chip", onClick: () => changeRequest(text) }, text))),
      el("details", { className: "office-disclosure" }, el("summary", null, "참고 파일 추가"), el("label", { className: "office-field" }, "파일 경로", el("input", { value: reference, onChange: e => changeReference(e.target.value), placeholder: "outputs/날짜/파일명.md" }))),
      el("button", { className: "primary", onClick: sendRequest, disabled: !request.trim() }, "지시 보내기"),
      files.task && link("최근 수시 업무 결과", () => openDoc("task")));
    function approval() {
      return el(Panel, { title: "기획안 검토·승인", aside: status?.date && el("small", null, status.date) },
        ...[["plan","기획안 원문"],["review","품질검수 의견"]].filter(([key]) => files[key]).map(([key,label]) =>
          el("details", { key, className: "office-disclosure" }, el("summary", null, label), read(files[key]))),
        needsReview ? el("div", { className: "office-approval" },
          el("fieldset", null, el("legend", null, "문서로 만들 기획안"), ...planOptions.map(plan =>
            el("label", { className: "pick" + (plan.n === selectedPlan ? " on" : ""), key: plan.n },
              el("input", { type: "radio", name: "pick", checked: selectedPlan === plan.n, onChange: () => choosePlan(plan.n) }),
              el("span", null, el("b", null, "TOP " + plan.n + " · " + plan.title), el("small", null, [plan.verdict, plan.reason].filter(Boolean).join(" · ")))))),
          el("label", { className: "office-field" }, "작성할 문서", el("input", { list: "doc-types", value: docType, onChange: e => changeType(e.target.value) })),
          el("datalist", { id:"doc-types" }, ...api.docTypes.map(value => el("option", { key:value, value }))),
          el("button", { className: "primary", onClick: approve, disabled: !docType.trim() || !planOptions.some(plan => plan.n === selectedPlan) }, "선택한 기획안 승인·문서 작성")) :
          el("p", { className: "office-empty" }, reviewTitle), files.doc && link("작성된 문서 열기", () => openDoc("doc")));
    }
    function documents() {
      return el(Panel, { title: "보고·문서" },
        el(Nav, { secondary:true, label:"문서 종류", items:api.docTabs.filter(([key]) => files[key] || key === documentKey), active:documentKey, choose:chooseDocument }),
        doc && el("h3", { className: "doc-title" }, [doc.title,doc.date].filter(Boolean).join(" · ")),
        downloads(doc), doc ? read(doc) : el("p", {className:"office-empty"}, "작성된 문서가 여기에 표시됩니다."),
        doc && el("div", { className:"office-revision" }, el("label", { className:"office-field" }, "수정할 내용", el("input", { value:revision,onChange:e=>changeRevision(e.target.value) })), el("button", { disabled:!revision.trim(), onClick:sendRevision }, "수정 요청")));
    }
    function operations() {
      return el("div", {className:"office-stack"},
        el(Panel, { title:"업무 진행", aside:link("아침 작업 실행",props.runMorning) }, el("p",null,status?.headline || "상태 확인 중"), el("div", {className:"office-stages"}, ...(status?.stages || []).map(step=>el("span",{key:step.id}, step.label + " · " + step.status)))),
        el(Panel, { title:"에이전트 운영" }, el("p",null,"GPT는 조사·기획·작성을, Claude는 품질검수를 담당합니다."), el("p",{className:"muted"},status?.agents?.claude ? [status.agents.claude.status,status.agents.claude.reason].filter(Boolean).join(" · ") : "Claude 검수 연결 확인 전"),
          ...api.teams.map(team=>el("div",{className:"list-row",key:team.key},el("strong",null,team.name),el("span",null,status?.depts?.[team.key]?.label || team.role),el("small",null,status?.depts?.[team.key]?.status || "대기")))),
        el(Panel,{title:"실행 기록 · PC 공통"},...(status?.runs || []).map((run,index)=>el("div",{className:"list-row",key:index},el("strong",null,run.name),el("small",null,run.when),el("span",null,run.result))),!status?.runs?.length && el("p",{className:"muted"}, "아직 실행 기록이 없습니다.")),
        el(Panel,{title:"자동 실행 일정"},...(status?.schedule || []).map(item=>el("div",{className:"list-row",key:item.what},el("strong",null,item.what),el("small",null,item.when)))));
    }
    return el("main", {className:"shell office-layout sw-layout"},
      el(Header, {name:"SW 미래체험 본부", divisionNav:props.divisionNav, status, busy:props.busy, reload:props.reload, disconnect:props.disconnect, utilities:[["운영 현황",()=>setTab("operations")]]}),
      el(Nav,{items:tabs,active:tab,choose:setTab,label:"SW 미래체험 업무 메뉴"}),
      props.error && el("div",{className:"alert-box",role:"alert"},props.error),
      tab === "home" && el("div",{className:"office-home-grid"},
        el("div",{className:"office-stack"},reviewSummary,reportShelf),
        el("div",{className:"office-stack"},
          el(Panel,{title:"수시 업무",aside:link("업무 지시",()=>setTab("request"))},files.task ? el("div",{className:"report-line"},el("span",null,files.task.date+" 업무 결과"),link("열기",()=>openDoc("task"))) : el("p",{className:"muted"},"처리한 업무 결과가 여기에 표시됩니다.")),
          el(Panel,{title:"운영 현황",aside:link("자세히",()=>setTab("operations"))},el("p",null,status?.runs?.[0] ? [status.runs[0].name,status.runs[0].result,status.runs[0].when].join(" · ") : "최근 실행 기록이 없습니다.")))),
      tab === "approval" && approval(), tab === "documents" && documents(), tab === "request" && requestPanel, tab === "operations" && operations(),
      props.notice && el("div",{className:"toast",role:"status"},props.notice));
  };
};
