const fs=require('fs');
const text=fs.readFileSync('src/components/finance/LedgerAccounts.jsx','utf8');
const re=/<\/?([A-Za-z][\w.]*)(\s[^>]*?)?(\/?)>/g;let m;const stack=[];
while((m=re.exec(text))){
  const closing=m[0].startsWith('</');
  const self=m[3]==='/'||m[0].endsWith('/>');
  const name=m[1];
  const ln=text.slice(0,m.index).split('\n').length;
  if(closing){const top=stack.pop();if(!top||top.name!==name){console.log('MISMATCH line',ln,'</'+name+'> top was',top?top.name+'@'+top.ln:'EMPTY');}}
  else if(!self){stack.push({name,ln});}
}
console.log('UNCLOSED:',stack.map(s=>s.name+'@'+s.ln).join(', ')||'none');
