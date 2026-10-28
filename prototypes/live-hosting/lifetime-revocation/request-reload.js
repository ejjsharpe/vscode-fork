async page => {
 await page.keyboard.press('F1');
 await page.getByRole('textbox', {name:'Type the name of a command to run.'}).fill('>Developer: Reload Window');
 await page.getByRole('option', {name:/^Developer: Reload Window/}).first().click();
 await page.waitForTimeout(1000);
 return {requests:await page.evaluate(()=>window.lifetimeUnloadRequests),text:await page.locator('body').innerText()};
}
