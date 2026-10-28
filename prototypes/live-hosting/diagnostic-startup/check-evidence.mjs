// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8'));
assert.equal(read('evidence/baseline.json').startupPassed,false);
const trace=read('evidence/candidate-trace.json');
assert.equal(trace.startupPassed,true);
assert.ok(trace.events.find(e=>e.message?.includes('receiver installed')).at<trace.events.find(e=>e.kind==='dispatch').at);
assert.equal(read('evidence/startup-final.json').startupPassed,true);
assert.equal(read('../context-menu/evidence/baseline.json').replacementReceivedOldCallbacks,true);
assert.equal(read('../context-menu/evidence/ownership.json').closedOnRevocation,1);
assert.deepEqual(read('../context-menu/evidence/native.json').result,{hidden:1,clicked:0});
assert.equal(read('../context-menu/evidence/prebootstrap.json').popups,0);
assert.equal(read('../context-menu/evidence/diagnostic-startup.json').startupPassed,true);
assert.equal(read('../context-menu/evidence/diagnostic-ownership.json').remainingListeners,0);
for(const file of ['reload','close','host'])assert.ok(read(`../context-menu/evidence/${file}.json`));
console.log('Saved evidence consistency passed; this does not rerun the app.');
