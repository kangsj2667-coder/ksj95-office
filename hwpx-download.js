/* 비공개 저장소의 코닥 결과만 다운로드한다. 인증 토큰을 URL·파일에 넣지 않는다. */
(function(root) {
  const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map(x => x.toString(16).padStart(2,"0")).join("");
  const decode = content => Uint8Array.from(atob(content.replace(/\s/g,"")), char => char.charCodeAt(0));
  const contentsPath = path => "/contents/" + path.split("/").map(encodeURIComponent).join("/");
  const pending = new Set();
  async function download(token, doc, request) {
    const source = doc?.path;
    if (!source || !/^outputs\/(?:government\/)?(?:\d{4}-\d{2}-\d{2}|tasks|weekly)\/[^\\?#\x00-\x1f]+\.md$/u.test(source) || source.split("/").some(part => ["", ".", ".."].includes(part))) throw new Error("한글 문서의 원본 경로를 확인하지 못했습니다.");
    if (pending.has(source)) return;
    pending.add(source);
    try {
      const output = source.startsWith("outputs/government/") ? "outputs/government" : "outputs";
      let manifest;
      try {
        const data = await request(token, contentsPath(output + "/documents.json"), { cache: "no-store" });
        manifest = JSON.parse(new TextDecoder().decode(decode(data.content)));
      } catch (error) {
        if (error.status && error.status !== 404) throw error;
        throw new Error("아직 한글 파일이 없습니다. PC 연결 후 문서 작업이나 연결 점검을 실행하면 생성됩니다. 지금은 DOCX로 받을 수 있습니다.");
      }
      const record = manifest.records?.find(item => item.sourcePath === source && item.format === "hwpx");
      if (!record) throw new Error("이 문서의 한글 파일이 아직 없습니다. PC에서 문서 작업이나 연결 점검을 실행한 뒤 새로고침하세요.");
      if (record.status !== "ready") throw new Error("한글 파일 생성에 실패했습니다. PC 실행 기록을 확인하세요. 원문과 DOCX는 사용할 수 있습니다.");
      const sourceHash = await digest(new TextEncoder().encode(doc.markdown));
      if (sourceHash !== record.sourceHash) throw new Error("문서가 수정되어 한글 파일과 내용이 다릅니다. 새로고침 후 PC의 문서 생성 완료를 확인하세요.");
      const expected = output + "/documents/" + source.slice(output.length + 1).replace(/\.md$/, ".hwpx");
      if (record.filePath !== expected) throw new Error("한글 파일 경로가 원본과 일치하지 않습니다.");
      let data = await request(token, contentsPath(expected), { cache: "no-store" });
      if (data.encoding !== "base64" && /^[a-f0-9]{40}$/.test(data.sha || "")) data = await request(token, "/git/blobs/" + data.sha, { cache: "no-store" });
      if (data.encoding !== "base64" || !data.content) throw new Error("한글 파일을 읽지 못했습니다. 다시 시도하세요.");
      const bytes = decode(data.content);
      if (bytes[0] !== 80 || bytes[1] !== 75 || await digest(bytes) !== record.fileHash) throw new Error("한글 파일 검증에 실패했습니다. 새로고침 후 다시 시도하세요.");
      const blob = new Blob([bytes], { type: "application/hwp+zip" });
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url;link.download = (doc.title || record.title || "문서").replace(/[\\/:*?"<>|\x00-\x1f]/g,"_").slice(0,100) + (doc.date ? "_" + doc.date : "") + ".hwpx";
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally { pending.delete(source); }
  }
  root.AIOfficeHwpx = { download };
})(typeof window !== "undefined" ? window : globalThis);
