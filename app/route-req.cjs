const fs = require('fs');

let r = fs.readFileSync('10-router.js', 'utf8');
r = r.replace('lreq: screenLeaderRequests,', 'lreq: screenReqCenter,');
r = r.replace('requests: screenRequests,', 'requests: screenReqCenter,');
fs.writeFileSync('10-router.js', r);

let u = fs.readFileSync('05-ui.js', 'utf8');
u = u.replace('b:allRequests().filter(x=>x.state==="pending").length',
              'b:S.requests.filter(x=>x.to===S.session.id&&x.state==="pending").length');
u = u.replace('b:myRequests().length',
              'b:S.requests.filter(x=>x.to===S.session.id&&x.state==="pending").length');
fs.writeFileSync('05-ui.js', u);

console.log('router:', (r.match(/screenReqCenter/g) || []).length);
console.log('tabs badge:', (u.match(/S\.requests\.filter/g) || []).length);
