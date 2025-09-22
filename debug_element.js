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
    
    console.log('Page loaded, checking for element...');
    
    // Wait a bit for the page to load
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Check if element exists
    const element = await page.$('#molecule-fully-render-puppeteer');
    console.log('Element found after 15s:', !!element);
    
    // Check page content
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get some info about the page state
    const url = page.url();
    console.log('Current URL:', url);
    
    // Check if any molecules or components loaded
    const hasBody = await page.$('body');
    console.log('Body element exists:', !!hasBody);
    
    // Wait longer and check again
    await new Promise(resolve => setTimeout(resolve, 30000));
    const elementLater = await page.$('#molecule-fully-render-puppeteer');
    console.log('Element found after 45s total:', !!elementLater);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();