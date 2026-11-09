/** Tests local HTTP bytes/headers separately from the in-memory browser fixture. */
import {spawn} from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const child=spawn(process.execPath,['tools/serve.mjs'],{env:{...process.env,HOST:'127.0.0.1',PORT:String(port)},stdio:['ignore','pipe','pipe']});
let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
const results=[];const check=(name,ok,detail)=>results.push({test:name,passed:!!ok,detail});
try {
 await new Promise((resolve,reject)=>{let t=0;const timer=setInterval(()=>{if(output.includes('LOCAL PREVIEW')){clearInterval(timer);resolve();}else if(t++>70){clearInterval(timer);reject(new Error(output||'Server did not start'));}},50);});
 for(const [url,mime] of [['/','text/html'],['/assets/v6/mobile-r4.css','text/css'],['/assets/v6/mobile-layout.js','text/javascript'],['/assets/brand/zahlfix-ribbon-96.webp','image/webp'],['/assets/brand/zahlfix-ribbon-384.webp','image/webp'],['/assets/brand/zahlfix-ribbon-silhouette.svg','image/svg+xml'],['/impressum.html','text/html'],['/datenschutz.html','text/html']]){
  const response=await fetch(`http://127.0.0.1:${port}${url}`);const bytes=new Uint8Array(await response.arrayBuffer());
  check(url+' served with expected MIME',response.ok&&response.headers.get('content-type').startsWith(mime)&&bytes.length>50);
  check(url+' uncached local response',response.headers.get('cache-control')==='no-store');
 }
 const missing=await fetch(`http://127.0.0.1:${port}/does-not-exist`);check('unknown resources return 404',missing.status===404);
 check('local preview explicitly identifies unauthenticated mode',output.includes('no authentication'));
} finally {child.kill();}
const report={scope:'Actual Node HTTP server on loopback; no browser CSP or Netlify authentication certification',passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,results};fs.writeFileSync('qa/r4/local-http.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=report.failed?1:0;
