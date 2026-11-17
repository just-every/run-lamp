import { createRequire } from 'node:module';
const {chromium}=createRequire('/home/agent/rer-consolidation/work/sd-lamp-settings-1/run-lamp/package.json')('playwright');
const launch=chromium.launch.bind(chromium);
chromium.launch=options=>launch({...options,executablePath:'/usr/bin/chromium',args:[...(options?.args??[]),'--no-sandbox']});
