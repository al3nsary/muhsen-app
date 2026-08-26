/* يبني نسخًا للقطات الشاشة على شاشات محددة */
const fs = require('fs'), path = require('path');
const OUT = 'C:/Users/KSA/AppData/Local/Temp/claude/C--Users-KSA/0f19431d-f6aa-45db-814d-430ecc6aec9d/scratchpad';
const app = fs.readFileSync(path.join(__dirname, '..', 'muhsen-app.html'), 'utf8');

const scenes = {
  home:  "S.session={id:'L1'};S.route={n:'home'};render();",
  task:  "S.session={id:'L1'};S.route={n:'task',id:S.tasks.filter(t=>t.leaderId==='L1').sort((a,b)=>a.start-b.start)[0].id};render();",
  assign:"S.session={id:'L1'};S.route={n:'assign',id:S.tasks.filter(t=>t.leaderId==='L1').sort((a,b)=>a.start-b.start)[0].id};render();",
  tickets:"S.session={id:'L1'};S.route={n:'tickets'};render();",
  mhome: "S.session={id:'M1001'};var t=S.tasks.filter(x=>x.leaderId==='L1').sort((a,b)=>a.start-b.start)[0];" +
         "sendRequest(t,t.groups[0],'M1001');respondRequest(t,t.groups[0],true);S.route={n:'mhome'};render();"
};

Object.entries(scenes).forEach(([k, js]) => {
  fs.writeFileSync(OUT + '/scene-' + k + '.html', app + '<script>try{' + js + '}catch(e){document.body.innerHTML="<pre>"+e.message+"</pre>";}</scr' + 'ipt>');
});
console.log('scenes:', Object.keys(scenes).join(', '));
