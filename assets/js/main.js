// Mobile nav + year filter + footer year + active link
document.addEventListener('DOMContentLoaded',()=>{
  const burger=document.querySelector('.burger');
  const nav=document.querySelector('nav.main');
  if(burger&&nav){burger.addEventListener('click',()=>nav.classList.toggle('open'));}
  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  // active nav
  const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  document.querySelectorAll('nav.main a').forEach(a=>{
    const h=(a.getAttribute('href')||'').toLowerCase();
    if(h===path||(path===''&&h==='index.html')) a.classList.add('active');
  });
  // fan deck: vertical scroll spreads the horizontal hand 0..1
  const fan=document.getElementById('fan');
  if(fan){
    const set=()=>{
      const r=fan.getBoundingClientRect();
      const total=r.height-window.innerHeight;
      const p=total>0?Math.min(1,Math.max(0,-r.top/total)):1;
      fan.style.setProperty('--fan',p.toFixed(3));
    };
    let tick=false;
    const onScroll=()=>{if(!tick){tick=true;requestAnimationFrame(()=>{set();tick=false;});}};
    set(); window.addEventListener('scroll',onScroll,{passive:true}); window.addEventListener('resize',onScroll);
  }
  const btns=document.querySelectorAll('[data-filter-year]');
  const items=document.querySelectorAll('[data-year]');
  if(btns.length&&items.length){
    btns.forEach(b=>b.addEventListener('click',()=>{
      btns.forEach(x=>x.classList.remove('active')); b.classList.add('active');
      const f=b.getAttribute('data-filter-year');
      items.forEach(it=>{
        it.style.display=(f==='toate'||it.getAttribute('data-year')===f)?'':'none';
      });
    }));
  }
  // simple contact fake-submit for Netlify (progressive enhancement)
  const form=document.getElementById('contact-form');
  if(form){
    form.addEventListener('submit',(e)=>{
      if(form.getAttribute('data-netlify')!==null) return; // let Netlify handle
      e.preventDefault();
      const ok=document.getElementById('form-ok');
      if(ok) ok.style.display='block';
      form.reset();
    });
  }
});
