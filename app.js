(()=>{"use strict";
const $=id=>document.getElementById(id), colors=["#f5c542","#ff8a65","#ef5350","#66bb6a","#29b6f6","#7157e8","#ec4899","#111827","#fff"];
const defs={text:["Text",300,180,"#7157e8"],image:["Image",380,280,"#29b6f6"],video:["Video",420,280,"#ef5350"],shot:["Shot",360,380,"#7157e8"],note:["Note",270,220,"#f5c542"],link:["Link",320,170,"#29b6f6"],tasks:["Tasks",300,220,"#66bb6a"],color:["Color",190,190,"#7157e8"],section:["Section",520,110,"#111827"]};
let S={name:"Untitled Creative Project",items:[],connections:[],selected:null,z:1,px:0,py:0,h:[],f:[],approved:false,approval:null,quote:[]}, space=false, connectMode=false, connectSource=null;
function toast(x){$("toast").textContent=x;$("toast").classList.add("show");clearTimeout(window._t);window._t=setTimeout(()=>$("toast").classList.remove("show"),1300)}
function snap(){return JSON.stringify({name:S.name,items:S.items,connections:S.connections||[]})}
function hist(){S.h.push(snap());S.f=[]}
function persist(){S.name=$("projectName").value;localStorage.setItem("framedeck-clean",JSON.stringify(S))}
function load(){try{let x=JSON.parse(localStorage.getItem("framedeck-clean"));if(x)Object.assign(S,x)}catch(e){}if(!Array.isArray(S.connections))S.connections=[];$("projectName").value=S.name}
function transform(){$("board").style.transform=`translate(${S.px}px,${S.py}px) scale(${S.z})`;$("zoom").textContent=Math.round(S.z*100)+"%"}
function centre(){S.px=$("viewport").clientWidth/2;S.py=$("viewport").clientHeight/2;transform()}
function zoomAt(z,cx,cy){z=Math.max(.25,Math.min(4,z));let r=$("viewport").getBoundingClientRect(),x=cx??r.width/2,y=cy??r.height/2,wx=(x-S.px)/S.z,wy=(y-S.py)/S.z;S.z=z;S.px=x-wx*z;S.py=y-wy*z;transform()}
function make(type){let d=defs[type],i={id:crypto.randomUUID?crypto.randomUUID():Date.now()+Math.random(),type,x:5000-S.px/S.z+30,y:3500-S.py/S.z+30,w:d[1],h:d[2],title:d[0],color:d[3],content:""};if(type==="text")i.content="Your creative idea goes here.";if(type==="note")i.content="Add a note...";if(type==="tasks")i.content="Confirm concept\nPrepare shoot\nEdit first cut\nFinal delivery";if(type==="section")i.content="CREATIVE DIRECTION";if(type==="link")i.content="Reference";if(type==="color")i.content="#7157e8";if(type==="shot")Object.assign(i,{content:"Describe the shot",shotSize:"Wide",move:"Slow push-in",lens:"24mm",audio:"Natural ambience",notes:"Director notes"});return i}
function add(type){hist();let i=make(type);S.items.push(i);S.selected=i.id;render();inspect();persist();if(type==="image"||type==="video")setTimeout(()=>$("files").click(),0)}
function select(id){S.selected=id;render();inspect()}
function card(i){
let c=document.createElement("div");c.className="card"+(S.selected===i.id?" sel":"");
c.style.cssText=`left:${i.x}px;top:${i.y}px;width:${i.w}px;height:${i.h}px`;
c.innerHTML=`<div class="head"><span>⠿</span><span class="dot" style="background:${i.color}"></span><span>${escape(i.title)}</span><button class="cardClose" title="Remove card" aria-label="Remove card">×</button></div>`;
let b=document.createElement("div");b.className="body";
if(i.type==="text"||i.type==="note"){b.classList.add(i.type==="note"?"noteBody":"textBody");b.textContent=i.content}
if(i.type==="image"||i.type==="video"){b.classList.add("mediaBody");b.innerHTML=i.src?(i.type==="image"?`<img src="${i.src}">`:`<video src="${i.src}" controls muted playsinline></video>`):"Upload a file"}
if(i.type==="color"){b.classList.add("colorBody");b.innerHTML=`<div class="swatch" style="background:${i.content}">${escape(i.content)}</div>`}
if(i.type==="section"){b.classList.add("sectionBody");b.textContent=i.content}
if(i.type==="tasks"){String(i.content).split("\n").filter(Boolean).forEach(t=>b.innerHTML+=`<label class="check"><input type="checkbox">${escape(t)}</label>`)}
if(i.type==="link"){b.innerHTML=`<b>${escape(i.content)}</b><br><br><a href="${escape(i.url||"#")}" target="_blank">${escape(i.url||"Add URL")}</a>`}
if(i.type==="shot"){b.classList.add("shotBody");let ref=i.src?(i.mediaType==="video"?`<video src="${i.src}" controls muted playsinline></video>`:`<img src="${i.src}">`):"FRAME REFERENCE";b.innerHTML=`<div class="shotFrame">${ref}</div><b>${escape(i.content)}</b><p>Size: ${escape(i.shotSize)}<br>Move: ${escape(i.move)}<br>Lens: ${escape(i.lens)}<br>Audio: ${escape(i.audio)}</p><small>${escape(i.notes)}</small>`}
c.appendChild(b);
let close=c.querySelector(".cardClose");
close.onclick=e=>{e.stopPropagation();select(i.id);remove()};
let r=document.createElement("div");r.className="resize";c.appendChild(r);
c.onmousedown=e=>{
 if(e.target===r||e.target.closest("a,input,button,video"))return;
 if(connectMode){
   if(!connectSource){connectSource=i.id;c.classList.add("connectSource");toast("Now click the destination card")}
   else{let source=connectSource;document.querySelectorAll(".connectSource").forEach(x=>x.classList.remove("connectSource"));connectSource=null;makeConnection(source,i.id)}
   return;
 }
 select(i.id);drag(e,i,false)
};
r.onmousedown=e=>{e.stopPropagation();if(!connectMode)drag(e,i,true)};
return c}
function itemById(id){return S.items.find(i=>i.id===id)}
function connectionExists(a,b){return (S.connections||[]).some(c=>(c.from===a&&c.to===b)||(c.from===b&&c.to===a))}
function makeConnection(from,to){
 if(!from||!to||from===to)return;
 if(connectionExists(from,to))return toast("Those cards are already connected");
 hist();S.connections.push({id:(crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random())),from,to});
 persist();render();toast("Flow connection added");
}
function drawConnections(){
 let svg=$("connections");if(!svg)return;
 svg.querySelectorAll(".flowLine").forEach(n=>n.remove());
 S.connections=(S.connections||[]).filter(c=>itemById(c.from)&&itemById(c.to));
 S.connections.forEach(c=>{
  let a=itemById(c.from),b=itemById(c.to);
  let ax=a.x+a.w,ay=a.y+a.h/2,bx=b.x,by=b.y+b.h/2,dx=Math.max(60,Math.abs(bx-ax)*.45);
  let p=document.createElementNS("http://www.w3.org/2000/svg","path");
  p.setAttribute("d",`M ${ax} ${ay} C ${ax+dx} ${ay}, ${bx-dx} ${by}, ${bx} ${by}`);
  p.setAttribute("class","flowLine");svg.appendChild(p);
 });
}
function toggleConnectMode(){
 connectMode=!connectMode;connectSource=null;
 $("connectMode").classList.toggle("active",connectMode);
 let old=$("flowHint");if(old)old.remove();
 if(connectMode){let h=document.createElement("div");h.id="flowHint";h.className="flowHint";h.textContent="Flow mode: click the first card, then the second card";document.body.appendChild(h)}
}
function escape(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function render(){let box=$("items");box.innerHTML="";S.items.forEach(i=>box.appendChild(card(i)));drawConnections();$("hint").style.display=S.items.length?"none":"block";transform()}
function drag(e,i,res){e.preventDefault();hist();let s={mx:e.clientX,my:e.clientY,x:i.x,y:i.y,w:i.w,h:i.h};function m(v){let dx=(v.clientX-s.mx)/S.z,dy=(v.clientY-s.my)/S.z;if(res){i.w=Math.max(90,s.w+dx);i.h=Math.max(70,s.h+dy)}else{i.x=s.x+dx;i.y=s.y+dy}render();inspect()}function u(){document.removeEventListener("mousemove",m);document.removeEventListener("mouseup",u);persist()}document.addEventListener("mousemove",m);document.addEventListener("mouseup",u)}
function inspect(){let i=S.items.find(x=>x.id===S.selected);$("empty").hidden=!!i;$("inspector").hidden=!i;if(!i)return;$("type").textContent=defs[i.type][0];$("title").value=i.title||"";$("content").value=i.content||"";$("x").value=i.x;$("y").value=i.y;$("w").value=i.w;$("h").value=i.h;$("colors").innerHTML=colors.map(c=>`<button data-c="${c}" style="background:${c}"></button>`).join("");$("colors").querySelectorAll("button").forEach(b=>b.onclick=()=>{hist();i.color=b.dataset.c;render();inspect();persist()});$("shotBox").hidden=i.type!=="shot";$("linkBox").hidden=i.type!=="link";if(i.type==="shot"){["shotSize","move","lens","audio","notes"].forEach(k=>$(k).value=i[k]||"");$("referenceStatus").textContent=i.src?("Attached: "+(i.fileName||i.mediaType||"reference")):"No reference attached"}if(i.type==="link")$("url").value=i.url||""}
function bind(id,key,num=false){$(id).oninput=e=>{let i=S.items.find(x=>x.id===S.selected);if(!i)return;i[key]=num?Number(e.target.value):e.target.value;render();persist()}}
[["title","title"],["content","content"],["x","x",1],["y","y",1],["w","w",1],["h","h",1],["shotSize","shotSize"],["move","move"],["lens","lens"],["audio","audio"],["notes","notes"],["url","url"]].forEach(a=>bind(...a));
function remove(){if(!S.selected)return;hist();let id=S.selected;S.items=S.items.filter(i=>i.id!==id);S.connections=(S.connections||[]).filter(c=>c.from!==id&&c.to!==id);S.selected=null;render();inspect();persist()}
function download(data,name,type){let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function exportFile(t){if(t==="json")return download(JSON.stringify(S,null,2),"framedeck.json","application/json");let body=S.items.map(i=>`<article><h2>${escape(i.title)}</h2><small>${defs[i.type][0]}</small><p>${escape(i.content||"").replace(/\n/g,"<br>")}</p>${i.src&&i.type==="image"?`<img src="${i.src}" style="max-width:100%">`:""}</article>`).join("");if(t==="txt")return download(S.items.map(i=>i.title+"\n"+(i.content||"")).join("\n\n"),"framedeck.txt","text/plain");if(t==="html")return download(`<html><body><h1>${escape(S.name)}</h1>${body}</body></html>`,"framedeck.html","text/html");if(t==="doc")return download("\ufeff<html><body><h1>"+escape(S.name)+"</h1>"+body+"</body></html>","framedeck.doc","application/msword");if(t==="pdf"){let w=window.open("","_blank");if(!w)return toast("Allow pop-ups for PDF");w.document.write(`<html><head><title>${escape(S.name)}</title><style>body{font-family:Arial;padding:30px}article{border:1px solid #ddd;padding:15px;margin:0 0 18px;page-break-inside:avoid}img{max-width:100%}</style></head><body><h1>${escape(S.name)}</h1>${body}</body></html>`);w.document.close();setTimeout(()=>w.print(),400)}}
function pitch(){ $("pitchTitle").value=S.name; $("pIdea").textContent=$("pitchIdea").value; $("pitchEditor").hidden=false;$("approvedPanel").hidden=!S.approved;$("pitchModal").hidden=false}
function approve(){S.approved=true;S.approval={name:"Client approval",date:new Date().toLocaleString()};$("approvalInfo").textContent="Approved on "+S.approval.date;renderQuote();$("pitchEditor").hidden=true;$("approvedPanel").hidden=false;persist();toast("Concept approved")}
function renderQuote(){let q=$("quoteLines");q.innerHTML="";S.quote.forEach((l,n)=>{let row=document.createElement("div");row.className="quoteRow";row.innerHTML=`<input value="${escape(l.name)}"><input type="number" value="${l.amount}"><button>×</button>`;row.children[0].oninput=e=>l.name=e.target.value;row.children[1].oninput=e=>{l.amount=Number(e.target.value);total()};row.children[2].onclick=()=>{S.quote.splice(n,1);renderQuote();persist()};q.appendChild(row)});total()}
function total(){$("total").textContent="KES "+S.quote.reduce((a,b)=>a+Number(b.amount||0),0).toLocaleString()}
function clientView(){
  let w=window.open("","_blank");
  if(!w)return toast("Allow pop-ups");
  let cards=S.items.map(i=>{
    let media=(i.src&&i.type==="image")?'<img src="'+i.src+'">':"";
    return '<article><h3>'+escape(i.title)+'</h3><small>'+defs[i.type][0]+'</small><p>'+escape(i.content||"").replace(/\n/g,"<br>")+'</p>'+media+'</article>';
  }).join("");
  let approved=S.approved;
  let approval=approved?'<div class="status">✓ Concept approved</div>':'<button class="approve" id="approve">Approve concept</button>';
  let page='<!doctype html><html><head><title>'+escape(S.name)+'</title><style>'+
    'body{font-family:Arial;background:#f2f0eb;margin:0;padding:40px;color:#20201e}'+
    '.wrap{max-width:1000px;margin:auto;background:#fff;padding:45px;border-radius:14px}'+
    '.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}'+
    'article{border:1px solid #ddd;padding:18px;border-radius:10px;page-break-inside:avoid}'+
    'img{max-width:100%;max-height:400px}.approve{margin-top:30px;padding:14px 20px;border:0;border-radius:8px;background:#7157e8;color:#fff;font-weight:800;cursor:pointer}'+
    '.status{margin-top:15px;padding:12px;border-radius:8px;background:#e4f7e8;color:#18733a;font-weight:800}'+
    '@media(max-width:700px){.grid{grid-template-columns:1fr}}'+
    '</style></head><body><div class="wrap"><small>CREATIVE PROPOSAL</small>'+
    '<h1>'+escape($("pitchTitle").value)+'</h1>'+
    '<p>'+escape($("pitchIdea").value).replace(/\n/g,"<br>")+'</p>'+
    '<h2>Creative Direction</h2><p>'+escape($("pitchWhy").value).replace(/\n/g,"<br>")+'</p>'+
    '<h2>Storyboard & References</h2><div class="grid">'+cards+'</div>'+
    '<div id="approval">'+approval+'</div></div>'+
    '<script>document.getElementById("approve")?.addEventListener("click",function(){localStorage.setItem("framedeck-client-approval",JSON.stringify({project:"'+escape(S.name).replace(/"/g,'&quot;')+'",date:new Date().toISOString()}));document.getElementById("approval").innerHTML="<div class=\\"status\\">✓ Concept approved in this browser</div>";});</script>'+
    '</body></html>';
  w.document.open();w.document.write(page);w.document.close();
}
function fit(){if(!S.items.length)return centre();let minX=Math.min(...S.items.map(i=>i.x)),minY=Math.min(...S.items.map(i=>i.y)),maxX=Math.max(...S.items.map(i=>i.x+i.w)),maxY=Math.max(...S.items.map(i=>i.y+i.h));let bw=maxX-minX,bh=maxY-minY;S.z=Math.max(.25,Math.min(1.5,($("viewport").clientWidth-100)/bw,($("viewport").clientHeight-100)/bh));S.px=$("viewport").clientWidth/2-((minX+maxX)/2-5000)*S.z;S.py=$("viewport").clientHeight/2-((minY+maxY)/2-3500)*S.z;transform()}
$("addReference").onclick=()=>{
  let i=S.items.find(x=>x.id===S.selected);
  if(!i||i.type!=="shot")return toast("Select a shot card first");
  $("referenceFile").value=""; $("referenceFile").click();
};
$("clearReference").onclick=()=>{
  let i=S.items.find(x=>x.id===S.selected); if(!i||i.type!=="shot")return;
  hist(); delete i.src; delete i.mediaType; delete i.fileName;
  render(); inspect(); persist(); toast("Reference removed");
};
$("referenceFile").onchange=e=>{
  let i=S.items.find(x=>x.id===S.selected), f=e.target.files[0];
  if(!i||i.type!=="shot"||!f)return;
  if(!f.type.startsWith("image/")&&!f.type.startsWith("video/"))return toast("Choose an image or video");
  if(f.size>50*1024*1024)return toast("Reference must be under 50 MB");
  let rd=new FileReader();
  rd.onload=()=>{
    hist(); i.src=rd.result; i.mediaType=f.type.startsWith("video/")?"video":"image"; i.fileName=f.name;
    render(); inspect(); persist(); toast("Frame reference added");
  };
  rd.readAsDataURL(f);
};
document.querySelectorAll(".tool").forEach(b=>b.onclick=()=>add(b.dataset.type));$("upload").onclick=()=>$("files").click();$("files").onchange=e=>[...e.target.files].forEach(f=>{let rd=new FileReader();rd.onload=()=>{hist();let type=f.type.startsWith("video")?"video":"image",i=make(type);i.src=rd.result;i.title=f.name;S.items.push(i);S.selected=i.id;render();inspect();persist()};rd.readAsDataURL(f)});$("delete").onclick=remove;$("remove").onclick=remove;
$("leftToggle").onclick=()=>{$("app").classList.toggle("leftRetracted");$("leftToggle").textContent=$("app").classList.contains("leftRetracted")?"›":"‹"};$("rightToggle").onclick=()=>{$("app").classList.toggle("rightRetracted");$("rightToggle").textContent=$("app").classList.contains("rightRetracted")?"‹":"›"};$("clean").onclick=()=>document.body.classList.toggle("clean");
$("plus").onclick=()=>zoomAt(S.z*1.15);$("minus").onclick=()=>zoomAt(S.z/1.15);$("fit").onclick=fit;$("save").onclick=()=>{persist();toast("Saved")};$("projectName").oninput=e=>S.name=e.target.value;
$("undo").onclick=()=>{if(!S.h.length)return;S.f.push(snap());let x=JSON.parse(S.h.pop());S.name=x.name;S.items=x.items;$("projectName").value=S.name;S.selected=null;render();inspect()};$("redo").onclick=()=>{if(!S.f.length)return;S.h.push(snap());let x=JSON.parse(S.f.pop());S.name=x.name;S.items=x.items;$("projectName").value=S.name;render();inspect()};
$("duplicate").onclick=()=>{let i=S.items.find(x=>x.id===S.selected);if(!i)return;hist();let n=JSON.parse(JSON.stringify(i));n.id=Date.now()+Math.random();n.x+=35;n.y+=35;S.items.push(n);S.selected=n.id;render();inspect();persist()};
$("export").onclick=()=>{$("exportMenu").hidden=!$("exportMenu").hidden};document.querySelectorAll("[data-exp]").forEach(b=>b.onclick=()=>{exportFile(b.dataset.exp);$("exportMenu").hidden=true});
$("connectMode").onclick=toggleConnectMode;$("pitch").onclick=pitch;$("closePitch").onclick=()=>$("pitchModal").hidden=true;$("approve").onclick=approve;$("clientView").onclick=clientView;$("clientView2").onclick=clientView;$("pitchIdea").oninput=()=>{$("pIdea").textContent=$("pitchIdea").value};
$("addLine").onclick=()=>{if(!S.approved)return;S.quote.push({name:"Production service",amount:0});renderQuote();persist()};$("makeQuote").onclick=()=>{if(!S.approved)return toast("Approve concept first");let html=`<html><body style="font-family:Arial;padding:40px"><h1>CREATIVE PRODUCTION QUOTATION</h1><h2>${escape(S.name)}</h2><p>Prepared: ${new Date().toLocaleDateString()}</p><table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%">${S.quote.map(x=>`<tr><td>${escape(x.name)}</td><td>KES ${Number(x.amount).toLocaleString()}</td></tr>`).join("")}<tr><th>TOTAL</th><th>KES ${S.quote.reduce((a,b)=>a+Number(b.amount||0),0).toLocaleString()}</th></tr></table><p><b>Payment terms:</b> ${escape($("terms").value)}</p></body></html>`;let w=window.open("","_blank");w.document.write(html);w.document.close();setTimeout(()=>w.print(),400)};$("clientView2").onclick=clientView;
$("viewport").onwheel=e=>{e.preventDefault();zoomAt(S.z*(e.deltaY<0?1.08:.92),e.clientX,e.clientY)};$("viewport").onmousedown=e=>{if(e.button!==1&&!space)return;e.preventDefault();let s={x:e.clientX,y:e.clientY,px:S.px,py:S.py};function m(v){S.px=s.px+v.clientX-s.x;S.py=s.py+v.clientY-s.y;transform()}function u(){document.removeEventListener("mousemove",m);document.removeEventListener("mouseup",u)}document.addEventListener("mousemove",m);document.addEventListener("mouseup",u)};
document.addEventListener("keydown",e=>{if(e.code==="Space"){space=true}if(e.key==="Tab"){e.preventDefault();document.getElementById("app").classList.toggle("clean")}if(e.key.toLowerCase()==="f"&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName))fit();if((e.key==="Delete"||e.key==="Backspace")&&S.selected&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName))remove()});document.addEventListener("keyup",e=>{if(e.code==="Space")space=false});window.addEventListener("resize",()=>{if(!S.items.length)centre()});
load();render();inspect();centre();
})();