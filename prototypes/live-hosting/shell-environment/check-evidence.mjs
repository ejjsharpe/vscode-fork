// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = name => JSON.parse(fs.readFileSync(new URL(`evidence/${name}.json`, import.meta.url)));
assert.equal(read('baseline').receivedSentinel, true);
const own = read('ownership');
assert.equal(own.realWireOwnProjectsAndAgents, 3);
for (const [key, value] of Object.entries(own)) if (key !== 'realWireOwnProjectsAndAgents') assert.equal(value, true, key);
assert.equal(read('transitions').oldHandlerOutcome, 'Shell environment request interrupted');
assert.equal(read('transitions').freshPreloadEnvironmentResolved, true);
assert.deepEqual(read('prebootstrap').requests, [{credentialType:'undefined',argsLength:1,rejected:true},{credentialType:'string',argsLength:1,resolved:true}]);
assert.deepEqual(read('destruction').outcomes, ['Shell environment request interrupted']);
assert.equal(read('reload').realWireReloadCalls, 1);
assert.equal(read('diagnostic-startup').startupPassed, true);
assert.equal(read('menu').closedOnRevocation, 1);
assert.equal(read('close').retryResult.samePromise, true);
for (const result of read('close').retryResult.outcomes) assert.match(result.error, /Close interrupted/);
assert.equal(read('host').hostAlive, true);
assert.equal(read('host').laterReady, true);
assert.equal(read('failures').fullGatePassed, false);
assert.equal(read('failures').creatorVerdictObtained, false);
console.log('Saved shell-environment evidence is internally consistent; full gate remains open.');
