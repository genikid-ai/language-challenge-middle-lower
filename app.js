const base="https://genikid-ai.github.io/imagecard/images/game-folder-h6qsjz/";
const BACKEND_URL="https://script.google.com/macros/s/AKfycbxqfuB5DVR7fxOtpsvhAvPyJm9rrzZqTCL5k7jMbPMlfzQ5xF_JIQ2_OEHkTCKkwAlZ/exec";
const GAME_CODE="LANGUAGE_CHALLENGE_MIDDLE_LOWER",GAME_VERSION="1.0.0";
const DEMO_MODE=BACKEND_URL.startsWith("__");
const DEMO_STORAGE_KEY="language-game-middle-lower-preview";
const make=(rows,type)=>rows.map(x=>type==="sound"?{word:x[0],prompt:base+x[1],success:base+x[2],answer:base+x[3]}:{word:x[0],prompt:base+x[1],answer:base+x[2]});
const sounds=make([["比賽","image-c7603670.jpg","image-2a3e20b6.jpg","image-9afcc3ee.jpg"],["水溝","image-7efe1f2e.jpg","image-dfa18c03.jpg","image-34162449.jpg"],["牙齒","image-c9ab6e06.jpg","image-4fcab844.jpg","image-943766dc.jpg"],["平安","image-4855984f.jpg","image-a3697b5b.jpg","image-33b2c9c2.jpg"],["娃娃","image-b4facdff.jpg","image-fe577326.jpg","image-362b6c05.jpg"],["粗心","image-79518ee7.jpg","image-cb15597a.jpg","image-b9f1a1b3.jpg"],["跟著","image-4da334e1.jpg","image-807db4a9.jpg","image-41452b24.jpg"],["環保杯","image-dd06bc8d.jpg","image-0835464e.jpg","image-e5af2d53.jpg"]],"sound");
const pictures=make([["小羊","image-12c7aa68.jpg","image-58349cb3.jpg"],["白鵝","image-7a1bc0a2.jpg","image-6b3557ac.jpg"],["老鷹","image-d8306cc2.jpg","image-388b7a85.jpg"],["拍手","image-091b317e.jpg","image-7bd61756.jpg"],["雨滴","image-773e3d33.jpg","image-a4ab597d.jpg"],["蛋糕","image-cb4e5444.jpg","image-9ac7ee70.jpg"],["握手","image-c9792e7a.jpg","image-d213319f.jpg"],["爺爺","image-6fad417a.jpg","image-9be149c8.jpg"],["粽子","image-43a40e38.jpg","image-a6747cf5.jpg"],["鴨子","image-149461f9.jpg","image-4dd0fdbd.jpg"]],"picture");

const DEFAULT_YEAR="115學年度",DEFAULT_SCHOOL="管理中心",DEFAULT_CLASS="測試班";
const app=document.querySelector("#app");
let state={screen:"home",school:DEFAULT_SCHOOL,className:DEFAULT_CLASS,seat:null,questions:[],index:0,options:[],results:[],selected:null,review:false,records:[],loading:false,saving:false,saveError:"",sessionId:"",autoAdvanceTimer:null,classReady:false,academicYear:DEFAULT_YEAR,years:[DEFAULT_YEAR],schools:[DEFAULT_SCHOOL],classOptions:[DEFAULT_CLASS],configLoading:false,deletingSeat:null,reportNotice:"",reportError:""};
const shuffle=a=>[...a].sort(()=>Math.random()-.5),norm=v=>{v=v.trim();return v&&!v.endsWith("班")?v+"班":v},score=()=>state.results.filter(x=>x.correct).length;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

function classRecords(){return state.records.filter(r=>r.school===state.school&&(!state.className||r.className===norm(state.className)))}
function balancedPick(pool,count){const totals=Object.fromEntries(pool.map(card=>[card.word,0]));classRecords().forEach(record=>record.results.forEach(result=>{if(Object.prototype.hasOwnProperty.call(totals,result.word))totals[result.word]++}));return shuffle(pool).sort((a,b)=>totals[a.word]-totals[b.word]).slice(0,count)}
function classAccuracy(){const rows=classRecords(),words=[...sounds,...pictures];return words.map(w=>{const tries=rows.flatMap(r=>r.results).filter(x=>x.word===w.word),right=tries.filter(x=>x.correct).length;return {word:w.word,tries:tries.length,right,rate:tries.length?Math.round(right/tries.length*100):null}})}
function suggestedWords(){return classAccuracy().filter(x=>x.tries>=3&&x.rate<60).sort((a,b)=>a.rate-b.rate||a.word.localeCompare(b.word,"zh-Hant"))}
function safeFilePart(value){return String(value||"").replace(/[\\/:*?"<>|]/g,"-").trim()}
function roundedRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

/* =========================================================
   Storybook Poster JPG Exporter (ONLY 待加強語詞 + Same Bear Mascot, NO numbers/copyright)
   ========================================================= */
function drawFluffyCloud(ctx,cx,cy,s,color){
  ctx.save();ctx.fillStyle=color;ctx.beginPath();
  ctx.arc(cx,cy,28*s,0,Math.PI*2);
  ctx.arc(cx-26*s,cy+9*s,20*s,0,Math.PI*2);
  ctx.arc(cx+28*s,cy+9*s,22*s,0,Math.PI*2);
  ctx.fill();ctx.restore();
}
function drawSparkleStar(ctx,cx,cy,r,color){
  ctx.save();ctx.fillStyle=color;ctx.beginPath();
  for(let i=0;i<10;i++){const rad=i%2===0?r:r*.45,a=-Math.PI/2+i*Math.PI/5;ctx[i?"lineTo":"moveTo"](cx+Math.cos(a)*rad,cy+Math.sin(a)*rad)}
  ctx.closePath();ctx.fill();ctx.restore();
}
function loadDataImage(src){
  return new Promise(resolve=>{
    if(!src){resolve(null);return}
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>resolve(null);
    img.src=src;
  });
}

async function downloadReportJpg(){
  try{if(document.fonts&&document.fonts.ready)await document.fonts.ready}catch{}
  const review=suggestedWords();
  const rows=classRecords();
  const mascots=window.REPORT_MASCOTS||{};
  const mascotImg=await loadDataImage(review.length?mascots.encourage:(rows.length?mascots.trophy:mascots.encourage));
  const font='"Chiron GoRound TC","Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
  const cols=4,rowCount=review.length?Math.ceil(review.length/cols):1;
  const width=1600;
  const boardH=review.length?146+rowCount*136+42:290;
  const height=Math.max(920,330+boardH+120);
  const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
  canvas.width=width;canvas.height=height;

  const sky=ctx.createLinearGradient(0,0,0,height);
  sky.addColorStop(0,"#d6efff");
  sky.addColorStop(0.5,"#fffef6");
  sky.addColorStop(1,"#dff2ff");
  ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);

  // Soft pastel rainbow arc on upper right
  const rbColors=["rgba(255,179,167,.35)","rgba(255,223,148,.38)","rgba(167,227,181,.35)","rgba(155,213,250,.38)"];
  rbColors.forEach((c,i)=>{ctx.strokeStyle=c;ctx.lineWidth=18;ctx.beginPath();ctx.arc(1460,210,230-i*18,Math.PI,Math.PI*1.65);ctx.stroke()});
  drawFluffyCloud(ctx,160,96,1.35,"rgba(255,255,255,.92)");
  drawFluffyCloud(ctx,975,78,1.0,"rgba(255,255,255,.86)");
  drawSparkleStar(ctx,645,112,14,"#ffd04d");
  drawSparkleStar(ctx,965,160,11,"#ff9f78");

  // Fluffy cloud banks at bottom
  ctx.fillStyle="rgba(202,233,255,.72)";
  for(let x=60;x<width+80;x+=150){ctx.beginPath();ctx.arc(x,height-52,110,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle="rgba(255,255,255,.9)";
  for(let x=0;x<width+100;x+=135){ctx.beginPath();ctx.arc(x,height-18,92,0,Math.PI*2);ctx.fill()}

  ctx.strokeStyle="rgba(154,209,245,.88)";ctx.lineWidth=8;
  roundedRect(ctx,28,28,width-56,height-56,42);ctx.stroke();

  ctx.fillStyle="#3595db";roundedRect(ctx,96,76,278,52,26);ctx.fill();
  ctx.strokeStyle="#fffef6";ctx.lineWidth=4;roundedRect(ctx,96,76,278,52,26);ctx.stroke();
  ctx.fillStyle="#ffffff";ctx.font=`800 25px ${font}`;ctx.textAlign="center";
  ctx.fillText("語文闖關・中下",235,111);

  ctx.textAlign="left";ctx.fillStyle="#194d78";ctx.font=`800 66px ${font}`;
  ctx.fillText("班級待加強語詞",96,212);
  ctx.fillStyle="#52728b";ctx.font=`700 24px ${font}`;
  ctx.fillText("提供老師日常複習與個別引導參考",98,254);

  ctx.fillStyle="#fffdf6";roundedRect(ctx,1054,84,448,158,32);ctx.fill();
  ctx.strokeStyle="#f3c55e";ctx.lineWidth=5;roundedRect(ctx,1054,84,448,158,32);ctx.stroke();
  ctx.fillStyle="#f9e9b8";ctx.beginPath();ctx.arc(1084,114,9,0,Math.PI*2);ctx.arc(1472,114,9,0,Math.PI*2);ctx.fill();
  ctx.textAlign="center";ctx.fillStyle="#2273b3";ctx.font=`800 34px ${font}`;
  ctx.fillText(state.academicYear||"—",1278,150);
  ctx.fillStyle="#1b405c";ctx.font=`800 38px ${font}`;
  ctx.fillText(`${state.school||""}・${norm(state.className)||""}`,1278,208);

  const boardX=96,boardY=316,boardW=width-192;
  ctx.fillStyle="rgba(42,108,162,.13)";roundedRect(ctx,boardX,boardY+12,boardW,boardH,38);ctx.fill();
  ctx.fillStyle="#fffef9";roundedRect(ctx,boardX,boardY,boardW,boardH,38);ctx.fill();
  ctx.strokeStyle="#a9d6f5";ctx.lineWidth=5;roundedRect(ctx,boardX,boardY,boardW,boardH,38);ctx.stroke();
  ctx.save();ctx.setLineDash([12,10]);ctx.strokeStyle="#cde6f7";ctx.lineWidth=3;
  roundedRect(ctx,boardX+18,boardY+18,boardW-36,boardH-36,28);ctx.stroke();ctx.restore();

  if(mascotImg){
    const mSize=316,mx=width/2-mSize/2,my=38;
    ctx.save();
    ctx.shadowColor="rgba(32,88,138,.22)";
    ctx.shadowBlur=18;
    ctx.shadowOffsetY=8;
    ctx.drawImage(mascotImg,mx,my,mSize,mSize);
    ctx.restore();
  }

  ctx.textAlign="center";ctx.fillStyle="#1e68a3";ctx.font=`800 34px ${font}`;
  ctx.fillText("建議複習的語詞清單",width/2,boardY+92);

  if(review.length){
    const gapX=24,gapY=24,padX=54;
    const cardW=(boardW-padX*2-gapX*(cols-1))/cols,cardH=112;
    const palette=[
      {bg:"#eaf6ff",bd:"#98cef5",lip:"#bedff7"},
      {bg:"#fff6dc",bd:"#f3ca68",lip:"#f4da93"},
      {bg:"#eefaf0",bd:"#9fd8a9",lip:"#bce5c3"},
      {bg:"#ffefe8",bd:"#f5b79c",lip:"#f4cbb8"}
    ];
    review.forEach((item,idx)=>{
      const col=idx%cols,row=Math.floor(idx/cols);
      const x=boardX+padX+col*(cardW+gapX),y=boardY+132+row*(cardH+gapY);
      const p=palette[idx%palette.length];
      ctx.fillStyle=p.lip;roundedRect(ctx,x,y+7,cardW,cardH,28);ctx.fill();
      ctx.fillStyle=p.bg;roundedRect(ctx,x,y,cardW,cardH,28);ctx.fill();
      ctx.strokeStyle=p.bd;ctx.lineWidth=4;roundedRect(ctx,x,y,cardW,cardH,28);ctx.stroke();
      ctx.fillStyle="#1b3f5c";ctx.textAlign="center";ctx.font=`800 ${item.word.length>2?46:52}px ${font}`;
      ctx.fillText(item.word,x+cardW/2,y+75);
    });
  }else{
    ctx.fillStyle="#eaf6ff";roundedRect(ctx,boardX+90,boardY+136,boardW-180,104,28);ctx.fill();
    ctx.strokeStyle="#9cd0f5";ctx.lineWidth=3;roundedRect(ctx,boardX+90,boardY+136,boardW-180,104,28);ctx.stroke();
    ctx.textAlign="center";ctx.fillStyle=rows.length?"#1d68a3":"#647d90";ctx.font=`800 36px ${font}`;
    ctx.fillText(rows.length?"本班目前沒有待加強的語詞，大家表現都很棒喔！":"完成闖關後，這裡會整理本班待加強的語詞",width/2,boardY+200);
  }

  canvas.toBlob(blob=>{
    if(!blob)return;
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;
    a.download=`${safeFilePart(state.academicYear)}_${safeFilePart(state.school)}_${safeFilePart(norm(state.className))}_中下待加強語詞.jpg`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  },"image/jpeg",.94);
}

/* =========================================================
   Backend API (100% Preserved)
   ========================================================= */
function demoRows(){try{return JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY)||"[]")}catch{return []}}
function demoApi(action,fields){const rows=demoRows();if(action==="academicYears")return {ok:true,years:["115學年度"]};if(action==="schools")return {ok:true,schools:["測試園"]};if(action==="classes")return {ok:true,classes:["中班測試班"]};if(action==="classResults")return {ok:true,rows:rows.filter(r=>r.gameCode===GAME_CODE&&r.academicYear===fields.academicYear&&r.school===fields.school&&r.className===fields.className&&r.active)};if(action==="submit"){if(fields.gameCode!==GAME_CODE)throw new Error("遊戲代碼不符");if(rows.some(r=>r.gameCode===GAME_CODE&&r.academicYear===fields.academicYear&&r.school===fields.school&&r.className===fields.className&&r.seat===fields.seat&&r.active))throw new Error("此座號已完成闖關");const recordId=crypto.randomUUID?crypto.randomUUID():String(Date.now());rows.push({...fields,recordId,score:fields.questions.filter(q=>q.result==="○").length*20,active:true,completedAt:new Date().toISOString()});localStorage.setItem(DEMO_STORAGE_KEY,JSON.stringify(rows));return {ok:true,recordId}}if(action==="softDelete"){const row=rows.find(r=>r.recordId===fields.recordId&&r.gameCode===GAME_CODE&&r.academicYear===fields.academicYear&&r.school===fields.school&&r.className===fields.className&&r.seat===fields.seat&&r.active);if(!row)throw new Error("找不到有效成績");row.active=false;row.deletedAt=new Date().toISOString();localStorage.setItem(DEMO_STORAGE_KEY,JSON.stringify(rows));return {ok:true}}throw new Error("未知操作")}
async function postApi(action,fields={},timeout=15000){if(DEMO_MODE)return demoApi(action,fields);const data=await fetchJsonWithTimeout(BACKEND_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,...fields})},timeout);if(!data.ok)throw new Error(data.error||"後台操作失敗");return data}
async function loadAcademicYears(useDefault=true){state.configLoading=true;render();try{const data=await postApi("academicYears");state.years=data.years||[];if(useDefault&&state.years.includes(DEFAULT_YEAR))state.academicYear=DEFAULT_YEAR;else if(!state.years.includes(state.academicYear))state.academicYear=state.years[0]||"";await loadSchools(useDefault)}catch(e){console.warn("學年度暫時無法讀取",e);state.configLoading=false;render()}}
async function loadSchools(useDefault=false){if(!state.academicYear){state.schools=[];state.school="";state.classOptions=[];state.className="";state.configLoading=false;render();return}state.configLoading=true;state.classReady=false;state.seat=null;render();try{const data=await postApi("schools",{academicYear:state.academicYear,grade:"中班"});state.schools=data.schools||[];if(useDefault&&state.schools.includes(DEFAULT_SCHOOL))state.school=DEFAULT_SCHOOL;else if(!state.schools.includes(state.school))state.school=state.schools[0]||"";await loadClasses(useDefault)}catch(e){console.warn("園所暫時無法讀取",e);state.schools=[];state.school="";state.classOptions=[];state.className="";state.configLoading=false;render()}}
async function loadClasses(useDefault=false){if(!state.academicYear||!state.school){state.classOptions=[];state.className="";state.configLoading=false;render();return}state.configLoading=true;state.classReady=false;state.seat=null;render();let matchedClass="";try{const data=await postApi("classes",{academicYear:state.academicYear,school:state.school,grade:"中班"});state.classOptions=data.classes||[];matchedClass=useDefault?(state.classOptions.find(c=>c===DEFAULT_CLASS||norm(c)===DEFAULT_CLASS)||""):"";state.className=matchedClass}catch(e){console.warn("班級暫時無法讀取",e);state.classOptions=[];state.className=""}finally{state.configLoading=false;if(matchedClass)await syncClass();else render()}}
async function syncClass(){if(!state.className.trim())return;state.classReady=false;state.loading=true;render();try{const data=await postApi("classResults",{gameCode:GAME_CODE,academicYear:state.academicYear,school:state.school,className:norm(state.className)});state.records=data.rows.map(r=>({recordId:r.recordId,school:r.school,className:r.className,seat:+r.seat,score:r.score/20,results:r.questions.map(q=>({word:q.word,correct:q.result==="○"})),completedAt:r.completedAt}));state.classReady=true}catch(e){state.classReady=false;console.warn("雲端成果暫時無法讀取",e)}finally{state.loading=false;render()}}
async function fetchJsonWithTimeout(url,options={},timeout=15000){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);try{const res=await fetch(url,{...options,signal:controller.signal});return await res.json()}catch(e){if(e.name==="AbortError")throw new Error("後台回應逾時");throw e}finally{clearTimeout(timer)}}
async function verifyCompleted(){try{const data=await postApi("classResults",{gameCode:GAME_CODE,academicYear:state.academicYear,school:state.school,className:norm(state.className)},8000);return Boolean((data.rows||[]).some(r=>+r.seat===state.seat))}catch{return false}}
async function saveCompleted(){const payload={gameCode:GAME_CODE,version:GAME_VERSION,academicYear:state.academicYear,school:state.school,className:norm(state.className),seat:String(state.seat),sessionId:state.sessionId,questions:state.results.map(x=>({word:x.word,result:x.correct?"○":"X"}))};try{return await postApi("submit",payload)}catch(e){if(await verifyCompleted())return {ok:true,verified:true};throw e}}
async function deleteSeat(record){if(state.deletingSeat!==null||!record.recordId)return;const label=`${state.academicYear}・${state.school}・${norm(state.className)}・${record.seat} 號`;if(!confirm(`確定要刪除 ${label} 的有效成績嗎？\n舊紀錄會保留在後台，該座號可重新闖關。`))return;state.deletingSeat=record.seat;state.reportError="";state.reportNotice="";render();try{await postApi("softDelete",{gameCode:GAME_CODE,version:GAME_VERSION,academicYear:state.academicYear,school:state.school,className:norm(state.className),seat:String(record.seat),recordId:record.recordId});state.reportNotice=`已刪除 ${record.seat} 號的有效成績，可重新闖關。`;await syncClass()}catch(e){state.reportError=e.message||"刪除失敗，請重新整理成果確認。";await syncClass()}finally{state.deletingSeat=null;render()}}
function optionsFor(card,i){const pool=i<2?sounds:pictures;return shuffle([card,...shuffle(pool.filter(x=>x.word!==card.word)).slice(0,5)])}

/* =========================================================
   Storybook UI Rendering
   ========================================================= */
function confettiHtml(count=22){
  return `<div class="confetti-layer" aria-hidden="true">${Array.from({length:count},(_,i)=>`<i style="left:${(i*17+4)%96}%;animation-delay:${(i%7)*0.09}s;animation-duration:${1.1+(i%4)*0.22}s"></i>`).join("")}</div>`;
}
function updateFullscreenButton(){const button=document.querySelector("#fullscreenToggle");if(!button)return;const active=!!document.fullscreenElement;button.setAttribute("aria-label",active?"離開全螢幕":"切換全螢幕");button.title=active?"離開全螢幕":"全螢幕";button.classList.toggle("is-active",active)}
async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch(error){console.warn("此瀏覽器無法切換全螢幕",error)}}
document.addEventListener("fullscreenchange",updateFullscreenButton);

function render(){
  const view=state.screen==="home"?home():state.screen==="game"?game():state.screen==="finish"?finish():report();
  app.innerHTML=`<button class="fullscreen-toggle" id="fullscreenToggle" type="button" aria-label="切換全螢幕" title="全螢幕"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg></button><div class="sb-stage">${view}</div>`;
  bind();
  document.querySelector("#fullscreenToggle").onclick=toggleFullscreen;
  updateFullscreenButton();
}

function bearMessage(){
  if(state.seat!==null)return `${state.seat} 號小飛行員準備好了嗎？我們一起飛向雲端吧！`;
  if(state.className&&state.classReady)return "太棒了！點一下你的座號徽章，就可以起飛囉！";
  if(state.className&&state.loading)return "小熊正在幫你準備座號徽章，稍等一下喔！";
  return "嗨！先選好班級，跟小熊飛行員一起去雲朵找語詞吧！";
}

function home(){
  const locked=new Set(classRecords().map(r=>r.seat));
  const readyToStart=!state.loading&&state.classReady&&state.seat!==null;
  return `<section class="sb-home">
    <aside class="home-left">
      <div class="home-header-badge">
        <span class="ribbon-pill">語文闖關・中下</span>
        <h1 class="home-title">語詞配對</h1>
        <p class="home-subtitle">小熊飛行員的雲朵大冒險</p>
      </div>
      <div class="mascot-stage">
        <div class="speech-bubble">${esc(bearMessage())}</div>
        <div class="mascot-medallion">
          <img src="${state.seat!==null?"assets/mascot-bear-cheer.png":"assets/mascot-bear.png"}" alt="小熊飛行員嚮導" />
        </div>
      </div>
      <div class="home-left-foot">
        <button class="btn-wood" id="report" ${state.loading||!state.classReady?"disabled":""}>📋 查看全班成果</button>
        <p class="home-copyright">© 傑尼爾教育文化事業集團 版權所有</p>
      </div>
    </aside>

    <div class="home-notebook">
      <div class="notebook-tabs">
        <span class="notebook-heading">✈️ 雲端飛行登記本</span>
        <span class="notebook-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      </div>

      <div class="identity-bar">
        <label>學年度
          <select id="academicYear" ${state.configLoading?"disabled":""}>
            <option value="">請選擇學年度</option>
            ${state.years.map(x=>`<option value="${esc(x)}" ${state.academicYear===x?"selected":""}>${esc(x)}</option>`).join("")}
          </select>
        </label>
        <label>園所
          <select id="school" ${state.configLoading||!state.academicYear?"disabled":""}>
            <option value="">${state.configLoading?"讀取中…":"請選擇園所"}</option>
            ${state.schools.map(x=>`<option value="${esc(x)}" ${state.school===x?"selected":""}>${esc(x)}</option>`).join("")}
          </select>
        </label>
        <label>班級
          <select id="className" ${state.configLoading||!state.academicYear||!state.school?"disabled":""}>
            <option value="">${state.configLoading?"讀取中…":"請選擇班級"}</option>
            ${state.classOptions.map(x=>`<option value="${esc(x)}" ${state.className===x?"selected":""}>${esc(x)}</option>`).join("")}
          </select>
        </label>
      </div>

      <div class="seat-board">
        ${state.className?(state.classReady?`
          <div class="seat-board-head">
            <h2>點選你的座號徽章</h2>
            <span class="seat-legend">✓ 表示已完成</span>
          </div>
          <div class="seat-grid">
            ${Array.from({length:30},(_,i)=>i+1).map(n=>{
              const done=locked.has(n);
              return `<button class="seat ${state.seat===n?"active":""} ${done?"is-done":""}" data-seat="${n}" ${state.loading||!state.classReady||done?"disabled":""} aria-label="${n} 號${done?"，已完成":""}">${n}</button>`;
            }).join("")}
          </div>
        `:`<div class="seat-placeholder"><span>☁️</span><div>正在讀取該班座號徽章…</div></div>`):`
          <div class="seat-placeholder"><span>🎈</span><div>請先在上方選擇學年度、園所與班級<br>座號徽章就會出現在這裡喔！</div></div>
        `}
      </div>

      <div class="notebook-footer">
        <p class="notebook-note">完成後才會新增紀錄；中途返回不留下資料。</p>
        <button class="btn-launch ${readyToStart?"ready-pulse":""}" id="start" ${readyToStart?"":"disabled"}>出發去闖關！ →</button>
      </div>
    </div>
  </section>`;
}

function game(){
  const q=state.questions[state.index],showSuccess=q.success&&(state.review||state.selected===q.word),correctNow=state.selected===q.word;
  const steps=Array.from({length:5},(_,i)=>{
    const r=state.results[i],c=r?(r.correct?"lit":"dim"):i===state.index?"current":"";
    const label=r?(r.correct?"過關":"未過關"):"未闖關";
    return `<span class="step-node ${c}" aria-label="第${i+1}題${label}">★</span>`;
  }).join("");
  const promptText=state.review?"看看正確答案，再前往下一題喔！":state.index<2?"找找看，哪一張是正確的注音？":"找找看，哪一張是正確的語詞？";
  const guideImg=correctNow?"assets/mascot-bear-cheer.png":state.review?"assets/mascot-bear-encourage.png":"assets/mascot-bear-think.png";

  return `<section class="sb-game">
    ${correctNow&&!state.saving?`${confettiHtml(24)}<div class="success-pop" role="status"><img src="assets/mascot-bear-cheer.png" alt="小熊歡呼" /><div class="success-pop-text"><strong>答對了！</strong><span>表現超棒 👍</span></div></div>`:""}
    ${state.saving?'<div class="save-status" role="status"><div class="save-spinner"></div><strong>成績儲存中…</strong><span>請稍候，不要關閉畫面</span></div>':state.saveError?`<div class="save-status save-failed" role="alert"><strong>成績尚未儲存</strong><span>${esc(state.saveError)}</span><button class="btn-launch" id="retrySave">重新儲存</button></div>`:""}

    <header class="journey-bar">
      <div class="journey-left">
        <button class="btn-back-pill" id="back" ${state.saving?"disabled":""}>← 重選</button>
        <span class="seat-chip">${esc(norm(state.className))}・${state.seat} 號</span>
        <span class="mode-chip">${state.index<2?"語詞找注音":"圖片找語詞"}</span>
      </div>
      <div class="journey-trail" aria-label="闖關進度">
        <div class="trail-steps">${steps}</div>
        <span class="round-chip">第 ${state.index+1} 題／共 5 題</span>
      </div>
    </header>

    <div class="play-stage">
      <div class="easel-col">
        <div class="guide-prompt-row">
          <div class="guide-mascot"><img src="${guideImg}" alt="小熊陪伴引導" /></div>
          <h2>${promptText}</h2>
        </div>
        <article class="easel-frame">
          <div class="card-mat"><img src="${showSuccess?q.success:q.prompt}" alt="${q.word}題目圖卡" /></div>
        </article>
      </div>

      <div class="choices-col">
        <div class="choices">
          ${state.options.map(c=>{
            const right=c.word===q.word,wrong=state.review&&!right;
            return `<button class="choice ${state.review&&right?"correct":""} ${wrong?"wrong":""}" data-word="${c.word}" ${state.selected?"disabled":""}><img src="${c.answer}" alt="${c.word}選項">${wrong?'<span class="wrong-mark">×</span>':""}</button>`;
          }).join("")}
        </div>
        ${state.review?`<div class="review-banner"><span>💡 正確答案是「${q.word}」</span><button class="btn-launch" id="next" ${state.saving||state.saveError?"disabled":""}>下一題 →</button></div>`:""}
      </div>
    </div>
  </section>`;
}

function finish(){
  const s=score();
  const parts=s===5?["恭喜過關！","表現超讚！❤️"]:s>=3?["闖關完成！","回家記得多複習喔！🌟"]:["繼續加油！","多練習會越來越棒！💪"];
  const finishImg=s===5?"assets/mascot-bear-trophy.png":s>=3?"assets/mascot-bear-cheer.png":"assets/mascot-bear-encourage.png";
  const starsHtml=Array.from({length:5},(_,i)=>`<span class="${i<s?"on":"off"}">★</span>`).join("");
  return `<section class="sb-finish">
    ${confettiHtml(28)}
    <div class="finish-card">
      <div class="finish-mascot"><img src="${finishImg}" alt="小熊慶祝過關" /></div>
      <div class="finish-stars" aria-hidden="true">${starsHtml}</div>
      <h1>${parts[0]}</h1>
      <p>${parts[1]}</p>
      <div class="finish-actions">
        <button class="btn-wood" id="report">📋 查看全班成果</button>
        <button class="btn-launch" id="home">回到首頁 🏡</button>
      </div>
    </div>
  </section>`;
}

function report(){
  const rows=classRecords(),avg=rows.length?Math.round(rows.reduce((a,r)=>a+r.score*20,0)/rows.length):"—",accuracy=classAccuracy(),review=suggestedWords();
  return `<section class="sb-report">
    <div class="report-card">
      <header class="report-head">
        <div>
          <span class="ribbon-pill">老師檢視・全班成果</span>
          <h1>${esc(state.academicYear)}・${esc(norm(state.className)||"尚未選擇班級")}・全班成果</h1>
        </div>
        <div class="report-actions">
          <button class="btn-launch" id="downloadJpg" style="padding:11px 24px;font-size:1rem;">下載待加強語詞 JPG</button>
          <button class="btn-sky" id="home">← 返回首頁</button>
        </div>
      </header>
      ${state.reportNotice?`<p class="report-notice" role="status">${esc(state.reportNotice)}</p>`:""}
      ${state.reportError?`<p class="auth-error" role="alert">${esc(state.reportError)}</p>`:""}
      <div class="summary">
        <div><strong>${rows.length}</strong><span>完成人數</span></div>
        <div><strong>${avg}${avg!=="—"?" 分":""}</strong><span>平均成績</span></div>
        <div><strong>${rows.filter(r=>r.score===5).length}</strong><span>滿分人數</span></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>座號</th>${[1,2,3,4,5].map(n=>`<th>第${n}題</th>`).join("")}<th>成績</th><th>其他成績</th><th>操作</th></tr></thead>
          <tbody>${rows.length?rows.map(r=>`<tr><td>${r.seat} 號</td>${r.results.map(x=>`<td>${esc(x.word)}<b class="${x.correct?"ok":"miss"}">${x.correct?"○":"X"}</b></td>`).join("")}<td><strong>${r.score*20} 分</strong></td><td class="hint">可擴充</td><td><button class="delete-seat" data-delete-seat="${r.seat}" ${state.deletingSeat!==null||!r.recordId?"disabled":""}>${state.deletingSeat===r.seat?"處理中…":"刪除成績"}</button></td></tr>`).join(""):`<tr><td colspan="9" class="empty">目前還沒有完成紀錄</td></tr>`}</tbody>
        </table>
      </div>
      <section class="review-words">
        <h2>📌 建議複習語詞（會匯出至 JPG 圖檔）</h2>
        <p class="section-note">出題至少 3 次且正確率低於 60% 才會列入。下載的 JPG 僅保留待加強語詞，不含分數與百分比。</p>
        ${review.length?`<div class="review-grid">${review.map(x=>`<div><strong>${x.word}</strong><span>${x.rate}%</span><small>答對 ${x.right}／出題 ${x.tries} 次</small></div>`).join("")}</div>`:`<div class="review-empty">${rows.length?"目前沒有符合複習建議條件的語詞。":"完成闖關後，這裡會整理建議複習的語詞。"}</div>`}
      </section>
      <section class="accuracy">
        <h2>各語詞正確率</h2>
        <p class="section-note">出題次數會在同一班級中自動平均；未滿 3 次的語詞暫不列入複習建議。</p>
        <div class="accuracy-grid">${accuracy.map(x=>`<div><span>${x.word}</span><strong>${x.rate===null?"—":x.rate+"%"}</strong><small>${x.tries?`答對 ${x.right}／出題 ${x.tries} 次`:"尚未出題"}</small></div>`).join("")}</div>
      </section>
    </div>
  </section>`;
}

function bind(){
  const $=s=>document.querySelector(s);
  if(state.screen==="home"){
    $("#academicYear").onchange=e=>{state.academicYear=e.target.value;loadSchools(false)};
    $("#school").onchange=e=>{state.school=e.target.value;loadClasses(false)};
    $("#className").onchange=e=>{state.className=e.target.value;state.seat=null;state.classReady=false;if(state.className)syncClass();else render()};
    document.querySelectorAll("[data-seat]").forEach(b=>b.onclick=()=>{state.seat=+b.dataset.seat;render()});
    $("#start").onclick=start;
    $("#report").onclick=()=>{state.screen="report";state.reportNotice="";state.reportError="";render()};
  }else if(state.screen==="game"){
    $("#back").onclick=reset;
    document.querySelectorAll("[data-word]").forEach(b=>b.onclick=()=>answer(b.dataset.word));
    if($("#next"))$("#next").onclick=advance;
    if($("#retrySave"))$("#retrySave").onclick=advance;
  }else if(state.screen==="finish"){
    $("#home").onclick=reset;
    $("#report").onclick=()=>{state.screen="report";render()};
  }else{
    $("#home").onclick=()=>{state.screen="home";render()};
    $("#downloadJpg").onclick=downloadReportJpg;
    document.querySelectorAll("[data-delete-seat]").forEach(b=>b.onclick=()=>{const record=classRecords().find(r=>r.seat===+b.dataset.deleteSeat);if(record)deleteSeat(record)});
  }
}

function start(){state.questions=[...balancedPick(sounds,2),...balancedPick(pictures,3)];state.index=0;state.results=[];state.selected=null;state.review=false;state.saving=false;state.saveError="";state.sessionId=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;state.options=optionsFor(state.questions[0],0);state.screen="game";render()}
function answer(word){if(state.selected)return;const q=state.questions[state.index],correct=word===q.word;state.selected=word;state.results.push({word:q.word,correct});if(correct){render();state.autoAdvanceTimer=setTimeout(()=>{state.autoAdvanceTimer=null;if(state.screen==="game")advance()},1300)}else{state.review=true;render()}}
async function advance(){if(state.screen!=="game")return;if(state.index===4){if(state.saving)return;state.saving=true;state.saveError="";render();try{const saved=await saveCompleted();const record={recordId:saved.recordId||"",school:state.school,className:norm(state.className),seat:state.seat,score:score(),results:state.results,completedAt:new Date().toISOString()};state.records=state.records.filter(r=>!(r.school===record.school&&r.className===record.className&&r.seat===record.seat));state.records.push(record);state.saving=false;state.screen="finish";render()}catch(e){state.saving=false;state.saveError=e.message||"請檢查網路後重新儲存。";render()}return}state.index++;state.selected=null;state.review=false;state.options=optionsFor(state.questions[state.index],state.index);render()}
function reset(){if(state.autoAdvanceTimer)clearTimeout(state.autoAdvanceTimer);state.autoAdvanceTimer=null;state.screen="home";state.seat=null;state.questions=[];state.index=0;state.options=[];state.results=[];state.selected=null;state.review=false;state.saving=false;state.saveError="";state.sessionId="";render()}
render();loadAcademicYears();
