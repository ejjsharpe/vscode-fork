// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = name => JSON.parse(fs.readFileSync(new URL(`evidence/${name}.json`, import.meta.url)));
assert.ok(Object.values(read('baseline')).every(value => value === true));
assert.deepEqual(read('ownership'), {realWireAgentsAndProjects:3,realDevToolsOpenAndToggle:true,realZoomNumberAndUndefined:true,realInvalidZoomRejected:5,realExtraArgumentsRejected:true,realUnregisteredAuxiliaryRejected:true,injectedMissingGuessedForeignFrameRejected:true,unauthorizedDevToolsEffects:0});
assert.ok(Object.values(read('transitions')).every(value => value === true));
assert.ok(Object.values(read('destruction')).every(value => value === true));
assert.deepEqual(read('zoom-ui').records.map(({value,authenticated})=>({value,authenticated})),[{value:1,authenticated:true},{value:'configured',authenticated:true}]);
assert.equal(read('reload').realWireReloadCalls,1);
assert.equal(read('environment').noUnauthorizedResolverCalls,true);
assert.equal(read('diagnostic').startupPassed,true);
assert.equal(read('menu').closedOnRevocation,1);
assert.ok(read('close').retryResult.outcomes.every(x=>x.error==='Error: Close interrupted'));
assert.equal(read('host').unload,'interrupted');
assert.equal(read('host').pending,false);
assert.equal(read('runtime').ready,true);
assert.equal(read('failures').length,3);
console.log('Saved evidence assertions passed; not a runtime rerun or full gate pass.');
