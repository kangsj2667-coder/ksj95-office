/* 정부지원사업 본부: SW 운영 화면과 분리된 개인 지원사업 작업 공간 */
window.createGovernmentOffice = function (React, jsx, api) {
  const h = jsx.jsx, j = jsx.jsxs;
  const { Header, Nav, Panel, Downloads, LinkButton } = api.layout;
  const menus = [["overview","지원 홈"], ["recommend","공고 탐색"], ["prepare","신청 관리"], ["report","한 장 리포트"]];
  const statuses = ["검토 중", "준비 중", "신청 완료", "결과 대기", "선정", "미선정", "보류"];
  const blankProfile = { region: "", ageRange: "", employment: "", business: "", interests: "", notes: "" };
  const parse = (text, fallback) => { try { return JSON.parse(text); } catch { return fallback; } };
  const safeLink = value => { try { const u = new URL(value); return ["http:", "https:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };
  const today = () => new Date(Date.now() + 32400000).toISOString().slice(0, 10);
  const isClosed = record => record.deadline && record.deadline < today();
  const sourceLink = (url, label = "공식 공고 열기") => safeLink(url) ? h("a", { href: safeLink(url), target: "_blank", rel: "noopener noreferrer", children: label }) : h("span", { className: "muted", children: "공식 링크 확인 필요" });
  const empty = (title, description, action) => j("div", { className: "gov-empty", children: [h("h3", { children: title }), h("p", { children: description }), action] });

  return function GovernmentOffice({ token, divisionNav, onDisconnect }) {
    const [tab, setTab] = React.useState("overview");
    const [data, setData] = React.useState({ records: [], applications: [], files: {}, status: null });
    const [busy, setBusy] = React.useState(false), [sending, setSending] = React.useState(false);
    const [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
    const [query, setQuery] = React.useState(""), [filter, setFilter] = React.useState("all");
    const [request, setRequest] = React.useState(""), [doc, setDoc] = React.useState(null);
    const [profile, setProfile] = React.useState(() => { try { return { ...blankProfile, ...JSON.parse(localStorage.getItem("gov_profile_draft") || "{}") }; } catch { return { ...blankProfile }; } });
    const [reportDoc, setReportDoc] = React.useState(null);
    const dirtyProfile = React.useRef(false), version = React.useRef(0), alive = React.useRef(true);
    const load = React.useCallback(async () => {
      const id = ++version.current;setBusy(true);
      try {
        const [snapshot, opportunities, applications, savedProfile, reportIndex] = await Promise.all([
          api.Fm(token, "government"), api.km(token, "outputs/government/opportunities.json"),
          api.km(token, "outputs/government/applications.json"), api.km(token, "context/government/profile.json"), api.km(token, "outputs/government/reports.json")
        ]);
        if (!alive.current || id !== version.current) return;
        const records = parse(opportunities, { records: [] }).records || [];
        const appRecords = parse(applications, { records: [] }).records;setData({ records: Array.isArray(records) ? records : [], applications: Array.isArray(appRecords) ? appRecords : [], files: snapshot.files, status: snapshot.status, reports: parse(reportIndex, { records: [] }).records || [] });
        const saved = parse(savedProfile, null);
        if (saved && !dirtyProfile.current) setProfile({ ...blankProfile, ...saved });
        setError("");
      } catch (e) { if (alive.current && id === version.current) setError(api.If(e)); }
      finally { if (alive.current && id === version.current) setBusy(false); }
    }, [token]);
    React.useEffect(() => { alive.current = true;load();const timer = setInterval(() => { if (document.visibilityState === "visible") load(); }, 30000);return () => { alive.current = false;version.current++;clearInterval(timer); }; }, [load]);

    const command = async (title, body, after) => {
      if (sending) return;
      if (!data.status?.gptReady) { setError("PC 연결 설정이 먼저 필요합니다. 연결 후 조사·서류 준비·조건 저장 요청을 처리할 수 있습니다.");return; }
      setSending(true);setError("");setNotice("");
      try {
        await api.sc(token, "[명령] " + title, body, "codex", "government");
        setNotice("요청을 접수했어요. PC 에이전트가 처리하면 이 화면에 반영됩니다.");
        if (after) after();
        setTimeout(() => { if (alive.current) load(); }, 4000);
      } catch (e) { setError(api.If(e)); }
      finally { setSending(false); }
    };
    const operation = (kind, title, values, after) => command(title, "작업: " + kind + "\n데이터: " + JSON.stringify(values), after);
    const openDocument = async application => {
      const path = application.documentPath;
      if (!path || !path.startsWith("outputs/government/") || path.includes("..")) return;
      setError("");
      try { const markdown = await api.km(token, path);if (!markdown) throw new Error("EMPTY_DOCUMENT");setDoc({ title: application.title, path, markdown });setTab("prepare"); }
      catch { setError("문서를 불러오지 못했습니다. 새로고침 후 다시 확인하세요."); }
    };
    const exportButtons = (document, compact = false) => h(Downloads, {
      doc: document, compact, onHwpx: item => api.downloadHwpx(token,item), onError: setError
    });
    const loadReport = async path => { if(!/^outputs\/government\/\d{4}-\d{2}-\d{2}\/05-report\.md$/.test(path))return;try{const markdown=await api.km(token,path);if(!markdown)throw new Error("해당 날짜의 리포트가 아직 없습니다.");setReportDoc({title:"정부지원사업 한 장 리포트",date:path.split("/")[2],path,markdown});}catch(e){setError(e.message);} };
    const changeProfile = (key, value) => { dirtyProfile.current = true;setProfile(previous => { const next = { ...previous, [key]: value };try { localStorage.setItem("gov_profile_draft", JSON.stringify(next)); } catch {}return next; }); };
    const profileProvided = !!(profile.region || profile.employment || profile.business || profile.interests);
    const activeRecords = data.records.filter(record => !isClosed(record));
    const recommendations = activeRecords.filter(record => record.recommended === true);
    const imminent = activeRecords.filter(record => record.deadline && (new Date(record.deadline + "T00:00:00Z") - new Date(today() + "T00:00:00Z")) / 86400000 <= 7).sort((a,b) => a.deadline.localeCompare(b.deadline));
    const pending = data.applications.filter(item => ["검토 중", "준비 중"].includes(item.status));
    const findRecord = id => data.records.find(record => record.id === id);
    const prepareButton = record => h("button", { className: "primary", disabled: sending || isClosed(record), onClick: () => operation("prepare_application", record.title + " 신청 준비", { id: record.id }, () => setTab("prepare")), children: isClosed(record) ? "접수 마감" : data.applications.some(x => x.id === record.id) ? "준비서류 다시 작성" : "신청 준비하기" });
    const grantCard = record => j("article", { className: "gov-grant card", children: [
      j("div", { className: "gov-grant-top", children: [h("span", { className: "gov-tag", children: record.applicantType === "prestartup" ? "예비창업자 · 개인 신청" : "개인 신청" }), h("span", { className: "gov-deadline" + (isClosed(record) ? " is-closed" : ""), children: record.deadline ? (isClosed(record) ? "마감 · " : "접수마감 · ") + record.deadline : "접수기한 확인 필요" })] }),
      h("h3", { children: record.title }),h("p", { className: "muted small", children: record.agency || "주관기관 확인 필요" }),
      j("dl", { className: "gov-facts", children: [h("dt", { children: "지원 내용" }), h("dd", { children: record.benefit || "공고 확인 필요" }), h("dt", { children: "신청 조건" }), h("dd", { children: record.eligibility || "개인별 조건 확인 필요" })] }),
      record.recommendationReason && h("p", { className: "gov-reason", children: record.recommendationReason }),
      h("p", { className: "gov-caution", children: record.missingConditions?.length ? "내가 확인할 조건: " + record.missingConditions.join(" · ") : "개인 신청 가능 공고라도 내 자격은 최종 확인이 필요합니다." }),
      j("div", { className: "gov-actions", children: [sourceLink(record.sourceUrl), prepareButton(record)] })
    ] }, record.id);
    const collection = (records, title, explanation) => records.length ? h("div", { className: "gov-grants", children: records.map(grantCard) }) : empty(title, explanation);
    const applicationCard = application => {
      const record = findRecord(application.id);
      return j("article", { className: "card gov-application", children: [j("div", { className: "gov-grant-top", children: [h("span", { className: "gov-tag", children: application.status }),h("span", { className: "muted small", children: record?.deadline ? "접수마감 " + record.deadline : "" })] }),h("h3", { children: application.title }),
        application.documentStatus && h("p", { children: application.documentStatus }),
        record?.documents?.length > 0 && j("div", { children: [h("h4", { children: "준비할 서류" }),h("ul", { children: record.documents.map((value,i) => h("li", { children: value },i)) })] }),
        record?.missingConditions?.length > 0 && h("p", { className: "gov-caution", children: "확인 필요: " + record.missingConditions.join(" · ") }),
        j("div", { className: "gov-actions", children: [sourceLink(application.sourceUrl), application.documentPath && h("button", { onClick: () => openDocument(application), children: "준비서류·초안 보기" }), tab === "track" && h("label", { className: "gov-status-field", children: j("span", { children: ["지원 상태 ",h("select", { value: application.status, disabled: sending, onChange: event => operation("application_update", application.title + " 지원 현황 변경", { id: application.id, status: event.target.value }), children: statuses.map(value => h("option", { value, children: value },value)) })] }) })] })
      ] },application.id);
    };
    const controls = j("section", { className: "card gov-request", children: [h("h2", { children: "에이전트에게 요청" }),h("p", { className: "muted small", children: "공고 링크를 붙여 자격 확인을 맡기거나, 비교·서류 작성·수정을 요청하세요." }),h("textarea", { value: request, rows: 3, placeholder: "예: 이 공고를 개인 자격으로 신청할 수 있는지 확인해줘. https://…", onChange: event => setRequest(event.target.value) }),j("div", { className: "gov-actions", children: [h("button", { className: "primary", disabled: sending || request.trim().length < 3, onClick: () => command(request.trim().slice(0,40), request.trim(), () => setRequest("")), children: sending ? "요청 전송 중…" : "업무 요청하기" }), data.files.task && h("button", { onClick: () => { setDoc(data.files.task);setTab("prepare"); }, children: "최근 요청 결과 보기" })] })] });
    let content;
    const link = (label, onClick) => h(LinkButton, { onClick, children: label });
    function showGrant(record) {
      setQuery(record.title);
      setFilter("all");
      setTab("discover");
    }
    const priorities = [...new Map([...imminent, ...recommendations].map(record => [record.id, record])).values()].slice(0,3);
    if (tab === "overview") content = j("div", { className:"office-home-grid", children:[
      j("div", { className:"office-stack", children:[
        j(Panel, { title:"먼저 검토할 공고", className:"grant-priority", aside:link("공고 탐색",()=>setTab("recommend")), children:[
          h("p", {className:"muted small",children:"7일 이내 마감 공고와 개인 조건에 맞는 추천 공고"}),
          priorities.length ? priorities.map(record => j("button", {className:"grant-row",onClick:()=>showGrant(record),children:[
            h("strong",{children:record.title}),h("small",{children:record.agency}),h("span",{className:"deadline-tag",children:record.deadline ? record.deadline.slice(5).replace("-","/")+" 마감" : "마감일 확인"})
          ]},record.id)) : h("p",{className:"office-empty",children:data.status ? "아직 검토할 공고가 없습니다." : "공고 확인 중…"}),
          !profileProvided && link("내 지원 조건 입력",()=>setTab("profile"))
        ]}),
        j(Panel, {title:"지원공고 한 장 리포트",aside:link("전체 보기",()=>setTab("report")),children:[
          h("p",{className:"muted",children:data.files.report ? "최근 작성일 "+data.files.report.date : "개인 신청 후보를 매일 18시에 정리합니다."}),
          exportButtons(data.files.report,true)
        ]})
      ]}),
      j("div", { className:"office-stack", children:[
        j(Panel, {title:"진행 중인 신청",aside:link("지원 현황",()=>setTab("track")),children:[
          h("div",{className:"application-counts",children:[["신청 준비",pending.length,"prepare"],["결과 대기",data.applications.filter(item=>item.status==="결과 대기").length,"track"]].map(([label,n,target])=>j("button",{onClick:()=>setTab(target),children:[h("strong",{children:data.status?n:"–"}),h("span",{children:label})]},label))}),
          ...pending.slice(0,2).map(item=>j("div",{className:"report-line",children:[h("strong",{children:item.title}),item.documentPath ? link("서류 열기",()=>openDocument(item)) : link("준비함",()=>setTab("prepare"))]},item.id))
        ]}),
        j(Panel,{title:"수시 업무",aside:link("업무 지시",()=>setTab("request")),children:[
          h("p",{className:"muted",children:"공고 자격 확인, 조건 비교, 신청서 수정을 요청하세요."}),
          data.files.task && link("최근 결과 열기",()=>{setDoc(data.files.task);setTab("prepare");})
        ]})
      ]})
    ]});
    if (tab === "report") {
      const current=reportDoc||data.files.report;
      const history=Array.isArray(data.reports)?data.reports:[];
      content=j(jsx.Fragment,{children:[j("section",{className:"card",children:[h("h2",{children:"정부지원사업 하루 한 장 리포트"}),h("p",{className:"muted",children:"내가 검토할 개인 신청 공고와 지원 내용, 접수마감, 확인할 자격, 공식 링크를 매일 한 장 분량으로 정리합니다. 별도로 작성 요청할 필요가 없습니다."}),history.length>0&&j("label",{className:"field",children:["이전 리포트",h("select",{value:current?.path||"",onChange:event=>loadReport(event.target.value),children:[h("option",{value:"",children:"날짜 선택"}),...history.map(item=>h("option",{value:item.path,children:item.date},item.date))]})]}),exportButtons(current),!current&&h("p",{className:"muted small",children:"문서가 작성되면 내려받을 수 있습니다. 한글 파일 생성에는 PC 연결이 필요합니다."})]}),current?j("article",{className:"gov-report-paper",children:[h("p",{className:"muted small",children:current.date}),h(api.Markdown,{text:current.markdown})]}):empty("첫 리포트를 기다리고 있어요","PC 에이전트를 연결하면 매일 18시에 작성합니다. 실제 공고가 확인되지 않은 날은 확인된 공고가 없다는 내용으로 남깁니다.")]});
    }
    if (tab === "discover") {
      const records = data.records.filter(record => (record.title + " " + record.agency + " " + record.benefit).toLowerCase().includes(query.toLowerCase())).filter(record => filter === "all" || (filter === "open" ? !isClosed(record) : filter === "closed" ? isClosed(record) : !record.deadline));
      content = j(jsx.Fragment, { children: [j("section", { className: "card", children: [h("h2", { children: "개인 신청 가능한 공고부터 찾습니다" }),h("p", { className: "muted", children: "기업·기관 전용 사업을 제외한 조사 후보입니다. 내 자격과 실제 접수 여부는 공식 공고에서 최종 확인합니다." }),j("div", { className: "gov-search", children: [h("input", { type: "search", value: query, placeholder: "사업명·기관·지원 내용 검색", "aria-label": "지원사업 검색", onChange: event => setQuery(event.target.value) }),h("select", { value: filter, "aria-label": "접수 상태", onChange: event => setFilter(event.target.value), children: [["all","전체"],["open","마감 전·기한 미확인"],["unknown","기한 확인 필요"],["closed","마감"]].map(([value,label]) => h("option", { value, children: label },value)) })] })] }),collection(records, "조건에 맞는 수집 공고가 없어요", "자동 조사 결과가 쌓이면 이곳에서 검색할 수 있습니다. 알고 있는 공고는 업무 지시에서 링크로 검토를 요청하세요.")] });
    }
    if (tab === "recommend") content = j(jsx.Fragment, { children: [j("section", { className: "card", children: [h("h2", { children: "나에게 맞는 추천" }),h("p", { children: "추천 이유, 미확인 자격, 접수마감과 준비 부담을 함께 살펴보세요. 추천은 선정이나 신청 자격 충족을 보장하지 않습니다." }),!profileProvided && h("button", { onClick: () => setTab("profile"), children: "먼저 내 지원 조건 입력하기" })] }),collection(recommendations, "아직 확정된 추천이 없어요", "개인 지원 조건과 공고를 대조한 뒤 우선 검토할 후보를 표시합니다. 일반 수집 공고는 ‘지원사업 찾기’에서 볼 수 있습니다.")] });
    if (tab === "prepare") content = j(jsx.Fragment, { children: [j("section", { className: "card", children: [h("h2", { children: "신청 준비함" }),h("p", { className: "muted", children: "선택한 사업의 확인할 조건·필요서류·신청서 초안을 모아 봅니다. ‘신청 준비’는 실제 제출과 구분됩니다." })] }),data.applications.length ? h("div", { className: "gov-grants", children: data.applications.map(applicationCard) }) : empty("아직 준비 중인 신청이 없어요", "공고의 ‘신청 준비하기’를 누르면 에이전트가 체크리스트와 작성 가능한 초안을 준비합니다.",h("button", { onClick: () => setTab("discover"), children: "지원사업 찾기" })),doc && j("section", { className: "card gov-document", children: [h("h2", { children: doc.title }),h("div", { className: "doc", children: h(api.Markdown, { text: doc.markdown }) }),exportButtons(doc),h("button", { onClick: () => {setRequest("아래 준비서류를 수정해줘.\n\n참고: " + doc.path + "\n수정할 내용: ");setTab("request");}, children: "이 문서 수정 요청" })] })] });
    if (tab === "track") content = j(jsx.Fragment, { children: [j("section", { className: "card", children: [h("h2", { children: "지원 현황" }),h("p", { className: "muted", children: "준비 중부터 결과 확인까지 관리합니다. ‘신청 완료’는 실제 제출 후 직접 변경하세요. 에이전트가 자동 제출하지 않습니다." })] }),data.applications.length ? h("div", { className: "gov-grants", children: data.applications.map(applicationCard) }) : empty("아직 등록된 지원 현황이 없어요", "신청 준비를 시작한 사업이 이곳에 나타납니다.")] });
    if (tab === "profile") {
      const field = (key,label,placeholder,options) => j("label", { className: "field", children: [label,options ? h("select", { value: profile[key] || "", onChange: event => changeProfile(key,event.target.value), children: [h("option", { value:"",children:"선택하지 않음" }),...options.map(value=>h("option",{value,children:value},value))] }) : h(key === "notes" ? "textarea" : "input", { value: profile[key] || "", placeholder, rows: key === "notes" ? 3 : undefined, onChange: event => changeProfile(key,event.target.value) })] },key);
      content = j("form", { className: "card gov-profile", onSubmit: event => { event.preventDefault();operation("profile_save","개인 지원 조건 저장",profile); }, children: [h("h2", { children: "내 지원 조건" }),h("p", { className: "muted", children: "입력한 조건만 추천에 사용합니다. 모르는 항목은 비워 두면 확인 필요로 남깁니다. 입력 중인 내용은 이 브라우저에 임시 보관됩니다." }),h("div", { className: "gov-profile-grid", children: [field("region","거주지역","예: 인천광역시"),field("ageRange","연령 조건","예: 만 30대 / 직접 입력"),field("employment","현재 활동 상태","",["재직 중","구직 중","프리랜서","학생","기타"]),field("business","사업자등록 여부","",["없음","개인사업자 있음","법인사업자 있음","확인 필요"]),field("interests","관심 분야","예: 창업, 직무교육, 창작, 생활지원"),field("notes","추가 조건·제외할 사업","확인된 조건과 원하지 않는 지원 유형을 적어주세요.")] }),h("button", { type:"submit",className:"primary",disabled:sending,children:"조건 저장 요청" }),h("p", { className: "muted small", children: "PC 에이전트가 처리하면 개인 조건이 저장되어 이후 조사에 반영됩니다. 저장소의 개인 조건은 정부지원사업 본부에서만 사용합니다." })] });
    }
    if (tab === "request") content = controls;
    const explore = ["recommend","discover","profile"].includes(tab);
    const application = ["prepare","track"].includes(tab);
    return j("main", { className:"shell office-layout gov-office", children:[
      h(Header, {name:"정부지원사업 본부",divisionNav,status:data.status,busy,reload:load,disconnect:onDisconnect,
        utilities:[["내 지원 조건",()=>setTab("profile")],["업무 지시",()=>setTab("request")]]}),
      h(Nav, {items:menus,active:explore?"recommend":application?"prepare":tab,choose:setTab,label:"정부지원사업 업무 메뉴"}),
      explore && h(Nav,{secondary:true,label:"공고 탐색 메뉴",items:[["recommend","맞춤 추천"],["discover","전체 공고"],["profile","내 지원 조건"]],active:tab,choose:setTab}),
      application && h(Nav,{secondary:true,label:"신청 관리 메뉴",items:[["prepare","신청 준비함"],["track","지원 현황"]],active:tab,choose:setTab}),
      error && h("div",{className:"alert-box",role:"alert",children:error}),
      notice && h("div",{className:"gov-notice",role:"status",children:notice}),content
    ]});
  };
};
