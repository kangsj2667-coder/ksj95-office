/* 두 본부가 공유하는 메뉴와 문서 도구. 업무 데이터와 명령은 각 본부에서 관리한다. */
window.createOfficeLayout = function (React) {
  const el = React.createElement;
  const guide = "https://github.com/kangsj2667-coder/ksj95/blob/main/docs/windows-gpt.md";

  function Header({ name, divisionNav, status, busy, reload, disconnect, utilities = [] }) {
    return el("header", { className: "office-header" },
      el("div", { className: "office-brand-row" },
        el("div", { className: "office-brand" }, el("span", { className: "office-mark", "aria-hidden": true }, "▦"), "AI 사무실"),
        el("div", { className: "office-tools" },
          el("button", { type: "button", disabled: busy, onClick: reload }, busy ? "갱신 중…" : "새로고침"),
          el("details", { className: "office-options" },
            el("summary", null, "설정"),
            el("div", { className: "office-options-list" },
              ...utilities.map(([label, action]) => el("button", { key: label, onClick: event => { event.currentTarget.closest("details").open = false; action(); } }, label)),
              el("a", { href: guide, target: "_blank", rel: "noreferrer" }, "PC 연결 안내"),
              el("button", { onClick: disconnect }, "연결 해제"))))),
      divisionNav,
      el("div", { className: "office-heading-row" },
        el("h1", null, name),
        el("a", { className: "office-pc", href: guide, target: "_blank", rel: "noreferrer", title: "PC 연결 안내" },
          el("i", { className: status?.gptReady ? "ready" : "", "aria-hidden": true }),
          !status ? "연결 확인 중" : status.gptReady ? "PC 설정 확인됨" : "PC 연결 필요")));
  }

  function Nav({ items, active, choose, label, secondary = false }) {
    return el("nav", { className: secondary ? "office-filter" : "office-tabs", "aria-label": label },
      ...items.map(([id, title]) => el("button", {
        key: id, type: "button", "aria-current": active === id ? "page" : undefined,
        className: active === id ? "selected" : "", onClick: () => choose(id)
      }, title)));
  }

  function Panel({ title, aside, children, className = "" }) {
    return el("section", { className: "office-panel " + className },
      el("div", { className: "panel-heading" }, el("h2", null, title), aside), children);
  }

  function LinkButton({ children, onClick }) {
    return el("button", { type: "button", className: "office-link", onClick }, children);
  }

  function Downloads({ doc, onHwpx, onError, compact = false }) {
    const [working, setWorking] = React.useState(false);
    const supported = doc?.path?.startsWith("outputs/");
    const title = doc ? doc.title + (doc.date ? "_" + doc.date : "") : "";
    async function hwpx() {
      setWorking(true);
      try { await onHwpx(doc); } catch (error) { onError(error.message); } finally { setWorking(false); }
    }
    function exportAs(method) {
      try { window.AIOfficeDocuments[method](doc.markdown, title); } catch (error) { onError(error.message); }
    }
    return el("div", { className: "office-downloads" },
      el("button", { type: "button", className: "download-main", disabled: !supported || working, onClick: hwpx }, working ? "파일 확인 중…" : "한글(HWPX) 내려받기"),
      !compact && doc && el("details", { className: "office-formats" },
        el("summary", null, "다른 형식"),
        el("div", null, ...[["downloadDocx", "DOCX"], ["print", "PDF 저장 / 인쇄"], ["downloadMarkdown", "원문(.md)"]].map(([method,label]) => el("button", { key: method, onClick: () => exportAs(method) }, label)))),
      !doc && !compact && el("small", { className: "muted" }, "PC에서 문서가 생성되면 받을 수 있습니다."),
      doc && !supported && el("small", { className: "muted" }, "제출본은 다른 형식으로 받을 수 있습니다."));
  }

  return { Header, Nav, Panel, Downloads, LinkButton };
};
