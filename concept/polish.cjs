const fs = require('fs');
let t = fs.readFileSync('template.html', 'utf8');

const n0 = (t.match(/backdrop-filter/g) || []).length;
t = t.replace(/\s*-webkit-backdrop-filter:[^;}]*;?/g, '').replace(/\s*backdrop-filter:[^;}]*;?/g, '');

// gold hairline on every service card (the signature card)
t = t.replace(/<div class="c p16">(\s*\n\s*<div class="svc">)/g, '<div class="c p16 gold">$1');

// gold rule under every section label
t = t.replace(/\.lbl small\{/,
  '.lbl::after{content:""; display:block; width:36px; height:2px; border-radius:2px; margin-top:7px; background:linear-gradient(90deg,#C6A86F,rgba(198,168,111,0))}\n  .lbl small{');

fs.writeFileSync('template.html', t);
console.log('removed backdrop-filter:', n0, '| remaining:', (t.match(/backdrop-filter/g) || []).length);
console.log('gold service cards:', (t.match(/c p16 gold/g) || []).length);
