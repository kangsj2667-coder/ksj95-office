"""Parse generated HWP with pyhwp, including standard OLE application metadata.
pyhwp's HWP property label list omits PIDSI_APPNAME and otherwise tries to read
an absent optional dictionary. Register the standard property label; do not skip
metadata, record parsing, document sections, tables or text validation.
"""
from pathlib import Path
from hwp5 import summaryinfo
from hwp5.msoleprops import PIDSI_APPNAME
from hwp5.xmlmodel import Hwp5File
from lxml import etree

if PIDSI_APPNAME not in summaryinfo.HWP_PROPERTIES:
    summaryinfo.HWP_PROPERTIES = tuple(summaryinfo.HWP_PROPERTIES) + (PIDSI_APPNAME,)
file = Hwp5File('test-output/weekly.hwp')
assert file.summaryinfo.getPropertySetStream().propertysets
with open('test-output/weekly.xml', 'wb') as output:
    file.xmlevents().dump(output)
root = etree.parse('test-output/weekly.xml')
text = ''.join(root.getroot().itertext())
assert '한글 파일 생성 기능 점검' in text
assert '소프트웨어(SW) 미래채움사업' in text
print('Independent HWP metadata and full document XML parsing passed.')
