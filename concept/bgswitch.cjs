const fs = require('fs');
let t = fs.readFileSync('template.html', 'utf8');

/* 1. ground layers driven by a body class */
t = t.replace(/\.ground \.ph\{[^}]*\}/,
  '.ground .ph{position:absolute; inset:-14%; background-size:cover; background-position:center; filter:blur(34px) saturate(1.05); opacity:0; transition:opacity .3s}');
t = t.replace(/\.ground \.tint\{[^}]*\}/,
  '.ground .tint{position:absolute; inset:0; background:#FCFBF8}');
t = t.replace(/\.ground \.topo\{[^}]*\}/,
  '.ground .topo{position:absolute; inset:0; width:100%; height:100%; opacity:0; transition:opacity .3s}');

/* 2. the three modes */
t = t.replace(/\n  \.statusbar\{/, `
  body[data-bg="lines"] .ground .topo{opacity:.5}
  body[data-bg="photo"] .ground .topo{opacity:.8}
  body[data-bg="photo"] .ground .ph{opacity:.24}
  body[data-bg="photo"] .ground .tint{
    background:linear-gradient(180deg, rgba(18,72,51,.3) 0%, rgba(252,251,248,.94) 30%, #FCFBF8 62%)}

  .bgswitch{position:fixed; inset-block-end:22px; inset-inline-start:22px; z-index:60; display:flex; gap:4px;
    padding:5px; border-radius:99px; background:var(--card); border:1px solid var(--card-brd);
    box-shadow:0 6px 24px -8px rgba(11,53,39,.4)}
  .bgswitch button{padding:8px 16px; border-radius:99px; font-size:13px; font-weight:700; color:var(--muted)}
  .bgswitch button[aria-pressed="true"]{background:linear-gradient(150deg,#1D7452,#0C3A29); color:#fff}
  @media (max-width:640px){ .bgswitch{inset-block-end:12px; inset-inline-start:12px} .bgswitch button{padding:7px 11px; font-size:12px} }

  .statusbar{`);

/* 3. screen ground colour */
t = t.replace(/\.screen\{height:100%; background:#FAF8F3;/, '.screen{height:100%; background:#FCFBF8;');

/* 4. the switcher markup + wiring */
t = t.replace(/<script>\n\(function\(\)\{/,
`<div class="bgswitch" role="group" aria-label="خلفية التطبيق">
  <button data-bg="plain">أبيض نقي</button>
  <button data-bg="lines" aria-pressed="true">خطوط خفيفة</button>
  <button data-bg="photo">خطوط وصورة</button>
</div>

<script>
(function(){
  document.body.setAttribute("data-bg","lines");
  document.querySelectorAll(".bgswitch button").forEach(function(b){
    b.addEventListener("click", function(){
      document.body.setAttribute("data-bg", b.getAttribute("data-bg"));
      document.querySelectorAll(".bgswitch button").forEach(function(x){
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
    });
  });
})();
</script>

<script>
(function(){`);

fs.writeFileSync('template.html', t);
console.log('background switcher installed');
