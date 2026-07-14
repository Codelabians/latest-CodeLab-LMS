const fs=require('fs');const parser=require('@babel/parser');
const c=fs.readFileSync('/tmp/head.jsx','utf8');
try{parser.parse(c,{sourceType:'module',plugins:['jsx']});console.log('HEAD PARSE OK','lines='+c.split("\n").length);}
catch(e){console.log('HEAD ERR',e.message);}
