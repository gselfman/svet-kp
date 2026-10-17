const motion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if('IntersectionObserver' in window&&!motion){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.06});document.querySelectorAll('.reveal').forEach(el=>{el.classList.add('ready');observer.observe(el)})}
const dialog=document.querySelector('#lightbox');let previousFocus;
document.querySelectorAll('.gallery-card').forEach(card=>card.addEventListener('click',()=>{previousFocus=card;dialog.querySelector('img').src=card.dataset.full;dialog.querySelector('img').alt=card.dataset.caption;dialog.querySelector('p').textContent=card.dataset.caption;dialog.showModal();document.body.style.overflow='hidden'}));
dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog.addEventListener('close',()=>{document.body.style.overflow='';previousFocus?.focus()});
const search=document.querySelector('#guide-search');search.addEventListener('input',()=>{const q=search.value.trim().toLocaleLowerCase('ru');let n=0;document.querySelectorAll('.guide-item').forEach(item=>{const found=item.textContent.toLocaleLowerCase('ru').includes(q);item.hidden=!found;if(found)n++;if(q&&found)item.open=true;else if(!q)item.open=false});document.querySelector('#no-results').hidden=n>0});
const heroTrack=document.querySelector('.hero-slides');
const heroPause=document.querySelector('.hero-pause');
const slideImages=Array.from(heroTrack.querySelectorAll('img')).slice(0,-1);
const slideCount=slideImages.length;
let slideIndex=0,slidePaused=false,slideTimer,resetTimer;
function startSlides(){clearInterval(slideTimer);if(slidePaused||document.hidden)return;slideTimer=setInterval(()=>{slideIndex++;heroTrack.style.transition=motion?'none':'transform 450ms ease-in-out';heroTrack.style.transform=`translateX(-${slideIndex*100}%)`;const current=slideIndex%slideCount;document.querySelector('.photo-caption>span:first-child').textContent=slideImages[current].alt;document.querySelector('.photo-caption>span:last-child').textContent=`${String(current+1).padStart(2,'0')} / ${String(slideCount).padStart(2,'0')}`;if(slideIndex===slideCount){clearTimeout(resetTimer);resetTimer=setTimeout(()=>{heroTrack.style.transition='none';slideIndex=0;heroTrack.style.transform='translateX(0)'},460)}},2000)}
heroPause.addEventListener('click',()=>{slidePaused=!slidePaused;heroPause.textContent=slidePaused?'▶':'Ⅱ';heroPause.setAttribute('aria-label',slidePaused?'Продолжить смену фотографий':'Остановить смену фотографий');startSlides()});
document.addEventListener('visibilitychange',startSlides);startSlides();

