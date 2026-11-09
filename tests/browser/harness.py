"""Restricted-environment DOM harness, NOT a deployed-network/authentication test.

Styles, local images and ES modules are embedded without changing application logic.
Only module specifiers become data URLs. Remote media remains external/unverified.
"""
from pathlib import Path
import re, base64, mimetypes
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2]
PUBLIC=ROOT/'public'
def data_url(path):
    mime=mimetypes.guess_type(str(path))[0] or 'application/octet-stream'
    if path.suffix=='.js':mime='text/javascript'
    return 'data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()
def module_url(path, fail_main=False):
    source=('throw new Error("Intentional test: main module failed");' if fail_main and path.name=='main.js' else path.read_text())
    def sub(match):
        quote,spec=match.group(1),match.group(2)
        return quote+module_url((path.parent/spec).resolve(),fail_main=fail_main)+quote
    source=re.sub(r'''(["'])(\./[^"']+\.js)\1''',sub,source)
    return 'data:text/javascript;base64,'+base64.b64encode(source.encode()).decode()
def markup(*,script=True,fail_main=False):
    h=BeautifulSoup((PUBLIC/'index.html').read_text(),'html.parser')
    for link in h.select('link[rel="stylesheet"]'):
        tag=h.new_tag('style');tag.string=(PUBLIC/link['href'].lstrip('/')).read_text();link.replace_with(tag)
    for img in h.select('img[src^="/"]'):
        img['src']=data_url(PUBLIC/img['src'].lstrip('/'));img.attrs.pop('srcset',None)
    for image in h.select('image[href^="/"]'):
        image['href']=data_url(PUBLIC/image['href'].lstrip('/'))
    # Inline blocking local classic scripts (notably R6.1 entry-boot) so the data-URL
    # harness preserves first-paint class ownership without network access.
    for local in list(h.select('script[src^="/"]')):
        if local.get('src') == '/assets/v6/boot.js':
            continue
        src=PUBLIC/local['src'].lstrip('/')
        if src.exists():
            local.attrs.pop('src',None)
            local.string=src.read_text()
    tag=h.find('script',src='/assets/v6/boot.js')
    if script:tag['src']=module_url(PUBLIC/'assets/v6/boot.js',fail_main=fail_main)
    else:tag.decompose()
    return str(h)
