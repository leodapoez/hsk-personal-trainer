(() => {
'use strict';
const A = window.HSKTrainerAPI;
if (!A) return;
const $ = q => document.querySelector(q);
const $$ = q => [...document.querySelectorAll(q)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const stripPunct = s => String(s ?? '').normalize('NFC').toLowerCase().replace(/[\s，。！？、,.!?;；:：'’\-]/g,'');
const stripHanziPunct = s => String(s ?? '').normalize('NFC').replace(/[\s，。！？、,.!?;；:：'’\-]/g,'');
const cnFont = '"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif';

function levelChips(container){
  if (!container) return;
  container.innerHTML='';
  for(let l=1;l<=9;l++){
    const b=document.createElement('button');
    b.type='button'; b.className='level-chip'+(l<=3?' active':''); b.dataset.level=l; b.textContent='Cấp '+l;
    b.onclick=()=>b.classList.toggle('active'); container.appendChild(b);
  }
}
function levels(id){return [...$(id).querySelectorAll('.level-chip.active')].map(x=>Number(x.dataset.level))}
function filteredPool(sourceId, levelId, scopeId){
  let pool=A.dedupe(A.getPool($(sourceId).value, levels(levelId)));
  const scope=$(scopeId).value, now=Date.now(), st=A.getState();
  if(scope==='DUE') pool=pool.filter(w=>{const r=st.progress[w.id];return r&&r.seen&&r.due<=now});
  if(scope==='WEAK') pool=pool.filter(w=>{const r=st.progress[w.id];return r&&(r.wrong>0||r.mastery<=1)});
  if(scope==='UNSEEN') pool=pool.filter(w=>!st.progress[w.id]||!st.progress[w.id].seen);
  return pool;
}
function mkSession(){return {items:[],i:0,correct:0,wrong:0,answered:false}}
function statHTML(s){const total=s.correct+s.wrong;return `<div class="statline"><span>Đúng</span><b>${s.correct}</b></div><div class="statline"><span>Sai</span><b>${s.wrong}</b></div><div class="statline"><span>Độ chính xác</span><b>${total?Math.round(s.correct*100/total)+'%':'—'}</b></div><div class="statline"><span>Tiến độ phiên</span><b>${Math.min(s.i+1,s.items.length)}/${s.items.length||0}</b></div>`}
function sourceBadge(w){return `<span class="source-badge">${esc(A.sourceLabel(w))}</span>`}
function pinyinKeyboard(targetId){
  const chars='āáǎà ēéěè īíǐì ōóǒò ūúǔù ǖǘǚǜ ü'.split(/\s+/).flatMap(g=>[...g]);
  return `<div class="pinyin-tools active-practice-tools"><div class="tone-row">${chars.map(c=>`<button type="button" class="tone-key skill-tone" data-target="${targetId}" data-char="${c}">${c}</button>`).join('')}</div><div class="converter"><input id="${targetId}Number" autocomplete="off" placeholder="Nhập kiểu số: ni3 hao3"><button type="button" class="btn secondary skill-convert" data-target="${targetId}">Đổi số → dấu</button></div><div class="mini">Đáp án được chấm theo Pinyin có dấu thanh. Bạn có thể gõ trực tiếp hoặc dùng bộ chuyển số → dấu.</div></div>`;
}
const toneMap={
  a:['ā','á','ǎ','à'],e:['ē','é','ě','è'],i:['ī','í','ǐ','ì'],o:['ō','ó','ǒ','ò'],u:['ū','ú','ǔ','ù'],'ü':['ǖ','ǘ','ǚ','ǜ']
};
function convertSyllable(raw){
  const m=raw.match(/^([A-Za-züÜvV:]+)([0-5])$/); if(!m)return raw;
  let syl=m[1].toLowerCase().replace(/u:|v/g,'ü'), tone=Number(m[2]); if(tone===0||tone===5)return syl;
  let idx=-1;
  if(syl.includes('a'))idx=syl.indexOf('a'); else if(syl.includes('e'))idx=syl.indexOf('e'); else if(syl.includes('ou'))idx=syl.indexOf('o');
  else {for(let i=syl.length-1;i>=0;i--){if('aeiouü'.includes(syl[i])){idx=i;break}}}
  if(idx<0)return syl; const v=syl[idx], marked=(toneMap[v]||[])[tone-1]||v; return syl.slice(0,idx)+marked+syl.slice(idx+1);
}
function numberToMarks(text){
  // Nhận cả Pinyin viết cách và viết liền: lao3shi1 -> lǎoshī, wo3ai4ni3 -> wǒàinǐ.
  return String(text||'').replace(/([A-Za-zÜüVv]+(?::)?)([0-5])/g,(m,sy,n)=>convertSyllable(sy+n));
}
function wirePinyinTools(inputId){
  const inp=$('#'+inputId); if(!inp)return;
  $$('.skill-tone[data-target="'+inputId+'"]').forEach(k=>k.onclick=()=>{
    const a=inp.selectionStart??inp.value.length,b=inp.selectionEnd??a; inp.value=inp.value.slice(0,a)+k.dataset.char+inp.value.slice(b); inp.focus();inp.setSelectionRange(a+1,a+1);
  });
  const btn=$('.skill-convert[data-target="'+inputId+'"]'); const n=$('#'+inputId+'Number'); const doConvert=()=>{const raw=(n?.value||inp.value);const converted=numberToMarks(raw);inp.value=converted;if(n)n.value=converted;inp.focus()}; if(btn)btn.onclick=doConvert;if(n)n.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doConvert()}});
}
function focusEnter(id,fn){const el=$('#'+id);if(!el)return;el.focus();el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();fn()}})}
function endPractice(box,s,title,restart){
  const total=s.correct+s.wrong, acc=total?Math.round(s.correct*100/total):0;
  box.innerHTML=`<div class="practice-finish"><div class="finish-icon">🎯</div><h3>${title}</h3><p>Đúng <b>${s.correct}</b> · Sai <b>${s.wrong}</b> · Chính xác <b>${acc}%</b></p><button class="btn primary" id="skillRestart">Làm phiên mới</button></div>`;
  $('#skillRestart').onclick=restart;
}

// ---------------- GÕ PINYIN ----------------
const tp=mkSession();
function startTP(){
  const pool=filteredPool('#tpSource','#tpLevels','#tpScope'); if(!pool.length)return A.toast('Không có từ trong phạm vi này.');
  Object.assign(tp,mkSession(),{items:A.orderWords(pool,$('#tpOrder')?.value||'PINYIN_ASC').slice(0,Number($('#tpCount').value))}); renderTP();
}
function renderTP(){
  $('#tpStats').innerHTML=statHTML(tp); const box=$('#tpMain');
  if(tp.i>=tp.items.length){endPractice(box,tp,'Hoàn thành phiên gõ Pinyin',startTP);return}
  const w=tp.items[tp.i]; tp.answered=false; const showMeaning=$('#tpHint').value==='HANZI_MEANING';
  box.innerHTML=`<div class="qmeta"><span>${sourceBadge(w)}</span><span>Câu ${tp.i+1}/${tp.items.length}</span></div><div class="practice-label">Gõ Pinyin có dấu thanh</div><div class="practice-hanzi info-hanzi">${esc(w.hanzi)}</div>${showMeaning?`<div class="practice-support info-meaning">${esc(w.meaning)}</div>`:''}<div class="answer-box"><input id="tpInput" autocomplete="off" spellcheck="false" placeholder="Ví dụ: nǐ hǎo"><div class="practice-buttons"><button class="btn primary" id="tpCheck">Kiểm tra</button><button class="btn ghost" id="tpSkip">Bỏ qua</button><button class="btn ghost" id="tpHear">🔊 Nghe từ</button></div></div>${pinyinKeyboard('tpInput')}<div id="tpFeedback"></div>`;
  wirePinyinTools('tpInput'); focusEnter('tpInput',checkTP); $('#tpCheck').onclick=checkTP; $('#tpSkip').onclick=()=>gradeTP(false,''); $('#tpHear').onclick=()=>A.speak(w.hanzi);
}
function checkTP(){if(tp.answered)return;const inp=$('#tpInput');let got=inp.value;const converted=numberToMarks(got);if(converted!==got){got=converted;inp.value=converted}gradeTP(stripPunct(got)===stripPunct(tp.items[tp.i].pinyin),got)}
function gradeTP(ok,got){
  if(tp.answered)return;tp.answered=true;const w=tp.items[tp.i]; ok?tp.correct++:tp.wrong++;A.updateProgress(w,ok); const inp=$('#tpInput');if(inp)inp.disabled=true;
  $('#tpFeedback').innerHTML=`<div class="feedback ${ok?'good':'bad'}"><strong>${ok?'✅ Chính xác':'❌ Chưa đúng'}</strong><div class="ans info-pinyin essential-info">Đáp án: <b>${esc(w.pinyin)}</b></div>${w.example?`<div class="feedback-example"><span class="info-hanzi">${esc(w.example)}</span>${w.example_pinyin?`<br><span class="info-pinyin">${esc(w.example_pinyin)}</span>`:''}</div>`:''}<button class="btn primary" id="tpNext">Câu tiếp theo</button></div>`;
  $('#tpNext').onclick=()=>{tp.i++;renderTP()};$('#tpStats').innerHTML=statHTML(tp);
}

// ---------------- GÕ HÁN ----------------
const th=mkSession();
function startTH(){
  let pool=filteredPool('#thSource','#thLevels','#thScope'); if($('#thPrompt').value==='CLOZE')pool=pool.filter(w=>w.example&&w.example.includes(w.hanzi)); if(!pool.length)return A.toast('Không có từ phù hợp trong phạm vi này.');
  Object.assign(th,mkSession(),{items:A.orderWords(pool,$('#thOrder')?.value||'PINYIN_ASC').slice(0,Number($('#thCount').value))});renderTH();
}
function thPrompt(w){
  const m=$('#thPrompt').value;
  if(m==='PINYIN')return {title:'Pinyin → chữ Hán',main:w.pinyin,mainType:'pinyin',sub:w.meaning,subType:'meaning'};
  if(m==='BOTH')return {title:'Nghĩa + Pinyin → chữ Hán',main:w.meaning,mainType:'meaning',sub:w.pinyin,subType:'pinyin'};
  if(m==='CLOZE')return {title:'Điền chữ Hán vào mẫu câu',main:w.example.replaceAll(w.hanzi,'＿＿'),mainType:'hanzi',subMeaning:w.meaning,subPinyin:w.pinyin};
  return {title:'Nghĩa Việt → chữ Hán',main:w.meaning,mainType:'meaning',sub:w.pinyin,subType:'pinyin'};
}
function renderTH(){
  $('#thStats').innerHTML=statHTML(th); const box=$('#thMain'); if(th.i>=th.items.length){endPractice(box,th,'Hoàn thành phiên gõ chữ Hán',startTH);return}
  const w=th.items[th.i],p=thPrompt(w); th.answered=false;
  box.innerHTML=`<div class="qmeta"><span>${sourceBadge(w)}</span><span>Câu ${th.i+1}/${th.items.length}</span></div><div class="practice-label">${esc(p.title)}</div><div class="practice-prompt ${$('#thPrompt').value==='CLOZE'?'chinese':''} ${p.mainType?'info-'+p.mainType:''}">${esc(p.main)}</div>${p.sub!==undefined?`<div class="practice-support ${p.subType?'info-'+p.subType:''}">${esc(p.sub)}</div>`:`<div class="practice-support"><span class="info-meaning">${esc(p.subMeaning||'')}</span><span class="info-separator"> · </span><span class="info-pinyin">${esc(p.subPinyin||'')}</span></div>`}<div class="answer-box"><input id="thInput" lang="zh-CN" inputmode="text" autocomplete="off" spellcheck="false" class="hanzi-input" placeholder="Nhập chữ Hán…"><div class="practice-buttons"><button class="btn primary" id="thCheck">Kiểm tra</button><button class="btn ghost" id="thSkip">Bỏ qua</button><button class="btn ghost" id="thHear">🔊 Nghe từ</button></div></div><div id="thFeedback"></div>`;
  focusEnter('thInput',checkTH);$('#thCheck').onclick=checkTH;$('#thSkip').onclick=()=>gradeTH(false,'');$('#thHear').onclick=()=>A.speak(w.hanzi);
}
function checkTH(){if(th.answered)return;const got=$('#thInput').value;gradeTH(stripHanziPunct(got)===stripHanziPunct(th.items[th.i].hanzi),got)}
function gradeTH(ok,got){
  if(th.answered)return;th.answered=true;const w=th.items[th.i];ok?th.correct++:th.wrong++;A.updateProgress(w,ok);const inp=$('#thInput');if(inp)inp.disabled=true;
  $('#thFeedback').innerHTML=`<div class="feedback ${ok?'good':'bad'}"><strong>${ok?'✅ Chính xác':'❌ Chưa đúng'}</strong><div class="ans hanzi-answer info-hanzi essential-info">${esc(w.hanzi)} <span class="info-pinyin">${esc(w.pinyin)}</span></div><div class="info-meaning">${esc(w.meaning)}</div>${w.example?`<div class="feedback-example info-hanzi">${esc(w.example)}</div>`:''}<button class="btn primary" id="thNext">Câu tiếp theo</button></div>`;
  $('#thNext').onclick=()=>{th.i++;renderTH()};$('#thStats').innerHTML=statHTML(th);
}

// ---------------- VIẾT TAY: XÁC MINH NÉT MIỄN PHÍ ----------------
const hw=mkSession();
let hwWriter=null,hwChars=[],hwCharIndex=0,hwCharDetails=[];
let hwAutoTimer=null,hwCountdownTimer=null,hwCurrentComplete=false,hwCurrentMistakes=0,hwRemaining=null,hwWriterToken=0;
function cjkChars(text){return [...String(text||'')].filter(c=>/[\u3400-\u9fff\uf900-\ufaff]/.test(c))}
function hwSettings(){const s=A.getState?.()||{};return {auto:s.handwritingAuto!==false,delay:Math.max(500,Math.min(10000,Number(s.handwritingDelayMs)||2000)),leniency:Math.max(0.4,Math.min(1.5,Number(s.handwritingLeniency)||1))}}
function setHWAutoStatus(text,kind=''){const el=$('#hwAutoStatus');if(!el)return;el.className='auto-recognition-status'+(kind?' '+kind:'');el.textContent=text}
function cancelHWAuto(clearStatus=false){if(hwAutoTimer){clearTimeout(hwAutoTimer);hwAutoTimer=null}if(hwCountdownTimer){clearInterval(hwCountdownTimer);hwCountdownTimer=null}if(clearStatus){const cfg=hwSettings();setHWAutoStatus(cfg.auto?`Tự xác nhận đang bật · sau khi viết đúng đủ nét, chờ ${(cfg.delay/1000).toFixed(1)} giây để chuyển tiếp.`:'Tự xác nhận đang tắt · sau khi viết đúng đủ nét, bấm “Xác nhận chữ”.')}}
function scheduleIdleNotice(remaining){cancelHWAuto();const cfg=hwSettings();if(!cfg.auto||hwCurrentComplete)return;const deadline=performance.now()+cfg.delay;const tick=()=>{if(hwCurrentComplete)return cancelHWAuto();const left=Math.max(0,deadline-performance.now());setHWAutoStatus(`Dừng bút… kiểm tra trạng thái sau ${(left/1000).toFixed(1)} giây`,'waiting')};tick();hwCountdownTimer=setInterval(tick,100);hwAutoTimer=setTimeout(()=>{cancelHWAuto();if(hwCurrentComplete)return;setHWAutoStatus(`Chưa hoàn thành chữ · còn ${Math.max(0,Number(remaining)||0)} nét đúng cần viết. Hệ thống không đoán chữ để tránh nhận diện sai.`,'busy')},cfg.delay)}
function scheduleAutoAccept(){cancelHWAuto();const cfg=hwSettings();const btn=$('#hwConfirmChar');if(btn)btn.disabled=false;if(!cfg.auto){setHWAutoStatus('Đã viết đúng đủ nét ✅ · bấm “Xác nhận chữ” để tiếp tục.','ready');return}const deadline=performance.now()+cfg.delay;const tick=()=>{const left=Math.max(0,deadline-performance.now());setHWAutoStatus(`Đã viết đúng đủ nét ✅ · tự xác nhận sau ${(left/1000).toFixed(1)} giây`,'ready')};tick();hwCountdownTimer=setInterval(tick,100);hwAutoTimer=setTimeout(()=>{cancelHWAuto();if(hwCurrentComplete&&!hw.answered)confirmCurrentChar()},cfg.delay)}
function renderHWStatus(){const el=$('#hwSupport');if(!el)return;const ok=!!window.HanziWriter;el.innerHTML=`<div class="recognizer-status ${ok?'ok':'warn'}"><span>●</span><div><b>${ok?'HanziWriter: sẵn sàng':'HanziWriter: chưa tải được'}</b><small>${ok?'Miễn phí, không dùng API trả phí. Chấm trực tiếp từng nét so với chữ mục tiêu bị ẩn.':'Bạn vẫn có thể dùng ô nhập dự phòng bằng bàn phím viết tay tiếng Trung của hệ điều hành.'}</small></div></div>`}
function startHW(){
  let pool=filteredPool('#hwSource','#hwLevels','#hwScope').filter(w=>cjkChars(w.hanzi).length>0);if(!pool.length)return A.toast('Không có từ chữ Hán phù hợp trong phạm vi này.');
  Object.assign(hw,mkSession(),{items:A.orderWords(pool,$('#hwOrder')?.value||'PINYIN_ASC').slice(0,Number($('#hwCount').value))});renderHW();
}
function hwPrompt(w){const m=$('#hwPrompt').value;if(m==='MEANING')return {main:w.meaning,mainType:'meaning',sub:'',subType:null};if(m==='PINYIN')return {main:w.pinyin,mainType:'pinyin',sub:'',subType:null};return {main:w.meaning,mainType:'meaning',sub:w.pinyin,subType:'pinyin'}}
function renderHW(){
  $('#hwStats').innerHTML=statHTML(hw);renderHWStatus();const box=$('#hwMain'); if(hw.i>=hw.items.length){endPractice(box,hw,'Hoàn thành phiên viết tay',startHW);return}
  const w=hw.items[hw.i],p=hwPrompt(w);cancelHWAuto();try{hwWriter?.cancelQuiz?.()}catch{}hw.answered=false;hwChars=[];hwCharIndex=0;hwCharDetails=[];hwCurrentComplete=false;hwCurrentMistakes=0;hwRemaining=null;hwWriterToken++;
  box.innerHTML=`<div class="qmeta"><span>${sourceBadge(w)}</span><span>Câu ${hw.i+1}/${hw.items.length}</span></div><div class="practice-label">Viết đúng từng nét — chữ đáp án được ẩn</div><div class="practice-prompt ${p.mainType?'info-'+p.mainType:''}">${esc(p.main)}</div>${p.sub?`<div class="practice-support ${p.subType?'info-'+p.subType:''}">${esc(p.sub)}</div>`:''}<div id="hwCharProgress"></div><div class="writing-zone"><div class="hanzi-quiz-shell"><div id="hwWriter" class="hanzi-writer-target" aria-label="Vùng luyện viết chữ Hán"></div></div><div class="canvas-actions"><button class="btn ghost" id="hwRestartChar">↻ Viết lại chữ</button><button class="btn ghost" id="hwPrevChar">← Chữ trước</button><button class="btn primary" id="hwConfirmChar" disabled>Xác nhận chữ</button></div></div><div id="hwAutoStatus" class="auto-recognition-status"></div><div id="hwStrokeInfo" class="stroke-info"></div><div class="fallback-recognition"><label>Nếu HanziWriter không tải được dữ liệu nét, nhập cả từ bằng bàn phím viết tay tiếng Trung của hệ điều hành:</label><div class="fallback-row"><input id="hwFallback" lang="zh-CN" inputmode="text" autocomplete="off" class="hanzi-input" placeholder="Nhập chữ Hán…"><button class="btn secondary" id="hwUseFallback">Chấm cả từ</button></div></div><div class="practice-buttons"><button class="btn ghost" id="hwReveal">Xem đáp án</button><button class="btn ghost" id="hwSkip">Bỏ qua</button><button class="btn ghost" id="hwHear">🔊 Nghe từ</button></div><div id="hwFeedback"></div>`;
  renderCharProgress();setupWriter();cancelHWAuto(true);$('#hwRestartChar').onclick=restartCurrentChar;$('#hwPrevChar').onclick=previousChar;$('#hwConfirmChar').onclick=confirmCurrentChar;$('#hwUseFallback').onclick=()=>gradeHW($('#hwFallback').value,'fallback');$('#hwFallback').addEventListener('keydown',e=>{if(e.key==='Enter')gradeHW(e.target.value,'fallback')});$('#hwReveal').onclick=()=>showHWAnswer(false);$('#hwSkip').onclick=()=>showHWAnswer(true);$('#hwHear').onclick=()=>A.speak(w.hanzi);
}
function renderCharProgress(){
  const el=$('#hwCharProgress');if(!el||!hw.items[hw.i])return;const chars=cjkChars(hw.items[hw.i].hanzi),len=chars.length;
  el.innerHTML=`<div class="char-progress-label">Đang viết chữ ${Math.min(hwCharIndex+1,len)}/${len}</div><div class="char-slots">${Array.from({length:len},(_,i)=>`<span class="char-slot ${i===hwCharIndex?'current':''} ${i<hwChars.length?'filled':''}">${i<hwChars.length?`<span class="info-hanzi">${esc(hwChars[i])}</span>`:'＿'}</span>`).join('')}</div><div class="mini" style="text-align:center">Website biết chữ mục tiêu nhưng không hiển thị. Mỗi nét được đối chiếu với mẫu chuẩn; nét sai không được tính là hoàn thành.</div>`;
}
function writerSize(){const host=$('#hwWriter');const parent=host?.parentElement;const w=Math.floor(parent?.getBoundingClientRect?.().width||390);return Math.max(280,Math.min(420,w-20))}
function updateStrokeInfo(text,kind=''){const el=$('#hwStrokeInfo');if(!el)return;el.className='stroke-info'+(kind?' '+kind:'');el.innerHTML=text}
function setupWriter(){
  cancelHWAuto();const w=hw.items[hw.i];if(!w||hw.answered)return;const chars=cjkChars(w.hanzi),target=chars[hwCharIndex],host=$('#hwWriter');if(!host||!target)return;
  host.innerHTML='';hwCurrentComplete=false;hwCurrentMistakes=0;hwRemaining=null;const confirm=$('#hwConfirmChar');if(confirm)confirm.disabled=true;updateStrokeInfo('<b>Đang tải dữ liệu nét…</b>');
  if(!window.HanziWriter){updateStrokeInfo('<b>Không tải được HanziWriter.</b> Hãy dùng ô nhập dự phòng.','bad');setHWAutoStatus('Không có bộ chấm nét trên thiết bị này.');return}
  const token=++hwWriterToken,size=writerSize(),cfg=hwSettings();
  try{
    hwWriter=HanziWriter.create(host,target,{width:size,height:size,padding:24,showCharacter:false,showOutline:false,drawingWidth:7,strokeWidth:5,highlightOnComplete:true,showHintAfterMisses:false,onLoadCharDataSuccess:()=>{if(token!==hwWriterToken)return;updateStrokeInfo('<b>Sẵn sàng.</b> Bắt đầu viết nét đầu tiên.');},onLoadCharDataError:()=>{if(token!==hwWriterToken)return;updateStrokeInfo('<b>Không tải được dữ liệu nét của chữ này.</b> Hãy dùng ô nhập dự phòng.','bad');setHWAutoStatus('Dữ liệu nét không khả dụng cho chữ này.');}});
    host.onpointerdown=()=>{if(token!==hwWriterToken||hw.answered)return;cancelHWAuto();if(!hwCurrentComplete)setHWAutoStatus('Đang ghi nhận và đối chiếu nét bút…','busy')};
    hwWriter.quiz({
      leniency:cfg.leniency,showHintAfterMisses:false,highlightOnComplete:true,acceptBackwardsStrokes:false,
      onMistake:data=>{if(token!==hwWriterToken||hw.answered)return;hwCurrentMistakes=data.totalMistakes||0;hwRemaining=data.strokesRemaining;updateStrokeInfo(`<b>❌ Nét chưa khớp.</b> Thử lại nét hiện tại · tổng lỗi nét: ${hwCurrentMistakes}.`,'bad');scheduleIdleNotice(data.strokesRemaining);},
      onCorrectStroke:data=>{if(token!==hwWriterToken||hw.answered)return;hwCurrentMistakes=data.totalMistakes||0;hwRemaining=data.strokesRemaining;const n=(Number(data.strokeNum)||0)+1;updateStrokeInfo(`<b>✅ Nét ${n} đúng.</b> Còn ${data.strokesRemaining} nét · lỗi nét hiện tại: ${hwCurrentMistakes}.`,'good');scheduleIdleNotice(data.strokesRemaining);},
      onComplete:data=>{if(token!==hwWriterToken||hw.answered)return;hwCurrentComplete=true;hwCurrentMistakes=data.totalMistakes||0;hwRemaining=0;updateStrokeInfo(`<b>✅ Đã hoàn thành đúng chữ.</b> Tổng lỗi nét trước khi hoàn thành: ${hwCurrentMistakes}.`,'good');scheduleAutoAccept();}
    });
  }catch(err){updateStrokeInfo('<b>Không khởi tạo được bộ chấm nét.</b> Hãy dùng ô nhập dự phòng.','bad');setHWAutoStatus('Bộ chấm nét gặp lỗi khởi tạo.');}
}
function restartCurrentChar(){if(hw.answered)return;cancelHWAuto();try{hwWriter?.cancelQuiz?.()}catch{}hwWriterToken++;setupWriter();renderCharProgress()}
function previousChar(){if(hw.answered||hwCharIndex<=0)return;cancelHWAuto();try{hwWriter?.cancelQuiz?.()}catch{}hwCharIndex--;hwChars=hwChars.slice(0,hwCharIndex);hwCharDetails=hwCharDetails.slice(0,hwCharIndex);renderCharProgress();setupWriter()}
function confirmCurrentChar(){
  if(hw.answered)return;if(!hwCurrentComplete)return A.toast('Bạn chưa viết đúng đủ các nét của chữ này.');cancelHWAuto();const w=hw.items[hw.i],chars=cjkChars(w.hanzi),target=chars[hwCharIndex];hwChars[hwCharIndex]=target;hwCharDetails[hwCharIndex]={char:target,mistakes:hwCurrentMistakes};hwCharIndex++;
  if(hwCharIndex>=chars.length){gradeHW(hwChars.join(''),'verified');return}
  renderCharProgress();setupWriter();A.toast(`Đã xác minh “${target}”. Tiếp tục chữ ${hwCharIndex+1}/${chars.length}.`)
}
function gradeHW(text,method='verified'){
  if(hw.answered)return;cancelHWAuto();try{hwWriter?.cancelQuiz?.()}catch{}const w=hw.items[hw.i],expectedWord=cjkChars(w.hanzi).join(''),got=cjkChars(text).join('');if(!got)return A.toast('Chưa có kết quả để chấm.');const ok=got===expectedWord;hw.answered=true;ok?hw.correct++:hw.wrong++;A.updateProgress(w,ok);const totalStrokeMistakes=hwCharDetails.reduce((sum,x)=>sum+(x?.mistakes||0),0);const strokeLine=method==='verified'?`<div class="stroke-summary">Lỗi nét trong quá trình viết: <b>${totalStrokeMistakes}</b></div>`:'';
  $('#hwFeedback').innerHTML=`<div class="feedback ${ok?'good':'bad'}"><strong>${ok?'✅ Viết đúng chữ mục tiêu':'❌ Chưa khớp đáp án'}</strong><div>Bạn tạo được: <b class="hanzi-answer-inline info-hanzi essential-info">${esc(got)}</b></div><div class="ans hanzi-answer info-hanzi essential-info">Đáp án: ${esc(expectedWord)} <span class="info-pinyin">${esc(w.pinyin)}</span></div>${strokeLine}<div class="info-meaning">${esc(w.meaning)}</div>${w.example?`<div class="feedback-example info-hanzi">${esc(w.example)}</div>`:''}<button class="btn primary" id="hwNext">Từ tiếp theo</button></div>`;$('#hwNext').onclick=()=>{hw.i++;renderHW()};$('#hwStats').innerHTML=statHTML(hw)
}
function showHWAnswer(skip){if(hw.answered)return;cancelHWAuto();try{hwWriter?.cancelQuiz?.()}catch{}const w=hw.items[hw.i],answer=cjkChars(w.hanzi).join('');hw.answered=true;if(skip){hw.wrong++;A.updateProgress(w,false)}$('#hwFeedback').innerHTML=`<div class="feedback ${skip?'bad':''}"><strong>${skip?'⏭ Đã bỏ qua':'👀 Đáp án'}</strong><div class="ans hanzi-answer info-hanzi essential-info">${esc(answer)} <span class="info-pinyin">${esc(w.pinyin)}</span></div><div class="info-meaning">${esc(w.meaning)}</div>${w.example?`<div class="feedback-example info-hanzi">${esc(w.example)}</div>`:''}<button class="btn primary" id="hwNext">Từ tiếp theo</button></div>`;$('#hwNext').onclick=()=>{hw.i++;renderHW()};$('#hwStats').innerHTML=statHTML(hw)}

function init(){
  levelChips($('#tpLevels'));levelChips($('#thLevels'));levelChips($('#hwLevels'));
  $('#tpStart').onclick=startTP;$('#thStart').onclick=startTH;$('#hwStart').onclick=startHW;
  // Keep page titles and handwriting support fresh when switching views.
  document.querySelector('[data-view="type-pinyin"]')?.addEventListener('click',()=>$('#tpStats').innerHTML=statHTML(tp));
  document.querySelector('[data-view="type-hanzi"]')?.addEventListener('click',()=>$('#thStats').innerHTML=statHTML(th));
  document.querySelector('[data-view="handwrite"]')?.addEventListener('click',()=>{renderHWStatus()});
  $('#tpStats').innerHTML=statHTML(tp);$('#thStats').innerHTML=statHTML(th);$('#hwStats').innerHTML=statHTML(hw);renderHWStatus();
}
init();
})();
