import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.json':'application/json','.txt':'text/plain; charset=utf-8','.zip':'application/zip'};
const port=Number(process.env.PORT)||4173;
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    const decoded=decodeURIComponent(url.pathname);
    const location=path.resolve(root,`.${decoded.endsWith('/')?`${decoded}index.html`:decoded}`);
    if(!location.startsWith(root)||decoded.includes('\0')){res.writeHead(403);res.end('Forbidden');return;}
    const info=await stat(location);if(!info.isFile())throw new Error('Not a file');
    const data=await readFile(location);res.writeHead(200,{'Content-Type':types[path.extname(location)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Hirebrew website: http://localhost:${port}`));
