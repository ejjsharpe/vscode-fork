// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = name => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), 'utf8'));
const result = name => JSON.parse(fs.readFileSync(new URL(name, import.meta.url),'utf8').split('### Result\n')[1].split('\n')[0]);
assert.equal(read('baseline-race.json').closeHonored, false);
assert.equal(result('caller-results.txt').results.filter(x=>x.rejected).length,18);
assert.equal(result('caller-results.txt').results.filter(x=>!x.rejected).length,6);
assert.equal(result('stale-check.txt').stale.accepted,false);
assert.equal(result('stale-check.txt').control,false);
assert.equal(result('connection-results.txt').oldConnection.accepted,false);
assert.equal(result('connection-results.txt').delivered.ports,1);
for(const name of ['race-state.json','repeat-state.json']) {
 const {race,current,pending,closed}=read(name);
 assert.equal(race.validations,1);
 assert.equal(race.pending,true);
 assert.equal(race.cancelledRecovery,true);
 assert.equal(race.closeHonored,false);
 assert.equal(closed,false);
 assert.deepEqual(pending,[]);
 assert.equal(current.hosts.length,1);
 assert.equal(current.hosts[0].children,2);
 assert.equal(current.windowCounter,3);
 const stale=current.windows.find(w=>w.id===100002);
 assert.equal(stale.contents,current.hosts[0].contents);
 assert.equal(stale.context,`unregistered:${stale.contents}`);
 assert.equal(current.contents.filter(w=>w.context.startsWith('window:')).length,2);
}
console.log('Saved evidence verified: sampled controls and repeated failed logical disposal. Not an acceptance pass.');
