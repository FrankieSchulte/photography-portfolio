from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import sys

ROOT = Path(__file__).resolve().parents[1]
errors=[]

class Parser(HTMLParser):
    def __init__(self, file):
        super().__init__(); self.file=file
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        for key in ('href','src'):
            value=d.get(key)
            if not value or value.startswith(('#','mailto:','http://','https://','data:','javascript:')): continue
            clean=urlsplit(value).path
            target=(self.file.parent/clean).resolve()
            if not target.exists(): errors.append(f'{self.file.relative_to(ROOT)}: missing {value}')
        if tag=='source' and d.get('srcset'):
            for item in d['srcset'].split(','):
                value=item.strip().split()[0]
                if value.startswith(('http://','https://','data:')): continue
                target=(self.file.parent/urlsplit(value).path).resolve()
                if not target.exists(): errors.append(f'{self.file.relative_to(ROOT)}: missing {value}')

for file in ROOT.glob('*.html'):
    Parser(file).feed(file.read_text(encoding='utf-8'))

required=['index.html','work.html','graduation.html','events.html','concerts.html','travel.html','about.html','inquire.html','assets/css/styles.css','assets/js/app.js','assets/js/site-config.js']
for rel in required:
    if not (ROOT/rel).exists(): errors.append(f'missing required file: {rel}')

if errors:
    print('\n'.join(errors)); sys.exit(1)
print(f'PASS: {len(list(ROOT.glob("*.html")))} HTML pages and all local references resolved.')
