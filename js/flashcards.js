(() => {
'use strict';
const root=document.getElementById('view-flashcards');
if(!root)return;
const $f=s=>root.querySelector(s);
const STORE='hskDedicatedFlashcards_v1';
const raw=window.SL_VOCAB_1000||[];
const words=raw.map((x,i)=>({
  id:`SL-${x.l}-${i}-${x.h}`,
  h:x.h,p:x.p,m:x.m,pos:x.pos||'—',l:+x.l||0,
  ex:'', exPy:''
}));
const host=window.VOCAB_DATA||[];
const hostMap=new Map();
for(const w of host){
  if(!hostMap.has(w.hanzi))hostMap.set(w.hanzi,w)
}
for(const w of words){
  const h=hostMap.get(w.h);
  if(h){w.ex=h.example||'';w.exPy=h.example_pinyin||''}
}
let session=[],idx=0,rated=false,stats={known:0,missed:0};

function load(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
function save(x){localStorage.setItem(STORE,JSON.stringify(x))}
function stripTone(s){return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function poolForLevel(l){return words.filter(w=>w.l===l)}
function updateLevelInfo(){
  const l=+$f('#fcLevel').value;
  $f('#fcLevelInfo').textContent=`Kho hiện có: ${poolForLevel(l).length} từ HSK${l}. Không trộn với cấp khác.`
}
$f('#fcLevel').addEventListener('change',updateLevelInfo);

function start(){
  const l=+$f('#fcLevel').value,n=+$f('#fcCount').value,order=$f('#fcOrder').value;
  let pool=poolForLevel(l).slice();
  if(order==='PINYIN')pool.sort((a,b)=>stripTone(a.p).localeCompare(stripTone(b.p),'en'));
  else pool.sort(()=>Math.random()-.5);
  session=pool.slice(0,Math.min(n,pool.length));
  idx=0;rated=false;stats={known:0,missed:0};
  $f('#fcEmpty').classList.add('hidden');$f('#fcBody').classList.remove('hidden');
  render()
}
$f('#fcStart').addEventListener('click',start);


function radicalAnalysisHTML(w){
  const help=window.SV_RADICAL_HELP||{};
  const chars=[...w.h].filter(ch=>/[\u3400-\u9FFF]/.test(ch));
  const charHtml=chars.map(ch=>{
    const x=help[ch];
    const dyn=window.getCharacterRadicalRecord?.(ch);
    const radForm=x?.r||dyn?.radicalForm||dyn?.radicalMeta?.base||'';
    const meta=radForm?window.radicalMetaForForm?.(radForm):null;
    const radName=x?.n||(meta?`bộ ${meta.hanviet}`:'');
    const comp=x?.c||dyn?.decomposition||'';
    if(x||dyn){
      return `<div class="fc-char-mini">
        <div class="fc-char-mini-top">
          <div class="fc-char-mini-glyph">${ch}</div>
          <div>
            <div class="mini">Bộ thủ chính</div>
            <div class="fc-char-mini-radical">${radForm||'—'}${radName?` · ${radName}`:''}</div>
            ${meta?`<div class="sv-radical-meta">${meta.pinyin} · ${meta.hanviet} · ${meta.meaning} · ${meta.strokes} nét</div>`:''}
          </div>
        </div>
        ${comp?`<div class="mini" style="margin-top:7px"><b>Thành phần:</b> ${comp}</div>`:''}
        ${meta?`<div class="rad-mini-link"><button type="button" class="btn ghost" onclick="window.openCharacterRadicalChain&&window.openCharacterRadicalChain('${ch}')">Bộ → chữ → từ → câu</button></div>`:''}
      </div>`
    }
    return `<div class="fc-char-mini">
      <div class="fc-char-mini-top">
        <div class="fc-char-mini-glyph">${ch}</div>
        <div>
          <div class="mini">Bộ thủ/thành phần</div>
          <div style="font-weight:800;margin-top:3px">Chưa có mapping; mở Radical Lab để đồng bộ Character Bank</div>
        </div>
      </div>
    </div>`
  }).join('');
  return charHtml||'<div class="fc-analysis-empty">Không có chữ Hán để phân tích.</div>'
}
function memoryTipHTML(w){
  const help=window.SV_RADICAL_HELP||{};
  const chars=[...w.h].filter(ch=>/[\u3400-\u9FFF]/.test(ch));
  const parts=chars.map(ch=>help[ch]?.c?`${ch}: ${help[ch].c}`:ch);
  const charTip=parts.length?`Tách từ thành ${parts.map(x=>`「${x}」`).join(' + ')}.`:'';
  const useTip=w.ex?` Sau đó đọc lại câu ví dụ có chứa <b>${w.h}</b> để gắn chữ với ngữ cảnh.`:'';
  return `${charTip} Đọc thành tiếng <b>${w.p||''}</b> và tự nhắc nghĩa “${w.m||''}”.${useTip}`
}
function renderAnalysis(w){
  const box=$f('#fcAnalysis'),body=$f('#fcAnalysisBody');
  $f('#fcAnalysisWord').textContent=`${w.h} · ${w.p||''}`;
  body.innerHTML=`
    <div class="fc-analysis-section">
      <div class="fc-analysis-label">1 · Phân tích từ</div>
      <div><b>${w.h}</b> · ${w.p||''}</div>
      <div style="margin-top:4px">${w.m||''}</div>
      <div class="meta" style="margin-top:7px"><span class="pill">HSK${w.l}</span><span class="pill">${w.pos||'—'}</span></div>
    </div>
    <div class="fc-analysis-section">
      <div class="fc-analysis-label">2 · Bộ thủ / thành phần nhận dạng</div>
      <div class="fc-word-breakdown">${radicalAnalysisHTML(w)}</div>
    </div>
    <div class="fc-analysis-section">
      <div class="fc-analysis-label">3 · Ví dụ</div>
      ${w.ex?`<div class="fc-analysis-example">${w.ex}</div>${w.exPy?`<div class="fc-analysis-pinyin">${w.exPy}</div>`:''}`:'<div class="fc-analysis-empty">Từ này chưa có ví dụ trong kho hiện tại.</div>'}
    </div>
    <div class="fc-analysis-section">
      <div class="fc-analysis-label">4 · Cách ghi nhớ</div>
      <div class="fc-memory-tip">${memoryTipHTML(w)}</div>
      <div class="mini" style="margin-top:7px">Mẹo trên dùng để nhận dạng hình thể và gắn từ với ngữ cảnh; không được trình bày như giải thích từ nguyên lịch sử.</div>
    </div>`;
  box.classList.remove('hidden')
}
function hideAnalysis(){
  const box=$f('#fcAnalysis');
  if(box){box.classList.add('hidden');$f('#fcAnalysisBody').innerHTML=''}
}

function render(){
  if(idx>=session.length){
    $f('#fcBody').innerHTML=`<div class="practice-finish"><div class="finish-icon">✅</div><h3>Hoàn thành phiên Flashcard</h3><p>Đã nhớ ${stats.known} · Chưa nhớ ${stats.missed}</p><button class="btn primary" id="fcRestart">Làm phiên mới</button></div>`;
    const b=$f('#fcRestart');if(b)b.onclick=()=>location.reload();
    renderStats();return
  }
  const w=session[idx],card=$f('#fcCard');
  card.classList.remove('fc-flipped');
  hideAnalysis();
  rated=false;
  $f('#fcFront').textContent=w.h;
  $f('#fcBackHanzi').textContent=w.h;
  $f('#fcPinyin').textContent=w.p||'';
  $f('#fcMeaning').textContent=w.m||'';
  $f('#fcMeta').innerHTML=`<span class="pill">HSK${w.l}</span><span class="pill">${w.pos}</span>`;
  $f('#fcExample').innerHTML=w.ex?`<div>${w.ex}</div>${w.exPy?`<div class="mini">${w.exPy}</div>`:''}`:'';
  $f('#fcLevelPill').textContent=`HSK${w.l}`;
  $f('#fcProgressText').textContent=`Thẻ ${idx+1}/${session.length}`;
  $f('#fcProgressBar').style.width=(idx/session.length*100)+'%';
  $f('#fcNextWrap').classList.add('hidden');
  $f('#fcKnown').disabled=false;$f('#fcMissed').disabled=false;
  renderStats()
}
$f('#fcCard').addEventListener('click',()=> $f('#fcCard').classList.toggle('fc-flipped'));

function rate(known){
  if(rated||idx>=session.length)return;
  rated=true;
  const w=session[idx],st=load(),r=st[w.id]||{known:0,missed:0,last:0};
  if(known){r.known++;stats.known++}else{r.missed++;stats.missed++}
  r.last=Date.now();st[w.id]=r;save(st);
  $f('#fcCard').classList.add('fc-flipped');
  if(known)renderAnalysis(w);else hideAnalysis();
  $f('#fcKnown').disabled=true;$f('#fcMissed').disabled=true;
  $f('#fcNextWrap').classList.remove('hidden');
  renderStats()
}
$f('#fcKnown').addEventListener('click',()=>rate(true));
$f('#fcMissed').addEventListener('click',()=>rate(false));
$f('#fcNext').addEventListener('click',()=>{if(!rated)return;idx++;render()});

function renderStats(){
  const done=stats.known+stats.missed;
  $f('#fcStats').innerHTML=`
    <div class="statline"><span>Đã làm</span><b>${done}/${session.length||0}</b></div>
    <div class="statline"><span>✓ Đã nhớ</span><b>${stats.known}</b></div>
    <div class="statline"><span>× Chưa nhớ</span><b>${stats.missed}</b></div>
    <div class="statline"><span>Độ nhớ</span><b>${done?Math.round(stats.known*100/done)+'%':'—'}</b></div>`
}
updateLevelInfo();
})();
