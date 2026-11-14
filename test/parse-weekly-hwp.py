"""Validate the entire generated file with an independent, unmodified HWP reader."""
from hwp5.xmlmodel import Hwp5File
from lxml import etree

file = Hwp5File('test-output/weekly.hwp')
assert file.summaryinfo.getPropertySetStream().propertysets
with open('test-output/weekly.xml', 'wb') as output:
    file.xmlevents().dump(output)
root = etree.parse('test-output/weekly.xml')
text = ''.join(root.getroot().itertext())
assert '한글 파일 생성 기능 점검' in text
assert '소프트웨어(SW) 미래채움사업' in text
print('Independent HWP metadata and full document XML parsing passed.')
