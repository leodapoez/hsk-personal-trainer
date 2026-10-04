/* V5.20 · UI giữ nguyên, cập nhật dữ liệu ngữ pháp đã đối chiếu */
(function(){
  function initV517(){
    const filter=document.querySelector('.sl-level-filter-card');
    const head=filter&&filter.querySelector('.sl-filter-step-title');
    if(filter&&head&&!document.getElementById('slFilterToggle')){
      const b=document.createElement('button');
      b.type='button';b.id='slFilterToggle';b.className='v517-filter-toggle';b.textContent='Thu gọn';
      head.appendChild(b);
      const sync=()=>{b.textContent=filter.classList.contains('sl-filter-collapsed')?'Bộ lọc':'Thu gọn';b.setAttribute('aria-expanded',String(!filter.classList.contains('sl-filter-collapsed')))};
      b.addEventListener('click',()=>{filter.classList.toggle('sl-filter-collapsed');sync()});sync();
      const start=document.getElementById('slStart');
      if(start)start.addEventListener('click',()=>{setTimeout(()=>{if(!document.getElementById('slQuizBody')?.classList.contains('hidden')){filter.classList.add('sl-filter-collapsed');sync()}},60)});
    }
    const title=document.getElementById('pageTitle');
    if(title&&title.textContent.trim()==='Luyện cấu trúc câu') title.textContent='Ngữ pháp & cấu trúc câu';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initV517);else initV517();
})();
