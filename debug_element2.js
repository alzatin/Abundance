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
    
    // Check what functions and global variables are available
    const globals = await page.evaluate(() => {
      return {
        hasGlobalVariables: typeof GlobalVariables !== 'undefined',
        hasTopLevelMolecule: typeof GlobalVariables !== 'undefined' && !!GlobalVariables.topLevelMolecule,
        hasWriteToDisplay: typeof GlobalVariables !== 'undefined' && typeof GlobalVariables.writeToDisplay === 'function',
        topLevelMoleculeId: typeof GlobalVariables !== 'undefined' && GlobalVariables.topLevelMolecule ? GlobalVariables.topLevelMolecule.uniqueID : null,
        currentMoleculeId: typeof GlobalVariables !== 'undefined' && GlobalVariables.currentMolecule ? GlobalVariables.currentMolecule.uniqueID : null,
        elementExists: !!document.getElementById('molecule-fully-render-puppeteer')
      };
    });
    
    console.log('Global state:', globals);
    
    // Try to manually trigger the element creation
    if (globals.hasGlobalVariables && globals.hasTopLevelMolecule) {
      await page.evaluate(() => {
        console.log('Manually calling writeToDisplay...');
        if (GlobalVariables.writeToDisplay && GlobalVariables.topLevelMolecule) {
          GlobalVariables.writeToDisplay(GlobalVariables.topLevelMolecule.uniqueID, false);
        }
      });
      
      // Wait a bit and check again
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const elementExists = await page.$('#molecule-fully-render-puppeteer');
      console.log('Element found after manual trigger:', !!elementExists);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();