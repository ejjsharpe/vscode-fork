// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = name => JSON.parse(fs.readFileSync(new URL(name, import.meta.url), 'utf8'));
const crash=read('crash.json'), recovered=read('recovered.json'), race=read('close-race.json'), failure=read('failure.json');
assert.equal(recovered.oldDestroyed,true);
assert.equal(recovered.after.hosts[0].id,crash.before.hosts[0].id);
assert.equal(recovered.after.hosts[0].children,3);
for(const id of [100000,100001]) {
 const before=crash.before.windows.find(w=>w.id===id),after=recovered.after.windows.find(w=>w.id===id);
 assert.deepEqual([after.contents,after.pid,after.generation],[before.contents,before.pid,before.generation]);
}
const before=crash.before.windows.find(w=>w.id===100002),after=recovered.after.windows.find(w=>w.id===100002);
assert.notEqual(before.contents,after.contents);
assert.notEqual(before.generation,after.generation);
assert.deepEqual([before.workspace,before.profile,before.environmentHash,before.backupPath],[after.workspace,after.profile,after.environmentHash,after.backupPath]);
// Map these PIDs to logical workbenches with extension-hosts.log, not process names alone.
for(const pid of [9774,9792]) {assert(recovered.after.metrics.some(m=>m.pid===pid));}
assert.match(failure.shell,/Recovery failed.*Retry.*Close/s);
assert.equal(failure.after.windows.find(w=>w.id===100002).generation,undefined);
assert.equal(race.during.hostClosing,true);
assert.equal(race.during.recovering,true);
assert.equal(race.validations,1);
assert.equal(race.afterCloseRequest.closed,false);
assert.equal(race.closeHonored,false);
assert.equal(race.after.hosts[0].children,3);
assert.equal(race.after.windows.find(w=>w.id===100002).ready,true);
assert.match(read('backups.json')[0].content,/Disposable lifecycle reply test/);
console.log('Captured recovery successes and lost-Close failure are internally consistent. This is not a full acceptance pass.');
