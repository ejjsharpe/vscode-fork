// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = name => JSON.parse(fs.readFileSync(new URL(`evidence/${name}.json`, import.meta.url)));
const baseline=read('baseline-result'),fixed=read('fresh-disposal-result');
assert.deepEqual([baseline.outerOutcome.ok,baseline.reentrantOutcome.ok,baseline.logicalDisposed],[false,true,false]);
assert.deepEqual([fixed.outerOutcome.ok,fixed.reentrantOutcome.ok,fixed.coalescedDuringError,fixed.notifications,fixed.logicalDisposed],[false,false,true,1,false]);
assert.equal(read('retry').logicalDisposed,true);
assert.deepEqual(read('scheduled-close').pending,{settled:false,sameClose:true,sameDirect:true,registered:true});
const detach=read('detach-error');
assert.deepEqual([detach.failure.outcome.ok,detach.failure.directOutcome.ok,detach.failure.logs,detach.retry.logicalDisposed,detach.retry.phasesReplayed],[false,false,1,true,0]);
for(const name of ['interruption','repeat-interruption']) {
 const failure=read(name);
 assert.deepEqual(failure.outcomes,[{resolved:true},{resolved:true}]);
 assert.equal(failure.registered,true);assert.equal(failure.logicalDisposed,false);assert.equal(failure.notifications,0);
 assert.match(failure.shell,/Close cancelled/);assert.equal(failure.results.at(-1).result,'interrupted');
}
assert.equal(read('repeat-interruption').before.ready,true);
console.log('Saved evidence consistent: sampled repair controls pass; interrupted Close gate fails. No Stage 1 pass.');
