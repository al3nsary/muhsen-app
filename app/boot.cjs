/* إقلاعُ الصفحة: ما سقط قبل أن يُرسم شيء */
const fs=require('fs'), cp=require('child_process');
const SC=__dirname.split('\\').join('/')+'/';
const B=process.argv[2]||'muhsen';
const SRC='C:/Users/KSA/Desktop/Muhsen-Field/docs/'+B+'/index.html';
const h=fs.readFileSync(SRC,'utf8');
const inj=`<script>
window.__E=[];
window.addEventListener('error',function(e){window.__E.push('ERR '+e.message+' @'+(e.lineno||'?'))});
setTimeout(function(){
  var o=[];
  o.push('BUILD='+(typeof BUILD!=='undefined'?BUILD:'؟'));
  o.push('KEY='+(typeof KEY!=='undefined'?KEY:'؟'));
  o.push('أخطاء='+window.__E.length);
  window.__E.slice(0,6).forEach(function(x){o.push('  '+x)});
  o.push('شاشة فيها='+(document.getElementById('screen').innerHTML.length)+' حرفًا');
  o.push('tabs='+document.querySelectorAll('.tabs').length+' acclist='+document.querySelectorAll('.acclist').length);
  var p=document.createElement('pre');p.id='PP';p.textContent=o.join(String.fromCharCode(10));
  document.body.appendChild(p);
},1500);
</scr`+`ipt>`;
const i=h.lastIndexOf('</body>');
fs.writeFileSync(SC+'_boot.html',h.slice(0,i)+inj+h.slice(i));
const r=cp.execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu '+
 '--virtual-time-budget=9000 --dump-dom "file:///'+SC+'_boot.html"',{maxBuffer:1<<28}).toString();
const m=r.match(/<pre id="PP">([\s\S]*?)<\/pre>/);
console.log(m?m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'):'لا مخرجات');
