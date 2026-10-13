const { chromium } = require("playwright");
const http=require("http"),fs=require("fs"),path=require("path");
const ROOT=process.cwd();
const MIME={".html":"text/html",".js":"text/javascript",".json":"application/json",".fbx":"application/octet-stream",".png":"image/png",".jpg":"image/jpeg",".css":"text/css",".ogg":"audio/ogg",".glb":"model/gltf-binary"};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split("?")[0]);if(u==="/")u="/Driving.html";const f=path.join(ROOT,u);fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{"Content-Type":MIME[path.extname(f).toLowerCase()]||"application/octet-stream"});r.end(d)})});
const CAND=[
 "Models And SFX/KayKit_Character_Animations_1.1/Animations/fbx/Rig_Medium/Rig_Medium_MovementBasic.fbx",
 "Models And SFX/KayKit_Character_Animations_1.1/Animations/fbx/Rig_Medium/Rig_Medium_General.fbx",
 "Models And SFX/KayKit_Character_Animations_1.1/Animations/fbx/Rig_Large/Rig_Large_MovementBasic.fbx",
 "Models And SFX/KayKit_Character_Animations_1.1/Mannequin Character/characters/Mannequin_Medium.fbx",
 "Models And SFX/Designersoup Low Poly Car Pack Volume 1 updated/Landyroamer.fbx",
 "Models And SFX/Designersoup Low Poly Car Pack Volume 1 updated/Beatall.fbx",
 "Models And SFX/Truck_collection.fbx",
];
srv.listen(5327,"127.0.0.1",async()=>{
  const b=await chromium.launch(); const p=await b.newPage();
  await p.goto("http://127.0.0.1:5327/Driving.html?level=1",{waitUntil:"load"});
  await p.waitForFunction(()=>window.THREE&&THREE.FBXLoader,null,{timeout:40000});
  for(const c of CAND){
    const r=await p.evaluate(async(url)=>{
      const enc="/"+url.split("/").map(s=>encodeURIComponent(s)).join("/");
      try{
        const buf=await new Promise((res,rej)=>{
          const x=new XMLHttpRequest(); x.open("GET",enc); x.responseType="arraybuffer";
          x.onload=()=>x.status===200?res(x.response):rej(new Error("http "+x.status));
          x.onerror=()=>rej(new Error("net")); x.send();
        });
        const L=new THREE.FBXLoader();
        const o=L.parse(buf,"");
        let meshes=0,tris=0,bones=0,skinned=0;
        o.traverse(c=>{ if(c.isMesh){meshes++;
          const g=c.geometry; if(g&&g.attributes&&g.attributes.position) tris+=g.attributes.position.count/3;
          if(c.isSkinnedMesh) skinned++;}
          if(c.isBone) bones++; });
        return {ok:true,mb:+(buf.byteLength/1e6).toFixed(2),meshes,tris:Math.round(tris),bones,skinned,
          clips:(o.animations||[]).map(a=>a.name)};
      }catch(e){return {ok:false,err:String(e.message||e)}}
    },c);
    const nm=c.split("/").pop();
    if(!r.ok){ console.log(`  FAIL  ${nm.padEnd(34)} ${r.err}`); continue; }
    console.log(`  ok    ${nm.padEnd(34)} ${String(r.mb).padStart(5)}MB meshes=${r.meshes} tris=${String(r.tris).padStart(5)} bones=${r.bones} skinned=${r.skinned}`);
    if(r.clips.length) console.log(`          clips(${r.clips.length}): ${r.clips.join(", ")}`);
  }
  await b.close(); srv.close();
});
