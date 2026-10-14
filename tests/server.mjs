import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
const root=resolve(".");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css",".json":"application/json"};
createServer(async(req,res)=>{
 try{const path=resolve(root,"."+new URL(req.url,"http://localhost").pathname.replace(/\/$/,"/index.html"));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 const data=await readFile(path);res.writeHead(200,{"content-type":types[extname(path)]||"application/octet-stream"}).end(data);
 }catch{res.writeHead(404).end();}
}).listen(4302,"127.0.0.1");