const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('[Yjs]') || msg.type() === 'error') {
      console.log('BROWSER:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });

  await page.goto('http://localhost:8000/auth', { waitUntil: 'networkidle2' });
  
  await page.type('input[type="email"]', 'test@example.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('Logged in!');

  await page.goto('http://localhost:8000/project/1', { waitUntil: 'networkidle2' });
  console.log('In project 1!');

  await new Promise(r => setTimeout(r, 10000));
  
  await browser.close();
})();
