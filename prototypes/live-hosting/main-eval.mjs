import fs from 'node:fs/promises';
const info = JSON.parse(await fs.readFile(process.env.HOSTING_LAUNCH_INFO || new URL('../../..' + '/launch.json', import.meta.url), 'utf8'));
const targets = await (await fetch(`http://127.0.0.1:${info.mainPort}/json/list`)).json();
const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
const result = new Promise((resolve, reject) => {
 ws.onmessage = e => { const msg=JSON.parse(e.data); if(msg.id===1) { msg.error ? reject(msg.error) : resolve(msg.result); } };
});
ws.send(JSON.stringify({id:1, method:'Runtime.evaluate', params:{expression:process.argv[2], awaitPromise:true, returnByValue:true}}));
console.log(JSON.stringify(await result, null, 2));
ws.close();
