(() => {
'use strict';
const DATA = window.VOCAB_DATA || [];
const META = window.VOCAB_META || {};
const STORE='hskPersonalTrainer_v1';
const DEFAULT={dailyGoal:40,dedupe:true,showHanzi:true,showPinyin:true,showMeaning:true,handwritingAuto:true,handwritingDelayMs:2000,handwritingLeniency:1,progress:{},daily:{},lastActive:null,streak:0};
let state=loadState(); let activeView='dashboard';
let scanSession=[], scanIndex=0, scanRevealed=false;
let quiz={items:[],i:0,correct:0,wrong:0,answered:false,mode:null,word:null};
let dictPage=1;

function loadState(){try{return {...DEFAULT,...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{return structuredClone(DEFAULT)}}
function save(){localStorage.setItem(STORE,JSON.stringify(state));updateHeader()}
function rec(id){return state.progress[id] || (state.progress[id]={seen:0,correct:0,wrong:0,mastery:0,due:0,last:0})}
function todayKey(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function touchDaily(){const t=todayKey();state.daily[t]=(state.daily[t]||0)+1; const last=state.lastActive; if(last!==t){const y=new Date();y.setDate(y.getDate()-1);const yk=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');state.streak=(last===yk)?(state.streak||0)+1:1;state.lastActive=t;}save()}
function updateProgress(w,ok){const r=rec(w.id);r.seen++;r.last=Date.now();if(ok){r.correct++;r.mastery=Math.min(5,r.mastery+1);const days=[0,1,3,7,14,30][r.mastery]||30;r.due=Date.now()+days*86400000}else{r.wrong++;r.mastery=Math.max(0,r.mastery-1);r.due=Date.now()}touchDaily()}
function scanMark(w,kind){const r=rec(w.id);r.seen++;r.last=Date.now();if(kind==='known')r.mastery=Math.max(r.mastery,3);else if(kind==='unsure')r.mastery=Math.max(1,Math.min(r.mastery,2));else{r.mastery=0;r.wrong++;}r.due=kind==='known'?Date.now()+7*86400000:Date.now();touchDaily()}
function fmt(n){return Number(n||0).toLocaleString('vi-VN')}
function sourceLabel(w){return w.source==='PREP'?`PREP HSK${w.level}`:`Ngoài PREP · Cấp ${w.level}`}
function getPool(source='ALL',levels=[]){return DATA.filter(w=>(source==='ALL'||w.source===source)&&(!levels.length||levels.includes(Number(w.level))))}
function dedupe(arr){if(!state.dedupe)return arr;const seen=new Set();return arr.filter(w=>{const k=w.hanzi+'|'+w.pinyin;if(seen.has(k))return false;seen.add(k);return true})}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const PINYIN_COLLATOR=new Intl.Collator('en',{sensitivity:'base',numeric:true});
function pinyinSortKey(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ü/g,'u').replace(/[^a-z]/g,'')}
function comparePinyin(a,b){const ka=pinyinSortKey(a?.pinyin),kb=pinyinSortKey(b?.pinyin);let c=PINYIN_COLLATOR.compare(ka,kb);if(c)return c;c=PINYIN_COLLATOR.compare(String(a?.pinyin||''),String(b?.pinyin||''));if(c)return c;c=Number(a?.level||0)-Number(b?.level||0);if(c)return c;c=Number(a?.sheet_page||0)-Number(b?.sheet_page||0);if(c)return c;return Number(a?.sheet_row||0)-Number(b?.sheet_row||0)}
function orderWords(arr,mode='PINYIN_ASC'){if(mode==='RANDOM')return shuffle(arr);if(mode==='SHEET')return [...arr].sort((a,b)=>(Number(a.sheet_page||0)-Number(b.sheet_page||0))||(Number(a.sheet_row||0)-Number(b.sheet_row||0)));const out=[...arr].sort(comparePinyin);return mode==='PINYIN_DESC'?out.reverse():out}
function normBasic(s){return (s||'').toString().normalize('NFC').toLowerCase().replace(/[\s，。！？、,.!?;；:：'’\-]/g,'')}
function normText(s){return (s||'').toString().normalize('NFC').toLowerCase().trim().replace(/\s+/g,' ')}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function speak(text){if(!('speechSynthesis' in window))return toast('Trình duyệt không hỗ trợ đọc âm.');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.82;speechSynthesis.speak(u)}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function $(q){return document.querySelector(q)} function $$(q){return [...document.querySelectorAll(q)]}
function isVisible(type){
  if(type==='hanzi')return state.showHanzi!==false;
  if(type==='pinyin')return state.showPinyin!==false;
  if(type==='meaning')return state.showMeaning!==false;
  return true;
}
function setVisibility(type,value){
  if(type==='hanzi')state.showHanzi=!!value;
  else if(type==='pinyin')state.showPinyin=!!value;
  else if(type==='meaning')state.showMeaning=!!value;
  save();applyVisibility();
}
function applyVisibility(){
  document.body.classList.toggle('hide-hanzi',!isVisible('hanzi'));
  document.body.classList.toggle('hide-pinyin',!isVisible('pinyin'));
  document.body.classList.toggle('hide-meaning',!isVisible('meaning'));
  $$('[data-visibility]').forEach(b=>{
    const on=isVisible(b.dataset.visibility);
    b.classList.toggle('active',on);
    b.setAttribute('aria-pressed',String(on));
  });
  const h=$('#showHanziToggle'),p=$('#showPinyinToggle'),m=$('#showMeaningToggle');
  if(h)h.checked=isVisible('hanzi');if(p)p.checked=isVisible('pinyin');if(m)m.checked=isVisible('meaning');
}
function quizPromptType(m){
  if(['hanzi_meaning','hanzi_pinyin','hanzi_pos','cloze','sentence_pinyin'].includes(m))return 'hanzi';
  if(['meaning_hanzi','meaning_pinyin'].includes(m))return 'meaning';
  if(['pinyin_hanzi','pinyin_meaning'].includes(m))return 'pinyin';
  return null;
}

function initNav(){ $$('.nav button[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view))); $$('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go))); $$('.nav-folder').forEach(d=>d.addEventListener('toggle',()=>{if(!d.open||window.innerWidth<=700)return;$$('.nav-folder').forEach(other=>{if(other!==d)other.open=false})})) }
function showView(v){activeView=v;$$('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+v));$$('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===v));const activeBtn=document.querySelector(`.nav button[data-view="${v}"]`);if(activeBtn){const folder=activeBtn.closest('.nav-folder');if(folder&&window.innerWidth>700)folder.open=true}const titles={dashboard:'Tổng quan',scan:'Quét nhanh',quiz:'Kiểm tra hỗn hợp','type-pinyin':'Kiểm tra Pinyin','type-hanzi':'Kiểm tra chữ Hán',handwrite:'Kiểm tra viết tay','sentence-lab':'Ngữ pháp & cấu trúc câu','smart-vocab':'Học từ thông minh',flashcards:'Flashcard từ vựng',dictionary:'Kho từ vựng',radicals:'214 Bộ thủ',progress:'Tiến độ',settings:'Cài đặt'};$('#pageTitle').textContent=titles[v]||''; if(v==='dashboard')renderDashboard();if(v==='dictionary')renderDictionary();if(v==='progress')renderProgress();if(v==='settings')renderSettings();applyVisibility()}
function updateHeader(){const t=todayKey();$('#todayPill').textContent=`Hôm nay ${state.daily[t]||0}/${state.dailyGoal}`;$('#streakPill').textContent=`🔥 ${state.streak||0} ngày`}

function modules(){const arr=[];for(let l=1;l<=3;l++)arr.push({source:'PREP',level:l,label:`PREP HSK${l}`});for(let l=1;l<=9;l++)arr.push({source:'OUTSIDE_PREP',level:l,label:`Ngoài PREP · Cấp ${l}`});return arr}
function moduleStats(m){const pool=DATA.filter(w=>w.source===m.source&&w.level===m.level);let seen=0,mastered=0,c=0,a=0;for(const w of pool){const r=state.progress[w.id];if(r&&r.seen){seen++;c+=r.correct||0;a+=(r.correct||0)+(r.wrong||0);if(r.mastery>=4)mastered++}}return {total:pool.length,seen,mastered,acc:a?Math.round(c*100/a):0}}
function overall(){let seen=0,mastered=0,c=0,a=0;for(const w of DATA){const r=state.progress[w.id];if(r&&r.seen){seen++;c+=r.correct||0;a+=(r.correct||0)+(r.wrong||0);if(r.mastery>=4)mastered++}}return {seen,mastered,acc:a?Math.round(c*100/a):0}}
function renderDashboard(){const o=overall();$('#kpis').innerHTML=`
<div class="card kpi"><div class="label">Kho luyện</div><div class="value">${fmt(META.training_record_count)}</div><div class="sub">bản ghi đang dùng</div></div>
<div class="card kpi"><div class="label">PREP H1–H3</div><div class="value">${fmt(META.prep_count)}</div><div class="sub">tách riêng theo chương trình</div></div>
<div class="card kpi"><div class="label">Ngoài PREP</div><div class="value">${fmt(META.outside_prep_count)}</div><div class="sub">phân theo Cấp 1–9</div></div>
<div class="card kpi"><div class="label">Đã gặp</div><div class="value">${fmt(o.seen)}</div><div class="sub">trên trình duyệt này</div></div>
<div class="card kpi"><div class="label">Độ chính xác</div><div class="value">${o.acc}%</div><div class="sub">các câu đã chấm</div></div>`;
const focus=modules().slice(0,6);$('#roadmap').innerHTML=focus.map(m=>{const s=moduleStats(m),pct=s.total?Math.round(s.mastered*100/s.total):0;return `<div class="module"><div class="tag">${m.source==='PREP'?'Lộ trình chính':'Mở rộng'}</div><strong>${m.label}</strong><small>${s.mastered}/${s.total} từ thuộc</small><div class="progress" style="margin:9px 0"><span style="width:${pct}%"></span></div><small>${pct}% hoàn thành · ${s.acc}% chính xác</small></div>`}).join('');
const due=DATA.filter(w=>{const r=state.progress[w.id];return r&&r.seen&&r.due<=Date.now()}).length;const weak=DATA.filter(w=>{const r=state.progress[w.id];return r&&(r.wrong>0||r.mastery<=1)}).length;$('#todaySummary').innerHTML=`<div class="statline"><span>Đến hạn ôn</span><b>${fmt(due)}</b></div><div class="statline"><span>Từ yếu / từng sai</span><b>${fmt(weak)}</b></div><div class="statline"><span>Đã thuộc</span><b>${fmt(o.mastered)}</b></div>`}

function levelChips(container){container.innerHTML='';for(let l=1;l<=9;l++){const b=document.createElement('button');b.type='button';b.className='level-chip'+(l<=3?' active':'');b.dataset.level=l;b.textContent='Cấp '+l;b.onclick=()=>b.classList.toggle('active');container.appendChild(b)}}
function selectedLevels(container){return [...container.querySelectorAll('.level-chip.active')].map(x=>Number(x.dataset.level))}

function startScan(){let pool=dedupe(getPool($('#scanSource').value,selectedLevels($('#scanLevels'))));if(!pool.length)return toast('Không có từ trong phạm vi này.');scanSession=orderWords(pool,$('#scanOrder')?.value||'PINYIN_ASC').slice(0,Number($('#scanCount').value));scanIndex=0;scanRevealed=false;renderScan()}
function renderScan(){const box=$('#scanCard');if(scanIndex>=scanSession.length){box.innerHTML=`<div><h3>Hoàn thành phiên quét 🎉</h3><p style="color:var(--muted)">Bạn đã phân loại ${scanSession.length} từ. Các từ chưa chắc/chưa biết sẽ được ưu tiên ở phần Kiểm tra.</p><button class="btn primary" onclick="document.querySelector('[data-view=quiz]').click()">Chuyển sang ôn sâu</button></div>`;renderDashboard();return}const w=scanSession[scanIndex];box.innerHTML=`<div class="source-badge">${sourceLabel(w)} · ${scanIndex+1}/${scanSession.length}</div><div class="hanzi info-hanzi">${esc(w.hanzi)}</div><button class="audio" id="scanAudio">🔊</button><div id="scanReveal" class="${scanRevealed?'':'hidden'}"><div class="pinyin info-pinyin">${esc(w.pinyin)}</div><div class="meaning info-meaning">${esc(w.meaning)}</div><div class="pos">${esc(w.pos)}</div>${w.example?`<div class="example info-hanzi">${esc(w.example)}</div>`:''}</div><div class="card-actions"><button class="btn ghost" id="revealBtn">${scanRevealed?'Ẩn đáp án':'Xem đáp án'}</button><button class="btn bad" data-mark="unknown">Chưa biết</button><button class="btn warn" data-mark="unsure">Chưa chắc</button><button class="btn good" data-mark="known">Biết</button></div>`;$('#scanAudio').onclick=()=>speak(w.hanzi);$('#revealBtn').onclick=()=>{scanRevealed=!scanRevealed;renderScan()};$$('[data-mark]').forEach(b=>b.onclick=()=>{scanMark(w,b.dataset.mark);scanIndex++;scanRevealed=false;renderScan()})}

const QUIZ_MODES={
 hanzi_meaning:{label:'Chọn nghĩa đúng',kind:'mcq'},meaning_hanzi:{label:'Gõ chữ Hán',kind:'input'},hanzi_pinyin:{label:'Gõ Pinyin có dấu',kind:'pinyin'},pinyin_hanzi:{label:'Gõ chữ Hán',kind:'input'},meaning_pinyin:{label:'Gõ Pinyin có dấu',kind:'pinyin'},pinyin_meaning:{label:'Chọn nghĩa đúng',kind:'mcq'},hanzi_pos:{label:'Chọn từ loại',kind:'mcq'},cloze:{label:'Điền từ vào mẫu câu',kind:'input'},sentence_pinyin:{label:'Gõ Pinyin của mẫu câu',kind:'pinyin'}
};
function enabledModes(){return $$('#modeList input:checked').map(x=>x.value)}
function availableMode(w,m){const promptType=quizPromptType(m);if(promptType&&!isVisible(promptType))return false;if(m==='cloze')return !!w.example&&w.example.includes(w.hanzi);if(m==='sentence_pinyin')return !!w.example&&!!w.example_pinyin;return true}
function startQuiz(scopeOverride=null){let pool=dedupe(getPool($('#quizSource').value,selectedLevels($('#quizLevels'))));const scope=scopeOverride||$('#quizScope').value;const now=Date.now();if(scope==='DUE')pool=pool.filter(w=>{const r=state.progress[w.id];return r&&r.seen&&r.due<=now});if(scope==='WEAK')pool=pool.filter(w=>{const r=state.progress[w.id];return r&&(r.wrong>0||r.mastery<=1)});if(scope==='UNSEEN')pool=pool.filter(w=>!state.progress[w.id]?.seen);const modes=enabledModes();if(!modes.length)return toast('Hãy chọn ít nhất một dạng câu hỏi.');const usable=modes.filter(m=>!quizPromptType(m)||isVisible(quizPromptType(m)));if(!usable.length)return toast('Các dạng đã chọn đang dùng trường thông tin bạn đã ẩn. Hãy bật lại Hán/Pinyin/Nghĩa hoặc chọn dạng khác.');pool=pool.filter(w=>usable.some(m=>availableMode(w,m)));if(!pool.length)return toast('Không có từ phù hợp với bộ lọc và cài đặt hiển thị.');const count=Math.min(Number($('#quizCount').value),pool.length);quiz={items:orderWords(pool,$('#quizOrder')?.value||'PINYIN_ASC').slice(0,count),i:0,correct:0,wrong:0,answered:false,mode:null,word:null};renderQuiz()}
function chooseMode(w){const m=shuffle(enabledModes().filter(x=>availableMode(w,x)));return m[0]||'hanzi_meaning'}
function distractors(w,field,n=3){return shuffle(DATA.filter(x=>x.id!==w.id&&x[field]&&x[field]!==w[field])).slice(0,n).map(x=>x[field])}
function pinyinTools(){const keys='ā á ǎ à ē é ě è ī í ǐ ì ō ó ǒ ò ū ú ǔ ù ǖ ǘ ǚ ǜ ü'.split(' ');return `<div class="pinyin-tools"><div class="tone-row">${keys.map(k=>`<button type="button" class="tone-key" data-char="${k}">${k}</button>`).join('')}</div><div class="converter"><input id="numberPinyin" placeholder="Hoặc gõ số: zhe4 li3 zhen1 piao4 liang5"><button type="button" class="btn secondary" id="convertTone">Chuyển số → dấu</button></div><div class="mini">Kiểm tra giữ nguyên dấu thanh; chỉ bỏ qua khoảng trắng, dấu câu và chữ hoa/thường.</div></div>`}
function numberToMarks(text){
  const map={a:['a','ā','á','ǎ','à'],e:['e','ē','é','ě','è'],i:['i','ī','í','ǐ','ì'],o:['o','ō','ó','ǒ','ò'],u:['u','ū','ú','ǔ','ù'],'ü':['ü','ǖ','ǘ','ǚ','ǜ']};
  const convert=(sy,n)=>{
    let s=String(sy||'').toLowerCase().replace(/u:/g,'ü').replace(/v/g,'ü'),tone=Number(n);
    if(!tone||tone===5)return s;
    let idx=s.indexOf('a');
    if(idx<0)idx=s.indexOf('e');
    if(idx<0&&s.includes('ou'))idx=s.indexOf('o');
    if(idx<0){for(let j=s.length-1;j>=0;j--){if('aeiouü'.includes(s[j])){idx=j;break}}}
    if(idx<0)return s;
    const ch=s[idx];
    return s.slice(0,idx)+(map[ch]?.[tone]||ch)+s.slice(idx+1);
  };
  // Dùng replace toàn chuỗi thay vì tách theo khoảng trắng để nhận cả dạng viết liền:
  // lao3shi1 -> lǎoshī, zhong1guo2 -> zhōngguó, nv3 -> nǚ, lu:4 -> lǜ.
  return String(text||'').replace(/([A-Za-zÜüVv]+(?::)?)([0-5])/g,(m,sy,n)=>convert(sy,n));
}
function quizPrompt(w,m){
  if(m==='hanzi_meaning')return {title:'Chọn nghĩa tiếng Việt đúng',main:w.hanzi,mainType:'hanzi',sub:w.pinyin,subType:'pinyin'};
  if(m==='meaning_hanzi')return {title:'Gõ chữ Hán tương ứng',main:w.meaning,mainType:'meaning',sub:w.pos,subType:null};
  if(m==='hanzi_pinyin')return {title:'Gõ Pinyin có dấu thanh',main:w.hanzi,mainType:'hanzi',sub:w.meaning,subType:'meaning'};
  if(m==='pinyin_hanzi')return {title:'Gõ chữ Hán tương ứng',main:w.pinyin,mainType:'pinyin',sub:w.meaning,subType:'meaning'};
  if(m==='meaning_pinyin')return {title:'Gõ Pinyin có dấu thanh',main:w.meaning,mainType:'meaning',sub:w.hanzi,subType:'hanzi'};
  if(m==='pinyin_meaning')return {title:'Chọn nghĩa tiếng Việt đúng',main:w.pinyin,mainType:'pinyin',sub:w.hanzi,subType:'hanzi'};
  if(m==='hanzi_pos')return {title:'Chọn từ loại đúng',main:w.hanzi,mainType:'hanzi',sub:w.pinyin,subType:'pinyin'};
  if(m==='cloze')return {title:'Điền từ bị khuyết trong mẫu câu',main:w.example.replaceAll(w.hanzi,'＿＿'),mainType:'hanzi',sub:w.meaning,subType:'meaning'};
  if(m==='sentence_pinyin')return {title:'Gõ Pinyin của mẫu câu theo đáp án Sheet',main:w.example,mainType:'hanzi',sub:w.meaning,subType:'meaning'};
  return {title:'',main:w.hanzi,mainType:'hanzi',sub:'',subType:null};
}
function renderQuiz(){const box=$('#quizMain');if(quiz.i>=quiz.items.length){const total=quiz.correct+quiz.wrong,acc=total?Math.round(quiz.correct*100/total):0;box.innerHTML=`<div style="text-align:center;padding:60px 10px"><div style="font-size:52px">🎯</div><h3>Hoàn thành bài kiểm tra</h3><p>Đúng <b>${quiz.correct}</b> · Sai <b>${quiz.wrong}</b> · Chính xác <b>${acc}%</b></p><div class="card-actions"><button class="btn primary" id="againBtn">Làm bài mới</button><button class="btn secondary" id="weakAgain">Ôn từ sai/yếu</button></div></div>`;$('#againBtn').onclick=()=>startQuiz();$('#weakAgain').onclick=()=>startQuiz('WEAK');renderQuizStats();renderDashboard();return}const w=quiz.items[quiz.i];quiz.word=w;quiz.mode=chooseMode(w);quiz.answered=false;const m=quiz.mode,p=quizPrompt(w,m),cfg=QUIZ_MODES[m];let answer='';if(cfg.kind==='mcq'){const field=(m==='hanzi_meaning'||m==='pinyin_meaning')?'meaning':'pos';const opts=shuffle([w[field],...distractors(w,field,3)]);answer=`<div class="choices">${opts.map(o=>`<button class="choice" data-choice="${esc(o)}">${esc(o)}</button>`).join('')}</div>`}else{answer=`<div class="answer-box"><input id="quizInput" autocomplete="off" placeholder="Nhập đáp án…"><div style="display:flex;gap:8px;margin-top:10px"><button class="btn primary" id="submitAnswer">Kiểm tra</button><button class="btn ghost" id="skipAnswer">Bỏ qua</button></div></div>${cfg.kind==='pinyin'?pinyinTools():''}`}
box.innerHTML=`<div class="qmeta"><span>${sourceLabel(w)}</span><span>Câu ${quiz.i+1}/${quiz.items.length}</span></div><div class="question-title">${p.title}</div><div class="question-main ${p.mainType?'info-'+p.mainType:''}">${esc(p.main)}</div><div class="question-sub ${p.subType?'info-'+p.subType:''}">${esc(p.sub||'')}</div>${answer}<div id="feedbackSlot"></div>`;if(cfg.kind==='mcq')$$('.choice').forEach(b=>b.onclick=()=>gradeChoice(b));else{const inp=$('#quizInput');inp.focus();inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();gradeInput()}});$('#submitAnswer').onclick=gradeInput;$('#skipAnswer').onclick=()=>finishAnswer(false,'(bỏ qua)');if(cfg.kind==='pinyin'){let last=inp;inp.addEventListener('focus',()=>last=inp);$$('.tone-key').forEach(k=>k.onclick=()=>{const pos=last.selectionStart??last.value.length;last.value=last.value.slice(0,pos)+k.dataset.char+last.value.slice(last.selectionEnd??pos);last.focus();last.setSelectionRange(pos+1,pos+1)});const num=$('#numberPinyin');const doConvert=()=>{const raw=(num?.value||inp.value);const converted=numberToMarks(raw);inp.value=converted;if(num)num.value=converted;inp.focus()};$('#convertTone').onclick=doConvert;if(num)num.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doConvert()}})}}renderQuizStats()}
function expected(w,m){if(m==='meaning_hanzi'||m==='pinyin_hanzi'||m==='cloze')return w.hanzi;if(m==='hanzi_pinyin'||m==='meaning_pinyin')return w.pinyin;if(m==='sentence_pinyin')return w.example_pinyin;if(m==='hanzi_meaning'||m==='pinyin_meaning')return w.meaning;if(m==='hanzi_pos')return w.pos;return ''}
function answerType(m){if(['meaning_hanzi','pinyin_hanzi','cloze'].includes(m))return 'hanzi';if(['hanzi_pinyin','meaning_pinyin','sentence_pinyin'].includes(m))return 'pinyin';if(['hanzi_meaning','pinyin_meaning'].includes(m))return 'meaning';return null}
function isCorrectInput(got,w,m){const exp=expected(w,m);if(m==='hanzi_pinyin'||m==='meaning_pinyin'||m==='sentence_pinyin')return normBasic(got)===normBasic(exp);if(m==='meaning_hanzi'||m==='pinyin_hanzi'||m==='cloze')return normBasic(got)===normBasic(exp);return normText(got)===normText(exp)}
function gradeInput(){if(quiz.answered)return;const inp=$('#quizInput');let got=inp.value;if(['hanzi_pinyin','meaning_pinyin','sentence_pinyin'].includes(quiz.mode)){const converted=numberToMarks(got);if(converted!==got){got=converted;inp.value=converted}}finishAnswer(isCorrectInput(got,quiz.word,quiz.mode),got)}
function gradeChoice(btn){if(quiz.answered)return;const ok=normText(btn.dataset.choice)===normText(expected(quiz.word,quiz.mode));$$('.choice').forEach(b=>{b.disabled=true;if(normText(b.dataset.choice)===normText(expected(quiz.word,quiz.mode)))b.classList.add('correct')});if(!ok)btn.classList.add('wrong');finishAnswer(ok,btn.dataset.choice,true)}
function finishAnswer(ok,got,mcq=false){quiz.answered=true;if(ok)quiz.correct++;else quiz.wrong++;updateProgress(quiz.word,ok);if(!mcq){const inp=$('#quizInput');if(inp)inp.disabled=true;$('#submitAnswer')?.setAttribute('disabled','');$('#skipAnswer')?.setAttribute('disabled','')}const exp=expected(quiz.word,quiz.mode),aType=answerType(quiz.mode);$('#feedbackSlot').innerHTML=`<div class="feedback ${ok?'good':'bad'}"><strong>${ok?'✅ Chính xác':'❌ Chưa đúng'}</strong><div class="ans essential-info ${aType?'info-'+aType:''}">Đáp án: <b>${esc(exp)}</b></div>${quiz.word.example?`<div class="info-hanzi" style="margin-top:7px">Ví dụ: ${esc(quiz.word.example)}</div>`:''}<div style="margin-top:12px"><button class="btn primary" id="nextQuestion">Câu tiếp theo</button> <button class="btn ghost" id="sayWord">🔊 Nghe từ</button></div></div>`;$('#nextQuestion').onclick=()=>{quiz.i++;renderQuiz()};$('#sayWord').onclick=()=>speak(quiz.word.hanzi);renderQuizStats()}
function renderQuizStats(){const total=quiz.correct+quiz.wrong;$('#quizStats').innerHTML=`<div class="statline"><span>Đúng</span><b>${quiz.correct}</b></div><div class="statline"><span>Sai</span><b>${quiz.wrong}</b></div><div class="statline"><span>Độ chính xác</span><b>${total?Math.round(quiz.correct*100/total)+'%':'—'}</b></div>`}

function renderDictionary(){const sel=$('#dictLevel');if(sel.options.length===1){for(let l=1;l<=9;l++)sel.add(new Option('Cấp '+l,String(l)))}const q=normText($('#dictSearch').value);const source=$('#dictSource').value,level=$('#dictLevel').value,diff=$('#dictDiff').value;let rows=DATA.filter(w=>(source==='ALL'||w.source===source)&&(level==='ALL'||String(w.level)===level)&&(diff==='ALL'||w.difficulty===diff));if(q)rows=rows.filter(w=>[w.hanzi,w.pinyin,w.meaning,w.pos,w.example].some(v=>normText(v).includes(q)));rows=orderWords(rows,$('#dictSort')?.value||'PINYIN_ASC');const size=50,pages=Math.max(1,Math.ceil(rows.length/size));dictPage=Math.min(dictPage,pages);const slice=rows.slice((dictPage-1)*size,dictPage*size);$('#dictBody').innerHTML=slice.length?slice.map(w=>`<tr><td><span class="source-badge">${sourceLabel(w)}</span></td><td class="info-hanzi">${esc(w.hanzi)} <button class="audio" style="width:32px;height:32px" data-say="${esc(w.hanzi)}">🔊</button></td><td class="info-pinyin">${esc(w.pinyin)}</td><td class="info-meaning">${esc(w.meaning)}</td><td>${esc(w.pos)}</td><td class="info-hanzi">${esc(w.example)}</td><td><small>Trang ${w.sheet_page} · dòng ${w.sheet_row}</small></td></tr>`).join(''):`<tr><td colspan="7" class="empty">Không tìm thấy.</td></tr>`;$$('[data-say]').forEach(b=>b.onclick=()=>speak(b.dataset.say));$('#dictPager').innerHTML=`<button class="btn ghost" id="prevPg" ${dictPage<=1?'disabled':''}>←</button><span class="pill">${dictPage}/${pages} · ${fmt(rows.length)} kết quả</span><button class="btn ghost" id="nextPg" ${dictPage>=pages?'disabled':''}>→</button>`;$('#prevPg').onclick=()=>{dictPage--;renderDictionary()};$('#nextPg').onclick=()=>{dictPage++;renderDictionary()}}

function renderProgress(){const body=$('#progressBody');body.innerHTML=modules().map(m=>{const s=moduleStats(m),pct=s.total?Math.round(s.mastered*100/s.total):0;return `<tr><td><b>${m.label}</b></td><td>${fmt(s.total)}</td><td>${fmt(s.seen)}</td><td>${fmt(s.mastered)}</td><td class="barcell"><div class="progress"><span style="width:${pct}%"></span></div><small>${pct}% · ${s.acc}% đúng</small></td></tr>`}).join('');const weak=DATA.map(w=>({w,r:state.progress[w.id]})).filter(x=>x.r&&(x.r.wrong>0||x.r.mastery<=1)).sort((a,b)=>(b.r.wrong-a.r.wrong)||(a.r.mastery-b.r.mastery)).slice(0,80);$('#weakList').innerHTML=weak.length?weak.map(x=>`<div class="danger-item"><div><strong class="info-hanzi">${esc(x.w.hanzi)}</strong><div style="font-size:12px;color:var(--muted)"><span class="info-pinyin">${esc(x.w.pinyin)}</span><span class="info-separator"> · </span><span class="info-meaning">${esc(x.w.meaning)}</span></div></div><span class="pill">Sai ${x.r.wrong}</span></div>`).join(''):`<div class="empty">Chưa có từ yếu. Hãy làm một phiên kiểm tra trước.</div>`}

function renderSettings(){$('#dailyGoal').value=state.dailyGoal;$('#dedupeToggle').checked=state.dedupe;const auto=$('#hwAutoRecognize');const delay=$('#hwAutoDelay');const leniency=$('#hwLeniency');if(auto)auto.checked=state.handwritingAuto!==false;if(delay)delay.value=String(state.handwritingDelayMs||2000);if(leniency)leniency.value=String(state.handwritingLeniency||1);$('#dataInfo').textContent=`${META.source_sheet} · ${fmt(META.training_record_count)} bản ghi luyện · phiên bản ${META.dataset_version}.`;applyVisibility()}
function exportProgress(){const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hsk-personal-progress.json';a.click();URL.revokeObjectURL(a.href)}
function importProgress(file){const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);state={...DEFAULT,...(o.state||o)};save();toast('Đã nhập tiến độ.');renderDashboard()}catch{toast('File tiến độ không hợp lệ.')}};r.readAsText(file)}

window.HSKTrainerAPI={DATA,META,getPool,dedupe,shuffle,orderWords,comparePinyin,pinyinSortKey,normBasic,normText,sourceLabel,speak,toast,updateProgress,rec,getState:()=>state,save,showView,isVisible,setVisibility,applyVisibility};


// ===== V5.3 · PHÍM TẮT BÀN PHÍM =====
const SHORTCUT_VIEWS=['dashboard','scan','quiz','type-pinyin','type-hanzi','handwrite','dictionary','progress','settings'];
function shortcutVisible(el){if(!el||el.disabled)return false;const r=el.getBoundingClientRect();const st=getComputedStyle(el);return r.width>0&&r.height>0&&st.display!=='none'&&st.visibility!=='hidden'}
function shortcutClick(selector){const el=typeof selector==='string'?$(selector):selector;if(shortcutVisible(el)){el.click();return true}return false}
function typingTarget(el){return !!el&&(el.matches?.('input,textarea,select')||el.isContentEditable)}
function openShortcutHelp(){const m=$('#shortcutModal');if(!m)return;m.classList.add('open');m.setAttribute('aria-hidden','false');document.body.classList.add('shortcut-modal-open');$('.shortcut-close')?.focus()}
function closeShortcutHelp(){const m=$('#shortcutModal');if(!m)return;m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.classList.remove('shortcut-modal-open')}
function shortcutModalOpen(){return $('#shortcutModal')?.classList.contains('open')}
function toggleInfo(type){setVisibility(type,!isVisible(type));toast(`${type==='hanzi'?'Chữ Hán':type==='pinyin'?'Pinyin':'Nghĩa'}: ${isVisible(type)?'đang hiển thị':'đã ẩn'}.`)}
function primaryAction(){
  if(activeView==='dashboard')return shortcutClick('[data-go="scan"]');
  if(activeView==='scan')return shortcutClick('#scanCard [data-mark="known"]')||shortcutClick('#scanCard .btn.primary')||shortcutClick('#startScan');
  if(activeView==='quiz')return shortcutClick('#nextQuestion')||shortcutClick('#submitAnswer')||shortcutClick('#againBtn')||shortcutClick('#startQuiz');
  if(activeView==='type-pinyin')return shortcutClick('#tpNext')||shortcutClick('#tpCheck')||shortcutClick('#skillRestart')||shortcutClick('#tpStart');
  if(activeView==='type-hanzi')return shortcutClick('#thNext')||shortcutClick('#thCheck')||shortcutClick('#skillRestart')||shortcutClick('#thStart');
  if(activeView==='handwrite')return shortcutClick('#hwNext')||shortcutClick('#hwConfirmChar:not(:disabled)')||shortcutClick('#skillRestart')||shortcutClick('#hwStart');
  if(activeView==='dictionary'){const q=$('#dictSearch');if(q){q.focus();q.select?.();return true}}
  return false;
}
function skipAction(){
  if(activeView==='quiz')return shortcutClick('#skipAnswer');
  if(activeView==='type-pinyin')return shortcutClick('#tpSkip');
  if(activeView==='type-hanzi')return shortcutClick('#thSkip');
  if(activeView==='handwrite')return shortcutClick('#hwSkip');
  return false;
}
function audioAction(){return shortcutClick('#scanAudio')||shortcutClick('#sayWord')||shortcutClick('#tpHear')||shortcutClick('#thHear')||shortcutClick('#hwHear')}
function revealAction(){if(activeView==='scan')return shortcutClick('#revealBtn');if(activeView==='handwrite')return shortcutClick('#hwReveal');return false}
function convertToneAction(){return shortcutClick('#convertTone')||shortcutClick('.skill-convert')}
function setHotkey(el,key){
  if(!el||!key)return;
  el.dataset.hotkey=key;
  el.setAttribute('aria-keyshortcuts',key.replace('Alt+','Alt+'));
  const base=(el.title||'').replace(/(?: · )?Phím tắt: .+$/,'');
  el.title=(base?base+' · ':'')+'Phím tắt: '+key;
}
function annotateHotkeys(){
  const ids={startScan:'Enter',startQuiz:'Enter',tpStart:'Enter',thStart:'Enter',hwStart:'Enter',dictSearchBtn:'Enter',submitAnswer:'Enter',nextQuestion:'Enter',againBtn:'Enter',tpCheck:'Enter',tpNext:'Enter',thCheck:'Enter',thNext:'Enter',hwConfirmChar:'Enter',hwNext:'Enter',hwUseFallback:'Enter',skillRestart:'Enter',skipAnswer:'Alt+S',tpSkip:'Alt+S',thSkip:'Alt+S',hwSkip:'Alt+S',scanAudio:'Alt+A',sayWord:'Alt+A',tpHear:'Alt+A',thHear:'Alt+A',hwHear:'Alt+A',revealBtn:'Space',hwReveal:'Alt+R',convertTone:'Alt+C',hwRestartChar:'R',hwPrevChar:'←',shortcutHelpBtn:'?',settingsShortcutHelp:'?',reviewWeakBtn:'Alt+W',exportProgress:'Alt+E'};
  for(const [id,key] of Object.entries(ids))setHotkey($('#'+id),key);
  const navKeys=['Alt+1','Alt+2','Alt+3','Alt+4','Alt+5','Alt+6','Alt+7','Alt+8','Alt+9'];
  $$('.nav button[data-view]').forEach((el,i)=>setHotkey(el,navKeys[i]));
  setHotkey($('[data-visibility=hanzi]'),'Alt+H');
  setHotkey($('[data-visibility=pinyin]'),'Alt+P');
  setHotkey($('[data-visibility=meaning]'),'Alt+M');
  setHotkey($('[data-go=scan]'),'Alt+2');
  setHotkey($('[data-go=quiz]'),'Alt+3');
  $$('.skill-convert').forEach(el=>setHotkey(el,'Alt+C'));
  $$('#scanCard [data-mark]').forEach(el=>{const k={unknown:'1',unsure:'2',known:'3'}[el.dataset.mark];if(k)setHotkey(el,k)});
  $$('#quizMain .choice').forEach((el,i)=>{if(i<4)setHotkey(el,String(i+1))});
}
function handleGlobalShortcut(e){
  if(e.defaultPrevented)return;
  const target=e.target;
  if(shortcutModalOpen()){
    if(e.key==='Escape'||e.key==='?'){e.preventDefault();closeShortcutHelp()}return;
  }
  if(!typingTarget(target)&&e.key==='?'){e.preventDefault();openShortcutHelp();return}
  // Chuyển trang bằng Alt+1…9, dùng e.code để ổn định với nhiều layout bàn phím.
  if(e.altKey&&!e.ctrlKey&&!e.metaKey&&/^Digit[1-9]$/.test(e.code)){
    e.preventDefault();const idx=Number(e.code.slice(-1))-1;showView(SHORTCUT_VIEWS[idx]);return;
  }
  if(e.altKey&&!e.ctrlKey&&!e.metaKey){
    const k=e.key.toLowerCase();
    if(k==='s'){e.preventDefault();skipAction();return}
    if(k==='a'){e.preventDefault();audioAction();return}
    if(k==='r'){e.preventDefault();revealAction();return}
    if(k==='c'){e.preventDefault();convertToneAction();return}
    if(k==='h'){e.preventDefault();toggleInfo('hanzi');return}
    if(k==='p'){e.preventDefault();toggleInfo('pinyin');return}
    if(k==='m'){e.preventDefault();toggleInfo('meaning');return}
    if(k==='w'){e.preventDefault();shortcutClick('#reviewWeakBtn');return}
    if(k==='e'){e.preventDefault();shortcutClick('#exportProgress');return}
  }
  // Không chiếm chữ/số khi người dùng đang nhập Pinyin/Hán/nghĩa.
  if(typingTarget(target))return;
  if(e.key==='Enter'){e.preventDefault();primaryAction();return}
  if(activeView==='scan'){
    if(e.code==='Space'){e.preventDefault();shortcutClick('#revealBtn');return}
    if(['Digit1','Numpad1'].includes(e.code)){e.preventDefault();shortcutClick('#scanCard [data-mark="unknown"]');return}
    if(['Digit2','Numpad2'].includes(e.code)){e.preventDefault();shortcutClick('#scanCard [data-mark="unsure"]');return}
    if(['Digit3','Numpad3'].includes(e.code)){e.preventDefault();shortcutClick('#scanCard [data-mark="known"]');return}
  }
  if(activeView==='quiz'&&!quiz.answered){
    const m=e.code.match(/^(?:Digit|Numpad)([1-4])$/);if(m){const choices=$$('#quizMain .choice');const el=choices[Number(m[1])-1];if(shortcutVisible(el)){e.preventDefault();el.click();return}}
  }
  if(activeView==='handwrite'){
    if(e.key.toLowerCase()==='r'){e.preventDefault();shortcutClick('#hwRestartChar');return}
    if(e.key==='ArrowLeft'){e.preventDefault();shortcutClick('#hwPrevChar');return}
  }
  if(activeView==='dictionary'&&e.key==='/'){e.preventDefault();const q=$('#dictSearch');q?.focus();q?.select?.();return}
}
function initShortcuts(){
  $('#shortcutHelpBtn')?.addEventListener('click',openShortcutHelp);
  $('#settingsShortcutHelp')?.addEventListener('click',openShortcutHelp);
  $$('[data-shortcut-close]').forEach(el=>el.addEventListener('click',closeShortcutHelp));
  document.addEventListener('keydown',handleGlobalShortcut);
  const obs=new MutationObserver(annotateHotkeys);obs.observe(document.body,{childList:true,subtree:true});annotateHotkeys();
}

function bind(){initNav();levelChips($('#scanLevels'));levelChips($('#quizLevels'));$('#startScan').onclick=startScan;$('#startQuiz').onclick=()=>startQuiz();$('#dictSearchBtn').onclick=()=>{dictPage=1;renderDictionary()};$('#dictSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();dictPage=1;renderDictionary()}});['dictSource','dictLevel','dictDiff','dictSort'].forEach(id=>$('#'+id).onchange=()=>{dictPage=1;renderDictionary()});$('#dailyGoal').onchange=e=>{state.dailyGoal=Math.max(5,Number(e.target.value)||40);save()};$('#dedupeToggle').onchange=e=>{state.dedupe=e.target.checked;save()};
['showHanziToggle','showPinyinToggle','showMeaningToggle'].forEach((id,i)=>{const el=$('#'+id);if(el)el.onchange=e=>{const type=['hanzi','pinyin','meaning'][i];setVisibility(type,e.target.checked);toast(`${type==='hanzi'?'Chữ Hán':type==='pinyin'?'Pinyin':'Nghĩa'}: ${e.target.checked?'đang hiển thị':'đã ẩn'}.`)}});$$('[data-visibility]').forEach(b=>b.onclick=()=>{const type=b.dataset.visibility;setVisibility(type,!isVisible(type));toast(`${type==='hanzi'?'Chữ Hán':type==='pinyin'?'Pinyin':'Nghĩa'}: ${isVisible(type)?'đang hiển thị':'đã ẩn'}.`)});
$('#hwAutoRecognize').onchange=e=>{state.handwritingAuto=e.target.checked;save();toast(e.target.checked?'Đã bật tự xác nhận chữ viết tay.':'Đã tắt tự xác nhận chữ viết tay.');};$('#hwAutoDelay').onchange=e=>{state.handwritingDelayMs=Math.max(500,Math.min(10000,Number(e.target.value)||2000));save();toast(`Thời gian chờ tự xác nhận: ${(state.handwritingDelayMs/1000).toFixed(1)} giây.`);};$('#hwLeniency').onchange=e=>{state.handwritingLeniency=Math.max(0.4,Math.min(1.5,Number(e.target.value)||1));save();toast('Đã cập nhật độ nghiêm khi chấm nét.');};$('#exportProgress').onclick=exportProgress;$('#importProgress').onchange=e=>e.target.files[0]&&importProgress(e.target.files[0]);$('#resetProgress').onclick=()=>{if(confirm('Xóa toàn bộ tiến độ học trên trình duyệt này?')){state=structuredClone(DEFAULT);save();renderDashboard();applyVisibility();toast('Đã đặt lại tiến độ.')}};$('#reviewWeakBtn').onclick=()=>{showView('quiz');$('#quizScope').value='WEAK';startQuiz('WEAK')};updateHeader();renderDashboard();applyVisibility()}
bind();
initShortcuts();
})();
