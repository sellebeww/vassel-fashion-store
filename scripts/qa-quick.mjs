import {chromium} from '@playwright/test';
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:390,height:900}});await p.goto('http://127.0.0.1:3002',{waitUntil:'networkidle'});await p.screenshot({path:'output/qa/current-mobile.png'});await b.close();
