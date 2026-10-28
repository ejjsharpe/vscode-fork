(async()=>{
 const w=globalThis.replyProbe.service.prototypeWindows.get(100002);
 const clicked=await w.webContents.executeJavaScript(`(()=>{const el=[...document.querySelectorAll('button,a,[role="button"]')].find(e=>e.textContent.trim()==='Continue without Signing In');if(el){el.click();return true;}return false;})()`);
 await new Promise(r=>setTimeout(r,1000));
 return {clicked,pending:globalThis.replyProbe.service.pendingProjectCloses.has(w.id),text:await w.webContents.executeJavaScript('document.body.innerText')};
})()
