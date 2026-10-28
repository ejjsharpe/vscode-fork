// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import fs from 'node:fs/promises';
const [port, file] = process.argv.slice(2);
const targets = await (await fetch(`http://127.0.0.1:${Number(port)}/json/list`)).json();
const expression = await fs.readFile(file,'utf8');
const socket = new WebSocket(targets[0].webSocketDebuggerUrl);
const result = await new Promise((resolve,reject)=>{
 const timeout = setTimeout(()=>{socket.close();reject(new Error('Inspector timeout'));},10000);
 socket.addEventListener('open',()=>socket.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,awaitPromise:true,returnByValue:true}})));
 socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id===1){clearTimeout(timeout);resolve(data);socket.close();}});
 socket.addEventListener('error',reject);
});
if(result.error || result.result?.exceptionDetails) {throw new Error(JSON.stringify(result));}
console.log(JSON.stringify(result.result.result.value,null,2));
