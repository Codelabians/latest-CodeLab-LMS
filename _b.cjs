const fs=require('fs');const parser=require('@babel/parser');
let c=fs.readFileSync('/tmp/orig.jsx','utf8').split('\n');
// try parsing only up to certain lines by closing braces is hard; instead replace line 219 with simple p
c[218]='            <p>x</p>';
const joined=c.join('\n');
try{parser.parse(joined,{sourceType:'module',plugins:['jsx']});console.log('PARSE OK after simplifying 219');}
catch(e){console.log('STILL ERR',e.message);}
