#!/usr/bin/env python3
"""Deterministically recommend fonts; actual installation and glyph support are checked separately on macOS."""
import argparse
import json
import sys

PROFILES = {
 'announcement': {'name':'社區正式公告','title':['Noto Sans TC','GenSenRounded TC'],'body':['Noto Sans TC']},
 'meeting': {'name':'會議紀錄','title':['Noto Sans TC'],'body':['Noto Sans TC','Noto Serif TC']},
 'rules': {'name':'選舉辦法／規約','title':['Noto Serif TC','Noto Sans TC'],'body':['Noto Serif TC','Noto Sans TC']},
 'report': {'name':'年度工作報告','title':['Noto Serif TC','Noto Sans TC'],'body':['Noto Sans TC','Noto Serif TC']},
 'poster': {'name':'海報／社區活動','title':['GenSenRounded TC','Huninn','Noto Sans TC'],'body':['Noto Sans TC']},
 'handwriting': {'name':'手寫風格','title':['LXGW WenKai TC','Iansui','Noto Sans TC'],'body':['Noto Sans TC']},
 'slides': {'name':'簡報','title':['Noto Sans TC','GenSenRounded TC'],'body':['Noto Sans TC']},
}
CRITICAL = '天玥社區管理委員會選舉辦法會議紀錄規約設備修繕'

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--type',choices=list(PROFILES),default='announcement')
 parser.add_argument('--text',default='')
 parser.add_argument('--json',action='store_true')
 args=parser.parse_args()
 result={'profile':args.type,**PROFILES[args.type],
         'critical_characters':''.join(dict.fromkeys(CRITICAL+args.text)),
         'font_available':'NOT_VERIFIED_ON_THIS_MACHINE',
         'glyph_coverage':'MUST_VALIDATE_BEFORE_EXPORT',
         'pdf_requirement':'Check actual embedded fonts and visually inspect final output'}
 if args.json:
  print(json.dumps(result,ensure_ascii=False,indent=2))
 else:
  print('類型：',result['name'])
  print('標題候選：',' → '.join(result['title']))
  print('內文候選：',' → '.join(result['body']))
  print('重要字形：',result['critical_characters'])
  print('選字偏好不代表字體已安裝或涵蓋全文。')
 return 0

if __name__=='__main__':
 sys.exit(main())
