// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=name=>JSON.parse(fs.readFileSync(new URL(`evidence/${name}`,import.meta.url),'utf8'));
const baseline=read('baseline-state.json'),race=read('close-race.json'),r=read('disposal-result.json');
assert.equal(baseline.current.windowCounter,3);
assert.equal(baseline.current.hosts[0].children,2);
assert.equal(race.closeHonored,true);
assert.equal(race.after.windowCounter,2);
assert.equal(r.before.stale.accepted,false);
assert.deepEqual([r.pendingDuringError,r.coalescedDuringError,r.notifications,r.outerOutcome.ok,r.reentrantOutcome.ok,r.logicalDisposed,r.after.windowCounter,r.children,r.sameHost],[true,false,1,false,true,false,1,1,true]);
assert.match(r.shell,/Close failed/);
console.log('Saved evidence consistent: original race improved; reentrant Close failure retained. NOT a runtime acceptance pass.');
