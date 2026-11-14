from pathlib import Path
import olefile, struct
p=Path('test-output/weekly.hwp')
assert olefile.isOleFile(str(p))
with olefile.OleFileIO(str(p),raise_defects=olefile.DEFECT_INCORRECT) as ole:
    assert ole.openstream('FileHeader').read().startswith(b'HWP Document File')
    assert ole.exists('\x05HwpSummaryInformation')
    data=ole.openstream('BodyText/Section0').read()
    pos=0;text=[];tables=[]
    while pos<len(data):
        n=struct.unpack_from('<I',data,pos)[0];pos+=4
        tag=n&1023;level=(n>>10)&1023;length=n>>20
        if length==4095:length=struct.unpack_from('<I',data,pos)[0];pos+=4
        payload=data[pos:pos+length];assert len(payload)==length;pos+=length
        if tag==67:text.append(payload.decode('utf-16le'))
        if tag==77:tables.append(struct.unpack_from('<HH',payload,4))
    text='\n'.join(text)
    assert '한글 파일 생성 기능 점검' in text
    assert '소프트웨어(SW) 미래채움사업' in text
    assert '2026. 11. 9.~11. 13.' in text
    assert (2,3) in tables
    for forbidden in ['ICT이노베이션','블록체인','22,444','99백만원','102%']:
        assert forbidden not in text,forbidden
    assert not ole.exists('Scripts')
print('Independent OLE container, HWP records, template isolation and data sanitation checks passed.')
