const $=s=>document.querySelector(s);
const colors=['#f5c542','#ff8a65','#ef5350','#66bb6a','#29b6f6','#7157e8','#ec4899','#111827','#ffffff'];
const types={
 text:{title:'Text',w:300,h:180,color:'#7157e8'},
 image:{title:'Image',w:380,h:280,color:'#29b6f6'},
 video:{title:'Video',w:420,h:280,color:'#ef5350'},
 shot:{title:'Shot',w:360,h:390,color:'#7157e8'},
 note:{title:'Note',w:260,h:220,color:'#f5c542'},
 link:{title:'Link',w:320,h:170,color:'#29b6f6'},
 checklist:{title:'Tasks',w:300,h:220,color:'#66bb6a'},
 color:{title:'Color',w:190,h:190,color:'#7157e8'},
 section:{title:'Section',w:520,h:110,color:'#111827'}
};

let state={
 name:'Untitled Creative Project',
 zoom:1,
 panX:0,panY:0,
 items:[],
 selected:null,
 history:[],
 future:[]
};

function uid(){return Math.random().toString(36).slice(2,10)}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1300)}
function snapshot(){return JSON.stringify({name:state.name,items:state.items})}
function pushHistory(){state.history.push(snapshot());if(state.history.length>50)state.history.shift();state.future=[]}
function restore(s){let x=JSON.parse(s);state.name=x.name;state.items=x.items;state.selected=null;render();syncInspector()}
function undo(){if(!state.history.length)return;state.future.push(snapshot());restore(state.history.pop());toast('Undo')}
function redo(){if(!state.future.length)return;state.history.push(snapshot());restore(state.future.pop());toast('Redo')}

function save(){
 state.name=$('#projectName').value;
 localStorage.setItem('framedeck-v2',JSON.stringify({name:state.name,zoom:state.zoom,panX:state.panX,panY:state.panY,items:state.items}));
 toast('Saved locally');
}
function load(){
 try{
  const x=JSON.parse(localStorage.getItem('framedeck-v2'));
  if(x){Object.assign(state,x);$('#projectName').value=state.name||''}
 }catch(e){}
}

function boardPoint(clientX,clientY){
 const r=$('#viewport').getBoundingClientRect();
 return {x:(clientX-r.left-state.panX)/state.zoom+3000,y:(clientY-r.top-state.panY)/state.zoom+2000}
}
function applyBoardTransform(){
 $('#board').style.transform=`translate(${state.panX}px,${state.panY}px) scale(${state.zoom})`;
 $('#zoomValue').textContent=Math.round(state.zoom*100)+'%';
}
function centerBoard(){state.panX=$('#viewport').clientWidth/2;state.panY=$('#viewport').clientHeight/2;applyBoardTransform()}
function setZoom(z,cx,cy){
 z=Math.max(.25,Math.min(2.5,z));
 const r=$('#viewport').getBoundingClientRect();
 const x=cx==null?r.width/2:cx-r.left,y=cy==null?r.height/2:cy-r.top;
 const worldX=(x-state.panX)/state.zoom,worldY=(y-state.panY)/state.zoom;
 state.zoom=z;state.panX=x-worldX*z;state.panY=y-worldY*z;applyBoardTransform();
}

function defaultItem(type,x=2850,y=1900){
 const d=types[type];
 let i={id:uid(),type,x,y,w:d.w,h:d.h,title:d.title,color:d.color,content:''};
 if(type==='text'){i.content='Your creative idea goes here.'}
 if(type==='note'){i.content='Add a thought, reference or client note...'}
 if(type==='section'){i.content='CREATIVE DIRECTION'}
 if(type==='checklist'){i.content='Find location\\nConfirm wardrobe\\nShoot test footage\\nFinal edit'}
 if(type==='link'){i.content='Reference website'}
 if(type==='color'){i.content='#7157e8'}
 if(type==='shot'){i.content='Athlete enters the gym.';i.shotSize='Wide';i.cameraMove='Slow push-in';i.lens='24mm';i.audio='Room tone + footsteps';i.directorNotes='Keep the background clean.'}
 return i
}

function add(type){
 pushHistory();
 const i=defaultItem(type,3000-state.panX/state.zoom+40,2000-state.panY/state.zoom+40);
 state.items.push(i);state.selected=i.id;render();syncInspector();save();
}
function addMedia(file){
 const reader=new FileReader();
 reader.onload=()=>{
  pushHistory();
  const type=file.type.startsWith('video')?'video':'image';
  const i=defaultItem(type,3000-state.panX/state.zoom+40,2000-state.panY/state.zoom+40);
  i.src=reader.result;i.title=file.name;
  state.items.push(i);state.selected=i.id;render();syncInspector();save();
 };
 reader.readAsDataURL(file);
}

function render(){
 const box=$('#items');box.innerHTML='';
 state.items.forEach(i=>box.appendChild(createCard(i)));
 $('#emptyHint').style.display=state.items.length?'none':'flex';
 applyBoardTransform();
}
function createCard(i){
 const card=document.createElement('div');
 card.className='card '+(state.selected===i.id?'selected':'');
 card.dataset.id=i.id;
 card.style.left=i.x+'px';card.style.top=i.y+'px';card.style.width=i.w+'px';card.style.height=i.h+'px';

 const header=document.createElement('div');header.className='card-header';
 header.innerHTML=`<span class="handle">⠿</span><span class="card-dot" style="background:${i.color}"></span><span class="card-title">${esc(i.title||types[i.type].title)}</span>`;
 card.appendChild(header);

 const body=document.createElement('div');body.className='card-body';
 if(i.type==='text'){body.classList.add('text-body');body.textContent=i.content}
 if(i.type==='note'){body.classList.add('note-body');body.textContent=i.content}
 if(i.type==='image'){body.classList.add('image-body');body.innerHTML=i.src?`<img src="${i.src}">`:'<div class="empty-hint" style="position:static;transform:none">Add an image</div>'}
 if(i.type==='video'){body.classList.add('video-body');body.innerHTML=i.src?`<video src="${i.src}" controls muted loop></video>`:'<div class="empty-hint" style="position:static;transform:none">Add a video</div>'}
 if(i.type==='link'){body.classList.add('link-body');body.innerHTML=`<strong>${esc(i.content||'Reference')}</strong><br><br><a href="${esc(i.url||'#')}" target="_blank">${esc(i.url||'Add URL in inspector')}</a>`}
 if(i.type==='color'){body.classList.add('color-body');body.innerHTML=`<div class="color-swatch" style="background:${esc(i.content||i.color)}">${esc(i.content||i.color)}</div>`}
 if(i.type==='section'){body.classList.add('section-body');body.textContent=i.content}
 if(i.type==='checklist'){
   body.innerHTML='';
   String(i.content||'').split('\\n').filter(Boolean).forEach((x,n)=>{
    const row=document.createElement('label');row.className='check-row';row.innerHTML=`<input type="checkbox"> <span>${esc(x)}</span>`;body.appendChild(row)
   });
 }
 if(i.type==='shot'){
   body.classList.add('shot-body');
   body.innerHTML=`
   <div class="shot-image">${i.src?`<img src="${i.src}">`:'FRAME REFERENCE'}</div>
   <strong>${esc(i.content||'Shot description')}</strong>
   <div class="shot-meta">
    <div><span>SIZE</span><br>${esc(i.shotSize||'Wide')}</div>
    <div><span>MOVE</span><br>${esc(i.cameraMove||'')}</div>
    <div><span>LENS</span><br>${esc(i.lens||'')}</div>
    <div><span>AUDIO</span><br>${esc(i.audio||'')}</div>
   </div>
   <p><span>NOTES</span><br>${esc(i.directorNotes||'')}</p>`;
 }
 card.appendChild(body);
 const rh=document.createElement('div');rh.className='resize-handle';card.appendChild(rh);

 card.addEventListener('mousedown',e=>{
   if(e.target===rh)return;
   select(i.id);
   if(e.target.closest('a')||e.target.closest('input'))return;
   dragItem(e,i,false);
 });
 rh.addEventListener('mousedown',e=>{e.stopPropagation();select(i.id);dragItem(e,i,true)});
 card.addEventListener('dblclick',()=>{if(i.type==='text'||i.type==='note'||i.type==='section'){select(i.id);$('#fieldContent').focus()}});
 return card;
}

function select(id){state.selected=id;render();syncInspector()}
function dragItem(e,item,resize){
 e.preventDefault();
 const start={mx:e.clientX,my:e.clientY,x:item.x,y:item.y,w:item.w,h:item.h};
 const before=snapshot();
 const move=ev=>{
  const dx=(ev.clientX-start.mx)/state.zoom,dy=(ev.clientY-start.my)/state.zoom;
  if(resize){item.w=Math.max(90,start.w+dx);item.h=Math.max(70,start.h+dy)}
  else{item.x=start.x+dx;item.y=start.y+dy}
  render();
 };
 const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);state.history.push(before);state.future=[];save()};
 document.addEventListener('mousemove',move);document.addEventListener('mouseup',up);
}

let panning=null;
$('#viewport').addEventListener('mousedown',e=>{
 if(e.button!==1 && !(e.button===0&&(e.target.id==='viewport'||e.target.id==='grid'||e.target.id==='board')))return;
 panning={mx:e.clientX,my:e.clientY,px:state.panX,py:state.panY};
 const move=ev=>{state.panX=panning.px+ev.clientX-panning.mx;state.panY=panning.py+ev.clientY-panning.my;applyBoardTransform()};
 const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up)};
 document.addEventListener('mousemove',move);document.addEventListener('mouseup',up);
});
window.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();save()}
 if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo()}
 if((e.ctrlKey||e.metaKey)&&e.key==='y'){e.preventDefault();redo()}
 if((e.key==='Delete'||e.key==='Backspace')&&state.selected&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){deleteSelected()}
 if(e.code==='Space'&&!panning){$('#viewport').style.cursor='grab'}
});
window.addEventListener('keyup',e=>{if(e.code==='Space')$('#viewport').style.cursor='default'});
$('#viewport').addEventListener('wheel',e=>{e.preventDefault();setZoom(state.zoom*(e.deltaY<0?1.08:.92),e.clientX,e.clientY)},{passive:false});

function syncInspector(){
 const i=state.items.find(x=>x.id===state.selected);
 $('#noSelection').hidden=!!i;$('#inspector').hidden=!i;
 if(!i)return;
 $('#selectedType').textContent=types[i.type]?.title||i.type;
 $('#fieldTitle').value=i.title||'';
 $('#fieldContent').value=i.content||'';
 $('#fieldX').value=Math.round(i.x);$('#fieldY').value=Math.round(i.y);
 $('#fieldW').value=Math.round(i.w);$('#fieldH').value=Math.round(i.h);
 $('#colorChoices').innerHTML=colors.map(c=>`<button class="color-choice" style="background:${c}" data-color="${c}"></button>`).join('');
 document.querySelectorAll('.color-choice').forEach(b=>b.onclick=()=>{pushHistory();i.color=b.dataset.color;render();syncInspector();save()});
 $('#shotFields').hidden=i.type!=='shot';
 $('#linkFields').hidden=i.type!=='link';
 if(i.type==='shot'){
  $('#shotSize').value=i.shotSize||'Wide';$('#cameraMove').value=i.cameraMove||'';$('#lens').value=i.lens||'';$('#audio').value=i.audio||'';$('#directorNotes').value=i.directorNotes||'';
 }
 if(i.type==='link')$('#urlField').value=i.url||'';
}
function bindField(id,key,number=false){
 $('#'+id).addEventListener('input',e=>{
  const i=state.items.find(x=>x.id===state.selected);if(!i)return;
  i[key]=number?Number(e.target.value):e.target.value;render();
 });
}
bindField('fieldTitle','title');bindField('fieldContent','content');
bindField('fieldX','x',true);bindField('fieldY','y',true);bindField('fieldW','w',true);bindField('fieldH','h',true);
['shotSize','cameraMove','lens','audio','directorNotes'].forEach(id=>bindField(id,{shotSize:'shotSize',cameraMove:'cameraMove',lens:'lens',audio:'audio',directorNotes:'directorNotes'}[id]));
bindField('urlField','url');

function deleteSelected(){
 if(!state.selected)return;
 pushHistory();state.items=state.items.filter(x=>x.id!==state.selected);state.selected=null;render();syncInspector();save();
}
$('#deleteSelected').onclick=deleteSelected;
$('#deleteBtn').onclick=deleteSelected;
$('#duplicateBtn').onclick=()=>{
 const i=state.items.find(x=>x.id===state.selected);if(!i)return;
 pushHistory();const n=JSON.parse(JSON.stringify(i));n.id=uid();n.x+=30;n.y+=30;state.items.push(n);state.selected=n.id;render();syncInspector();save();
};
$('#bringFrontBtn').onclick=()=>{
 const i=state.items.find(x=>x.id===state.selected);if(!i)return;
 pushHistory();state.items=state.items.filter(x=>x.id!==i.id);state.items.push(i);render();save();
};
document.querySelectorAll('.add-tool').forEach(b=>b.onclick=()=>add(b.dataset.type));
$('#uploadBtn').onclick=()=>$('#fileInput').click();
$('#fileInput').onchange=e=>[...e.target.files].forEach(addMedia);

$('#zoomIn').onclick=()=>setZoom(state.zoom*1.15);
$('#zoomOut').onclick=()=>setZoom(state.zoom/1.15);
$('#fitBtn').onclick=()=>{if(!state.items.length){centerBoard();return}let minX=Math.min(...state.items.map(i=>i.x)),minY=Math.min(...state.items.map(i=>i.y)),maxX=Math.max(...state.items.map(i=>i.x+i.w)),maxY=Math.max(...state.items.map(i=>i.y+i.h));let vw=$('#viewport').clientWidth-100,vh=$('#viewport').clientHeight-100;let z=Math.min(vw/(maxX-minX),vh/(maxY-minY),1.2);state.zoom=Math.max(.25,z);state.panX=$('#viewport').clientWidth/2-((minX+maxX)/2-3000)*state.zoom;state.panY=$('#viewport').clientHeight/2-((minY+maxY)/2-2000)*state.zoom;applyBoardTransform()};
$('#undoBtn').onclick=undo;$('#redoBtn').onclick=redo;
$('#saveBtn').onclick=save;
$('#projectName').oninput=e=>state.name=e.target.value;

$('#clearBtn').onclick=()=>{if(confirm('Clear the entire board?')){pushHistory();state.items=[];state.selected=null;render();syncInspector();save()}};

$('#exportBtn').onclick=()=>{
 const data={...state,history:undefined,future:undefined};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(state.name||'framedeck').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.json';a.click();URL.revokeObjectURL(a.href);toast('Project exported');
};

$('#presentBtn').onclick=()=>{
 const p=document.createElement('div');p.className='present';
 const close=document.createElement('button');close.className='btn primary close';close.textContent='Close';close.onclick=()=>p.remove();p.appendChild(close);
 const card=document.createElement('div');card.className='present-card';
 const title=document.createElement('h1');title.textContent=state.name;title.style.marginTop='0';card.appendChild(title);
 const sub=document.createElement('p');sub.textContent='Creative board presentation';sub.style.color='#777';card.appendChild(sub);
 const list=document.createElement('div');list.style='display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-height:65vh;overflow:auto';
 state.items.forEach(i=>{const d=document.createElement('div');d.style='border:1px solid #ddd;border-radius:8px;padding:10px;min-height:80px';d.innerHTML=`<b>${esc(i.title)}</b><p style="font-size:12px">${esc(i.content||'')}</p>`;list.appendChild(d)});
 card.appendChild(list);p.appendChild(card);document.body.appendChild(p);
};

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

load();render();syncInspector();
if(!state.panX&&!state.panY)centerBoard();
applyBoardTransform();
