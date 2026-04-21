const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  page.on('requestfailed', request => {
    console.error(`[NETWORK ERROR] ${request.url()} failed: ${request.failure()?.errorText}`);
  });

  console.log("Navigating to local site...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  console.log("Waiting a few seconds...");
  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
})();
