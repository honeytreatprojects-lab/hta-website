#!/usr/bin/env python3
"""
HTA website speed patch — run it from the folder that holds index.html.

What it changes (and nothing else):
  1. Images   : converts large JPG/PNG files to WebP (resized to a sensible maximum),
                and points <img src> / CSS url() at the .webp. Originals are kept.
                Adds width/height to <img> tags (fixes layout shift) and
                loading="lazy" + decoding="async" to images below the fold.
  2. Fonts    : loads the Google Fonts stylesheet without blocking rendering,
                and drops the DM Sans 300 weight if nothing uses it.
  3. CSS      : writes styles.min.css (minified copy of styles.css) and links pages to it.
                styles.css stays your editable source — rerun with --css after editing it.
  4. Chat     : removes the Tawk.to script (and the stray "Copy this code..." text)
                and adds hta-bot.js to every page.
  5. Brevo    : adds brevo-enroll.js to the page that has the enrolment form (courses.html).

Every file it touches is first copied to _hta_backup_<date-time>/.
    python hta_speed_patch.py --dry-run    # show what would change, write nothing
    python hta_speed_patch.py              # apply
    python hta_speed_patch.py --css        # only rebuild styles.min.css after editing styles.css
    python hta_speed_patch.py --restore    # put back the files from the latest backup

Needs Python 3.8+ and Pillow:  pip install pillow
"""
import argparse
import datetime
import io
import os
import re
import shutil
import sys
from urllib.parse import unquote

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover
    sys.exit("Pillow is missing. Install it with:  pip install pillow")

RASTER = ('.jpg', '.jpeg', '.png')
SKIP_DIRS = {'node_modules', '.git', 'cgi-bin', '.well-known'}
BOT_TAG = '<script src="hta-bot.js" defer></script>'
BREVO_TAG = '<script src="brevo-enroll.js" defer></script>'
IMG_CSS_MARK = '/* hta-speed: keep aspect ratio when <img> has width/height */'
IMG_CSS_RULE = IMG_CSS_MARK + '\n:where(img[width][height]) { height: auto; }\n'

# Longest-side limits (px). Chosen from how big each kind of image is shown on the site, x2-3 for sharp phones.
CAP_DEFAULT = 1600
CAP_HERO = 1920
CAP_TEAM = 800
CAP_LOGO = 480
CAP_AVATAR = 320


# --------------------------------------------------------------------------- helpers
def read(p):
    with open(p, encoding='utf-8', newline='') as f:   # keep the file's own line endings
        return f.read()


def write(p, s):
    crlf = False
    if os.path.isfile(p):
        with open(p, 'rb') as f:
            crlf = b'\r\n' in f.read(65536)
    s = s.replace('\r\n', '\n')
    if crlf:
        s = s.replace('\n', '\r\n')
    with open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)


def human(n):
    return f"{n / 1024:,.0f} KB" if n < 1024 * 1024 else f"{n / 1048576:,.2f} MB"


def site_files(root):
    html, css = [], []
    for d, dirs, files in os.walk(root):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS and not x.startswith('_hta_backup_')]
        for f in files:
            p = os.path.join(d, f)
            if f.lower().endswith(('.html', '.htm')):
                html.append(p)
            elif f.lower().endswith('.css') and not f.lower().endswith('.min.css'):
                css.append(p)
    return sorted(html), sorted(css)


def css_unescape(s):
    return re.sub(r'\\(.)', r'\1', s)


def resolve(ref, base_dir):
    """Return (abs_path or None, note). ref is the raw text inside src="" or url()."""
    r = ref.strip().strip('"\'')
    if not r or re.match(r'^(https?:|data:|//|#|mailto:|tel:)', r, re.I):
        return None, 'external'
    r = css_unescape(unquote(r.split('#')[0].split('?')[0]))
    p = os.path.normpath(os.path.join(base_dir, r))
    if os.path.isfile(p):
        return p, ''
    # case mismatch check (Linux servers are case-sensitive)
    d, name = os.path.split(p)
    if os.path.isdir(d):
        for f in os.listdir(d):
            if f.lower() == name.lower():
                return None, f'case mismatch: file is "{os.path.relpath(os.path.join(d, f))}"'
    parent = os.path.dirname(d)
    if not os.path.isdir(d) and os.path.isdir(parent):
        for f in os.listdir(parent):
            if f.lower() == os.path.basename(d).lower():
                return None, f'case mismatch in folder name: "{f}"'
    return None, 'missing (404)'


def webp_ref(ref):
    """Swap the extension inside the original reference text, keeping quotes/escapes/folders."""
    return re.sub(r'\.(jpe?g|png)(?=(["\')\s?#]|$))', '.webp', ref, count=1, flags=re.I)


# --------------------------------------------------------------------------- CSS minifier
def minify_css(src):
    out, i, n = [], 0, len(src)
    buf = []

    def flush():
        chunk = ''.join(buf)
        buf.clear()
        chunk = re.sub(r'\s+', ' ', chunk)
        chunk = re.sub(r'\s*([{};,>])\s*', r'\1', chunk)
        chunk = re.sub(r':\s+', ':', chunk)          # 'color: red' -> 'color:red'
        chunk = re.sub(r'\s+!important', '!important', chunk)
        out.append(chunk)

    while i < n:
        c = src[i]
        if c == '/' and i + 1 < n and src[i + 1] == '*':
            j = src.find('*/', i + 2)
            i = n if j < 0 else j + 2
            buf.append(' ')
            continue
        if c in '"\'':
            flush()
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == '\\' else 1
            out.append(src[i:j + 1])
            i = j + 1
            continue
        if c == '(' and src[max(0, i - 3):i].lower() == 'url':
            flush()
            j = src.find(')', i)
            j = n - 1 if j < 0 else j
            out.append(src[i:j + 1])
            i = j + 1
            continue
        buf.append(c)
        i += 1
    flush()
    css = ''.join(out)
    css = css.replace(';}', '}')
    return css.strip() + '\n'


# --------------------------------------------------------------------------- main work
class Patcher:
    def __init__(self, root, dry, quality, min_kb):
        self.root = root
        self.dry = dry
        self.quality = quality
        self.min_bytes = min_kb * 1024
        self.report = []
        self.missing = {}
        self.images = {}      # abs path -> dict(cap, refs, webp, w, h)
        self.changed = {}     # path -> new text
        self.backup_dir = None

    def log(self, s=''):
        print(s)
        self.report.append(s)

    # ---------- backup
    def backup(self, path):
        if self.dry:
            return
        if not self.backup_dir:
            stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
            self.backup_dir = os.path.join(self.root, '_hta_backup_' + stamp)
        dst = os.path.join(self.backup_dir, os.path.relpath(path, self.root))
        if not os.path.exists(dst):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if os.path.exists(path):
                shutil.copy2(path, dst)

    def save(self, path, text):
        if self.dry:
            return
        self.backup(path)
        write(path, text)

    # ---------- 1. collect image usages
    def note_image(self, ref, base_dir, cap, where):
        p, why = resolve(ref, base_dir)
        if p is None:
            if why != 'external':
                self.missing.setdefault((ref.strip('"\' '), why), set()).add(where)
            return
        if not p.lower().endswith(RASTER):
            return
        info = self.images.setdefault(p, {'cap': 0, 'where': set()})
        info['cap'] = max(info['cap'], cap)
        info['where'].add(where)

    def scan(self, html_files, css_files):
        for css in css_files:
            text = read(css)
            base = os.path.dirname(css)
            for rule in re.finditer(r'([^{}]+)\{([^{}]*)\}', re.sub(r'/\*.*?\*/', '', text, flags=re.S)):
                sel, body = rule.group(1), rule.group(2)
                for m in re.finditer(r'url\(\s*([^)]+?)\s*\)', body):
                    cap = CAP_HERO if 'hero' in sel else CAP_AVATAR if re.search(r'\.(av\d|ta\d|testi-avatar)', sel) else CAP_DEFAULT
                    self.note_image(m.group(1), base, cap, os.path.basename(css))
        for page in html_files:
            text = read(page)
            base = os.path.dirname(page)
            name = os.path.basename(page)
            for m in re.finditer(r'<img\b[^>]*>', text, re.I):
                tag = m.group(0)
                src = re.search(r'\ssrc\s*=\s*(["\'])(.*?)\1', tag, re.I | re.S)
                if not src:
                    continue
                before = text[max(0, m.start() - 400):m.start()]
                cls = (re.search(r'class\s*=\s*["\']([^"\']*)', tag) or [None, ''])[1]
                ctx = before[before.rfind('<div'):] if '<div' in before else ''
                if re.search(r'avatar|ccc-av', cls):
                    cap = CAP_AVATAR
                elif re.search(r'logo', cls) or 'partner-logo' in ctx:
                    cap = CAP_LOGO
                elif 'team-photo' in ctx:
                    cap = CAP_TEAM
                else:
                    cap = CAP_DEFAULT
                self.note_image(src.group(2), base, cap, name)
            for m in re.finditer(r'url\(\s*([^)]+?)\s*\)', ''.join(re.findall(r'<style[^>]*>(.*?)</style>', text, re.S | re.I)) +
                                 ' '.join(re.findall(r'style\s*=\s*"([^"]*)"', text))):
                self.note_image(m.group(1), base, CAP_DEFAULT, name)

    # ---------- 2. convert
    def convert(self):
        self.log('\n== Images ==')
        saved_total = 0
        for p in sorted(self.images):
            info = self.images[p]
            size = os.path.getsize(p)
            out = os.path.splitext(p)[0] + '.webp'
            rel = os.path.relpath(p, self.root)
            try:
                im = Image.open(p)
                im = ImageOps.exif_transpose(im)
            except Exception as e:  # corrupt / unsupported
                self.log(f'  ! {rel}: cannot open ({e})')
                continue
            w0, h0 = im.size
            info['w'], info['h'] = w0, h0
            cap = info['cap'] or CAP_DEFAULT
            needs = size >= self.min_bytes or max(w0, h0) > cap
            if not needs:
                continue
            if os.path.isfile(out) and os.path.getmtime(out) >= os.path.getmtime(p):
                with Image.open(out) as wim:
                    info['w'], info['h'] = wim.size
                info['webp'] = out
                self.log(f'  = {rel}: WebP already up to date ({human(os.path.getsize(out))})')
                continue
            has_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
            im = im.convert('RGBA' if has_alpha else 'RGB')
            if max(w0, h0) > cap:
                im.thumbnail((cap, cap), Image.LANCZOS)
            if self.dry:
                est = '(dry run)'
                self.log(f'  → {rel}  {w0}x{h0} {human(size)}  → .webp {im.size[0]}x{im.size[1]} {est}')
                info['webp'] = out
                info['w'], info['h'] = im.size
                continue
            best = io.BytesIO()
            im.save(best, 'WEBP', quality=self.quality, method=6, alpha_quality=90)
            if p.lower().endswith('.png') and max(im.size) <= 1000:
                lossless = io.BytesIO()
                im.save(lossless, 'WEBP', lossless=True, method=6)
                if lossless.tell() <= best.tell() * 1.3:
                    best = lossless
            new = best.tell()
            if new >= size * 0.9 and max(w0, h0) <= cap:
                self.log(f'  · {rel}: skipped (WebP not smaller)')
                continue
            with open(out, 'wb') as f:
                f.write(best.getvalue())
            info['webp'] = out
            info['w'], info['h'] = im.size
            saved_total += size - new
            self.log(f'  ✓ {rel}  {w0}x{h0} {human(size)}  →  {os.path.basename(out)} {im.size[0]}x{im.size[1]} {human(new)}')
        if not self.dry:
            self.log(f'  Total saved on converted images: {human(max(saved_total, 0))}')

    def webp_for(self, ref, base_dir):
        p, _ = resolve(ref, base_dir)
        return p and self.images.get(p, {}).get('webp') and webp_ref(ref)

    def dims_for(self, ref, base_dir):
        p, _ = resolve(ref, base_dir)
        if not p:
            return None
        info = self.images.get(p)
        if info and 'w' in info:
            return info['w'], info['h']
        try:
            with Image.open(p) as im:
                return im.size
        except Exception:
            return None

    # ---------- 3. rewrite CSS
    def patch_css(self, css_files):
        for css in css_files:
            text = orig = read(css)
            base = os.path.dirname(css)

            def rep(m):
                new = self.webp_for(m.group(1), base)
                return m.group(0).replace(m.group(1), new) if new else m.group(0)

            text = re.sub(r'url\(\s*([^)]+?)\s*\)', rep, text)
            if os.path.basename(css).lower() == 'styles.css' and IMG_CSS_MARK not in text:
                text = text.rstrip('\n') + '\n\n' + IMG_CSS_RULE
            if text != orig:
                self.log(f'  ~ {os.path.relpath(css, self.root)}: image URLs → .webp' +
                         (', added img aspect-ratio rule' if IMG_CSS_MARK not in orig and IMG_CSS_MARK in text else ''))
                self.save(css, text)
            self.changed[css] = text

    def build_min(self):
        src = os.path.join(self.root, 'styles.css')
        if not os.path.isfile(src):
            self.log('  ! styles.css not found — skipped styles.min.css')
            return False
        text = self.changed.get(src) or read(src)
        mini = minify_css(text)
        dst = os.path.join(self.root, 'styles.min.css')
        self.log(f'  ✓ styles.min.css  {human(len(text.encode()))} → {human(len(mini.encode()))}')
        self.save(dst, mini)
        return True

    # ---------- 4. rewrite HTML
    def font_weights_used(self, html_files, css_files):
        blob = ''.join(read(f) for f in html_files + css_files)
        return re.search(r'font-weight\s*:\s*(300|lighter)\b', blob) is not None

    def patch_html(self, html_files, keep_300):
        self.log('\n== Pages ==')
        for page in html_files:
            text = orig = read(page)
            base = os.path.dirname(page)
            notes = []

            # a) Tawk.to
            before = text
            text = re.sub(r'(?:[ \t]*Copy this code and place it before the </body> tag on every page of your website:\s*)?'
                          r'<!--\s*Start of Tawk\.to Script\s*-->.*?<!--\s*End of Tawk\.to Script\s*-->[ \t]*\n?',
                          '', text, flags=re.S | re.I)
            text = re.sub(r'[ \t]*Copy this code and place it before the </body> tag on every page of your website:[ \t]*\n?', '', text)
            if text != before:
                notes.append('removed Tawk.to')
            if 'embed.tawk.to' in text:
                notes.append('WARNING: another Tawk.to snippet is still on this page — remove it by hand')

            # b) Google Fonts: non-blocking
            def font_rep(href):
                if not keep_300:
                    href = href.replace('DM+Sans:wght@300;400', 'DM+Sans:wght@400')
                return ('<link rel="preload" as="style" href="' + href + '" onload="this.onload=null;this.rel=\'stylesheet\'">\n'
                        '  <noscript><link rel="stylesheet" href="' + href + '"></noscript>')
            before = text
            if 'rel="preload" as="style" href="https://fonts.googleapis' not in text:
                text = re.sub(r'<link\s+(?:href="(https://fonts\.googleapis\.com/css2\?[^"]+)"\s+rel="stylesheet"'
                              r'|rel="stylesheet"\s+href="(https://fonts\.googleapis\.com/css2\?[^"]+)")\s*/?>',
                              lambda m: font_rep(m.group(1) or m.group(2)), text)
            if text != before:
                notes.append('fonts non-blocking')

            # c) styles.min.css
            before = text
            text = re.sub(r'(<link\b[^>]*href=")styles\.css(")', r'\1styles.min.css\2', text)
            if text != before:
                notes.append('→ styles.min.css')

            # d) <img>: webp, width/height, lazy
            no_lazy = []
            for mm in re.finditer(r'<nav\b.*?</nav>|<section\s+class="hero"[^>]*>.*?</section>', text, re.S | re.I):
                no_lazy.append((mm.start(), mm.end()))

            counts = {'webp': 0, 'dims': 0, 'lazy': 0}

            def img_rep(m):
                tag = m.group(0)
                src = re.search(r'(\ssrc\s*=\s*)(["\'])(.*?)\2', tag, re.I | re.S)
                if not src:
                    return tag
                ref = src.group(3)
                new = self.webp_for(ref, base)
                if new:
                    tag = tag[:src.start(3)] + new + tag[src.end(3):]
                    counts['webp'] += 1
                has_w = re.search(r'\swidth\s*=\s*["\']?(\d+)', tag, re.I)
                has_h = re.search(r'\sheight\s*=', tag, re.I)
                dims = self.dims_for(ref, base)
                if dims and not has_h:
                    w, h = dims
                    if has_w:
                        tag = re.sub(r'(\swidth\s*=\s*["\']?\d+(?:px)?["\']?)', r'\1 height="%d"' % round(int(has_w.group(1)) * h / w), tag, count=1)
                    else:
                        tag = re.sub(r'^<img\b', '<img width="%d" height="%d"' % (w, h), tag, count=1, flags=re.I)
                    counts['dims'] += 1
                inside = any(a <= m.start() < b for a, b in no_lazy)
                if not inside and not re.search(r'\sloading\s*=', tag, re.I):
                    tag = re.sub(r'\s*/?>$', lambda e: ' loading="lazy" decoding="async"' + e.group(0), tag, count=1)
                    counts['lazy'] += 1
                elif not re.search(r'\sdecoding\s*=', tag, re.I):
                    tag = re.sub(r'\s*/?>$', lambda e: ' decoding="async"' + e.group(0), tag, count=1)
                return tag

            text = re.sub(r'<img\b[^>]*>', img_rep, text, flags=re.I)
            if any(counts.values()):
                notes.append(f"img: {counts['webp']} → webp, {counts['dims']} sized, {counts['lazy']} lazy")

            # e) url() inside <style> blocks and style="" attributes
            def url_rep(m):
                new = self.webp_for(m.group(1), base)
                return m.group(0).replace(m.group(1), new) if new else m.group(0)

            def style_block(m):
                return re.sub(r'url\(\s*([^)]+?)\s*\)', url_rep, m.group(0))
            before = text
            text = re.sub(r'<style[^>]*>.*?</style>', style_block, text, flags=re.S | re.I)
            text = re.sub(r'style\s*=\s*"[^"]*url\([^"]*"', style_block, text)
            if text != before:
                notes.append('inline CSS images → webp')

            # f) preload first hero background on pages with the hero slider
            if 'class="hero-bg"' in text and 'rel="preload" as="image"' not in text:
                hero = self.first_hero_image()
                if hero:
                    text = re.sub(r'(\n[ \t]*)(<link\b[^>]*href="styles(?:\.min)?\.css"[^>]*>)',
                                  lambda e: e.group(1) + '<link rel="preload" as="image" href="' + hero + '" fetchpriority="high">' + e.group(1) + e.group(2),
                                  text, count=1)
                    notes.append('preload hero image')

            # g) chatbot + brevo
            if BOT_TAG not in text and re.search(r'</body>', text, re.I):
                text = re.sub(r'(\s*)</body>', lambda e: '\n' + BOT_TAG + e.group(1) + '</body>', text, count=1, flags=re.I)
                notes.append('added hta-bot.js')
            if 'id="enrollForm"' in text and BREVO_TAG not in text:
                text = text.replace(BOT_TAG, BREVO_TAG + '\n' + BOT_TAG, 1)
                notes.append('added brevo-enroll.js')

            if text != orig:
                self.save(page, text)
                self.log(f'  ~ {os.path.relpath(page, self.root)}: ' + '; '.join(notes))
            else:
                self.log(f'  = {os.path.relpath(page, self.root)}: already patched')

    def first_hero_image(self):
        css = self.changed.get(os.path.join(self.root, 'styles.css'))
        if not css:
            return None
        m = re.search(r'\.hero-bg span:nth-child\(1\)\s*\{[^}]*url\(\s*["\']?([^"\')]+)', css)
        if not m:
            return None
        p, _ = resolve(m.group(1), self.root)
        return m.group(1) if p else None

    def run(self, css_only=False):
        html_files, css_files = site_files(self.root)
        if not os.path.isfile(os.path.join(self.root, 'index.html')):
            sys.exit('Run this from your website folder (the one with index.html).')
        self.log(f'HTA speed patch — {self.root}' + ('  [DRY RUN — nothing is written]' if self.dry else ''))
        if css_only:
            self.build_min()
            return
        self.scan(html_files, css_files)
        self.convert()
        self.log('\n== CSS ==')
        self.patch_css(css_files)
        self.build_min()
        keep_300 = self.font_weights_used(html_files, css_files)
        self.patch_html(html_files, keep_300)
        if self.missing:
            self.log('\n== Broken image references (these cause 404 errors in the browser console) ==')
            for (ref, why), where in sorted(self.missing.items()):
                self.log(f'  ✗ {ref}  —  {why}  (used in {", ".join(sorted(where))})')
        for f in ('hta-bot.js', 'brevo-enroll.js', 'enroll-brevo.php', 'brevo-config.php'):
            if not os.path.isfile(os.path.join(self.root, f)):
                self.log(f'\n  NOTE: {f} is not in this folder yet — upload it next to index.html.')
        if not self.dry:
            if self.backup_dir:
                self.log(f'\nBackup of the original files: {os.path.relpath(self.backup_dir, self.root)}/')
            write(os.path.join(self.root, 'hta_speed_report.txt'), '\n'.join(self.report) + '\n')
            print('Report saved to hta_speed_report.txt')


def restore(root):
    backs = sorted(d for d in os.listdir(root) if d.startswith('_hta_backup_'))
    if not backs:
        sys.exit('No backup found.')
    b = os.path.join(root, backs[-1])
    for d, _, files in os.walk(b):
        for f in files:
            src = os.path.join(d, f)
            dst = os.path.join(root, os.path.relpath(src, b))
            shutil.copy2(src, dst)
            print('restored', os.path.relpath(dst, root))
    mini = os.path.join(root, 'styles.min.css')
    if os.path.exists(mini) and not os.path.exists(os.path.join(b, 'styles.min.css')):
        print('(styles.min.css left in place; pages now point back to styles.css)')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='HTA website speed patch')
    ap.add_argument('--dry-run', action='store_true', help='show changes without writing')
    ap.add_argument('--css', action='store_true', help='only rebuild styles.min.css from styles.css')
    ap.add_argument('--restore', action='store_true', help='restore files from the latest backup')
    ap.add_argument('--quality', type=int, default=80, help='WebP quality for photos (default 80)')
    ap.add_argument('--min-kb', type=int, default=60, help='convert images at least this big (default 60 KB)')
    ap.add_argument('--site', default='.', help='website folder (default: current folder)')
    a = ap.parse_args()
    root = os.path.abspath(a.site)
    if a.restore:
        restore(root)
    else:
        Patcher(root, a.dry_run, a.quality, a.min_kb).run(css_only=a.css)
