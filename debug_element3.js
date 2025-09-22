import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set up console and error logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  try {
    console.log('Navigating to Wall-Anchor project...');
    await page.goto('http://localhost:4444/run/moatmaslow/Wall-Anchor', {timeout: 60000});
    await page.setViewport({width: 1080, height: 1024});
    
    // Wait for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 45000));
    
    // Check render state
    const renderState = await page.evaluate(() => {
      // Try to access React DevTools or internal state
      try {
        // Look for any render progress indicators in the DOM
        const progressBars = document.querySelectorAll('[class*="progress"], [class*="render"], [id*="progress"], [id*="render"]');
        const progressInfo = Array.from(progressBars).map(el => ({
          tag: el.tagName,
          id: el.id,
          className: el.className,
          style: el.style.cssText,
          textContent: el.textContent
        }));
        
        return {
          elementExists: !!document.getElementById('molecule-fully-render-puppeteer'),
          progressElements: progressInfo,
          bodyChildren: document.body.children.length,
          hasProgressBar: !!document.querySelector('.progress-bar, [class*="progress"]'),
          documentReady: document.readyState
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('Render state:', JSON.stringify(renderState, null, 2));
    
    // Force create the element manually to test
    await page.evaluate(() => {
      const existingDiv = document.getElementById("molecule-fully-render-puppeteer");
      if (!existingDiv) {
        const invisibleDiv = document.createElement("div");
        invisibleDiv.id = "molecule-fully-render-puppeteer";
        invisibleDiv.style.display = "none";
        document.body.appendChild(invisibleDiv);
        console.log('Manually created Puppeteer element');
      }
    });
    
    // Check if it exists now
    const elementNow = await page.$('#molecule-fully-render-puppeteer');
    console.log('Element found after manual creation:', !!elementNow);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();