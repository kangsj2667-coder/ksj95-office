/* SW 미래체험 본부: 대표는 결과만 본다. 업무 홈에 기획안 검토 요약·업무 지시·정기 보고서(한글)를 모아 둔다. */
window.createSwOffice = function (React, layout, api) {
  const el = React.createElement;
  const { Header, Nav, Panel, Downloads, LinkButton } = layout;
  const tabs = [["home", "업무 홈"], ["approval", "기획안 검토"]];
  const weeklyKeys = new Set(["weeklyDraft", "weekly"]);
  const API = "https://api.github.com/repos/kangsj2667-coder/ksj95/contents/";
  const token = () => { try { return localStorage.getItem("swmc_token") || ""; } catch { return ""; } };
  async function raw(path) {
    const res = await fetch(API + path.split("/").map(encodeURIComponent).join("/"), {
      cache: "no-store",
      headers: { Authorization: "Bearer " + token(), Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2022-11-28" },
    });
    if (!res.ok) throw new Error("GitHub " + res.status);
    return res.text();
  }
  // 승인 후 작성된 문서는 날짜 폴더가 바뀌어도 최근 3건까지 보여준다.
  function useApprovedDocs(reloadKey) {
    const [docs, setDocs] = React.useState([]);
    React.useEffect(() => {
      let alive = true;
      if (!token()) return undefined;
      (async () => {
        const manifest = JSON.parse(await raw("outputs/documents.json"));
        const records = (manifest.records || [])
          .filter(r => r.status === "ready" && /^outputs\/\d{4}-\d{2}-\d{2}\/04-doc[^/]*\.md$/.test(r.sourcePath))
          .sort((a, b) => b.sourcePath.localeCompare(a.sourcePath, "en", { numeric: true }))
          .slice(0, 3);
        const list = await Promise.all(records.map(async r => {
          const date = r.sourcePath.split("/")[1];
          const title = String(r.title || "승인 문서").replace(/^문서작성팀\s*·\s*/, "").replace(/\s*·\s*\d{4}-\d{2}-\d{2}$/, "");
          const markdown = await raw(r.sourcePath);
          const heading = (markdown.match(/^#\s+(.+)$/m) || [])[1];
          const realTitle = heading ? heading.replace(/[*_`]/g, "").trim() : title;
          return { title: realTitle, date, path: r.sourcePath, markdown };
        }));
        if (alive) setDocs(list);
      })().catch(() => {});
      return () => { alive = false; };
    }, [reloadKey]);
    return docs;
  }
  // 기획안 원문에서 TOP 1·2 본문만 잘라낸다. 점수·후보 목록·검수 내역은 보여주지 않는다.
  function topSections(markdown) {
    const out = {};
    if (!markdown) return out;
    for (const part of markdown.split(/^(?=##\s*TOP\s*\d)/m)) {
      const m = part.match(/^##\s*TOP\s*(\d)\s*[·:.\-]?\s*(.*)$/m);
      if (!m || out[m[1]]) continue;
      const body = part.replace(/^##.*$/m, "").replace(/^##\s+(?!TOP)[\s\S]*$/m, "").trim();
      out[m[1]] = { title: m[2].trim(), body };
    }
    return out;
  }

  return function SwOffice(props) {
    const { status, files, chooseDocument, documentKey, selectedPlan, choosePlan, docType, changeType, submitted,
      approve, request, changeRequest, reference, changeReference, sendRequest } = props;
    const [tab, setTab] = React.useState("home");
    React.useEffect(() => { if (weeklyKeys.has(documentKey)) chooseDocument("report"); }, [documentKey, chooseDocument]);
    const approvedDocs = useApprovedDocs([files.plan?.date, files.doc?.path, files.report?.date, submitted].join("|"));
    const needsReview = status?.approval && !submitted;
    const plans = (status?.top || []).filter(plan => [1, 2].includes(plan.n));
    const sections = topSections(files.plan?.markdown);
    const download = document => el(Downloads, { doc: document, compact: true, onHwpx: props.downloadHwpx, onError: props.onError });
    const reviewTitle = !status ? "안건 확인 중" : submitted ? "문서 작성 요청을 보냈어요" : needsReview ? "검토할 기획안 " + plans.length + "건" : "승인 대기 안건이 없습니다";

    const reviewSummary = el("section", { className: "decision-panel" },
      el("div", { className: "decision-label" }, "기획안 검토 · 월·수 오전 9시", status?.date && el("span", null, status.date)),
      el("h2", null, reviewTitle),
      needsReview && el("ul", { className: "short-list" }, ...plans.map(item => el("li", { key: item.n }, item.title))),
      needsReview && el("button", { className: "decision-action", onClick: () => setTab("approval") }, "기획안 검토하기"));

    const docs = Array.isArray(approvedDocs) && approvedDocs.length ? approvedDocs : (files.doc ? [files.doc] : []);
    const shelfRow = (key, label, sub, document) => el("div", { className: "report-line", key },
      el("div", null, el("h3", null, label), el("small", null, sub)),
      document ? download(document) : el("span", { className: "neutral-tag" }, status ? "작성 전" : "확인 중"));
    const reportShelf = el(Panel, { title: "정기 보고서" },
      shelfRow("report", "일일 리포트", files.report?.date || "매일 18시 자동 작성", files.report),
      ...(docs.length ? docs.map((d, i) => shelfRow("doc" + i, d.title, "승인 문서 · " + d.date, d))
        : [shelfRow("doc", "승인 문서", "기획안을 승인하면 자동 작성", null)]),
      shelfRow("task", "수시 업무 결과", files.task?.date || "업무 지시를 보내면 여기에 올라옵니다", files.task || null));

    const friendly = run => {
      const t = String(run.full || run.name || "");
      if (/AI Office|runner|startup/i.test(t)) return null;
      if (/승인\]/.test(t)) return "기획안 승인 · 문서 작성";
      const job = t.match(/\[GPT 실행\]\s*([^|]+?)(?:\s+\[GPT|$)/);
      if (job) return /주간업무보고/.test(job[1]) ? "주간업무보고 초안" : "업무 지시 · " + job[1].trim().slice(0, 24);
      if (/0 0 \* \* 1,3|아침 실행/.test(t)) return "기획안 TOP 2 작성";
      if (/0 0 \* \* 2,4/.test(t)) return "정부지원사업 공고 조사";
      if (/0 9 \* \* \*|한 장 리포트/.test(t)) return "일일 리포트";
      if (/\* \* 0|\* \* 1|주간/.test(t)) return "주간업무보고 초안";
      return null;
    };
    const recentRuns = (status?.runs || []).map(run => ({ ...run, label: friendly(run) })).filter(run => run.label).slice(0, 5);
    const nextRuns = (() => {
      const now = new Date(Date.now() + 9 * 3600e3); // 한국 시간
      const plan = [["일일 리포트", [0,1,2,3,4,5,6], 18], ["주간업무보고 초안", [1], 8], ["기획안 TOP 2", [1,3], 9]];
      const days = ["일","월","화","수","목","금","토"];
      return plan.map(([what, dows, hour]) => {
        for (let add = 0; add < 8; add++) {
          const d = new Date(now); d.setUTCDate(now.getUTCDate() + add); d.setUTCHours(hour, 0, 0, 0);
          if (dows.includes(d.getUTCDay()) && d > now) return { what, d, text: (add === 0 ? "오늘" : add === 1 ? "내일" : (d.getUTCMonth() + 1) + "/" + d.getUTCDate() + "(" + days[d.getUTCDay()] + ")") + " " + String(hour).padStart(2, "0") + ":00" };
        }
        return null;
      }).filter(Boolean).sort((a, b) => a.d - b.d);
    })();
    const tagClass = result => "run-tag " + (result === "완료" ? "ok" : result === "실패" ? "bad" : "run");
    const progressPanel = el(Panel, { title: "업무 진행 현황", aside: el("button", { type: "button", className: "office-link", onClick: () => setTab("operations") }, "전체 기록 ›") },
      recentRuns.length ? el("ul", { className: "run-list" }, ...recentRuns.map((run, i) => el("li", { key: i },
        el("div", null, el("strong", null, run.label), el("small", null, run.when)),
        el("span", { className: tagClass(run.result) }, run.result))))
        : el("p", { className: "muted" }, status ? "최근 실행 기록이 없습니다." : "확인 중…"),
      el("h3", { className: "run-subhead" }, "다음 자동 실행"),
      el("ul", { className: "run-list next" }, ...nextRuns.map(n => el("li", { key: n.what }, el("strong", null, n.what), el("small", null, n.text)))),
      el("p", { className: "muted small-note" }, "PC가 켜져 있고 윈도우에 로그인된 상태에서 자동 실행됩니다."));

    const requestPanel = el(Panel, { title: "새 업무 지시" },
      el("label", { className: "office-field" }, "업무 내용", el("textarea", { rows: 4, value: request, placeholder: "예: 다음 주 교육 운영 체크리스트를 작성해줘", onChange: e => changeRequest(e.target.value) })),
      el("div", { className: "chips" }, ...["이번 주 일정 점검", "조합 강사 모집 안내문 초안", "페스티벌 운영 체크리스트"].map(text => el("button", { key: text, className: "chip", onClick: () => changeRequest(text) }, text))),
      el("details", { className: "office-disclosure" }, el("summary", null, "참고 파일 추가"), el("label", { className: "office-field" }, "파일 경로", el("input", { value: reference, onChange: e => changeReference(e.target.value), placeholder: "outputs/날짜/파일명.md" }))),
      el("button", { className: "primary", onClick: sendRequest, disabled: !request.trim() }, "지시 보내기"),
      el("p", { className: "muted" }, "결과는 오른쪽 정기 보고서의 '수시 업무 결과'에 한글 파일로 올라옵니다."));

    function approval() {
      if (!needsReview) return el(Panel, { title: "기획안 검토", aside: status?.date && el("small", null, status.date) },
        el("p", { className: "office-empty" }, reviewTitle),
        el("p", { className: "muted" }, "새 기획안은 매주 월·수 오전 9시에 올라옵니다. 승인한 문서는 업무 홈 › 정기 보고서에서 한글 파일로 받을 수 있습니다."));
      return el("div", { className: "office-stack" },
        el("div", { className: "plan-cards" }, ...plans.map(plan => {
          const section = sections[plan.n];
          const on = plan.n === selectedPlan;
          return el("article", { key: plan.n, className: "plan-card" + (on ? " on" : "") },
            el("label", { className: "plan-card-head" },
              el("input", { type: "radio", name: "pick", checked: on, onChange: () => choosePlan(plan.n) }),
              el("span", { className: "plan-rank" }, "TOP " + plan.n),
              el("h2", null, section?.title || plan.title)),
            el("div", { className: "plan-card-body" }, section ? el(api.Markdown, { text: section.body }) : el("p", null, plan.title)));
        })),
        el(Panel, { title: plans.some(plan => plan.n === selectedPlan) ? "승인 · TOP " + selectedPlan + " 선택됨" : "승인 · 위 카드에서 하나를 고르세요", className: "approve-bar" },
          el("label", { className: "office-field" }, "작성할 문서", el("input", { list: "doc-types", value: docType, onChange: e => changeType(e.target.value) })),
          el("datalist", { id: "doc-types" }, ...api.docTypes.map(value => el("option", { key: value, value }))),
          el("button", { className: "primary", onClick: approve, disabled: !docType.trim() || !plans.some(plan => plan.n === selectedPlan) }, "선택한 기획안 승인·문서 작성"),
          el("p", { className: "muted" }, "승인하면 AI가 문서를 작성해 업무 홈 › 정기 보고서에 한글 파일로 올립니다.")));
    }
    function operations() {
      return el("div", { className: "office-stack" },
        el(Panel, { title: "실행 기록" }, ...(status?.runs || []).map((run, index) => el("div", { className: "list-row", key: index }, el("strong", null, friendly(run) || run.name), el("small", null, run.when), el("span", null, run.result))),
          !status?.runs?.length && el("p", { className: "muted" }, "아직 실행 기록이 없습니다.")),
        el(Panel, { title: "자동 실행 일정" }, ...[["기획안 TOP 2", "월·수 09:00"], ["일일 리포트", "매일 18:00"], ["주간업무보고 초안", "월 08:00"]]
          .map(([what, when]) => el("div", { className: "list-row", key: what }, el("strong", null, what), el("small", null, when)))));
    }
    return el("main", { className: "shell office-layout sw-layout" },
      el(Header, { name: "SW 미래체험 본부", divisionNav: props.divisionNav, status, busy: props.busy, reload: props.reload, disconnect: props.disconnect, utilities: [["실행 기록", () => setTab("operations")]] }),
      el(Nav, { items: tabs, active: tab, choose: setTab, label: "SW 미래체험 업무 메뉴" }),
      props.error && el("div", { className: "alert-box", role: "alert" }, props.error),
      tab === "home" && el("div", { className: "office-home-grid" },
        el("div", { className: "office-stack" }, reviewSummary, requestPanel),
        el("div", { className: "office-stack" }, reportShelf, progressPanel)),
      tab === "approval" && approval(), tab === "operations" && operations(),
      props.notice && el("div", { className: "toast", role: "status" }, props.notice));
  };
};
