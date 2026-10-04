(() => {
'use strict';
const root=document.getElementById('view-smart-vocab');
if(!root) return;
const $s=s=>root.querySelector(s), $$s=s=>[...root.querySelectorAll(s)];
const SV_STORE='hskSmartVocab_v1';
const data=(window.VOCAB_DATA||[]).filter(x=>x&&x.hanzi);
const hanziSet=[...new Set(data.map(x=>x.hanzi).filter(Boolean))].sort((a,b)=>b.length-a.length);
let current=null,currentSentence=null,currentCandidates=[],candidateIndex=0;

const RADICAL_HELP=window.SV_RADICAL_HELP={
'你':{r:'亻',n:'bộ Nhân đứng',c:'亻 + 尔'},'他':{r:'亻',n:'bộ Nhân đứng',c:'亻 + 也'},'们':{r:'亻',n:'bộ Nhân đứng',c:'亻 + 门'},'休':{r:'亻',n:'bộ Nhân đứng',c:'亻 + 木'},'住':{r:'亻',n:'bộ Nhân đứng',c:'亻 + 主'},'作':{r:'亻',n:'bộ Nhân đứng',c:'亻 + 乍'},'做':{r:'亻',n:'bộ Nhân đứng',c:'亻 + 故'},'件':{r:'亻',n:'bộ Nhân đứng',c:'亻 + 牛'},
'好':{r:'女',n:'bộ Nữ',c:'女 + 子'},'妈':{r:'女',n:'bộ Nữ',c:'女 + 马'},'姐':{r:'女',n:'bộ Nữ',c:'女 + 且'},'妹':{r:'女',n:'bộ Nữ',c:'女 + 未'},'她':{r:'女',n:'bộ Nữ',c:'女 + 也'},
'吃':{r:'口',n:'bộ Khẩu',c:'口 + 乞'},'喝':{r:'口',n:'bộ Khẩu',c:'口 + 曷'},'吗':{r:'口',n:'bộ Khẩu',c:'口 + 马'},'呢':{r:'口',n:'bộ Khẩu',c:'口 + 尼'},'听':{r:'口',n:'bộ Khẩu',c:'口 + 斤'},'唱':{r:'口',n:'bộ Khẩu',c:'口 + 昌'},
'说':{r:'讠',n:'bộ Ngôn (giản thể)',c:'讠 + 兑'},'话':{r:'讠',n:'bộ Ngôn (giản thể)',c:'讠 + 舌'},'语':{r:'讠',n:'bộ Ngôn (giản thể)',c:'讠 + 吾'},'读':{r:'讠',n:'bộ Ngôn (giản thể)',c:'讠 + 卖'},'请':{r:'讠',n:'bộ Ngôn (giản thể)',c:'讠 + 青'},'认':{r:'讠',n:'bộ Ngôn (giản thể)',c:'讠 + 人'},'谢':{r:'讠',n:'bộ Ngôn (giản thể)',c:'讠 + 射'},'谁':{r:'讠',n:'bộ Ngôn (giản thể)',c:'讠 + 隹'},
'汉':{r:'氵',n:'bộ Thủy',c:'氵 + 又'},'海':{r:'氵',n:'bộ Thủy',c:'氵 + 每'},'洗':{r:'氵',n:'bộ Thủy',c:'氵 + 先'},'河':{r:'氵',n:'bộ Thủy',c:'氵 + 可'},'没':{r:'氵',n:'bộ Thủy',c:'氵 + 殳'},'清':{r:'氵',n:'bộ Thủy',c:'氵 + 青'},'酒':{r:'氵',n:'bộ Thủy',c:'氵 + 酉'},
'林':{r:'木',n:'bộ Mộc',c:'木 + 木'},'校':{r:'木',n:'bộ Mộc',c:'木 + 交'},'杯':{r:'木',n:'bộ Mộc',c:'木 + 不'},'机':{r:'木',n:'bộ Mộc',c:'木 + 几'},'树':{r:'木',n:'bộ Mộc',c:'木 + 对'},'椅':{r:'木',n:'bộ Mộc',c:'木 + 奇'},
'字':{r:'子',n:'bộ Tử',c:'宀 + 子'},'家':{r:'宀',n:'bộ Miên',c:'宀 + 豕'},'室':{r:'宀',n:'bộ Miên',c:'宀 + 至'},'安':{r:'宀',n:'bộ Miên',c:'宀 + 女'},
'明':{r:'日',n:'bộ Nhật',c:'日 + 月'},'时':{r:'日',n:'bộ Nhật',c:'日 + 寸'},'晚':{r:'日',n:'bộ Nhật',c:'日 + 免'},'早':{r:'日',n:'bộ Nhật',c:'日 + 十'},'星':{r:'日',n:'bộ Nhật',c:'日 + 生'},
'想':{r:'心',n:'bộ Tâm',c:'相 + 心'},'您':{r:'心',n:'bộ Tâm',c:'你 + 心'},'忙':{r:'忄',n:'bộ Tâm đứng',c:'忄 + 亡'},'快':{r:'忄',n:'bộ Tâm đứng',c:'忄 + 夬'},'情':{r:'忄',n:'bộ Tâm đứng',c:'忄 + 青'},'慢':{r:'忄',n:'bộ Tâm đứng',c:'忄 + 曼'},'怕':{r:'忄',n:'bộ Tâm đứng',c:'忄 + 白'},
'国':{r:'囗',n:'bộ Vi',c:'囗 + 玉'},'园':{r:'囗',n:'bộ Vi',c:'囗 + 元'},'回':{r:'囗',n:'bộ Vi',c:'囗 + 口'},'图':{r:'囗',n:'bộ Vi',c:'囗 + 冬'},
'问':{r:'门',n:'bộ Môn',c:'门 + 口'},'间':{r:'门',n:'bộ Môn',c:'门 + 日'},'闻':{r:'门',n:'bộ Môn',c:'门 + 耳'},
'路':{r:'足',n:'bộ Túc',c:'足 + 各'},'跑':{r:'足',n:'bộ Túc',c:'足 + 包'},'跳':{r:'足',n:'bộ Túc',c:'足 + 兆'},
'近':{r:'辶',n:'bộ Sước',c:'斤 + 辶'},'远':{r:'辶',n:'bộ Sước',c:'元 + 辶'},'这':{r:'辶',n:'bộ Sước',c:'文 + 辶'},'过':{r:'辶',n:'bộ Sước',c:'寸 + 辶'},'还':{r:'辶',n:'bộ Sước',c:'不 + 辶'},'进':{r:'辶',n:'bộ Sước',c:'井 + 辶'},'送':{r:'辶',n:'bộ Sước',c:'关 + 辶'},'道':{r:'辶',n:'bộ Sước',c:'首 + 辶'},'边':{r:'辶',n:'bộ Sước',c:'力 + 辶'},
'钱':{r:'钅',n:'bộ Kim (giản thể)',c:'钅 + 戋'},'银':{r:'钅',n:'bộ Kim (giản thể)',c:'钅 + 艮'},'钟':{r:'钅',n:'bộ Kim (giản thể)',c:'钅 + 中'},'铁':{r:'钅',n:'bộ Kim (giản thể)',c:'钅 + 失'},
'饭':{r:'饣',n:'bộ Thực (giản thể)',c:'饣 + 反'},'馆':{r:'饣',n:'bộ Thực (giản thể)',c:'饣 + 官'},'饿':{r:'饣',n:'bộ Thực (giản thể)',c:'饣 + 我'},'饮':{r:'饣',n:'bộ Thực (giản thể)',c:'饣 + 欠'},
'红':{r:'纟',n:'bộ Mịch (giản thể)',c:'纟 + 工'},'给':{r:'纟',n:'bộ Mịch (giản thể)',c:'纟 + 合'},'绿':{r:'纟',n:'bộ Mịch (giản thể)',c:'纟 + 录'},'线':{r:'纟',n:'bộ Mịch (giản thể)',c:'纟 + 戋'},'结':{r:'纟',n:'bộ Mịch (giản thể)',c:'纟 + 吉'},'级':{r:'纟',n:'bộ Mịch (giản thể)',c:'纟 + 及'},
'被':{r:'衤',n:'bộ Y',c:'衤 + 皮'},'裤':{r:'衤',n:'bộ Y',c:'衤 + 库'},'裙':{r:'衤',n:'bộ Y',c:'衤 + 君'},
'病':{r:'疒',n:'bộ Nạch',c:'疒 + 丙'},'疼':{r:'疒',n:'bộ Nạch',c:'疒 + 冬'},'痛':{r:'疒',n:'bộ Nạch',c:'疒 + 甬'},
'看':{r:'目',n:'bộ Mục',c:'手 + 目'},'眼':{r:'目',n:'bộ Mục',c:'目 + 艮'},'睡':{r:'目',n:'bộ Mục',c:'目 + 垂'},
'男':{r:'田',n:'bộ Điền',c:'田 + 力'},'热':{r:'灬',n:'bộ Hỏa',c:'执 + 灬'},'点':{r:'灬',n:'bộ Hỏa',c:'占 + 灬'}
};

function loadStore(){try{return JSON.parse(localStorage.getItem(SV_STORE)||'{}')}catch{return {}}}
function saveStore(x){localStorage.setItem(SV_STORE,JSON.stringify(x))}
function norm(s){return (s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ')}
function normSentence(s){return (s||'').replace(/[，。！？,.!?；;：:\s]/g,'')}
function stripPunct(s){return (s||'').replace(/[，。！？,.!?；;：:“”"']/g,'')}
function wordLevel(w){return +w.level||+w.hsk||0}

function resolveWord(raw){
  const x=(raw||'').trim();
  if(!x)return null;
  let w=data.find(v=>v.hanzi===x);
  if(w)return w;
  const np=norm(x);
  w=data.find(v=>norm(v.pinyin)===np);
  if(w)return w;
  w=data.find(v=>norm(v.meaning||'').includes(np));
  return w||null
}
function fillDatalist(){
  const list=$s('#svWordList');
  list.innerHTML=data.slice(0,1800).map(w=>`<option value="${w.hanzi}">${w.pinyin||''} · ${w.meaning||''}</option>`).join('')
}
function setTab(name){
  $$s('.sv-tab').forEach(b=>b.classList.toggle('active',b.dataset.svTab===name));
  $s('#svPanelSentence').classList.toggle('hidden',name!=='sentence')
}
$$s('.sv-tab').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.svTab)));

function openWord(w){
  current=w;if(!w)return;
  $s('#svWorkspace').classList.remove('hidden');
  $s('#svHanzi').textContent=w.hanzi;
  $s('#svPinyin').textContent=w.pinyin||'';
  $s('#svMeaning').textContent=w.meaning||'';
  $s('#svMeta').innerHTML=`<span class="pill">HSK${wordLevel(w)||'?'}</span><span class="pill">${w.pos||'chưa có từ loại'}</span><span class="pill">${w.source||'Kho từ'}</span>`;
  $s('#svWordInput').value=w.hanzi;
  $s('#svFocusWord').innerHTML=`<div class="sv-focus-word"><div class="hanzi">${w.hanzi}</div><div class="py">${w.pinyin||''}</div><div>${w.meaning||''}</div><div class="mini" style="margin-top:5px">HSK${wordLevel(w)||'?'} · ${w.pos||'—'}</div></div>`;
  buildSentenceCandidates();
  renderSentenceGrammarOptions();
  renderSentence();
  $s('#svSearchMsg').textContent='';
}
function loadFromInput(){
  const w=resolveWord($s('#svWordInput').value);
  if(!w){$s('#svSearchMsg').textContent='Không tìm thấy từ này trong kho hiện tại. Hãy nhập chữ Hán hoặc chọn từ trong gợi ý.';return}
  openWord(w)
}
$s('#svLoadWord').addEventListener('click',loadFromInput);
$s('#svWordInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();loadFromInput()}});
$s('#svRandomWord').addEventListener('click',()=>randomWord());

function randomWord(){
  const level=+$s('#svRandomLevel').value||1;
  const pool=data.filter(w=>wordLevel(w)===level);
  if(!pool.length)return;
  openWord(pool[Math.floor(Math.random()*pool.length)])
}
function anotherWord(){
  const level=current?wordLevel(current):(+($s('#svRandomLevel').value)||1);
  const pool=data.filter(w=>wordLevel(w)===level && (!current || w.hanzi!==current.hanzi));
  if(!pool.length)return;
  const next=pool[Math.floor(Math.random()*pool.length)];
  $s('#svRandomLevel').value=String(level);
  openWord(next);
  setTab('sentence');
  try{$s('#svWordInput').scrollIntoView({behavior:'smooth',block:'nearest'})}catch(e){}
}
$s('#svAnotherWord').addEventListener('click',anotherWord);
$s('#svAnotherWordSide').addEventListener('click',anotherWord);


function grammarInfoById(id){
  const all=window.SL_GRAMMAR_META||[];
  return all.find(g=>g.id===id)||null
}
function detectGrammar(sentence){
  const s=sentence||'';
  const tests=[
    ['yinwei',/因为.*所以/],['suiran',/虽然.*但是/],['yi_bian',/一边.*一边/],
    ['you_you',/又[^。！？]*又/],['shi_de',/是[^。！？]*的/],['mei_dou',/每[^。！？]*都/],
    ['xian_zai',/先[^。！？]*再/],['cong_dao',/从[^。！？]*到/],['bi',/比/],
    ['zai',/正在|正在|正[^。！？]*呢/],['guo',/过/],['kuaiyao',/快要|就要|要[^。！？]*了/],
    ['jiu_cai',/才|就/],['you_zai',/再|又/],['keneng',/可能/],['zui',/最/],
    ['zhe',/着/],['le',/了/]
  ];
  for(const [id,re] of tests)if(re.test(s)){const g=grammarInfoById(id);return {id,name:g?.name||id,formula:g?.formula||''}}
  return {id:'basic',name:'Câu cơ bản / ngữ cảnh từ vựng',formula:''}
}
function sentencePinyin(sentence){
  const dict=[...(window.SL_VOCAB_1000||[]).map(x=>({h:x.h,p:x.p})),...data.map(x=>({h:x.hanzi,p:x.pinyin}))];
  const map=new Map();for(const x of dict)if(x.h&&!map.has(x.h))map.set(x.h,x.p||'');
  const keys=[...map.keys()].sort((a,b)=>b.length-a.length);
  const s=stripPunct(sentence);let i=0,out=[];
  while(i<s.length){
    let found=null;
    for(const k of keys){if(s.startsWith(k,i)){found=k;break}}
    if(found){out.push(map.get(found));i+=found.length}else{i++}
  }
  return out.filter(Boolean).join(' ')
}
function addCandidate(list,seen,c){
  const key=normSentence(c.answer);
  if(!key||seen.has(key)||!c.answer.includes(current?.hanzi||''))return;
  seen.add(key);
  if(!c.pinyin)c.pinyin=sentencePinyin(c.answer);
  list.push(c)
}
function nounGrammarVariants(word){
  const x=word.hanzi;
  return [
    {answer:`我想多了解一下${x}。`,grammar:'想 + V',formula:'S + 想 + V + O',source:'Biến thể tự biên an toàn'},
    {answer:`我们正在谈${x}。`,grammar:'正在 + V',formula:'S + 正在 + V + O',source:'Biến thể tự biên an toàn'},
    {answer:`关于${x}，我还有一个问题。`,grammar:'关于 + N',formula:'关于 + chủ đề，S + V',source:'Biến thể tự biên an toàn'},
    {answer:`因为我对${x}很感兴趣，所以我想多了解一下。`,grammar:'因为……所以……',formula:'因为 + nguyên nhân，所以 + kết quả',source:'Biến thể tự biên an toàn'},
    {answer:`如果你也对${x}感兴趣，我们可以一起学习。`,grammar:'如果……，可以……',formula:'如果 + điều kiện，S + 可以 + V',source:'Biến thể tự biên an toàn'},
    {answer:`我一边看关于${x}的资料，一边记笔记。`,grammar:'一边……一边……',formula:'一边 + V₁，一边 + V₂',source:'Biến thể tự biên an toàn'},
    {answer:`我已经了解了一些关于${x}的情况。`,grammar:'已经……了',formula:'S + 已经 + V + 了',source:'Biến thể tự biên an toàn'},
    {answer:`我想再了解一下${x}。`,grammar:'再 + V',formula:'S + 再 + V + O',source:'Biến thể tự biên an toàn'}
  ]
}
function adjectiveGrammarVariants(word){
  const x=word.hanzi;
  const human=new Set(['忙','累','饿','渴','高兴','生气','难过','紧张','害怕','满意','健康','舒服']);
  const weather=new Set(['冷','热','凉快','暖和']);
  const subject=human.has(x)?'我':weather.has(x)?'今天':'这个地方';
  return [
    {answer:`${subject}很${x}。`,grammar:'很 + Adj',formula:'S + 很 + Adj',source:'Biến thể tự biên'},
    {answer:`${subject}不太${x}。`,grammar:'不太 + Adj',formula:'S + 不太 + Adj',source:'Biến thể tự biên'},
    {answer:`${subject}有点儿${x}。`,grammar:'有点儿 + Adj',formula:'S + 有点儿 + Adj',source:'Biến thể tự biên'},
    {answer:`虽然${subject}有点儿${x}，但是没关系。`,grammar:'虽然……但是……',formula:'虽然 + mệnh đề 1，但是 + mệnh đề 2',source:'Biến thể tự biên'}
  ]
}
function verbGrammarVariants(word,baseExample){
  const x=word.hanzi, pos=word.pos||'';
  const stative=new Set(['是','有','没有','喜欢','爱','想','知道','认识','觉得','需要','希望','相信','会','能','可以','明白','记得','忘记','同意','愿意','应该']);
  if(stative.has(x)||!pos.includes('động từ'))return [];
  const base=(baseExample||'').replace(/[。！？!?]$/,'');
  const out=[];
  if(base&&base.includes(x)){
    const noLe=base.replace(/了/g,'').replace(/已经/g,'');
    if(!noLe.includes('正在'))out.push({answer:noLe.replace(x,'正在'+x)+'。',grammar:'正在 + V',formula:'S + 正在 + V (+O)',source:'Biến thể từ câu ví dụ'});
    if(!base.includes('再'))out.push({answer:base.replace(x,'再'+x)+'。',grammar:'再 + V',formula:'S + 再 + V (+O)',source:'Biến thể từ câu ví dụ'});
    if(!base.includes('常常'))out.push({answer:noLe.replace(x,'常常'+x)+'。',grammar:'常常 + V',formula:'S + 常常 + V (+O)',source:'Biến thể từ câu ví dụ'});
  }
  return out
}
function sentenceCandidatesFor(word){
  const seen=new Set(),arr=[];
  // 1) Existing vocabulary corpus examples containing the target.
  for(const w of data){
    if(!w.example||!w.example.includes(word.hanzi))continue;
    const g=detectGrammar(w.example);
    addCandidate(arr,seen,{answer:w.example,pinyin:w.example_pinyin||'',grammar:g.name,grammarId:g.id,formula:g.formula,source:'Kho từ vựng hiện có'})
  }
  // 2) Sentence Lab bank: explicitly tagged grammar.
  for(const b of (window.SL_SENTENCE_BANK||[])){
    if(!b.answer||!b.answer.includes(word.hanzi))continue;
    const g=grammarInfoById(b.grammar);
    addCandidate(arr,seen,{answer:b.answer,pinyin:'',grammar:g?.name||b.grammar,grammarId:b.grammar,formula:g?.formula||b.hint||'',source:'Sentence Lab · '+(b.source||'PREP/Hán ngữ')})
  }
  // 3) Conservative grammar variants.
  const pos=word.pos||'';
  let variants=[];
  if(pos.includes('danh từ'))variants=nounGrammarVariants(word);
  else if(pos.includes('tính từ')&&!pos.includes('động từ'))variants=adjectiveGrammarVariants(word);
  else if(pos.includes('động từ'))variants=verbGrammarVariants(word,word.example||arr[0]?.answer||'');
  for(const v of variants)addCandidate(arr,seen,{...v,grammarId:v.grammarId||'generated'});
  return arr
}
function buildSentenceCandidates(){
  currentCandidates=sentenceCandidatesFor(current);
  candidateIndex=0
}
function filteredCandidates(){
  const f=$s('#svGrammarFilter')?.value||'ALL';
  if(f==='ALL')return currentCandidates;
  return currentCandidates.filter(c=>(c.grammarId||c.grammar)===f)
}
function renderSentenceGrammarOptions(){
  const sel=$s('#svGrammarFilter');
  const groups=new Map();
  for(const c of currentCandidates){
    const key=c.grammarId||c.grammar||'basic';
    if(!groups.has(key))groups.set(key,c.grammar||key)
  }
  sel.innerHTML='<option value="ALL">Tất cả ngữ pháp</option>'+[...groups.entries()].map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  sel.value='ALL';
  sel.onchange=()=>{candidateIndex=0;renderSentence()}
}
function segmentSentence(sentence){
  let s=stripPunct(sentence),i=0,out=[];
  while(i<s.length){
    let found=null;
    for(const h of hanziSet){
      if(h.length<2)break;
      if(s.startsWith(h,i)){found=h;break}
    }
    if(!found){
      const one=hanziSet.find(h=>h.length===1&&s.startsWith(h,i));
      found=one||s[i]
    }
    out.push(found);i+=found.length
  }
  return out.filter(Boolean)
}
function shuffle(a){
  const orig=a.join('|');let b=a.slice(),tries=0;
  do{b=b.slice().sort(()=>Math.random()-.5);tries++}while(b.join('|')===orig&&tries<8);
  return b
}
function currentSentenceObj(){
  const pool=filteredCandidates();
  if(!pool.length)return null;
  return pool[candidateIndex%pool.length]
}
function renderSentence(){
  const pool=filteredCandidates();
  currentSentence=currentSentenceObj();
  $s('#svSentenceCount').textContent=`${pool.length} câu`;
  $s('#svSentenceFeedback').className='sv-feedback';
  $s('#svSentenceFeedback').innerHTML='';
  $s('#svSentenceSolution').classList.add('hidden');
  $s('#svSentenceSolution').innerHTML='';
  $s('#svSentenceAnswer').value='';
  $s('#svSentenceAnswer').disabled=false;
  $s('#svCheckSentence').disabled=false;
  if(!currentSentence){
    $s('#svTokens').innerHTML='<span class="mini">Chưa có câu phù hợp với bộ lọc ngữ pháp hiện tại.</span>';
    $s('#svSentenceTags').innerHTML='';
    return
  }
  const toks=shuffle(segmentSentence(currentSentence.answer));
  $s('#svTokens').innerHTML=toks.map(t=>`<span class="sv-token">${t}</span>`).join('');
  $s('#svSentenceTags').innerHTML=`<span class="pill">Từ trọng tâm: ${current.hanzi}</span><span class="pill">${current.grammar||'Câu cơ bản'}</span><span class="pill">Câu ${(candidateIndex%pool.length)+1}/${pool.length}</span><span class="pill">${current.source||'Kho câu'}</span>`;
}
$s('#svAnotherSentence').addEventListener('click',()=>{
  const pool=filteredCandidates();
  if(!pool.length)return;
  candidateIndex=(candidateIndex+1)%pool.length;renderSentence()
});
$s('#svSentenceHint').addEventListener('click',()=>{
  if(!currentSentence)return;
  const ans=stripPunct(currentSentence.answer);
  $s('#svSentenceFeedback').className='sv-feedback good';
  $s('#svSentenceFeedback').innerHTML=`<b>Ngữ pháp:</b> ${currentSentence.grammar||'Câu cơ bản'}${currentSentence.formula?` · ${currentSentence.formula}`:''}<br>Gợi ý: câu bắt đầu bằng <b>${ans.slice(0,Math.min(2,ans.length))}</b>… và phải chứa <b>${current.hanzi}</b>.`
});
$s('#svCheckSentence').addEventListener('click',()=>{
  if(!currentSentence)return;
  const ans=$s('#svSentenceAnswer').value.trim();
  if(!ans){$s('#svSentenceFeedback').className='sv-feedback bad';$s('#svSentenceFeedback').textContent='Hãy gõ câu trả lời trước.';return}
  const ok=normSentence(ans)===normSentence(currentSentence.answer);
  $s('#svSentenceFeedback').className='sv-feedback '+(ok?'good':'bad');
  $s('#svSentenceFeedback').innerHTML=ok?'✓ Chính xác. Hãy xem lại đáp án, Pinyin và ngữ pháp trước khi đổi câu.':'✕ Chưa đúng. Đối chiếu đáp án và cấu trúc bên dưới.';
  const py=currentSentence.pinyin||sentencePinyin(currentSentence.answer)||'—';
  $s('#svSentenceSolution').innerHTML=`<div class="sv-solution-head"><div class="mini">ĐÁP ÁN</div><div class="sv-solution-zh">${currentSentence.answer}</div><div class="sv-solution-py">${py}</div><div class="sv-grammar-note"><b>Ngữ pháp:</b> ${currentSentence.grammar||'Câu cơ bản'}${currentSentence.formula?`<br><b>Công thức:</b> ${currentSentence.formula}`:''}</div><div style="margin-top:9px"><b>Từ trọng tâm:</b> ${current.hanzi} · ${current.pinyin||''} · ${current.meaning||''}</div></div>`;
  $s('#svSentenceSolution').classList.remove('hidden');
  $s('#svSentenceAnswer').disabled=true;$s('#svCheckSentence').disabled=true
});

fillDatalist();
})();
