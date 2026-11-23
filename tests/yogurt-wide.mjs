import {readFile} from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';
import {yogurtRegressions} from './yogurt-regression.mjs';
const browser=await launchBrowser();try{const state=JSON.parse(await readFile('.tmp/p8-review/student-before-M5.json','utf8'));await yogurtRegressions(browser,process.env.APP_URL||'http://127.0.0.1:5358',state,{viewport:{width:915,height:412}});}finally{await browser.close();}
