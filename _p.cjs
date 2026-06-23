const fs=require('fs');const parser=require('@babel/parser');
const c=fs.readFileSync('src/components/finance/LedgerAccounts.jsx','utf8');
try{parser.parse(c,{sourceType:'module',plugins:['jsx']});console.log('PARSE OK');}
catch(e){console.log('ERR',e.message);}
