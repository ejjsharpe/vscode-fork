// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = name => JSON.parse(fs.readFileSync(new URL(`evidence/${name}.json`,import.meta.url)));
assert.equal(read('baseline').lifecycleRequests.length,0);
assert.equal(read('overlap-before-repair').replacements,2);
assert.equal(read('overlap-after-repair').replacements,1);
assert.deepEqual(read('startup').outcomes,[false,'interrupted']);
assert.equal(read('startup').pending,0);
assert.equal(read('authorization-final').rejected.length,6);
assert.equal(read('reentry').sameReentrantPromise,true);
assert.deepEqual(read('failure').outcomes,['rejected','rejected']);
assert.equal(read('cancel-final').results[0].result,'cancel');
assert.equal(read('save-final').saved,'Disposable lifecycle reply test');
assert.deepEqual(read('save-final').results.map(x=>x.result),['ok','ok']);
console.log('Saved evidence assertions passed; not a live product rerun.');
