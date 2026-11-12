/* 정부지원사업 본부: SW 운영 화면과 분리된 개인 지원사업 작업 공간 */
window.createGovernmentOffice = function (React, jsx, api) {
  const h = jsx.jsx, j = jsx.jsxs;
  const menus = [["overview", "한눈에 보기"], ["discover", "지원사업 찾기"], ["recommend", "나에게 맞는 추천"], ["prepare", "신청 준비함"], ["track", "지원 현황"], ["profile", "내 지원 조건"]];
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
    const dirtyProfile = React.useRef(false), version = React.useRef(0), alive = React.useRef(true);
    const load = React.useCallback(async () => {
      const id = ++version.current;setBusy(true);
      try {
        const [snapshot, opportunities, applications, savedProfile] = await Promise.all([
          api.Fm(token, "government"), api.km(token, "outputs/government/opportunities.json"),
          api.km(token, "outputs/government/applications.json"), api.km(token, "context/government/profile.json")
        ]);
        if (!alive.current || id !== version.current) return;
        const records = parse(opportunities, { records: [] }).records || [];
        const appRecords = parse(applications, { records: [] }).records;setData({ records: Array.isArray(records) ? records : [], applications: Array.isArray(appRecords) ? appRecords : [], files: snapshot.files, status: snapshot.status });
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
    if (tab === "overview") content = j(jsx.Fragment, { children: [
      j("section", { className: "gov-hero", children: [h("span", { className: "gov-eyebrow", children: "PERSONAL OPPORTUNITIES" }),h("h2", { children: "나에게 맞는 지원을 찾고, 신청까지 준비하세요." }),h("p", { children: "개인 신청 가능 여부부터 확인하고, 준비할 가치가 있는 사업을 추려드립니다." }),j("div", { className: "gov-actions", children: [h("button", { className: "primary", onClick: () => setTab("recommend"), children: "내 추천 보기" }),h("button", { onClick: () => setTab("profile"), children: profileProvided ? "지원 조건 확인" : "내 지원 조건 입력" })] })] }),
      h("section", { className: "gov-stats", children: [["개인 신청 후보",activeRecords.length,"discover"],["우선 검토 추천",recommendations.length,"recommend"],["7일 이내 마감",imminent.length,"discover"],["신청 준비 중",pending.length,"prepare"]].map(([label,count,target]) => j("button", { className: "card gov-stat", onClick: () => setTab(target), children: [h("span", { children: label }),h("strong", { children: count + "건" })] },label)) }),
      j("section", { className: "gov-section", children: [j("div", { className: "gov-section-heading", children: [h("h2", { children: "먼저 확인할 지원사업" }),h("button", { className: "ghost", onClick: () => setTab("discover"), children: "전체 보기" })] }),collection((imminent.length ? imminent : recommendations.length ? recommendations : activeRecords).slice(0,3), "아직 수집된 지원사업이 없어요", data.status?.gptReady ? "다음 자동 조사 결과가 나오면 공고와 추천이 여기에 표시됩니다." : "PC 에이전트를 연결하면 개인 신청 가능한 공고를 수집해 보여드립니다.")] }),
      pending.length > 0 && j("section", { className: "gov-section", children: [h("h2", { children: "이어갈 신청 준비" }),h("div", { className: "gov-grants", children: pending.slice(0,2).map(applicationCard) })] }),
      data.files.report && j("section", { className: "card", children: [h("h2", { children: "오늘의 변경사항" }),h("p", { className: "muted small", children: data.files.report.date }),h("div", { className: "gov-summary", children: h(api.Markdown, { text: data.files.report.markdown.slice(0,1000) }) })] }),controls
    ] });
    if (tab === "discover") {
      const records = data.records.filter(record => (record.title + " " + record.agency + " " + record.benefit).toLowerCase().includes(query.toLowerCase())).filter(record => filter === "all" || (filter === "open" ? !isClosed(record) : filter === "closed" ? isClosed(record) : !record.deadline));
      content = j(jsx.Fragment, { children: [j("section", { className: "card", children: [h("h2", { children: "개인 신청 가능한 공고부터 찾습니다" }),h("p", { className: "muted", children: "기업·기관 전용 사업을 제외한 조사 후보입니다. 내 자격과 실제 접수 여부는 공식 공고에서 최종 확인합니다." }),j("div", { className: "gov-search", children: [h("input", { type: "search", value: query, placeholder: "사업명·기관·지원 내용 검색", "aria-label": "지원사업 검색", onChange: event => setQuery(event.target.value) }),h("select", { value: filter, "aria-label": "접수 상태", onChange: event => setFilter(event.target.value), children: [["all","전체"],["open","마감 전·기한 미확인"],["unknown","기한 확인 필요"],["closed","마감"]].map(([value,label]) => h("option", { value, children: label },value)) })] })] }),collection(records, "조건에 맞는 수집 공고가 없어요", "자동 조사 결과가 쌓이면 이곳에서 검색할 수 있습니다. 알고 있는 공고는 아래 요청창에 링크를 붙여 검토를 맡기세요."),controls] });
    }
    if (tab === "recommend") content = j(jsx.Fragment, { children: [j("section", { className: "card", children: [h("h2", { children: "나에게 맞는 추천" }),h("p", { children: "추천 이유, 미확인 자격, 접수마감과 준비 부담을 함께 살펴보세요. 추천은 선정이나 신청 자격 충족을 보장하지 않습니다." }),!profileProvided && h("button", { onClick: () => setTab("profile"), children: "먼저 내 지원 조건 입력하기" })] }),collection(recommendations, "아직 확정된 추천이 없어요", "개인 지원 조건과 공고를 대조한 뒤 우선 검토할 후보를 표시합니다. 일반 수집 공고는 ‘지원사업 찾기’에서 볼 수 있습니다.")] });
    if (tab === "prepare") content = j(jsx.Fragment, { children: [j("section", { className: "card", children: [h("h2", { children: "신청 준비함" }),h("p", { className: "muted", children: "선택한 사업의 확인할 조건·필요서류·신청서 초안을 모아 봅니다. ‘신청 준비’는 실제 제출과 구분됩니다." })] }),data.applications.length ? h("div", { className: "gov-grants", children: data.applications.map(applicationCard) }) : empty("아직 준비 중인 신청이 없어요", "공고의 ‘신청 준비하기’를 누르면 에이전트가 체크리스트와 작성 가능한 초안을 준비합니다.",h("button", { onClick: () => setTab("discover"), children: "지원사업 찾기" })),doc && j("section", { className: "card gov-document", children: [h("h2", { children: doc.title }),h("div", { className: "doc", children: h(api.Markdown, { text: doc.markdown }) }),h("button", { onClick: () => { const blob = new Blob([doc.markdown], { type: "text/markdown;charset=utf-8" });const link = document.createElement("a");link.href=URL.createObjectURL(blob);link.download="지원사업_준비서류.md";link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000); }, children: "문서 내려받기" }),h("button", { onClick: () => setRequest("아래 준비서류를 수정해줘.\n\n참고: " + doc.path + "\n수정할 내용: "), children: "이 문서 수정 요청" })] }),controls] });
    if (tab === "track") content = j(jsx.Fragment, { children: [j("section", { className: "card", children: [h("h2", { children: "지원 현황" }),h("p", { className: "muted", children: "준비 중부터 결과 확인까지 관리합니다. ‘신청 완료’는 실제 제출 후 직접 변경하세요. 에이전트가 자동 제출하지 않습니다." })] }),data.applications.length ? h("div", { className: "gov-grants", children: data.applications.map(applicationCard) }) : empty("아직 등록된 지원 현황이 없어요", "신청 준비를 시작한 사업이 이곳에 나타납니다.")] });
    if (tab === "profile") {
      const field = (key,label,placeholder,options) => j("label", { className: "field", children: [label,options ? h("select", { value: profile[key] || "", onChange: event => changeProfile(key,event.target.value), children: [h("option", { value:"",children:"선택하지 않음" }),...options.map(value=>h("option",{value,children:value},value))] }) : h(key === "notes" ? "textarea" : "input", { value: profile[key] || "", placeholder, rows: key === "notes" ? 3 : undefined, onChange: event => changeProfile(key,event.target.value) })] },key);
      content = j("form", { className: "card gov-profile", onSubmit: event => { event.preventDefault();operation("profile_save","개인 지원 조건 저장",profile); }, children: [h("h2", { children: "내 지원 조건" }),h("p", { className: "muted", children: "입력한 조건만 추천에 사용합니다. 모르는 항목은 비워 두면 확인 필요로 남깁니다. 입력 중인 내용은 이 브라우저에 임시 보관됩니다." }),h("div", { className: "gov-profile-grid", children: [field("region","거주지역","예: 인천광역시"),field("ageRange","연령 조건","예: 만 30대 / 직접 입력"),field("employment","현재 활동 상태","",["재직 중","구직 중","프리랜서","학생","기타"]),field("business","사업자등록 여부","",["없음","개인사업자 있음","법인사업자 있음","확인 필요"]),field("interests","관심 분야","예: 창업, 직무교육, 창작, 생활지원"),field("notes","추가 조건·제외할 사업","확인된 조건과 원하지 않는 지원 유형을 적어주세요.")] }),h("button", { type:"submit",className:"primary",disabled:sending,children:"조건 저장 요청" }),h("p", { className: "muted small", children: "PC 에이전트가 처리하면 개인 조건이 저장되어 이후 조사에 반영됩니다. 저장소의 개인 조건은 정부지원사업 본부에서만 사용합니다." })] });
    }
    return j("main", { className: "shell gov-office", children: [divisionNav,j("header", { className:"top gov-header",children:[j("div",{children:[h("p",{className:"gov-eyebrow",children:"AI 사무실 / 개인 지원사업"}),h("h1",{children:"정부지원사업 본부"})]}),j("div",{className:"row",children:[h("button",{onClick:load,disabled:busy,children:busy?"갱신 중…":"새로고침"}),h("button",{className:"ghost",onClick:onDisconnect,children:"연결 해제"})]})]}),
      j("div", { className:"gov-connection",children:[h("span",{className:"gov-dot"+(data.status?.gptReady?" ready":"" )}),h("span",{children:data.status?.gptReady?"PC 로그인 설정 확인됨 · 실행기가 켜져 있어야 업무를 처리합니다.":"PC 에이전트 연결 전 · 아직 자동 조사를 시작하지 않았습니다."}),h("a",{href:"https://github.com/kangsj2667-coder/ksj95/blob/main/docs/windows-gpt.md",target:"_blank",rel:"noreferrer",children:"연결 안내"})]}),
      h("nav", { className:"gov-menu","aria-label":"정부지원사업 메뉴",children:menus.map(([value,label])=>h("button",{className:tab===value?"on":"","aria-pressed":tab===value,onClick:()=>{setTab(value);setError("");},children:label},value))}),
      error && h("div",{className:"alert-box",role:"alert",children:error}),notice && h("div",{className:"gov-notice",role:"status",children:notice}),content,
      h("footer",{className:"foot",children:"공식 공고 확인 → 개인 조건 대조 → 신청 준비 → 직접 제출 → 결과 관리"})] });
  };
};
