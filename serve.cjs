/* خادمٌ محلّيٌّ للتجربة — عاملُ الخدمة والتثبيتُ لا يعملان على file://
     node serve.cjs            ثمّ افتح http://localhost:8787/ */
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, 'docs');
const T = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json; charset=utf-8',
  '.png':'image/png', '.svg':'image/svg+xml' };

http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  /* لا يُقرأ خارج docs */
  if (!f.startsWith(ROOT)) { s.writeHead(403).end('403'); return; }
  fs.readFile(f, (e, b) => {
    if (e) { s.writeHead(404, T['.html']).end('<h1 dir=rtl>لا شيء هنا</h1>'); return; }
    s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream',
      'Cache-Control': 'no-store' });
    s.end(b);
  });
}).listen(8787, () => {
  console.log('يعمل على:');
  console.log('  http://localhost:8787/');
});
