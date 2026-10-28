// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
// Saved-evidence consistency check, not a fresh runtime acceptance run.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir=new URL('./evidence/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name+'.json',dir),'utf8'));
assert.equal(read('baseline-retry').retryResult.pending,true);
assert.equal(read('baseline-retry').retryAtBootstrap.ready,true);
const startup=read('startup-close');
assert.equal(startup.retryAtBootstrap.lifecycleReady,false);
assert.equal(startup.request,undefined);
assert.equal(startup.retryResult.samePromise,true);
assert.equal(startup.pending,false);
for(const outcome of startup.retryResult.outcomes){assert.equal(outcome.status,'rejected');assert.match(outcome.error,/Close interrupted/);}
const host=read('host-startup');assert.equal(host.laterReady,true);assert.equal(host.pending,false);assert.equal(host.count,3);
const cancel=read('real-cancel');assert.match(cancel.shell,/Close cancelled/);assert.equal(cancel.windows.length,3);assert.equal(cancel.results.at(-1).result,'cancel');
const save=read('real-save-close');assert.equal(save.windows.length,2);assert.equal(save.results.at(-1).result,'ok');assert.equal(save.outcome.resolved,true);
assert.equal(read('saved-content').text,'Disposable lifecycle reply test');
const detach=read('detach-error');assert.equal(detach.failure.outcome.ok,false);assert.equal(detach.failure.directOutcome.ok,false);assert.equal(detach.retry.phasesReplayed,0);assert.equal(detach.retry.notifications,1);
assert.equal(read('reload-opening').opens,0);assert.equal(read('reload-opening').lifecycleReady,true);
const partial=read('partial-host');assert.equal(partial.completedCleanupReplay,0);assert.equal(partial.recovered,true);assert.match(partial.outcome.error,/Close interrupted/);
const success=read('host-success');assert.equal(success.after.remaining,0);assert.equal(success.after.hostDestroyed,true);assert.deepEqual(success.after.logicalDisposed,[true,true,true]);assert.equal(new Set(success.notifications).size,3);
const baseline=fs.readFileSync(new URL('baseline.log',dir),'utf8');
const dispatch=Number(baseline.match(/dispatch (\d+) 100002 4 vscode:onBeforeUnload/)[1]);
const registrations=[...baseline.matchAll(/receivers-installed (\d+) 100002/g)].map(m=>Number(m[1]));
assert.ok(registrations.at(-1)>dispatch);
console.log(JSON.stringify({savedEvidenceConsistent:true,baselineDispatchBeforeRegistrationMs:registrations.at(-1)-dispatch,fullGatePassed:false}));
