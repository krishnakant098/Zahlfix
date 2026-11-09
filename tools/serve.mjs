/** Development preview only. No auth bypass is deployed; Netlify supplies the gate. */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json'};
const port=Number(process.env.PORT||4173);
const host=process.env.HOST||'127.0.0.1';
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be between 1 and 65535');
const server=http.createServer(async(req,res)=>{
  try {
    const u=new URL(req.url,'http://localhost');
    const route=decodeURIComponent(u.pathname);
    const target=path.resolve(root,'.'+(route==='/'?'/index.html':(/\/$/.test(route)?route+'index.html':route)));
    if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    const body=await fs.readFile(target);
    res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https://images.pexels.com; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' mailto:");
    res.end(body);
  } catch {res.writeHead(404).end('Not found');}
});
server.listen(port,host,()=>{console.log(`LOCAL PREVIEW (no authentication): http://${host}:${port}`);if(host==='0.0.0.0')console.warn('LAN preview is unauthenticated. Use only a trusted private network; do not expose this port to the internet.');});
server.on('error',error=>{console.error('Preview server:',error.message);process.exitCode=1;});
