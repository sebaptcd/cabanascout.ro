// Cabana Scout 2.0 — nav, year, filters
document.addEventListener('DOMContentLoaded',()=>{
  const b=document.querySelector('.burger'),n=document.querySelector('nav.menu');
  if(b&&n)b.addEventListener('click',()=>n.classList.toggle('open'));
  const y=document.getElementById('year');if(y)y.textContent=new Date().getFullYear();
  const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  document.querySelectorAll('nav.menu a').forEach(a=>{
    const h=(a.getAttribute('href')||'').toLowerCase();
    if(h===path||(path===''&&h==='index.html'))a.setAttribute('aria-current','page');
  });
  const fbtns=document.querySelectorAll('[data-f]');
  const items=document.querySelectorAll('[data-y]');
  if(fbtns.length&&items.length){
    fbtns.forEach(btn=>btn.addEventListener('click',()=>{
      fbtns.forEach(x=>x.classList.remove('on'));btn.classList.add('on');
      const f=btn.getAttribute('data-f');
      items.forEach(it=>{it.style.display=(f==='all'||it.getAttribute('data-y')===f)?'':'none';});
    }));
  }
});
