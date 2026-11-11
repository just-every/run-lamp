import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from '/home/agent/rer-consolidation/work/main-lamp-another-tool-1-c1/run-lamp/node_modules/playwright/index.mjs';
import { openNativeRuntime } from '/home/agent/rer-consolidation/work/main-lamp-another-tool-1-c1/run-lamp/tests/dev-ingress/runtime.mjs';
const runtime = await openNativeRuntime();
let browser;
const results=[];
try {
  await runtime.start();
  browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-mock-keychain','--password-store=basic']});
  for(const width of [1440,390]) {
    const context=await browser.newContext({viewport:{width,height:width===390?844:1000}});
    const page=await context.newPage();
    const response=await page.goto(runtime.origin+'/docs/alerts-from-monitoring-tools');
    assert.equal(response.status(),200);
    const heading=page.locator('h2#another-tool');
    await heading.waitFor();
    await heading.scrollIntoViewIfNeeded();
    await page.evaluate(()=>document.fonts.ready);
    const bounds=await heading.evaluate(el=>{
      const article=el.closest('article').getBoundingClientRect();
      const top=el.getBoundingClientRect();
      let end=top.bottom;
      for(let node=el.nextElementSibling;node&&node.tagName!=='H2';node=node.nextElementSibling)end=node.getBoundingClientRect().bottom;
      return {x:article.x+scrollX,y:top.y+scrollY,width:article.width,height:end-top.y+12};
    });
    const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
    if(width===1440)assert.ok(fits,'docs fit desktop viewport');
    await page.screenshot({path:process.env.LAMP_ANOTHER_TOOL_SCREENSHOTS+'/'+width+'-another-tool-docs.png',fullPage:true,clip:bounds});
    results.push({width,status:response.status(),fits_viewport:fits,section:'Another tool',screenshot:width+'-another-tool-docs.png'});
    await context.close();
  }
} finally {
  await browser?.close();
  await runtime.close();
}
await writeFile('/home/agent/rer-consolidation/work/main-lamp-another-tool-1-c1/packet/DOCS_PROOF_RECEIPT.json',JSON.stringify(results,null,2)+'\n');
console.log('Changed Another tool guide captured at 1440 and 390.');
