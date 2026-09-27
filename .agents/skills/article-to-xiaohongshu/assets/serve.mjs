// 常驻静态服务器，服务本 job 目录（含 inner.html / cover.html / data/）。
// 用法： node serve.mjs   （默认端口 8788；后台运行，渲染和读分页数都靠它）
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] || 8788);
const MIME = { '.html':'text/html', '.json':'application/json', '.png':'image/png',
               '.mjs':'text/javascript', '.js':'text/javascript', '.css':'text/css' };

createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = join(__dirname, p === '/' ? 'inner.html' : p);
  if (existsSync(f) && !f.includes('..')) {
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
  } else { res.writeHead(404); res.end('404'); }
}).listen(PORT, () => console.log(`serving ${__dirname} at http://localhost:${PORT}`));
