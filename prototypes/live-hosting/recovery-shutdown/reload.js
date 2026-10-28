async page => {
 const dialog=page.getByRole('dialog',{name:'Welcome to Visual Studio Code'});
 if(await dialog.count())await dialog.getByRole('button',{name:'Close',exact:true}).click();
 await page.keyboard.press('F1');
 await page.getByRole('textbox',{name:'Type the name of a command to run.'}).fill('>Developer: Reload Window');
 await page.getByRole('option',{name:/^Developer: Reload Window/}).first().click();
 await page.waitForTimeout(2000);
 return {title:await page.title()};
}
