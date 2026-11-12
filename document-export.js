(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AIOfficeDocuments = api;
})(typeof window !== "undefined" ? window : null, function () {
  const encode = text => new TextEncoder().encode(text);
  const escape = value => String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const plain = text => text.replace(/\*\*([^*]+)\*\*/g,"$1").replace(/`([^`]+)`/g,"$1");
  function blocks(markdown) {
    const lines = String(markdown).replace(/\r/g,"").split("\n"), result = [];
    const row = line => line.trim().replace(/^\|/,"").replace(/\|$/,"").split(/(?<!\\)\|/).map(cell => plain(cell.trim().replace(/\\\|/g,"|")));
    for (let i=0;i<lines.length;i++) {
      const line=lines[i];
      if (/^\s*\|/.test(line)) {
        const rows=[];
        while (i<lines.length && /^\s*\|/.test(lines[i])) {
          if (!/^\s*\|?\s*:?-{2,}/.test(lines[i])) rows.push(row(lines[i]));
          i++;
        }
        i--;if(rows.length)result.push({type:"table",rows});continue;
      }
      if (!line.trim() || /^\s*---+\s*$/.test(line) || /^```/.test(line)) continue;
      const heading=line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) result.push({type:heading[1].length===1?"title":"heading",text:plain(heading[2])});
      else result.push({type:"paragraph",text:plain(line.replace(/^\s*[-*]\s+/,"• "))});
    }
    return result;
  }
  const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  function crc32(bytes){let n=0xffffffff;for(const byte of bytes)n=crcTable[(n^byte)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
  function zip(files) {
    const parts=[],central=[];let offset=0;
    for(const [filename,text] of Object.entries(files)){
      const name=encode(filename),data=encode(text),crc=crc32(data),head=new Uint8Array(30),view=new DataView(head.buffer);
      view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x800,true);view.setUint16(12,33,true);view.setUint32(14,crc,true);view.setUint32(18,data.length,true);view.setUint32(22,data.length,true);view.setUint16(26,name.length,true);
      parts.push(head,name,data);
      const entry=new Uint8Array(46),v=new DataView(entry.buffer);
      v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);v.setUint16(14,33,true);v.setUint32(16,crc,true);v.setUint32(20,data.length,true);v.setUint32(24,data.length,true);v.setUint16(28,name.length,true);v.setUint32(42,offset,true);
      central.push(entry,name);offset+=head.length+name.length+data.length;
    }
    const size=central.reduce((n,a)=>n+a.length,0),end=new Uint8Array(22),v=new DataView(end.buffer),count=Object.keys(files).length;
    v.setUint32(0,0x06054b50,true);v.setUint16(8,count,true);v.setUint16(10,count,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);
    const all=[...parts,...central,end],out=new Uint8Array(all.reduce((n,a)=>n+a.length,0));let at=0;for(const item of all){out.set(item,at);at+=item.length;}return out;
  }
  function paragraph(text,style="Normal",links=new Map()){
    const tokens=String(text).split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
    const runs=tokens.map(token=>{const match=token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);if(!match)return `<w:r><w:t xml:space="preserve">${escape(token)}</w:t></w:r>`;const id="link"+(links.size+1);links.set(id,match[2]);return `<w:hyperlink r:id="${id}"><w:r><w:rPr><w:color w:val="156074"/><w:u w:val="single"/></w:rPr><w:t>${escape(match[1])}</w:t></w:r></w:hyperlink>`;}).join("");
    return `<w:p><w:pPr><w:pStyle w:val="${style}"/>${style!=="Normal"?"<w:keepNext/>":""}</w:pPr>${runs}</w:p>`;
  }
  function table(rows,links){
    const count=Math.max(...rows.map(row=>row.length)),widths=Array.from({length:count},()=>Math.floor(10240/count));
    if(count===4)widths.splice(0,4,2600,2700,3200,1740);
    return `<w:tbl><w:tblPr><w:tblW w:w="10240" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${["top","left","bottom","right","insideH","insideV"].map(side=>`<w:${side} w:val="single" w:sz="4" w:color="D9D9D9"/>`).join("")}</w:tblBorders><w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${rows.map((row,index)=>`<w:tr>${index===0?"<w:trPr><w:tblHeader/></w:trPr>":""}${Array.from({length:count},(_,i)=>`<w:tc><w:tcPr><w:tcW w:w="${widths[i]}" w:type="dxa"/><w:vAlign w:val="center"/>${index===0?'<w:shd w:fill="E8EDF0"/>':""}</w:tcPr>${paragraph(row[i]||"",index===0?"TableHeader":"Normal",links)}</w:tc>`).join("")}</w:tr>`).join("")}</w:tbl>${paragraph("")}`;
  }
  function docxBytes(markdown,title="문서"){
    const parsed=blocks(markdown);if(!parsed.some(block=>block.type==="title"))parsed.unshift({type:"title",text:title});
    const links=new Map();const body=parsed.map(block=>block.type==="table"?table(block.rows,links):paragraph(block.text,block.type==="title"?"Title":block.type==="heading"?"Heading1":"Normal",links)).join("");
    const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    return zip({
      "[Content_Types].xml":xml+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
      "_rels/.rels":xml+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      "word/_rels/document.xml.rels":xml+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+ [...links].map(([id,url])=>`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escape(url)}" TargetMode="External"/>`).join("")+'</Relationships>',
      "word/document.xml":xml+`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:header="400" w:footer="400"/></w:sectPr></w:body></w:document>`,
      "word/styles.xml":xml+'<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="맑은 고딕"/><w:color w:val="000000"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="ko-KR" w:eastAsia="ko-KR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="290" w:lineRule="auto"/><w:wordWrap/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="0" w:after="180"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="100"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="TableHeader"><w:name w:val="Table Header"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="000000"/></w:rPr></w:style></w:styles>'
    });
  }
  const filename=value=>String(value||"문서").replace(/[<>:"/\\|?*\x00-\x1f]/g,"_").slice(0,100);
  function download(data,name,type){const blob=new Blob([data],{type}),link=document.createElement("a"),url=URL.createObjectURL(blob);link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function htmlInline(value){return String(value).split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g).map(token=>{const match=token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);return match?`<a href="${escape(match[2])}">${escape(match[1])}</a>`:escape(token);}).join("");}
  function printHtml(markdown,title="문서"){
    const parsed=blocks(markdown);if(!parsed.some(block=>block.type==="title"))parsed.unshift({type:"title",text:title});
    const body=parsed.map(block=>block.type==="table"?`<table>${block.rows.map((row,i)=>`<tr>${row.map(cell=>`<${i===0?"th":"td"}>${htmlInline(cell)}</${i===0?"th":"td"}>`).join("")}</tr>`).join("")}</table>`:`<${block.type==="title"?"h1":block.type==="heading"?"h2":"p"}>${htmlInline(block.text)}</${block.type==="title"?"h1":block.type==="heading"?"h2":"p"}>`).join("");
    return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escape(title)}</title><style>@page{size:Letter;margin:18mm}body{font-family:"맑은 고딕","Noto Sans CJK KR",Arial,sans-serif;color:#000;font-size:10.5pt;line-height:1.5;overflow-wrap:anywhere}h1{font-size:16pt;margin:0 0 12pt}h2{font-size:12pt;margin:13pt 0 6pt;break-after:avoid}p{margin:0 0 7pt;white-space:pre-wrap}table{width:100%;border-collapse:collapse;table-layout:fixed;margin:8pt 0 12pt;font-size:10pt}td,th{border:1px solid #d9d9d9;padding:6pt;text-align:left;vertical-align:middle}th{background:#e8edf0}tr{break-inside:avoid}thead{display:table-header-group}</style></head><body>${body}</body></html>`;
  }
  return { docxBytes, blocks, printHtml,
    downloadDocx:(markdown,title)=>download(docxBytes(markdown,title),filename(title)+".docx","application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    downloadMarkdown:(markdown,title)=>download(markdown,filename(title)+".md","text/markdown;charset=utf-8"),
    print:(markdown,title)=>{const popup=window.open("","_blank");if(!popup)throw new Error("인쇄 창이 차단되었습니다. 이 사이트의 팝업을 허용한 뒤 다시 눌러주세요.");popup.document.write(printHtml(markdown,title));popup.document.close();popup.focus();setTimeout(()=>popup.print(),200);}
  };
});
